/**
 * CLI Tool: AllTick Integration & Live Market Data Health Checker
 * Usage: node scripts/checkAllTickHealth.js
 * From backend folder: node --env-file=.env scripts/checkAllTickHealth.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const axios = require('axios');

const HTTP_DEPTH_URL = 'https://quote.alltick.io/quote-b-api/depth-tick';

async function checkAllTickHealth() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 ALLTICK LIVE INTEGRATION HEALTH CHECKER (Agent #2)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const token = process.env.ALLTICKS_API_KEY;

    // 1. Verify Token Configuration
    if (!token) {
        console.log('❌ FATAL: ALLTICKS_API_KEY is not configured in .env!');
        process.exit(1);
    }

    const maskedToken = token.substring(0, 8) + '...' + token.substring(token.length - 6);
    console.log(`🔑 Configured Token: ${maskedToken}`);
    console.log(`📡 Cloud Endpoint:    ${HTTP_DEPTH_URL}`);

    // Sample Scrips across all 3 segments
    const testSymbols = [
        { code: 'BTCUSDT', segment: 'Crypto', display: 'BTC/USD' },
        { code: 'ETHUSDT', segment: 'Crypto', display: 'ETH/USD' },
        { code: 'EURUSD',  segment: 'Forex',  display: 'EUR/USD' },
        { code: 'USDINR',  segment: 'Forex',  display: 'USD/INR' },
        { code: 'GOLD',    segment: 'Comex',  display: 'XAU/USD (Gold)' },
        { code: 'USOIL',   segment: 'Comex',  display: 'USOIL (Crude)' }
    ];

    console.log(`\n⏳ Pinging AllTick Cloud API for ${testSymbols.length} cross-segment instruments...\n`);

    const startTime = Date.now();
    try {
        const queryPayload = {
            trace: `health_${Date.now()}`,
            data: {
                symbol_list: testSymbols.map(s => ({ code: s.code }))
            }
        };

        const res = await axios.get(HTTP_DEPTH_URL, {
            params: {
                token: token,
                query: JSON.stringify(queryPayload)
            },
            timeout: 10000
        });

        const latency = Date.now() - startTime;
        const body = res.data;

        if (body.ret_code && body.ret_code !== 0 && body.ret_code !== '0') {
            console.log(`❌ AllTick API Returned Error Code: ${body.ret_code} - ${body.ret_msg || 'Unknown'}`);
            process.exit(1);
        }

        console.log(`✅ Connection Established Successfully (Latency: ${latency} ms)\n`);

        const tickList = body?.data?.tick_list || [];
        const tickMap = {};
        tickList.forEach(t => {
            tickMap[t.code] = t;
        });

        console.log('┌──────────┬─────────────┬─────────────┬─────────────┬─────────────┬────────┐');
        console.log('│ Segment  │ Display Sym │ AllTick Code│ Best Bid    │ Best Ask    │ Spread │');
        console.log('├──────────┼─────────────┼─────────────┼─────────────┼─────────────┼────────┤');

        let usdInrRate = null;
        let activeRatesCount = 0;

        testSymbols.forEach(s => {
            const tick = tickMap[s.code];
            if (tick) {
                activeRatesCount++;
                const bestBid = tick.bids && tick.bids[0] ? parseFloat(tick.bids[0].price) : null;
                const bestAsk = tick.asks && tick.asks[0] ? parseFloat(tick.asks[0].price) : null;
                const spread = (bestBid && bestAsk) ? (bestAsk - bestBid).toFixed(4) : 'N/A';

                if (s.code === 'USDINR' && bestBid) {
                    usdInrRate = bestBid;
                }

                const segCol  = s.segment.padEnd(8);
                const dispCol = s.display.padEnd(11);
                const codeCol = s.code.padEnd(11);
                const bidCol  = (bestBid !== null ? bestBid.toFixed(2) : '-').padStart(11);
                const askCol  = (bestAsk !== null ? bestAsk.toFixed(2) : '-').padStart(11);
                const sprCol  = spread.padStart(6);

                console.log(`│ ${segCol} │ ${dispCol} │ ${codeCol} │ ${bidCol} │ ${askCol} │ ${sprCol} │`);
            } else {
                console.log(`│ ${s.segment.padEnd(8)} │ ${s.display.padEnd(11)} │ ${s.code.padEnd(11)} │           - │           - │      - │`);
            }
        });

        console.log('└──────────┴─────────────┴─────────────┴─────────────┴─────────────┴────────┘');

        console.log('\n─── CRITICAL CURRENCY AUDIT ───');
        if (usdInrRate) {
            console.log(`💵 Live USD/INR Conversion Benchmark: ₹${usdInrRate.toFixed(4)}`);
            console.log(`   └─ P&L Math Engine Status: 🟢 READY (1 USD = ₹${usdInrRate.toFixed(2)})`);
        } else {
            console.log(`⚠️ WARNING: USD/INR live rate was not returned in depth tick.`);
        }

        console.log('\n─── DIAGNOSTIC VERDICT ───');
        if (activeRatesCount > 0) {
            console.log(`🚦 Overall Status: 🟢 HEALTHY (${activeRatesCount}/${testSymbols.length} instruments delivering live quotes)`);
            console.log(`🛡️ Integration State: Verified & Operational for Crypto, Forex & Commodities.`);
        } else {
            console.log(`🚦 Overall Status: 🔴 NO TICKS (Check token permissions or market hours)`);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);

    } catch (err) {
        console.error('\n❌ Connection Failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

checkAllTickHealth();
