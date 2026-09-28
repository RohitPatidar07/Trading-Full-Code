const db = require('../config/db');

class OrderTraceService {
    /**
     * Trace an individual trade through all 5 stages of execution
     * @param {number|string} tradeId 
     */
    async traceTrade(tradeId) {
        if (!tradeId) {
            return { success: false, message: 'tradeId is required' };
        }

        try {
            // 1. Fetch the Trade Record
            const [trades] = await db.execute('SELECT * FROM trades WHERE id = ?', [tradeId]);
            if (trades.length === 0) {
                return {
                    success: false,
                    tradeId,
                    message: `Trade #${tradeId} does not exist in the database.`
                };
            }
            const trade = trades[0];

            // 2. Fetch User & Settings
            const [users] = await db.execute('SELECT id, username, role, balance FROM users WHERE id = ?', [trade.user_id]);
            const user = users[0] || { id: trade.user_id, username: 'Unknown', balance: 0 };

            const [settingsRows] = await db.execute('SELECT * FROM client_settings WHERE user_id = ?', [trade.user_id]);
            const clientSettings = settingsRows[0] || {};

            // 3. Stage 1: UI / Request Payload Check
            const stage1 = {
                stage: 1,
                name: 'UI / Request Payload',
                status: 'PASS',
                data: {
                    symbol: trade.symbol,
                    type: trade.type,
                    order_type: trade.order_type,
                    qty_input: parseFloat(trade.qty_input || trade.qty),
                    trade_mode: trade.trade_mode || 'LOTS',
                    entry_price: parseFloat(trade.entry_price),
                    entry_time: trade.entry_time
                },
                notes: `Client entered ${trade.qty_input || trade.qty} in ${trade.trade_mode || 'LOTS'} mode.`
            };

            // 4. Stage 2: Controller & Restrictions Check
            let isBanned = false;
            try {
                const [banned] = await db.execute(
                    'SELECT * FROM banned_scrips WHERE (user_id = ? OR user_id = 0) AND (symbol = ? OR symbol = "*")',
                    [trade.user_id, trade.symbol]
                );
                isBanned = banned.length > 0;
            } catch (e) {
                // Table optional check fallback
            }

            const stage2 = {
                stage: 2,
                name: 'Controller & Permissions',
                status: isBanned ? 'FAIL' : 'PASS',
                data: {
                    user_role: user.role,
                    is_banned: isBanned,
                    trade_ip: trade.trade_ip,
                    created_by: trade.created_by
                },
                notes: isBanned ? 'Symbol was explicitly banned for this user.' : 'Permission verified and order was accepted by controller.'
            };

            // 5. Stage 3: Master Lot Size & Actual Qty Check
            let masterLotSize = null;
            let lotSource = 'default';

            // Check MCX master
            if (trade.market_type === 'MCX') {
                const [mcxRows] = await db.execute('SELECT * FROM mcx_lot_sizes WHERE symbol = ?', [trade.symbol]);
                if (mcxRows.length > 0) {
                    masterLotSize = parseFloat(mcxRows[0].lot_size);
                    lotSource = 'mcx_lot_sizes';
                }
            }

            // Check Commodity / Forex / Crypto master
            if (!masterLotSize) {
                try {
                    const [cfcRows] = await db.execute('SELECT * FROM commodity_forex_crypto_lot_sizes WHERE symbol = ?', [trade.symbol]);
                    if (cfcRows.length > 0) {
                        masterLotSize = parseFloat(cfcRows[0].lot_size);
                        lotSource = 'commodity_forex_crypto_lot_sizes';
                    }
                } catch (e) {}
            }

            // Check scrip_data master
            if (!masterLotSize) {
                try {
                    const [scripRows] = await db.execute('SELECT * FROM scrip_data WHERE symbol = ?', [trade.symbol]);
                    if (scripRows.length > 0) {
                        masterLotSize = parseFloat(scripRows[0].lot_size);
                        lotSource = 'scrip_data';
                    }
                } catch (e) {}
            }

            const recordedLotSize = parseFloat(trade.lot_size_at_entry || trade.lot_size || 1);
            const resolvedLotSize = masterLotSize || recordedLotSize || 1;
            const inputQty = parseFloat(trade.qty_input || trade.qty);
            const actualQtyRecorded = parseFloat(trade.actual_qty || trade.qty);

            let expectedActualQty = inputQty;
            if ((trade.trade_mode || 'LOTS').toUpperCase() === 'LOTS') {
                expectedActualQty = inputQty * resolvedLotSize;
            }

            const qtyMatches = Math.abs(actualQtyRecorded - expectedActualQty) < 0.001;

            const stage3 = {
                stage: 3,
                name: 'Lot Size & Qty Calculation',
                status: qtyMatches ? 'PASS' : 'FAIL',
                data: {
                    input_qty: inputQty,
                    trade_mode: trade.trade_mode,
                    lot_size_at_entry: recordedLotSize,
                    master_lot_size: masterLotSize,
                    lot_source: lotSource,
                    expected_actual_qty: expectedActualQty,
                    actual_qty_in_db: actualQtyRecorded
                },
                notes: qtyMatches
                    ? `Exact match: ${inputQty} lots × ${resolvedLotSize} = ${actualQtyRecorded} units.`
                    : `Discrepancy: Expected ${expectedActualQty} units, but DB stored ${actualQtyRecorded}.`
            };

            // 6. Stage 4: Margin & Wallet Check
            const marginUsed = parseFloat(trade.margin_used || 0);
            const turnover = parseFloat(trade.turnover || (actualQtyRecorded * parseFloat(trade.entry_price)));
            const leverageUsed = parseFloat(trade.leverage_used || 1);

            const stage4 = {
                stage: 4,
                name: 'Margin & Balance Check',
                status: marginUsed >= 0 ? 'PASS' : 'WARN',
                data: {
                    margin_used: marginUsed,
                    turnover: turnover,
                    leverage_used: leverageUsed,
                    trade_type: trade.trade_type || 'INTRADAY',
                    current_user_balance: parseFloat(user.balance || 0)
                },
                notes: `Margin ₹${marginUsed.toFixed(2)} allocated with leverage ${leverageUsed}x.`
            };

            // 7. Stage 5: Lifecycle, Expiry & Ledger Integrity
            let isExpired = false;
            let expiryDateStr = null;

            // Check if symbol contains expiry pattern (e.g. 26JUN, 26SEP)
            const expiryMatch = trade.symbol.match(/(\d{2})([A-Z]{3})/);
            if (expiryMatch) {
                expiryDateStr = `${expiryMatch[1]} ${expiryMatch[2]}`;
            }

            // Check scrip_data expiry
            try {
                const [scripData] = await db.execute('SELECT expiry_date FROM scrip_data WHERE symbol = ?', [trade.symbol]);
                if (scripData.length > 0 && scripData[0].expiry_date) {
                    const exp = new Date(scripData[0].expiry_date);
                    if (exp < new Date()) {
                        isExpired = true;
                        expiryDateStr = exp.toISOString().split('T')[0];
                    }
                }
            } catch (e) {}

            // Check if trade is Intraday and opened on a past day
            const tradeDate = new Date(trade.entry_time);
            const now = new Date();
            const isPastDayIntraday = trade.trade_type === 'INTRADAY' && 
                (now.toDateString() !== tradeDate.toDateString()) &&
                trade.status === 'OPEN';

            // Fetch Ledger transactions related to this trade
            const [ledgerRows] = await db.execute(
                "SELECT * FROM ledger WHERE (reference_id = ? AND reference_type = 'TRADE') OR (reference_type = 'WEEKLY_SETTLEMENT' AND user_id = ?) ORDER BY id DESC LIMIT 5",
                [String(trade.id), trade.user_id]
            );

            let stage5Status = 'PASS';
            let stage5Notes = `Trade status: ${trade.status}.`;

            if (trade.status === 'OPEN' && (isExpired || isPastDayIntraday)) {
                stage5Status = 'FAIL';
                stage5Notes = isExpired
                    ? `CRITICAL: Contract expired (${expiryDateStr || 'past date'}), but trade remains OPEN (Orphan Position)!`
                    : `CRITICAL: Intraday trade from ${tradeDate.toISOString().split('T')[0]} was not squared off at daily cutoff and remains OPEN!`;
            }

            const stage5 = {
                stage: 5,
                name: 'Lifecycle & Expiry Integrity',
                status: stage5Status,
                data: {
                    status: trade.status,
                    is_pending: trade.is_pending,
                    is_carried_forward: trade.is_carried_forward,
                    pnl: parseFloat(trade.pnl || 0),
                    brokerage: parseFloat(trade.brokerage || 0),
                    contract_expiry: expiryDateStr,
                    is_expired_contract: isExpired,
                    is_past_day_intraday: isPastDayIntraday,
                    settlement_id: trade.settlement_id,
                    ledger_entries_count: ledgerRows.length
                },
                ledger_recent: ledgerRows.map(l => ({
                    id: l.id,
                    type: l.type,
                    amount: parseFloat(l.amount),
                    balance_before: parseFloat(l.balance_before),
                    balance_after: parseFloat(l.balance_after),
                    remarks: l.remarks
                })),
                notes: stage5Notes
            };

            // Overall Diagnosis & Root Cause
            const failedStages = [stage1, stage2, stage3, stage4, stage5].filter(s => s.status === 'FAIL');
            let diagnosis = 'Trade executed normally with all verification checkpoints passing.';
            let rootCause = null;
            let recommendedFix = 'No action required.';

            if (failedStages.length > 0) {
                const firstFail = failedStages[0];
                if (firstFail.stage === 3) {
                    diagnosis = 'Quantity discrepancy detected between input lots and actual units recorded in database.';
                    rootCause = 'SymbolHelper or TradeService failed to look up master lot size, defaulting to wrong lot size.';
                    recommendedFix = 'Ensure symbol master table contains latest exchange lot size and check tradeController lot calculation.';
                } else if (firstFail.stage === 5) {
                    diagnosis = 'Orphaned Open Position detected. Trade remained active past valid market cutoff or contract expiration.';
                    rootCause = 'expirySquareOffService.js only closes trades on margin shortfall and lacks an explicit expiry_date check.';
                    recommendedFix = 'Add contract expiration date check in expirySquareOffService.js to force square-off on expiry date regardless of wallet balance.';
                } else if (firstFail.stage === 2) {
                    diagnosis = 'Trade was accepted for a banned or restricted instrument.';
                    rootCause = 'tradeController.js permitted order placement despite banned status.';
                    recommendedFix = 'Verify isScripBannedForUser middleware prior to order insertion.';
                }
            }

            return {
                success: true,
                trade_id: trade.id,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                overall_status: failedStages.length === 0 ? 'HEALTHY' : 'DEFECT_DETECTED',
                failed_stage_count: failedStages.length,
                stages: [stage1, stage2, stage3, stage4, stage5],
                diagnosis,
                root_cause: rootCause,
                recommended_fix: recommendedFix,
                audited_at: new Date().toISOString()
            };

        } catch (err) {
            console.error('[OrderTraceService] Trace Error:', err);
            return {
                success: false,
                tradeId,
                error: err.message
            };
        }
    }
}

module.exports = new OrderTraceService();
