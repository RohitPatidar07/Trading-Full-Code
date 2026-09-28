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
    // ── 1. Input & Recipient Validation ───────────────────────────────────────
    if (!toUserId || amount === undefined || amount === null || amount === '') {
        return res.status(400).json({ success: false, message: 'Recipient user ID and transfer amount are required' });
    }

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || !isFinite(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Transfer amount must be a positive number greater than 0' });
    }

    // Limit to 2 decimal places to prevent precision anomalies
    const cleanAmount = Math.round(transferAmount * 100) / 100;
    if (cleanAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Transfer amount must be at least ₹0.01' });
    }

    const targetUserId = parseInt(toUserId, 10);
    if (!targetUserId || isNaN(targetUserId)) {
        return res.status(400).json({ success: false, message: 'Valid recipient user ID is required' });
    }

    if (parseInt(fromUserId, 10) === targetUserId) {
        return res.status(400).json({ success: false, message: 'Cannot transfer funds to yourself' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 🔒 Lock both user rows in ascending ID order to prevent deadlock & race conditions
        const firstId = Math.min(Number(fromUserId), Number(targetUserId));
        const secondId = Math.max(Number(fromUserId), Number(targetUserId));
        await connection.execute(
            'SELECT id, balance FROM users WHERE id IN (?, ?) FOR UPDATE',
            [firstId, secondId]
        );

        // ── 2. Lock & Verify Sender ──────────────────────────────────────────
        const [senderRows] = await connection.execute(
            'SELECT id, username, full_name, balance, status, role FROM users WHERE id = ? FOR UPDATE',
            [fromUserId]
        );
        if (!senderRows.length) {
            throw new Error(`Sender user (ID: ${fromUserId}) not found`);
        }
        if (senderRows[0].status && senderRows[0].status !== 'Active') {
            throw new Error('Sender account is not active');
        }

        const senderBalance = parseFloat(senderRows[0].balance || 0);

        // ── 3. Verify Withdrawable Balance & Margins ─────────────────────────
        if (req.user.role !== 'SUPERADMIN') {
            const [trades] = await connection.execute(
                'SELECT * FROM trades WHERE user_id = ? AND status = "OPEN"',
                [fromUserId]
            );
            const [settings] = await connection.execute(
                'SELECT config_json FROM client_settings WHERE user_id = ?',
                [fromUserId]
            );
            const clientConfig = settings.length > 0 ? JSON.parse(settings[0].config_json || '{}') : {};

            const blockedMargin = MarginUtils.calculateTotalRequiredHoldingMargin(trades, clientConfig);
            const withdrawableBalance = senderBalance - blockedMargin;

            if (cleanAmount > withdrawableBalance) {
                throw new Error(
                    `Insufficient withdrawable balance. Available: ₹${Math.max(0, withdrawableBalance).toFixed(2)} (Holding Margin: ₹${blockedMargin.toFixed(2)})`
                );
            }
        }

        // ── 4. Lock & Verify Recipient ────────────────────────────────────────
        const [recipientRows] = await connection.execute(
            'SELECT id, username, full_name, balance, status FROM users WHERE id = ? FOR UPDATE',
            [targetUserId]
        );
        if (!recipientRows.length) {
            throw new Error(`Recipient user ID ${targetUserId} does not exist`);
        }
        if (recipientRows[0].status && recipientRows[0].status !== 'Active') {
            throw new Error('Recipient account is not active');
        }

        const recipientBalance = parseFloat(recipientRows[0].balance || 0);
        const newSenderBalance = senderBalance - cleanAmount;
        const newRecipientBalance = recipientBalance + cleanAmount;

        // ── 5. Atomic Double-Entry Balance Updates ───────────────────────────
        if (req.user.role !== 'SUPERADMIN') {
            const [deductResult] = await connection.execute(
                'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
                [cleanAmount, fromUserId, cleanAmount]
            );
            if (deductResult.affectedRows === 0) {
                throw new Error('Insufficient balance');
            }
        } else {
            await connection.execute(
                'UPDATE users SET balance = balance - ? WHERE id = ?',
                [cleanAmount, fromUserId]
            );
        }
        await connection.execute(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [cleanAmount, targetUserId]
        );

        // ── 6. Record Audit in internal_transfers Table ──────────────────────
        try {
            await connection.execute(
                'INSERT INTO internal_transfers (from_user_id, to_user_id, amount) VALUES (?, ?, ?)',
                [fromUserId, targetUserId, cleanAmount]
            );
        } catch (logErr) {
            console.warn('[internalTransfer] internal_transfers logging warning:', logErr.message);
        }

        // ── 7. Double-Entry Ledger Tracking ──────────────────────────────────
        const transferNote = notes ? String(notes).trim() : '';
        try {
            await connection.execute(
                'INSERT INTO ledger (user_id, amount, type, balance_before, balance_after, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                [fromUserId, cleanAmount, 'WITHDRAW', senderBalance, newSenderBalance, `Internal transfer to user #${targetUserId}${transferNote ? ': ' + transferNote : ''}`]
            );
            await connection.execute(
                'INSERT INTO ledger (user_id, amount, type, balance_before, balance_after, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                [targetUserId, cleanAmount, 'DEPOSIT', recipientBalance, newRecipientBalance, `Internal transfer from user #${fromUserId}${transferNote ? ': ' + transferNote : ''}`]
            );
        } catch (_) {}

        // ── 8. Action Ledger Entry for Admin Audit Trail ─────────────────────
        try {
            await connection.execute(
                'INSERT INTO action_ledger (admin_id, action_type, target_table, description) VALUES (?, ?, ?, ?)',
                [
                    fromUserId,
                    'INTERNAL_TRANSFER',
                    'users',
                    `Transferred ₹${cleanAmount.toFixed(2)} from user ${fromUserId} (${senderRows[0].username || ''}) to user ${targetUserId} (${recipientRows[0].username || ''}). Notes: ${transferNote || 'N/A'}`
                ]
            );
        } catch (_) {}

        await connection.commit();

        // Optional cache invalidation
        try {
            const { invalidateCache } = require('../utils/cacheManager');
            await invalidateCache(`users_${fromUserId}_all`);
            await invalidateCache(`users_${targetUserId}_all`);
        } catch (cErr) {}

        return res.status(200).json({
            success: true,
            message: `Transfer of ₹${cleanAmount.toFixed(2)} to ${recipientRows[0].full_name || recipientRows[0].username || targetUserId} completed successfully`,
            transfer: {
                fromUserId: parseInt(fromUserId, 10),
                toUserId: targetUserId,
                amount: cleanAmount,
                sourceBalance: newSenderBalance,
                destinationBalance: newRecipientBalance
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
