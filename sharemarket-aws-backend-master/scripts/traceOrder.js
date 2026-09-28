/**
 * CLI Tool: Order Flow Tracer
 * Usage: node scripts/traceOrder.js <trade_id>
 * Example: node scripts/traceOrder.js 789
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const orderTraceService = require('../src/services/OrderTraceService');

async function run() {
    const rawArg = process.argv[2] || process.argv.find(a => a.startsWith('--tradeId='));
    let tradeId = null;

    if (rawArg) {
        tradeId = rawArg.replace('--tradeId=', '').trim();
    }

    if (!tradeId) {
        console.log('\n❌ ERROR: Please provide a Trade ID.');
        console.log('Usage:   node scripts/traceOrder.js <trade_id>');
        console.log('Example: node scripts/traceOrder.js 789\n');
        process.exit(1);
    }

    console.log(`\n🔍 Tracing Order Lifecycle for Trade #${tradeId}...\n`);
    const result = await orderTraceService.traceTrade(tradeId);

    if (!result.success) {
        console.log(`❌ Trace Failed: ${result.message || result.error}\n`);
        process.exit(1);
    }

    const { user, overall_status, stages, diagnosis, root_cause, recommended_fix } = result;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 ORDER TRACE AUDIT REPORT: Trade #${tradeId}`);
    console.log(`👤 Client: ${user.username} (ID: #${user.id}) | Role: ${user.role}`);
    console.log(`🚦 Overall Status: ${overall_status === 'HEALTHY' ? '🟢 HEALTHY (All Passed)' : '🔴 DEFECT DETECTED'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('─── 5-STAGE PIPELINE VERIFICATION ───');
    stages.forEach(s => {
        const badge = s.status === 'PASS' ? '✅ PASS' : (s.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL');
        console.log(`Stage ${s.stage} [${badge}]: ${s.name}`);
        console.log(`   └─ Details: ${s.notes}`);
    });

    console.log('\n─── DIAGNOSTIC SUMMARY ───');
    console.log(`• Diagnosis: ${diagnosis}`);
    if (root_cause) {
        console.log(`• Root Cause: ${root_cause}`);
    }
    console.log(`• Recommended Fix: ${recommended_fix}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
}

run().catch(err => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
});
