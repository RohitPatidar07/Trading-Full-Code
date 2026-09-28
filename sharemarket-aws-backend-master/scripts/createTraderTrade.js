const db = require('../src/config/db');

async function createTraderTrade() {
    try {
        const sql = `
            INSERT INTO trades (
                user_id, symbol, type, order_type, qty, entry_price, status,
                is_pending, market_type, product_type, entry_time, pnl,
                brokerage, swap, margin_used, created_by, trade_type,
                qty_input, actual_qty, lot_size_at_entry, trade_mode
            ) VALUES (
                109, 'MCX:GOLD26JUNFUT', 'SELL', 'MARKET', 1, 158588.00, 'OPEN',
                0, 'MCX', 'MIS', NOW(), 0,
                0, 0, 50000.00, 109, 'INTRADAY',
                '1.00', '100.00', 100, 'LOTS'
            )
        `;
        const [res] = await db.query(sql);
        console.log('SUCCESS: Created test trade with ID:', res.insertId, 'for user trader (109)');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

createTraderTrade();
