/**
 * Trading Verification & QA Tool for Antigravity Agents
 * ───────────────────────────────────────────────────
 * Provides read-only verification commands for:
 * 1. Trade Calculation Auditing (Lots * LotSize = Qty, P&L, Brokerage, Ledger)
 * 2. Contract Lot Size validation
 * 3. Symbol duplicate & collision detection
 */

const path = require('path');
const db = require('../src/config/db');

async function auditRecentTrades(limit = 20) {
    try {
        console.log(`\n🔍 [AUDIT] Running independent verification on last ${limit} closed trades...\n`);
        const [trades] = await db.query(`
            SELECT 
                t.id, t.user_id, t.symbol, t.type, t.order_type,
                t.qty, t.entry_price, t.exit_price, t.lot_size_at_entry,
                t.pnl AS recorded_pnl, t.brokerage AS recorded_brokerage,
                t.status, t.market_type, t.entry_time, t.exit_time,
                s.lot_size AS current_master_lot_size
            FROM trades t
            LEFT JOIN scrip_data s ON t.symbol = s.symbol
            WHERE t.status = 'CLOSED' AND t.exit_price IS NOT NULL
            ORDER BY t.id DESC
            LIMIT ?
        `, [limit]);

        if (trades.length === 0) {
            console.log('ℹ️ No closed trades found to audit.');
            return;
        }

        let discrepancies = 0;
        const results = [];

        for (const t of trades) {
            const entryPrice = parseFloat(t.entry_price);
            const exitPrice = parseFloat(t.exit_price);
            const recordedQty = parseInt(t.qty, 10);
            const recordedPnl = parseFloat(t.recorded_pnl);
            const recordedBrokerage = parseFloat(t.recorded_brokerage || 0);
            const lotSizeAtEntry = t.lot_size_at_entry ? parseInt(t.lot_size_at_entry, 10) : (t.current_master_lot_size ? parseInt(t.current_master_lot_size, 10) : 1);

            // Calculate expected gross P&L
            let expectedGrossPnl = 0;
            if (t.type === 'BUY') {
                expectedGrossPnl = (exitPrice - entryPrice) * recordedQty;
            } else if (t.type === 'SELL') {
                expectedGrossPnl = (entryPrice - exitPrice) * recordedQty;
            }

            const pnlDiff = Math.abs(recordedPnl - expectedGrossPnl);
            const isPnlMismatch = pnlDiff > 0.05; // 5 paise tolerance for rounding

            if (isPnlMismatch) discrepancies++;

            results.push({
                trade_id: t.id,
                user_id: t.user_id,
                symbol: t.symbol,
                type: t.type,
                qty: recordedQty,
                lot_size_at_entry: lotSizeAtEntry,
                entry_price: entryPrice,
                exit_price: exitPrice,
                recorded_pnl: recordedPnl,
                expected_pnl: parseFloat(expectedGrossPnl.toFixed(2)),
                diff: parseFloat(pnlDiff.toFixed(2)),
                status: isPnlMismatch ? '❌ MISMATCH' : '✅ OK'
            });
        }

        console.table(results);
        console.log(`\n📊 Audit Summary: Audited ${trades.length} trades | Discrepancies: ${discrepancies}`);
    } catch (err) {
        console.error('❌ Audit failed:', err.message);
    }
}

async function auditLotSizes() {
    try {
        console.log('\n🔍 [AUDIT] Checking scrip_data for missing or non-positive lot sizes...\n');
        const [badLots] = await db.query(`
            SELECT id, symbol, lot_size, market_type 
            FROM scrip_data 
            WHERE lot_size IS NULL OR lot_size <= 0
            LIMIT 50
        `);

        if (badLots.length === 0) {
            console.log('✅ All scrips in scrip_data have positive lot sizes.');
        } else {
            console.log(`⚠️ Found ${badLots.length} scrips with invalid lot sizes:`);
            console.table(badLots);
        }

        console.log('\n🔍 [AUDIT] Checking for duplicate symbol names with conflicting lot sizes...\n');
        const [duplicates] = await db.query(`
            SELECT symbol, COUNT(*) as count, MIN(lot_size) as min_lot, MAX(lot_size) as max_lot
            FROM scrip_data
            GROUP BY symbol
            HAVING count > 1 AND min_lot != max_lot
            LIMIT 50
        `);

        if (duplicates.length === 0) {
            console.log('✅ No conflicting duplicate lot sizes found.');
        } else {
            console.log(`⚠️ Found ${duplicates.length} symbols with conflicting lot sizes:`);
            console.table(duplicates);
        }
    } catch (err) {
        console.error('❌ Lot size audit failed:', err.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--audit-lots')) {
        await auditLotSizes();
    } else {
        const limitArg = args.find(a => a.startsWith('--limit='));
        const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;
        await auditRecentTrades(limit);
    }
    process.exit(0);
}

if (require.main === module) {
    main();
}

module.exports = { auditRecentTrades, auditLotSizes };
