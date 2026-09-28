const db = require('../config/db');
const tradeService = require('./TradeService');
const marketDataService = require('./MarketDataService');

let isChecking = false;

/**
 * Monitor Target & Stop Loss for all open trades
 * Evaluates live prices against target and SL thresholds.
 * Auto-closes trades when conditions are met.
 */
const monitorTargetSL = async () => {
    if (isChecking) return;
    isChecking = true;

    try {
        // Fetch all open trades with target/SL set
        const [trades] = await db.execute(`
            SELECT t.id, t.user_id, t.symbol, t.type, t.qty, t.entry_price,
                   t.target_price, t.stop_loss, t.market_type, cs.config_json
            FROM trades t
            JOIN client_settings cs ON t.user_id = cs.user_id
            WHERE t.status = 'OPEN'
            AND (t.target_price IS NOT NULL OR t.stop_loss IS NOT NULL)
        `);

        if (trades.length === 0) return;

        for (const trade of trades) {
            try {
                // Get current live price from MarketDataService
                const cleanSymbol = trade.symbol.includes(':') ? trade.symbol.split(':')[1] : trade.symbol;
                const marketType = (trade.market_type || 'MCX').toUpperCase();
                const prefix = marketType === 'EQUITY' ? 'NSE' : (marketType === 'OPTIONS' ? 'NFO' : marketType);
                
                let livePrice = null;
                const possibleSymbols = [trade.symbol, `${prefix}:${cleanSymbol}`, cleanSymbol];
                for (const s of possibleSymbols) {
                    const data = marketDataService.getPrice(s);
                    if (data && data.ltp && parseFloat(data.ltp) > 0) {
                        livePrice = parseFloat(data.ltp);
                        break;
                    }
                }

                // STRICT PRICE GUARD: If live price is not available or valid, SKIP evaluation to avoid false executions.
                let currentPrice = (livePrice !== null && !isNaN(livePrice) && parseFloat(livePrice) > 0) ? parseFloat(livePrice) : null;
                if (currentPrice === null) {
                    continue;
                }

                const targetPrice = trade.target_price !== null ? parseFloat(trade.target_price) : null;
                const stopLossPrice = trade.stop_loss !== null ? parseFloat(trade.stop_loss) : null;

                // Check TARGET HIT (Profit scenario)
                if (targetPrice !== null && targetPrice > 0) {
                    let targetHit = false;

                    if (trade.type === 'BUY' && currentPrice >= targetPrice) {
                        targetHit = true;
                    } else if (trade.type === 'SELL' && currentPrice <= targetPrice) {
                        targetHit = true;
                    }

                    if (targetHit) {
                        console.log(`[TargetSL] ✅ TARGET HIT - Trade #${trade.id} (${trade.symbol}) at live price ${currentPrice} (Target: ${targetPrice})`);
                        await autoCloseTrade(trade, currentPrice, 'TARGET_HIT');
                        continue;
                    }
                }

                // Check STOP LOSS HIT (Loss scenario)
                if (stopLossPrice !== null && stopLossPrice > 0) {
                    let slHit = false;

                    if (trade.type === 'BUY' && currentPrice <= stopLossPrice) {
                        slHit = true;
                    } else if (trade.type === 'SELL' && currentPrice >= stopLossPrice) {
                        slHit = true;
                    }

                    if (slHit) {
                        console.log(`[TargetSL] ❌ STOP LOSS HIT - Trade #${trade.id} (${trade.symbol}) at live price ${currentPrice} (SL: ${stopLossPrice})`);
                        await autoCloseTrade(trade, currentPrice, 'SL_HIT');
                        continue;
                    }
                }
            } catch (tradeErr) {
                console.error(`[TargetSL] Error processing trade #${trade.id}:`, tradeErr.message);
            }
        }
    } catch (err) {
        console.error('[TargetSL] Monitor error:', err.message);
    } finally {
        isChecking = false;
    }
};

/**
 * Auto-close trade when target/SL is hit
 */
const autoCloseTrade = async (trade, exitPrice, reason) => {
    try {
        const remark = reason === 'TARGET_HIT' ? '🎯 Target Reached (Profit)' : '❌ Stop Loss Hit (Loss)';

        // Use the centralized TradeService to handle complex P/L and Brokerage logic
        // Pass user_id as requesterId so closed_by shows the client name, not ADMIN
        await tradeService.closeTrade(trade.id, exitPrice, trade.user_id, null, remark);
        
        console.log(`[TargetSL] ✅ Trade #${trade.id} auto-closed | Exit: ${exitPrice} | Reason: ${reason}`);
    } catch (err) {
        if (err.message === 'TRADE_CLOSE_IN_PROGRESS' || err.message === 'TRADE_ALREADY_CLOSED' || err.message === 'Trade is already closed') {
            console.log(`[TargetSL] ℹ️ Trade #${trade.id} was already closing or closed concurrently. Skipped cleanly.`);
            return;
        }
        console.error(`[TargetSL] Error auto-closing trade #${trade.id}:`, err.message);
    }
};

/**
 * Start the monitoring service
 * Fast sub-second event-driven triggers + high-frequency fallback check
 */
const startTargetSLMonitoring = () => {
    // 1. High-frequency fallback interval (500ms instead of legacy 5000ms)
    setInterval(() => {
        monitorTargetSL().catch(err => console.error('[TargetSL] Polling service error:', err));
    }, 500);

    // 2. Real-time event-driven listener directly on market ticks (< 100ms response)
    marketDataService.on('update', () => {
        monitorTargetSL().catch(err => console.error('[TargetSL] Event-driven trigger error:', err));
    });

    console.log('⚡ [TargetSL] Real-time Sub-Second Target/SL monitoring service active (Event-driven + 500ms fallback)');
};

module.exports = { startTargetSLMonitoring, monitorTargetSL };
