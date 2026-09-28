const db = require('../config/db');
const MarginUtils = require('../utils/MarginUtils');

const getLedger = async (req, res) => {
    try {
        const { userId, type } = req.query; // type: CREDIT/DEBIT
        let query = 'SELECT * FROM internal_transfers';
        const params = [];

        if (userId) {
            query += ' WHERE to_user_id = ? OR from_user_id = ?';
            params.push(userId, userId);
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const internalTransfer = async (req, res) => {
    const { toUserId, amount, notes } = req.body;
    const fromUserId = req.user.id;

    // 1. Strict Input & Self-Transfer Validation
    if (!toUserId || amount === undefined || amount === null) {
        return res.status(400).json({ success: false, message: 'toUserId and amount are required' });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Transfer amount must be a positive number' });
    }

    if (parseInt(fromUserId) === parseInt(toUserId)) {
        return res.status(400).json({ success: false, message: 'Cannot transfer funds to the same account' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Lock & Validate Source Account
        const [sourceRows] = await connection.execute(
            'SELECT id, username, full_name, balance, role FROM users WHERE id = ? FOR UPDATE',
            [fromUserId]
        );
        if (!sourceRows.length) {
            throw new Error(`Source user (ID: ${fromUserId}) not found`);
        }

        // 3. Lock & Validate Destination Account
        const [destRows] = await connection.execute(
            'SELECT id, username, full_name, balance, role FROM users WHERE id = ? FOR UPDATE',
            [toUserId]
        );
        if (!destRows.length) {
            throw new Error(`Destination user (ID: ${toUserId}) not found`);
        }

        const sourceBal = parseFloat(sourceRows[0].balance || 0);
        const destBal = parseFloat(destRows[0].balance || 0);

        // 4. Sender Balance Check (except for SUPERADMIN bypass)
        if (req.user.role !== 'SUPERADMIN' && sourceBal < transferAmount) {
            throw new Error(`Insufficient funds: available ₹${sourceBal.toFixed(2)}, required ₹${transferAmount.toFixed(2)}`);
        }

        const newSourceBal = sourceBal - transferAmount;
        const newDestBal = destBal + transferAmount;

        // 5. Double-Entry Atomic Balance Updates
        await connection.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [transferAmount, fromUserId]);
        await connection.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [transferAmount, toUserId]);

        // 6. Record in internal_transfers Audit Table
        try {
            await connection.execute(
                'INSERT INTO internal_transfers (from_user_id, to_user_id, amount) VALUES (?, ?, ?)',
                [fromUserId, toUserId, transferAmount]
            );
        } catch (logErr) {
            console.warn('[internalTransfer] internal_transfers logging warning:', logErr.message);
        }

        // 7. Record in action_ledger for Admin Audit Trail
        try {
            await connection.execute(
                'INSERT INTO action_ledger (admin_id, action_type, target_table, description) VALUES (?, ?, ?, ?)',
                [
                    fromUserId,
                    'INTERNAL_TRANSFER',
                    'users',
                    `Transferred ₹${transferAmount} from user ${fromUserId} (${sourceRows[0].username || ''}) to user ${toUserId} (${destRows[0].username || ''}). Notes: ${notes || 'N/A'}`
                ]
            );
        } catch (_) {}

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: `Successfully transferred ₹${transferAmount} to user ${destRows[0].full_name || destRows[0].username || toUserId}`,
            transfer: {
                fromUserId: parseInt(fromUserId),
                toUserId: parseInt(toUserId),
                amount: transferAmount,
                sourceBalance: newSourceBal,
                destinationBalance: newDestBal
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('[internalTransfer] Transaction failed and rolled back:', err.message);
        return res.status(400).json({ success: false, message: err.message });
    } finally {
        connection.release();
    }
};

// GET /portfolio/balance — real balance, margin, P/L for logged-in user
const getBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. User balance from DB
        const [userRows] = await db.execute('SELECT balance, credit_limit FROM users WHERE id = ?', [userId]);
        if (!userRows.length) return res.status(404).json({ message: 'User not found' });
        const balance = parseFloat(userRows[0].balance);

        // 2. Total margin used from OPEN trades (DYNAMIC)
        const [openTrades] = await db.execute(
            `SELECT t.*, s.lot_size 
             FROM trades t 
             LEFT JOIN scrip_data s ON t.symbol = s.symbol 
             WHERE t.user_id = ? AND t.status = "OPEN"`,
            [userId]
        );

        const [clientSettings] = await db.execute('SELECT config_json FROM client_settings WHERE user_id = ?', [userId]);
        const clientConfig = clientSettings.length ? JSON.parse(clientSettings[0].config_json || '{}') : {};

        // Calculate breakdown by segment manually or via a new helper
        const marginBySegment = { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0, FOREX: 0, CRYPTO: 0 };
        let totalMarginUsed = 0;

        openTrades.forEach(trade => {
            let mType = (trade.market_type || 'MCX').toUpperCase();
            if (mType === 'COMMODITY') {
                mType = 'COMEX'; // Map COMMODITY to COMEX segment for portfolio breakdown
            }
            const calc = MarginUtils.calculateTotalRequiredHoldingMargin([trade], clientConfig);
            totalMarginUsed += calc;
            if (marginBySegment[mType] !== undefined) {
                marginBySegment[mType] += calc;
            }
        });

        // 4. Gross P/L from closed trades
        const [plRows] = await db.execute(
            'SELECT IFNULL(SUM(pnl), 0) as gross_pl FROM trades WHERE user_id = ? AND status = "CLOSED"',
            [userId]
        );
        const grossPL = parseFloat(plRows[0].gross_pl);

        // 5. Brokerage from closed trades
        const [brkRows] = await db.execute(
            'SELECT IFNULL(SUM(brokerage), 0) as total_brokerage FROM trades WHERE user_id = ? AND status = "CLOSED"',
            [userId]
        );
        const totalBrokerage = parseFloat(brkRows[0].total_brokerage);

        res.json({
            balance,
            credit_limit: parseFloat(userRows[0].credit_limit),
            margin_used: totalMarginUsed,
            margin_available: balance - totalMarginUsed,
            margin_by_segment: marginBySegment,
            gross_pl: grossPL,
            brokerage: totalBrokerage,
            net_pl: grossPL - totalBrokerage,
        });
    } catch (err) {
        console.error('getBalance error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getLedger, internalTransfer, getBalance };
