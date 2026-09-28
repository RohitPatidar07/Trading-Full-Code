const db = require('../config/db');
const { logAction } = require('./systemController');
const { uploadFile } = require('../utils/imagekit');
const MarginUtils = require('../utils/MarginUtils');

const getRequests = async (req, res) => {
    const { type, status } = req.query; // type: DEPOSIT/WITHDRAW, status: PENDING
    try {
        let query = `
            SELECT r.*, u.username, u.full_name, u.email, u.mobile, u.role as account_type, u.balance as current_balance,
                   IFNULL(ud.kyc_status, 'PENDING') as kyc_status,
                   b.full_name as broker_name,
                   adm.full_name as processed_by
            FROM payment_requests r 
            JOIN users u ON r.user_id = u.id
            LEFT JOIN user_documents ud ON u.id = ud.user_id
            LEFT JOIN client_settings cs ON u.id = cs.user_id
            LEFT JOIN users b ON cs.broker_id = b.id
            LEFT JOIN users adm ON r.admin_id = adm.id
            WHERE 1=1
        `;
        const params = [];

        if (type) { query += ' AND r.type = ?'; params.push(type); }
        if (status) { query += ' AND r.status = ?'; params.push(status); }
        
        // If not admin, only show own requests
        if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
            query += ' AND r.user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY r.created_at DESC';

        const [rows] = await db.execute(query, params);

        // Add withdrawable balance for withdrawal requests
        if (type === 'WITHDRAW') {
            for (let i = 0; i < rows.length; i++) {
                const userId = rows[i].user_id;
                const [trades] = await db.execute('SELECT * FROM trades WHERE user_id = ? AND status = "OPEN"', [userId]);
                const [settings] = await db.execute('SELECT config_json FROM client_settings WHERE user_id = ?', [userId]);
                const clientConfig = settings.length > 0 ? JSON.parse(settings[0].config_json || '{}') : {};
                
                const blockedMargin = MarginUtils.calculateTotalRequiredHoldingMargin(trades, clientConfig);
                rows[i].withdrawable_balance = (rows[i].current_balance || 0) - blockedMargin;
                rows[i].blocked_holding_margin = blockedMargin;
                console.log(`[getRequests] User ${userId}: Balance=${rows[i].current_balance}, Blocked=${blockedMargin}, Withdrawable=${rows[i].withdrawable_balance}`);
            }
        }

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, remark } = req.body; // status: APPROVED, REJECTED, ON_HOLD

    const normalizedStatus = (status || '').toString().trim().toUpperCase();
    if (!normalizedStatus) {
        return res.status(400).json({ message: 'Status is required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Request Details
        const [requests] = await connection.execute('SELECT * FROM payment_requests WHERE id = ? AND status = "PENDING" FOR UPDATE', [id]);
        if (requests.length === 0) throw new Error('Request not found or already processed');
        const request = requests[0];

        const finalStatus = normalizedStatus || status;
        if (finalStatus === 'APPROVED') {
            // 2. Get User Details with row lock to prevent race condition
            const [userRows] = await connection.execute('SELECT balance FROM users WHERE id = ? FOR UPDATE', [request.user_id]);
            if (!userRows.length) throw new Error('User not found');
            const user = userRows[0];
            const balanceBefore = parseFloat(user.balance || 0);
            const currentBal = balanceBefore;
            const reqAmt = parseFloat(request.amount);

            if (request.type === 'WITHDRAW') {
                // Fetch Open Trades and Config
                const [trades] = await connection.execute('SELECT * FROM trades WHERE user_id = ? AND status = "OPEN"', [request.user_id]);
                const [settings] = await connection.execute('SELECT config_json FROM client_settings WHERE user_id = ?', [request.user_id]);
                const clientConfig = settings.length > 0 ? JSON.parse(settings[0].config_json || '{}') : {};

                const blockedMargin = MarginUtils.calculateTotalRequiredHoldingMargin(trades, clientConfig);
                const withdrawable = balanceBefore - blockedMargin;

                if (reqAmt > withdrawable) {
                    throw new Error(`Insufficient Withdrawable Balance. Required Holding Margin: ₹${blockedMargin.toFixed(2)}, Available to Withdraw: ₹${withdrawable.toFixed(2)}`);
                }

                const [deductRes] = await connection.execute(
                    'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
                    [reqAmt, request.user_id, reqAmt]
                );
                if (deductRes.affectedRows === 0) {
                    throw new Error('Insufficient balance or concurrent transaction in progress');
                }
            } else {
                await connection.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [reqAmt, request.user_id]);
            }

            // 3. Get accurate New Balance inside locked transaction for Ledger
            const [updatedUserRows] = await connection.execute('SELECT balance FROM users WHERE id = ?', [request.user_id]);
            const newBalance = parseFloat(updatedUserRows[0]?.balance || 0);

            // 4. Record in Ledger with full double-entry consistency
            await connection.execute(
                `INSERT INTO ledger (user_id, amount, type, balance_before, balance_after, reference_id, reference_type, remarks, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'PAYMENT_REQUEST', ?, NOW())`,
                [
                    request.user_id,
                    reqAmt,
                    request.type,
                    balanceBefore,
                    newBalance,
                    String(request.id),
                    remark || `Payment Request Approved: ${request.type} #${request.id}`
                ]
            );

            // Invalidate user balance caches
            try {
                const { invalidateCache } = require('../utils/cacheManager');
                await invalidateCache(`users_${request.user_id}_all`);
                await invalidateCache(`users_${request.user_id}_TRADER`);
                await invalidateCache(`funds_${request.user_id}_*`);
            } catch (cacheErr) {
                console.warn('[Cache] Invalidation warning:', cacheErr.message);
            }
        }

        // 5. Update Request Status
        await connection.execute('UPDATE payment_requests SET status = ?, admin_remarks = ?, admin_id = ? WHERE id = ?', [normalizedStatus, remark, req.user.id, id]);

        await connection.commit();
        await logAction(req.user.id, `${finalStatus}_PAYMENT`, 'payment_requests', `${finalStatus} ${request.type} of ${request.amount} for user ID ${request.user_id}`);

        // Invalidate cache
        try {
            const { invalidateCache } = require('../utils/cacheManager');
            await invalidateCache(`users_${request.user_id}_*`);
            await invalidateCache(`funds_${request.user_id}_*`);
            await invalidateCache(`m2m_${request.user_id}_*`);
        } catch (_) {}

        res.json({ message: `Request ${finalStatus.toLowerCase()}` });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ message: err.message });
    } finally {
        connection.release();
    }
};

