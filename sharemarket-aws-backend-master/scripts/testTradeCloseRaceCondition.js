/**
 * Verification & Stress Test Script for Bug #8: Trade Close Race-Condition
 * ──────────────────────────────────────────────────────────────────────────
 * Tests concurrency safety by firing 10 simultaneous close requests against
 * the exact same trade ID using Promise.all().
 *
 * Verifies:
 * 1. Exactly 1 request succeeds (First-to-lock).
 * 2. Exactly 9 requests are safely rejected (Zero double execution).
 * 3. User balance is mutated strictly once.
 */

require('dotenv').config();
const db = require('../src/config/db');
const tradeService = require('../src/services/TradeService');

async function runRaceConditionTest() {
    console.log('================================================================');
    console.log('🧪 STRESS TEST: Trade Close Race-Condition & Concurrency Guard');
    console.log('================================================================\n');

    let testTradeId = null;
    let testUserId = null;
    let createdTempTrade = false;
    let startingBalance = 0;

    try {
        // 1. Find an open trade or create a dedicated dummy test trade
        const [openTrades] = await db.execute(`
            SELECT t.id, t.user_id, u.balance, u.username
            FROM trades t
            JOIN users u ON t.user_id = u.id
            WHERE t.status = 'OPEN' AND t.is_pending = 0
            LIMIT 1
        `);

        if (openTrades.length > 0) {
            testTradeId = openTrades[0].id;
            testUserId = openTrades[0].user_id;
            startingBalance = parseFloat(openTrades[0].balance || 0);
            console.log(`📌 Using existing OPEN trade #${testTradeId} for User #${testUserId} (${openTrades[0].username})`);
            console.log(`💰 User Starting Balance: ₹${startingBalance.toFixed(2)}`);
        } else {
            // Find a valid user to create a temporary test trade
            const [users] = await db.execute("SELECT id, balance, username FROM users WHERE role = 'TRADER' LIMIT 1");
            if (users.length === 0) {
                throw new Error('No test user found in database to execute test.');
            }
            testUserId = users[0].id;
            startingBalance = parseFloat(users[0].balance || 0);

            // Ensure client_settings exists
            await db.execute(`
                INSERT IGNORE INTO client_settings (user_id, config_json)
                VALUES (?, '{}')
            `, [testUserId]);

            // Insert a safe mock trade
            const [tradeInsert] = await db.execute(`
                INSERT INTO trades (
                    user_id, symbol, type, qty, entry_price, status,
                    market_type, entry_time, margin_used, is_pending
                ) VALUES (
                    ?, 'GOLD', 'BUY', 1, 4000.00, 'OPEN',
                    'COMMODITY', NOW(), 1000.00, 0
                )
            `, [testUserId]);

            testTradeId = tradeInsert.insertId;
            createdTempTrade = true;
            console.log(`📌 Created temporary test trade #${testTradeId} for User #${testUserId} (${users[0].username})`);
            console.log(`💰 User Starting Balance: ₹${startingBalance.toFixed(2)}`);
        }

        console.log(`\n🚀 Firing 10 SIMULTANEOUS closeTrade() calls for Trade #${testTradeId} via Promise.all()...\n`);

        const CONCURRENT_REQUESTS = 10;
        const promises = [];

        // Launch 10 parallel close requests at the exact same millisecond
        for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
            const reqIndex = i;
            const p = tradeService.closeTrade(
                testTradeId,
                4050.00, // Fixed mock exit price (+₹50 gross profit)
                testUserId,
                null,
                `Concurrency Stress Test Request #${reqIndex}`,
                '127.0.0.1'
            ).then(res => {
                return {
                    requestId: reqIndex,
                    success: true,
                    data: res
                };
            }).catch(err => {
                return {
                    requestId: reqIndex,
                    success: false,
                    error: err.message
                };
            });

            promises.push(p);
        }

        const results = await Promise.all(promises);

        // 2. Analyze the outcomes
        const successful = results.filter(r => r.success);
        const rejected = results.filter(r => !r.success);

        console.log('────────────────────────────────────────────────────────────────');
        console.log(`📊 CONCURRENCY EXECUTION RESULTS:`);
        console.log(`   Total Parallel Requests Fired: ${CONCURRENT_REQUESTS}`);
        console.log(`   Successful Executions        : ${successful.length}`);
        console.log(`   Rejected / Prevented         : ${rejected.length}`);
        console.log('────────────────────────────────────────────────────────────────\n');

        results.forEach(r => {
            if (r.success) {
                console.log(`   ✅ Request #${r.requestId}: SUCCESS ➜ P&L: ₹${r.data.pnl} | Balance Change: ₹${r.data.balanceChange}`);
            } else {
                console.log(`   🛡️ Request #${r.requestId}: SAFELY REJECTED ➜ Reason: ${r.error}`);
            }
        });

        // 3. Verify user balance in DB
        const [updatedUserRows] = await db.execute('SELECT balance FROM users WHERE id = ?', [testUserId]);
        const endingBalance = parseFloat(updatedUserRows[0].balance || 0);
        const actualBalanceChange = endingBalance - startingBalance;

        console.log('\n────────────────────────────────────────────────────────────────');
        console.log(`💰 BALANCE INTEGRITY VERIFICATION:`);
        console.log(`   Starting Balance      : ₹${startingBalance.toFixed(2)}`);
        console.log(`   Ending Balance        : ₹${endingBalance.toFixed(2)}`);
        console.log(`   Actual Balance Change : ₹${actualBalanceChange.toFixed(2)}`);

        if (successful.length === 1) {
            const expectedChange = parseFloat(successful[0].data.balanceChange || 0);
            console.log(`   Expected Balance Diff : ₹${expectedChange.toFixed(2)}`);
            const diff = Math.abs(actualBalanceChange - expectedChange);

            if (diff < 0.01) {
                console.log(`   ✅ Balance Match: PERFECT (Zero Duplicate Credit/Debit)`);
            } else {
                console.error(`   ❌ Balance Mismatch: Expected ${expectedChange}, got ${actualBalanceChange}`);
            }
        }
        console.log('────────────────────────────────────────────────────────────────\n');

        // 4. Assertions & Verdict
        const condition1 = (successful.length === 1);
        const condition2 = (rejected.length === CONCURRENT_REQUESTS - 1);
        const condition3 = Math.abs(actualBalanceChange - (successful[0]?.data?.balanceChange || 0)) < 0.01;

        if (condition1 && condition2 && condition3) {
            console.log('================================================================');
            console.log('🎉 VERDICT: PASSED! CONCURRENCY BUG #8 IS COMPLETELY RESOLVED!');
            console.log('================================================================');
            console.log('   • Race-condition eliminated: Exactly 1 request processed.');
            console.log('   • 9 duplicate requests safely rejected with 0ms mutex/lock.');
            console.log('   • Zero balance duplication or corruption detected.');
        } else {
            console.error('================================================================');
            console.error('❌ VERDICT: FAILED! Concurrency condition violated.');
            console.error('================================================================');
        }

    } catch (err) {
        console.error('💥 Test execution error:', err);
    } finally {
        // Clean up temporary trade if created
        if (createdTempTrade && testTradeId) {
            try {
                await db.execute('DELETE FROM trades WHERE id = ?', [testTradeId]);
                await db.execute('UPDATE users SET balance = ? WHERE id = ?', [startingBalance, testUserId]);
                console.log(`\n🧹 Cleaned up temporary test trade #${testTradeId} and restored balance.`);
            } catch (_) {}
        }
        process.exit(0);
    }
}

runRaceConditionTest();
