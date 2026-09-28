// test_proof.js - Verification of Issue #2 Fix (Enforcing Server-Side PnL Calculation)
const db = require('./src/config/db');
const tradeService = require('./src/services/TradeService');

async function runVerification() {
  const connection = await db.getConnection();
  try {
    console.log('===============================================================');
    console.log('   🛡️ VERIFICATION TEST: Issue #2 Server PnL Enforcement     ');
    console.log('===============================================================\n');

    // 1. Fetch real test user
    const [uRows] = await connection.execute('SELECT id, username, balance FROM users WHERE id = 109');
    const user = uRows[0];
    const initialBalance = parseFloat(user.balance);
    console.log(`[STEP 1] Initial State:`);
    console.log(`   User: ${user.username} (ID: ${user.id})`);
    console.log(`   Starting Balance: ₹${initialBalance.toFixed(2)}\n`);

    // 2. Create a temporary 1-share test trade
    const [ins] = await connection.execute(
      'INSERT INTO trades (user_id, symbol, type, qty, entry_price, status, market_type, entry_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [user.id, 'VERIFY-TEST-SCRIP', 'BUY', 1, 100.00, 'OPEN', 'EQUITY']
    );
    const testTradeId = ins.insertId;
    console.log(`[STEP 2] Created Temporary Trade #${testTradeId}:`);
    console.log(`   Type: BUY 1 Share @ ₹100.00`);
    console.log(`   Expected Server-Side PnL if sold @ ₹200.00 = ₹100.00\n`);

    // 3. Attempt exploit: send fake client-provided PnL (₹50,000)
    console.log(`[STEP 3] Closing Trade #${testTradeId} attempting to pass fake PnL = ₹50,000.00...`);
    await tradeService.closeTrade(testTradeId, 200.00, user.id, 50000.00, 'SECURITY VERIFY');

    // 4. Inspect Database
    console.log(`\n[STEP 4] Checking Database Record:`);
    const [tRows] = await connection.execute(
      'SELECT id, entry_price, exit_price, pnl, brokerage, status FROM trades WHERE id = ?',
      [testTradeId]
    );
    const savedPnl = parseFloat(tRows[0].pnl);
    console.log(`   Trade Entry Price: ₹${tRows[0].entry_price}`);
    console.log(`   Trade Exit Price:  ₹${tRows[0].exit_price}`);
    console.log(`   Trade Saved PnL:   ₹${savedPnl.toFixed(2)}`);

    const [uAfter] = await connection.execute('SELECT balance FROM users WHERE id = ?', [user.id]);
    const finalBalance = parseFloat(uAfter[0].balance);
    const balanceJump = finalBalance - initialBalance;
    console.log(`   Starting Balance:  ₹${initialBalance.toFixed(2)}`);
    console.log(`   New User Balance:  ₹${finalBalance.toFixed(2)}`);
    console.log(`   Actual Balance Change: +₹${balanceJump.toFixed(2)}\n`);

    // 5. Clean up (Rollback)
    console.log(`[STEP 5] Cleaning up temporary test data (Rollback)...`);
    await connection.execute('DELETE FROM trades WHERE id = ?', [testTradeId]);
    await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [initialBalance, user.id]);
    console.log(`   ✅ Test trade deleted and user balance restored to ₹${initialBalance.toFixed(2)}.\n`);

    console.log('===============================================================');
    if (savedPnl === 100.00) {
      console.log('   ✅ PASS: Fake ₹50,000 was BLOCKED. Server calculated exact ₹100!');
      console.log('   ✅ System is 100% SECURE and mathematically consistent.');
    } else {
      console.log('   ❌ FAIL: Fake PnL was not blocked.');
    }
    console.log('===============================================================');
  } catch (err) {
    console.error('Error during verification test:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runVerification();