const createRequest = async (req, res) => {
    console.log('\n\n=== CREATING DEPOSIT REQUEST ===');
    console.log('User ID:', req.user?.id);
    console.log('User Role:', req.user?.role);
    console.log('Body:', req.body);
    console.log('File:', req.file ? { name: req.file.filename, size: req.file.size } : 'No file');

    const {
        amount,
        type,
        bankName,
        accountHolder,
        accountNumber,
        ifscCode,
        upiId,
        paymentMethod
    } = req.body; // type: DEPOSIT or WITHDRAW
    const userId = req.user.id;
    let screenshotUrl = null;

    console.log('Extracted: amount=' + amount + ', type=' + type);

    try {
        // Validate required fields
        // 1. Basic Balance Check (Simple)
        if (type === 'WITHDRAW') {
            const [userRows] = await db.execute('SELECT balance FROM users WHERE id = ?', [userId]);
            const user = userRows[0];
            
            // 2. Complex Block Check
            const [trades] = await db.execute('SELECT * FROM trades WHERE user_id = ? AND status = "OPEN"', [userId]);
            const [settings] = await db.execute('SELECT config_json FROM client_settings WHERE user_id = ?', [userId]);
            const clientConfig = settings.length > 0 ? JSON.parse(settings[0].config_json || '{}') : {};

            const blockedMargin = MarginUtils.calculateTotalRequiredHoldingMargin(trades, clientConfig);
            const withdrawable = (user.balance || 0) - blockedMargin;

            console.log(`[createRequest] WITHDRAW Check: User=${userId}, Balance=${user.balance}, Blocked=${blockedMargin}, Withdrawable=${withdrawable}, Requested=${amount}`);

            if (amount > withdrawable) {
                return res.status(400).json({ 
                    message: `Insufficient Withdrawable Balance. You have open positions requiring margin.`,
                    details: {
                        ledgerBalance: parseFloat(user.balance || 0).toFixed(2),
                        blockedMargin: blockedMargin.toFixed(2),
                        withdrawable: withdrawable.toFixed(2),
                        requested: parseFloat(amount).toFixed(2)
                    }
                });
            }
        }

        if (req.file) {
            const uploaded = await uploadFile(req.file.buffer, req.file.originalname, '/deposits');
            screenshotUrl = uploaded.url;
            console.log('DEBUG: Screenshot uploaded to ImageKit:', screenshotUrl);
        }

        const [result] = await db.execute(
            'INSERT INTO payment_requests (user_id, amount, type, screenshot_url, bank_name, account_holder, account_number, ifsc_code, upi_id, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "PENDING")',
            [userId, amount, type, screenshotUrl, bankName || null, accountHolder || null, accountNumber || null, ifscCode || null, upiId || null, paymentMethod || null]
        );

        console.log('DEBUG: Request created with ID:', result.insertId);

        // Log action (don't fail if logging fails)
        try {
            await logAction(userId, `CREATE_${type}_REQUEST`, 'payment_requests', `User created ${type} request of ${amount}`);
        } catch (logErr) {
            console.warn('Warning: Failed to log action:', logErr.message);
        }

        res.status(201).json({
            message: 'Request created successfully',
            id: result.insertId
        });
    } catch (err) {
        console.error('ERROR in createRequest:', err.message, err.stack);
        res.status(500).json({ message: err.message || 'Internal Server Error' });
    }
};

module.exports = { getRequests, updateRequestStatus, createRequest };
