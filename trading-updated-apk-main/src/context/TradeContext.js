import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Alert, Platform } from 'react-native';

const scheduleIdleTask = (fn) => {
    if (typeof requestIdleCallback === 'function') {
        return requestIdleCallback(fn);
    }
    return setTimeout(fn, 0);
};
import { SOCKET_URL } from '../constants/Config';
import * as api from '../services/api';
import TradeSuccessPopup from '../components/TradeSuccessPopup';
import { formatScriptSymbol } from '../utils/formatPrice';
import { calculateEquityPnL, calculateMcxPnL } from '../utils/equityPnL';
import { calculateUsdPnL, calculateCryptoPnL, calculateForexPnL, calculateComexPnL } from '../utils/usdPnL';
import { calculateSegmentMargin, isMcxSymbol } from '../utils/segmentMargin';

export { formatScriptSymbol };

const TradeContext = createContext();

export const useTrades = () => useContext(TradeContext);

// No hardcoded initial prices — show 0 until live API data arrives
const INITIAL_MARKET_STATE = {};

export const INSTRUMENT_META = {
    // ===== MCX CRUDE =====
    'CRUDEOIL': { multiplier: 100, market: 'MCX' },        // Mega
    'CRUDEOILM': { multiplier: 10, market: 'MCX' },        // Mini
    'MCRUDEOIL': { multiplier: 10, market: 'MCX' },        // Mini (alternate naming)

    // ===== MCX NATURAL GAS =====
    'NATURALGAS': { multiplier: 1250, market: 'MCX' },     // Mega
    'NATURALGASM': { multiplier: 125, market: 'MCX' },     // Mini
    'MNATURALGAS': { multiplier: 125, market: 'MCX' },     // Mini (alternate naming)
    'NATGASMINI': { multiplier: 250, market: 'MCX' },

    // ===== MCX GOLD =====
    'GOLD': { multiplier: 100, market: 'MCX' },            // Mega
    'GOLDM': { multiplier: 10, market: 'MCX' },            // Mini
    'MGOLD': { multiplier: 10, market: 'MCX' },            // Mini (alternate naming)
    'GOLDGUINEA': { multiplier: 8, market: 'MCX' },        // Small
    'GOLDPETAL': { multiplier: 1, market: 'MCX' },         // Micro

    // ===== MCX SILVER =====
    'SILVER': { multiplier: 30, market: 'MCX' },           // Mega
    'SILVERM': { multiplier: 5, market: 'MCX' },           // Mini
    'MSILVER': { multiplier: 5, market: 'MCX' },           // Mini (alternate naming)
    'SILVERMIC': { multiplier: 1, market: 'MCX' },         // Micro

    // ===== MCX BASE METALS =====
    'COPPER': { multiplier: 2500, market: 'MCX' },         // Mega
    'COPPERM': { multiplier: 250, market: 'MCX' },        // Mini
    'MCOPPER': { multiplier: 250, market: 'MCX' },

    'ZINC': { multiplier: 5000, market: 'MCX' },           // Mega
    'ZINCMINI': { multiplier: 1000, market: 'MCX' },       // Mini
    'MZINC': { multiplier: 1000, market: 'MCX' },

    'NICKEL': { multiplier: 1500, market: 'MCX' },         // Standard
    'NICKELMINI': { multiplier: 100, market: 'MCX' },
    'MNICKEL': { multiplier: 100, market: 'MCX' },

    'LEAD': { multiplier: 5000, market: 'MCX' },           // Mega
    'LEADMINI': { multiplier: 1000, market: 'MCX' },       // Mini
    'MLEAD': { multiplier: 1000, market: 'MCX' },

    'ALUMINIUM': { multiplier: 5000, market: 'MCX' },      // Mega
    'ALUMINI': { multiplier: 1000, market: 'MCX' },        // Mini
    'ALUMINIUMM': { multiplier: 1000, market: 'MCX' },     // Mini
    'MALUMINIUM': { multiplier: 1000, market: 'MCX' },
    'MENTHAOIL': { multiplier: 360, market: 'MCX' },
    'COTTON': { multiplier: 25, market: 'MCX' },
    'BULLDEX': { multiplier: 1, market: 'MCX' },

    // ===== NSE EQUITY =====
    'TCS': { multiplier: 1, market: 'NSE' },
    'RELIANCE': { multiplier: 1, market: 'NSE' },
    'SBIN': { multiplier: 1, market: 'NSE' },
    'INFY': { multiplier: 1, market: 'NSE' },
    'HDFCBANK': { multiplier: 1, market: 'NSE' },

    // ===== CRYPTO & COMMODITY SPOT =====
    'BTC/USDT': { multiplier: 1, market: 'Crypto' },
    'XAU/USD': { multiplier: 100, market: 'Commodity' },
    'XAUUSD': { multiplier: 100, market: 'Commodity' },
    'XAUUSDM': { multiplier: 10, market: 'Commodity' },
    'MXAU': { multiplier: 10, market: 'Commodity' },
    'XAG/USD': { multiplier: 500, market: 'Commodity' },
    'XAGUSD': { multiplier: 500, market: 'Commodity' },
    'XAGUSDM': { multiplier: 500, market: 'Commodity' },
    'MXAG': { multiplier: 500, market: 'Commodity' }
};

// ── SYMBOL NORMALIZATION HELPERS ──
export const normalizeSymbol = (symbol) => {
    if (!symbol) return '';
    // E.g. "MCX:SILVER26MAYFUT" → "SILVER26MAYFUT"
    // Keep the expiry part to avoid different contracts (MAY vs JUN) colliding
    const tradingSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;

    // Normalize NIFTY/BANKNIFTY
    if (tradingSymbol.startsWith('NIFTY 50')) return 'NIFTY 50';
    if (tradingSymbol.startsWith('BANK NIFTY')) return 'BANK NIFTY';

    // Remove spaces, slashes, underscores, and dashes.
    // e.g. "BTC/USD" -> "BTCUSD", "SILVER 26MAY" -> "SILVER26MAY", "SILVER26MAYFUT" -> "SILVER26MAY"
    return tradingSymbol
        .replace(/[\s\/\_\-]+/g, '')
        .replace(/FUT$/i, '')
        .toUpperCase();
};

const MOCK_TRADES = [];

export const TradeProvider = ({ children }) => {
    const [trades, setTrades] = useState([]);
    const [userConfig, setUserConfig] = useState(null);
    const [dbLotSizes, setDbLotSizes] = useState({});
    const [extraMarketData, setExtraMarketData] = useState([]);

    const getDbLotSize = (name) => {
        if (!name) return null;
        const cleanSym = name.includes(':') ? name.split(':')[1] : name;
        const normKey = normalizeSymbol(cleanSym);
        const upperSym = cleanSym.toUpperCase();
        return dbLotSizes[name] || dbLotSizes[cleanSym] || dbLotSizes[upperSym] || dbLotSizes[normKey] || null;
    };
    const [successPopupVisible, setSuccessPopupVisible] = useState(false);
    const [successPopupMessage, setSuccessPopupMessage] = useState('');
    const [successPopupTitle, setSuccessPopupTitle] = useState('');

    const allowedCryptoSymbolsRef = useRef(null);
    const allowedForexSymbolsRef = useRef(null);
    const allowedCommoditySymbolsRef = useRef(null);

    const [livePrices, setLivePrices] = useState(INITIAL_MARKET_STATE);
    const [priceHistory, setPriceHistory] = useState(() => {
        const initialHistory = {};
        Object.keys(INITIAL_MARKET_STATE).forEach(key => {
            initialHistory[key] = [INITIAL_MARKET_STATE[key], INITIAL_MARKET_STATE[key]];
        });
        return initialHistory;
    });

    // Live Price Socket Integration
    useEffect(() => {
        console.log('🔌 [Socket] Initializing socket connection to:', SOCKET_URL);
        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('✅ [Socket] Connected successfully');
            // Send join event with user info to subscribe to personalized updates
            const user = api.getSessionUser();
            socket.emit('join', {
                userId: user?.id || 'mobile-user',
                role: user?.role || 'TRADER',
                username: user?.username || 'anonymous'
            });
        });

        socket.on('connected', (data) => {
        });

        socket.on('joined', (data) => {
        });

        socket.on('price_update', (newPrices) => {
            scheduleIdleTask(() => {
                setLivePrices(prev => {
                    const updatedPrices = { ...prev };
                    let changed = false;
                    Object.keys(newPrices).forEach(symbol => {
                        const data = newPrices[symbol];
                        const normKey = normalizeSymbol(symbol);
                        const cleanSym = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                        const cleanNorm = normalizeSymbol(cleanSym);

                        let newLtp = 0, newBid = 0, newAsk = 0;
                        let newOpen = 0, newHigh = 0, newLow = 0, newClose = 0, newVolume = 0, newChange = 0;
                        if (typeof data === 'object') {
                            newLtp = data.ltp || data.price || 0;
                            newBid = data.bid || (data.depth?.buy?.[0]?.price) || (prev[normKey]?.bid) || newLtp;
                            newAsk = data.ask || (data.depth?.sell?.[0]?.price) || (prev[normKey]?.ask) || newLtp;
                            newOpen = data.open || data.ohlc?.open || prev[normKey]?.open || 0;
                            newHigh = data.high || data.ohlc?.high || prev[normKey]?.high || 0;
                            newLow = data.low || data.ohlc?.low || prev[normKey]?.low || 0;
                            newClose = data.close || data.ohlc?.close || prev[normKey]?.close || 0;
                            newVolume = data.volume !== undefined ? data.volume : (data.vol !== undefined ? data.vol : (prev[normKey]?.volume || 0));
                            newChange = data.change !== undefined ? data.change : (data.chg !== undefined ? data.chg : (data.chg_pct !== undefined ? data.chg_pct : (prev[normKey]?.change || 0)));
                        } else {
                            newLtp = data;
                            newBid = data;
                            newAsk = data;
                        }

                        const priceObj = {
                            ltp: newLtp,
                            bid: newBid,
                            ask: newAsk,
                            open: newOpen,
                            high: newHigh,
                            low: newLow,
                            close: newClose,
                            volume: newVolume,
                            change: newChange
                        };

                        const old = prev[normKey] || {};
                        if (old.ltp !== newLtp || old.bid !== newBid || old.ask !== newAsk || old.open !== newOpen || old.high !== newHigh || old.low !== newLow || old.close !== newClose || old.volume !== newVolume || old.change !== newChange) {
                            updatedPrices[normKey] = priceObj;
                            if (symbol) updatedPrices[symbol] = priceObj;
                            if (cleanSym) updatedPrices[cleanSym] = priceObj;
                            if (cleanNorm) updatedPrices[cleanNorm] = priceObj;
                            changed = true;
                        }
                    });
                    return changed ? updatedPrices : prev;
                });
            });
        });

        socket.on('disconnect', (reason) => {
            console.warn(`⚠️ [Socket] Disconnected. Reason:`, reason);
        });

        socket.on('error', (err) => {
            console.error(`❌ [Socket] Error:`, err);
        });

        // Listen for admin notifications (from web dashboard)
        socket.on('notification', (notif) => {
            console.log('📢 New notification received:', notif);

            const notifObj = {
                id: notif.id?.toString() || `notif-${Date.now()}`,
                title: notif.title || 'Notification',
                message: notif.message || '',
                type: notif.type || 'info',
                time: notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                acknowledged: notif.is_read ? true : false,
                createdAt: new Date(notif.created_at || Date.now())
            };

            // Add to adminNotifications (displays in "Admin Messages" tab)
            addAdminNotification(notifObj);

            // Show popup alert immediately
            if (notif.type === 'ORDER_EXECUTED' || notif.type === 'EXECUTE_PENDING') {
                setSuccessPopupTitle('Pending Order Executed');
                let msg = notif.message || '';
                if (msg.startsWith('Order Executed!')) {
                    const parts = msg.replace('Order Executed!', '').trim().split(' at ');
                    const orderInfo = parts[0] || '';
                    const priceInfo = parts[1] || '';
                    const type = orderInfo.includes('BUY') ? 'BUY' : 'SELL';
                    let symbol = orderInfo.replace('BUY', '').replace('SELL', '').trim();
                    if (symbol.includes(':')) symbol = symbol.split(':')[1];
                    msg = `Pending ${type} order for ${symbol} executed successfully at ${priceInfo}.`;
                }
                setSuccessPopupMessage(msg);
                setSuccessPopupVisible(true);
            } else if (notif.type !== 'ORDER_PLACED' && notif.type !== 'TRADE_CLOSED' && notif.type !== 'TRADE_CANCELLED') {
                Alert.alert(
                    notifObj.title,
                    notifObj.message,
                    [{ text: 'OK', onPress: () => console.log('Notification acknowledged') }],
                    { cancelable: true }
                );
            }

            console.log('✅ Notification popup shown');
        });

        // Listen for alert triggers (hit target price)
        socket.on('alert_triggered', (data) => {
            if (!alertSettingsRef.current.priceAlerts) return;

            console.log('🔔 Price Alert Triggered:', data);

            // 1. Update local state
            setUserAlerts(prev => prev.map(a =>
                a.id === data.id.toString()
                    ? { ...a, status: 'triggered', triggeredAt: new Date() }
                    : a
            ));

            // 2. Add global notification
            addNotification({
                title: 'Price Alert Hit! 🎯',
                message: data.message || `${data.symbol} hit your target of ₹${data.targetPrice}`,
                type: 'success'
            });

            // 3. Show popup if app is in foreground
            Alert.alert(
                'Price Alert Hit! 🎯',
                data.message || `${data.symbol} hit your target of ₹${data.targetPrice}`,
                [{ text: 'OK' }]
            );
        });

        // 🔄 Real-time trade updates (e.g. pending order executed)
        socket.on('trade_update', (data) => {
            console.log('🔄 Trade update received via socket:', data);

            // No toast as per user request, UI will show "Executed from Pending" badge
            refreshTrades();
            refreshBalance();
        });

        // Listen for notification deletion
        socket.on('notification_deleted', (data) => {
            console.log('🗑️ Notification deleted:', data.id);
        });

        // Listen for real-time support message replies
        socket.on('support_message_received', (data) => {
            console.log('✉️ Real-time support message received via socket:', data);

            // Re-fetch support tickets count
            try {
                api.getSupportTickets().then(tickets => {
                    if (tickets && Array.isArray(tickets)) {
                        const unread = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
                        setUnreadSupportCount(unread);
                    }
                }).catch(e => console.log('Support count fetch failed:', e));
            } catch (e) { }

            // Trigger global callbacks if active
            if (global.onSupportMessageReceived) {
                global.onSupportMessageReceived(data);
            }
            if (global.onRefreshSupportTickets) {
                global.onRefreshSupportTickets();
            }
        });

        // Real-time updates for Crypto & Forex
        socket.on('market_data_update', (update) => {
            const { type, data } = update || {};
            if (!data || !Array.isArray(data)) {
                console.warn(`⚠️ [market_data_update] Invalid data received:`, { type, dataType: typeof data, isArray: Array.isArray(data) });
                return;
            }

            // DEBUG: Log what we're receiving from server
            if (data.length > 0) {
                // console.log(`📡 [market_data_update] ${type}: `, {
                //     count: data.length,
                //     firstItem: {
                //         symbol: data[0].symbol,
                //         ltp: data[0].ltp,
                //         bid: data[0].bid,
                //         ask: data[0].ask
                //     }
                // });
            } else {
                console.warn(`⚠️ [market_data_update] ${type} received but empty data array`);
            }

            let prefix = 'FOREX';
            let cat = 'FOREX';
            let allowedSet = null;
            if (type === 'crypto') {
                if (allowedCategories && !allowedCategories.includes('CRYPTO')) return;
                prefix = 'CRYPTO';
                cat = 'CRYPTO';
                allowedSet = allowedCryptoSymbolsRef.current;
            } else if (type === 'forex') {
                if (allowedCategories && !allowedCategories.includes('FOREX')) return;
                prefix = 'FOREX';
                cat = 'FOREX';
                allowedSet = allowedForexSymbolsRef.current;
            } else if (type === 'commodity') {
                if (allowedCategories && !allowedCategories.includes('COMMODITY')) return;
                prefix = 'COMMODITY';
                cat = 'COMMODITY';
                allowedSet = allowedCommoditySymbolsRef.current;
            }

            setWatchlist(prev => {
                const filtered = prev.filter(r => {
                    const sym = r.fullSymbol || r.symbol;
                    return !sym?.startsWith(`${prefix}:`);
                });
                let itemsToMap = type === 'forex'
                    ? data.filter(item => {
                        const sym = item.symbol.includes(':') ? item.symbol.split(':')[1] : item.symbol;
                        return sym !== 'XAU/USD' && sym !== 'XAG/USD' && sym !== 'XAUUSD' && sym !== 'XAGUSD';
                    })
                    : data;

                if (allowedSet) {
                    itemsToMap = itemsToMap.filter(item => allowedSet.has(item.symbol) || allowedSet.has(item.name));
                }

                const newRows = itemsToMap.map(item => ({
                    id: `${type}-${item.symbol}`,
                    name: item.name || item.symbol,
                    fullSymbol: item.symbol.includes(':') ? item.symbol : `${prefix}:${item.symbol}`,
                    category: cat,
                    exchange: prefix,
                    type: prefix,
                    ltp: String(item.ltp || item.price || 0),
                    bid: String(item.bid || item.ltp || item.price || 0),
                    ask: String(item.ask || item.ltp || item.price || 0),
                    change: String(item.chg_pct || item.changePct || item.change || 0),
                    changePct: String(item.chg_pct || item.changePct || 0),
                    high: String(item.high || 0),
                    low: String(item.low || 0),
                    open: String(item.open || 0),
                    close: String(item.close || 0),
                    date: new Date().toISOString().split('T')[0],
                    lotSize: Number(item.lotSize || item.lot_size || 1),
                    status: 'active',
                }));
                return [...filtered, ...newRows];
            });

            setLivePrices(prev => {
                const next = { ...prev };
                let changed = false;
                data.forEach(item => {
                    const normKey = normalizeSymbol(item.name || item.symbol);
                    const ltp = item.ltp || item.price || 0;
                    const bid = item.bid || item.ltp || item.price || 0;
                    const ask = item.ask || item.ltp || item.price || 0;

                    if (!prev[normKey] || prev[normKey].ltp !== ltp) {
                        next[normKey] = { ltp, bid, ask };
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        });

        return () => socket.disconnect();
    }, []);

    // Initial Data Fetch
    // Note: This is now called from LoginScreen after successful login
    // useEffect(() => {
    //     fetchInitialData();
    // }, []);

    // Parse symbol like "MCX:GOLDGUINEA26APRFUT" → { name: "GOLDGUINEA 26APR", displayName: "GOLDGUINEA 26APR", exchange: "MCX" }
    const parseTradeSymbol = (symbol) => {
        const parts = symbol.split(':');
        const exchange = parts.length > 1 ? parts[0] : '';
        let tradingSymbol = parts.length > 1 ? parts[1] : symbol;

        const prefixes = ['CRYPTO:', 'FOREX:', 'COMMODITY:', 'COMEX:', 'MCX:', 'NSE:', 'NFO:'];
        for (const p of prefixes) {
            if (tradingSymbol.toUpperCase().startsWith(p)) {
                tradingSymbol = tradingSymbol.substring(p.length).trim();
                break;
            }
        }

        let name = tradingSymbol;
        const futMatch = tradingSymbol.match(/^([A-Z]+)(\d{1,2}[A-Z]{3}\d{0,2})FUT$/i);
        if (futMatch) {
            name = `${futMatch[1].toUpperCase()} ${futMatch[2].toUpperCase()}`;
        }

        return { name, displayName: name, tradingSymbol, exchange };
    };

    // Map API trade object to local trade format
    const mapApiTrade = (t) => {
        const parsed = parseTradeSymbol(t.symbol || '');

        // For CRYPTO/FOREX, extract the actual symbol (e.g., "BTC/USD" from "CRYPTO:BTC/USD")
        let displayName = parsed.displayName;
        let name = parsed.name;
        if ((t.market_type === 'CRYPTO' || t.market_type === 'FOREX' || t.market_type === 'COMMODITY' || t.market_type === 'COMEX') && t.symbol) {
            // Remove all leading CRYPTO:, FOREX:, COMMODITY: and COMEX: prefixes to get clean symbol
            let cleanSymbol = t.symbol;
            let foundActualSymbol = false;

            // Keep removing prefixes from the start
            while (!foundActualSymbol && cleanSymbol) {
                if (cleanSymbol.startsWith('CRYPTO:')) {
                    cleanSymbol = cleanSymbol.substring(7); // Remove "CRYPTO:"
                } else if (cleanSymbol.startsWith('FOREX:')) {
                    cleanSymbol = cleanSymbol.substring(6); // Remove "FOREX:"
                } else if (cleanSymbol.startsWith('COMMODITY:')) {
                    cleanSymbol = cleanSymbol.substring(10); // Remove "COMMODITY:"
                } else if (cleanSymbol.startsWith('COMEX:')) {
                    cleanSymbol = cleanSymbol.substring(6); // Remove "COMEX:"
                } else {
                    foundActualSymbol = true;
                }
            }

            if (cleanSymbol) {
                displayName = cleanSymbol;
                name = cleanSymbol;
            }
        }

        // Determine if trade is completed/closed
        // Check status field, exit_price, and is_completed flag
        const isTradeCompleted =
            t.status === 'CLOSED' ||
            t.status === 'COMPLETED' ||
            t.is_completed === 1 ||
            (t.exit_price !== null && t.exit_price !== undefined && t.exit_price !== '');

        // Determine if trade is pending
        const isTradePending = t.status === 'PENDING' || t.is_pending === 1;

        return {
            id: t.id.toString(),
            name: name,
            displayName: displayName,
            fullSymbol: t.symbol,
            exchange: parsed.exchange,
            type: t.type,
            qty: (t.qty || 1).toString(),
            entryPrice: (t.entry_price || 0).toString(),
            exitPrice: t.exit_price ? t.exit_price.toString() : null,
            margin_used: Number(t.margin_used) || 0,
            pnl: Number(t.pnl) || 0,
            stop_loss: t.stop_loss || null,
            stopLoss: t.stop_loss || null,
            sl: t.stop_loss || null,
            target: t.target_price || null,
            target_price: t.target_price || null,
            brokerage: Number(t.brokerage) || 0,
            time: t.entry_time ? new Date(t.entry_time).toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
            entryTimeRaw: t.entry_time || t.created_at || t.time || '',
            exitTime: t.exit_time ? new Date(t.exit_time).toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null,
            exitTimeRaw: t.exit_time || t.updated_at || '',
            exit_time: t.exit_time || t.updated_at || null,
            isCompleted: isTradeCompleted,
            isPending: isTradePending,
            executedFromPending: t.executed_from_pending === 1,
            market: t.market_type || 'MCX',
            market_type: t.market_type || 'MCX',
            username: t.username || 'Unknown',
            closed_by: t.closed_by || 'Unknown',
            closeRemark: t.close_remark || null,
            is_usd_segment: (t.market_type === 'COMMODITY') || (t.market_type === 'COMEX') || (t.market_type === 'FOREX') || (t.market_type === 'CRYPTO'),
            is_commodity: (t.market_type === 'COMMODITY') || (t.market_type === 'COMEX') || (t.market_type === 'FOREX') || (t.market_type === 'CRYPTO'),
            lot_size: Number(t.lot_size) || Number(t.lot_size_at_entry) || 1,
            lot_size_at_entry: Number(t.lot_size_at_entry) || Number(t.lot_size) || 1,
            actual_qty: (t.actual_qty !== undefined && t.actual_qty !== null) ? Number(t.actual_qty) : null,
            qty_input: (t.qty_input !== undefined && t.qty_input !== null) ? Number(t.qty_input) : null,
            trade_mode: t.trade_mode || null,
            equity_units_mode: t.equity_units_mode !== undefined ? t.equity_units_mode : null,
            usdinr_value: Number(t.usdinr_value) || 95.1
        };
    };

    const fetchInitialData = async () => {
        if (!api.hasSession()) {
            console.log('ℹ️ No active session, skipping data fetch');
            return;
        }

        try {
            const user = api.getSessionUser();
            
            // Run all independent initial API fetches in parallel for maximum speed
            const promises = [
                // 1. User profile config
                (async () => {
                    if (user && user.id) {
                        try {
                            const profileData = await api.getUserProfile(user.id);
                            if (profileData && profileData.settings) {
                                const settings = profileData.settings;
                                const parsedConfig = typeof settings.config_json === 'string'
                                    ? JSON.parse(settings.config_json)
                                    : (settings.config_json || {});

                                setUserConfig({
                                    ...settings,
                                    ...parsedConfig,
                                    tradeEquityUnits: settings.trade_equity_units
                                });
                            }
                        } catch (configErr) {
                            console.warn('⚠️ Could not fetch user profile config:', configErr.message);
                        }
                    }
                })(),

                // 2. Zerodha Market Data (Kite & OHLC)
                (async () => {
                    await fetchOhlcData();
                    await fetchKiteMarketData();
                    if (kiteMarketData.length > 0) {
                        setKiteStatus({ connected: true, error: null, message: null });
                        setDataError(null);
                    }

                    if (!kiteLoadedRef.current) {
                        try {
                            const wl = await api.getWatchlist();
                            if (wl && wl.length > 0) {
                                const mappedWl = wl.map(item => ({
                                    ...item,
                                    fullSymbol: item.fullSymbol || item.symbol || ''
                                }));
                                setWatchlist(mappedWl);
                            }
                        } catch (wlErr) {
                            console.warn('⚠️ Could not fetch fallback watchlist:', wlErr.message);
                        }
                    }
                })(),

                // 3. Trades
                (async () => {
                    try {
                        const allTrades = await api.getTrades('');
                        if (allTrades && Array.isArray(allTrades) && allTrades.length > 0) {
                            const newTrades = allTrades.filter(t => t.status !== 'DELETED').map(mapApiTrade);
                            setTrades(newTrades);
                        } else {
                            setTrades([]);
                        }
                    } catch (tradesErr) {
                        console.warn('⚠️ Could not fetch trades:', tradesErr.message);
                    }
                })(),

                // 4. Indices
                (async () => {
                    try {
                        const idx = await api.getIndices();
                        if (idx && idx.length > 0) {
                            setIndices(idx);
                        }
                    } catch (indicesErr) {
                        console.warn('⚠️ Could not fetch indices:', indicesErr.message);
                    }
                })(),

                // 5. Portfolio balance & margin (funds)
                (async () => {
                    try {
                        const bal = await api.getFunds();
                        if (bal) {
                            setLedgerBalance(Number(bal.balance) || 0);
                            setMarginUsed(Number(bal.margin_used) || 0);
                            setMarginAvailable(Number(bal.margin_available) || 0);
                            setApiNetPL(Number(bal.net_pl) || 0);
                            const seg = bal.margin_by_segment || {};
                            setMarginBySegment({
                                MCX: Number(seg.MCX) || 0,
                                EQUITY: Number(seg.EQUITY) || 0,
                                OPTIONS: Number(seg.OPTIONS) || 0,
                                COMEX: Number(seg.COMEX) || 0
                            });
                        }
                    } catch (balErr) {
                        console.warn('❌ Could not fetch funds:', balErr.message);
                    }
                })(),

                // 6. DB Lot sizes map
                (async () => {
                    try {
                        const token = api.getToken();
                        const scripRes = await fetch(`${SOCKET_URL}/api/dashboard/scrips`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (scripRes.ok) {
                            const scripMapData = await scripRes.json();
                            setDbLotSizes(scripMapData);
                        }
                    } catch (e) {
                        console.warn('⚠️ Could not fetch DB scrips lot sizes:', e.message);
                    }
                })(),

                // 7. Persistent watchlist pins
                (async () => {
                    try {
                        const savedWatchlist = await api.getUserWatchlist();
                        if (Array.isArray(savedWatchlist) && savedWatchlist.length > 0) {
                            setIncludedPins(new Set(savedWatchlist));
                        }
                    } catch (wlErr) {
                        console.log('ℹ️ Watchlist pins fetch error:', wlErr.message);
                    }
                })(),

                // 8. Notifications, Alerts, Withdrawals, Tickers
                (async () => {
                    try {
                        const notifs = await api.getNotifications();
                        if (notifs && Array.isArray(notifs)) {
                            const adminNotifs = notifs.map(n => ({
                                id: n.id?.toString() || `notif-${Date.now()}`,
                                title: n.title || 'Notification',
                                message: n.message || '',
                                type: n.type || 'info',
                                time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                                acknowledged: n.is_read ? true : false,
                                createdAt: new Date(n.created_at || Date.now())
                            }));
                            setAdminNotifications(adminNotifs);
                        }
                    } catch (_) {}

                    try {
                        const alerts = await api.getAlerts();
                        if (alerts) {
                            const mappedAlerts = (Array.isArray(alerts) ? alerts : (alerts.data || [])).map(a => ({
                                ...a,
                                id: a.id.toString(),
                                targetPrice: Number(a.target_price || a.targetPrice || 0)
                            }));
                            setUserAlerts(mappedAlerts);
                        }
                    } catch (_) {}

                    try {
                        const wds = await api.getWithdrawals();
                        if (wds && wds.length > 0) setWithdrawalRequests(wds);
                    } catch (_) {}

                    try {
                        const alertSets = await api.getAlertSettings();
                        if (alertSets) setAlertSettings(prev => ({ ...prev, ...alertSets }));
                    } catch (_) {}

                    try {
                        const tickerData = await api.getTickers();
                        if (tickerData && Array.isArray(tickerData)) setTickers(tickerData);
                    } catch (_) {}

                    try {
                        const tickets = await api.getSupportTickets();
                        if (tickets && Array.isArray(tickets)) {
                            const unread = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
                            setUnreadSupportCount(unread);
                        }
                    } catch (_) {}
                })()
            ];

            await Promise.all(promises);
        } catch (globalErr) {
            console.warn('⚠️ fetchInitialData error:', globalErr.message);
        }
    };

    const addTrade = async (trade) => {
        // --- OPTIMISTIC UI UPDATE ---
        const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const optimisticTrade = {
            id: tempId,
            name: trade.name,
            displayName: trade.name,
            fullSymbol: trade.name,
            type: trade.type,
            qty: trade.qty.toString(),
            entryPrice: trade.price.toString(),
            status: trade.isPending ? 'PENDING' : 'OPEN',
            isPending: trade.isPending,
            time: new Date().toISOString(),
            pnl: 0,
            margin_used: 0
        };

        setTrades(prev => [optimisticTrade, ...prev]);

        try {
            const res = await api.placeOrder({
                symbol: trade.name,
                type: trade.type,
                qty: trade.qty,
                price: trade.price,
                order_type: trade.isPending ? 'LIMIT' : 'MARKET',
                is_pending: trade.isPending || false,
                transactionPassword: trade.transactionPassword,
                equity_units_mode: trade.equity_units_mode,
                instrument_type: trade.instrument_type,
                actual_qty: trade.actual_qty,
                lot_size_at_entry: trade.lot_size_at_entry
            });

            // Refresh trades in background — don't block the success popup
            refreshTrades().catch(() => {});
            return res;
        } catch (err) {
            // Rollback optimistic update
            setTrades(prev => prev.filter(t => t.id !== tempId));
            throw err;
        }
    };

    const closeTrade = async (ids, exitPrice, exitTime, pnl) => {
        // Normalize IDs to an array of strings
        const idList = (Array.isArray(ids) ? ids : [ids]).map(id => id.toString());
        console.log('🏁 attempt to close trades:', idList, { exitPrice, pnl });

        try {
            // --- CRITICAL STEP: Initial Validation ---
            // We must wait for at least one closure to confirm business rules (like 120s hold time)
            // If the first one fails, we don't proceed with optimistic UI
            const firstId = idList[0];
            const response = await api.closeTrade(firstId, parseFloat(exitPrice), pnl ? parseFloat(pnl) : null);

            // --- STEP 1: OPTIMISTIC UPDATE ---
            // Now that validation passed for at least one, we can be optimistic for the rest
            setTrades(prevTrades => {
                const updated = prevTrades.map(t => {
                    if (idList.includes(t.id.toString())) {
                        return {
                            ...t,
                            isCompleted: true,
                            exitPrice: exitPrice.toString(),
                            exitTime: exitTime,
                            exitTimeRaw: exitTime,
                            exit_time: exitTime,
                            status: 'CLOSED'
                        };
                    }
                    return t;
                });
                return updated;
            });

            // --- STEP 2: SILENT BACKGROUND SYNC ---
            // Handle the rest of the IDs and the balance sync in the background
            (async () => {
                try {
                    const otherIds = idList.slice(1);
                    if (otherIds.length > 0) {
                        await Promise.all(otherIds.map(async (id) => {
                            try {
                                await api.closeTrade(id, parseFloat(exitPrice), pnl ? parseFloat(pnl) : null);
                            } catch (err) {
                                if (!err.message.includes('already closed')) {
                                    console.error(`❌ Background Close Fail [${id}]:`, err.message);
                                }
                            }
                        }));
                    }

                    // Final Refresh
                    const [allTrades, bal] = await Promise.all([
                        api.getTrades(''),
                        api.getBalance()
                    ]);

                    if (allTrades && Array.isArray(allTrades)) {
                        setTrades(allTrades.filter(t => t.status !== 'DELETED').map(mapApiTrade));
                    }

                    if (bal) {
                        setLedgerBalance(bal.balance || 0);
                        setMarginUsed(bal.margin_used || 0);
                        setMarginAvailable(bal.margin_available || 0);
                        setMarginBySegment(bal.margin_by_segment || { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0 });
                    }
                } catch (bgErr) {
                    console.error('❌ Background sync error:', bgErr.message);
                }
            })();

            return { success: true };
        } catch (err) {
            console.log('❌ Trade validation failed:', err.message);
            // Catch business logic errors (like 120s rule) and propagate to UI
            throw err;
        }
    };

    const setTargetSL = async (id, target, sl) => {
        try {
            await api.setTargetSL(id, target, sl);
            setTrades(prev => prev.map(t => t.id === id ? { ...t, target, target_price: target, sl, stop_loss: sl, stopLoss: sl } : t));
            return { success: true };
        } catch (err) {
            console.log('Failed to set Target/SL:', err.message);
            throw err;
        }
    };

    const cancelTrade = async (id) => {
        const tradeToCancel = trades.find(t => t.id === id);
        if (!tradeToCancel) {
            console.warn('Trade not found:', id);
            throw new Error('Trade not found');
        }

        try {
            // Call backend API to cancel/close the pending order first
            const result = await api.closeTrade(id, 0);
            console.log('✅ Pending order cancelled via API:', id, result);

            // Only remove from local state after successful API call
            setTrades(prev => prev.filter(t => t.id !== id));

            // Show notification
            addNotification({
                title: 'Order Cancelled',
                message: `Your ${tradeToCancel.type} order for ${tradeToCancel.displayName} has been cancelled.`,
                type: 'success'
            });

            // Update balance
            const bal = await api.getBalance();
            if (bal) {
                setLedgerBalance(bal.balance || 0);
                setMarginUsed(bal.margin_used || 0);
                setMarginAvailable(bal.margin_available || 0);
            }

            return result;
        } catch (err) {
            console.log('❌ Failed to cancel trade:', err.message);

            // Show error notification
            addNotification({
                title: 'Cancel Failed',
                message: `Failed to cancel order: ${err.message}`,
                type: 'error'
            });

            throw err; // Re-throw so the calling function knows it failed
        }
    };

    const [ledgerBalance, setLedgerBalance] = useState(0);
    const [marginUsed, setMarginUsed] = useState(0);
    const [marginAvailable, setMarginAvailable] = useState(0);
    const [marginBySegment, setMarginBySegment] = useState({ MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0 });
    const [apiNetPL, setApiNetPL] = useState(0);

    const getInstrumentMeta = (name, marketType = null) => {
        if (!name) return { multiplier: 1, intradayMargin: 0, holdingMargin: 0 };
        const upperName = name.replace(/\s+/g, '').toUpperCase();
        const cleanUpperName = upperName.includes(':') ? upperName.split(':')[1] : upperName;

        // Extract base symbol (e.g. "GOLD" from "GOLD 26MAY" or "GOLD26MAYFUT")
        // Improved regex to handle various formats
        const baseSymbolMatch = cleanUpperName.match(/^([A-Z]+)/);
        const baseSymbol = baseSymbolMatch ? baseSymbolMatch[1] : cleanUpperName;

        // Resolve market type (infer if not passed)
        let resolvedMarket = marketType ? marketType.toUpperCase() : null;
        if (resolvedMarket === 'COMMODITY') {
            resolvedMarket = 'COMEX';
        }
        if (!resolvedMarket) {
            if (upperName.startsWith('CRYPTO:')) {
                resolvedMarket = 'CRYPTO';
            } else if (upperName.startsWith('FOREX:')) {
                resolvedMarket = 'FOREX';
            } else if (upperName.startsWith('COMEX:')) {
                resolvedMarket = 'COMEX';
            } else if (upperName.startsWith('MCX:')) {
                resolvedMarket = 'MCX';
            } else if (upperName.startsWith('NSE:')) {
                resolvedMarket = 'NSE';
            } else if (upperName.startsWith('NFO:')) {
                resolvedMarket = 'OPTIONS';
            } else if (upperName.includes('/')) {
                const cleanName = upperName.replace('/', '');
                const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
                if (forexPairs.some(p => cleanName.startsWith(p))) {
                    resolvedMarket = 'FOREX';
                } else {
                    resolvedMarket = 'CRYPTO';
                }
            }
        }

        // 1. Try Dynamic Config (Web Dashboard Settings) — Highest Priority
        if (userConfig) {
            // A. CRYPTO, FOREX, COMEX Segments
            if (resolvedMarket === 'CRYPTO' || resolvedMarket === 'FOREX' || resolvedMarket === 'COMEX') {
                let segConfig = {};
                if (resolvedMarket === 'COMEX') {
                    const commodityConfig = userConfig.commodityConfig || {};
                    const comexConfig = userConfig.comexConfig || {};
                    const forexConfig = userConfig.forexConfig || {};

                    const isPopulated = (cfg) => {
                        if (!cfg) return false;
                        if (cfg.lotMargins && Object.keys(cfg.lotMargins).length > 0) return true;
                        if (cfg.exposureType && cfg.exposureType !== 'per_crore') return true;
                        if (parseFloat(cfg.intradayMargin || 0) > 0 || parseFloat(cfg.holdingMargin || 0) > 0) return true;
                        return false;
                    };

                    if (isPopulated(commodityConfig)) {
                        segConfig = commodityConfig;
                    } else if (isPopulated(comexConfig)) {
                        segConfig = comexConfig;
                    } else if (isPopulated(forexConfig)) {
                        segConfig = forexConfig;
                    } else {
                        segConfig = commodityConfig || comexConfig || forexConfig || {};
                    }
                } else {
                    const segKey = `${resolvedMarket.toLowerCase()}Config`;
                    segConfig = userConfig[segKey] || {};
                }

                const exposureType = segConfig.exposureType || 'per_crore';
                const scripName = upperName.split(':').pop();

                if (exposureType === 'per_lot') {
                    const lotMargins = segConfig.lotMargins || {};
                    const noSlash = scripName.replace('/', '');
                    const config = lotMargins[scripName] || lotMargins[noSlash] || lotMargins[baseSymbol] || { INTRADAY: '0', HOLDING: '0' };
                    const intradayMargin = parseFloat(config.INTRADAY || config.MARGIN || 0);
                    const holdingMargin = parseFloat(config.HOLDING || 0);
                    return {
                        multiplier: 1,
                        intradayMargin,
                        holdingMargin,
                        market: resolvedMarket,
                        isDynamic: true,
                        isExposureBased: false
                    };
                } else {
                    const lowType = resolvedMarket.toLowerCase();
                    const getVal = (...keys) => {
                        for (const k of keys) {
                            if (userConfig[k] !== undefined && userConfig[k] !== null && userConfig[k] !== '') {
                                const parsed = parseFloat(userConfig[k]);
                                if (!isNaN(parsed) && parsed > 0) return parsed;
                            }
                        }
                        return null;
                    };

                    const rootIntraday = getVal(
                        `${lowType}IntradayMargin`, `${lowType}_intraday_margin`,
                        `${lowType}IntradayExposure`, `${lowType}_intraday_exposure`,
                        `${lowType}Intraday`, `${lowType}_intraday`
                    );
                    const rootHolding = getVal(
                        `${lowType}HoldingMargin`, `${lowType}_holding_margin`,
                        `${lowType}HoldingExposure`, `${lowType}_holding_exposure`,
                        `${lowType}Holding`, `${lowType}_holding`
                    );

                    const secIntraday = parseFloat(segConfig.intradayMargin || segConfig.intraday_margin || segConfig.intradayExposure || segConfig.intraday_exposure || segConfig.intraday || 0) || null;
                    const secHolding = parseFloat(segConfig.holdingMargin || segConfig.holding_margin || segConfig.holdingExposure || segConfig.holding_exposure || segConfig.holding || 0) || null;

                    const intradayExposure = rootIntraday || secIntraday || 500;
                    const holdingExposure = rootHolding || secHolding || 100;
                    return {
                        multiplier: 1,
                        intradayExposure,
                        holdingExposure,
                        market: resolvedMarket,
                        isDynamic: true,
                        isExposureBased: true
                    };
                }
            }

            // Determine if this is an Options instrument FIRST (so Options skip MCX Futures lot margins)
            const isOptions = cleanUpperName.endsWith('CE') || cleanUpperName.endsWith('PE') || /\d{5,}[CP]E/i.test(cleanUpperName);

            if (isOptions) {
                // Determine Option Segment: Index Options, MCX Options, or Equity Options
                const isMcxOption = (resolvedMarket === 'MCX' || cleanUpperName.startsWith('MCX:') ||
                    ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD', 'ALUMINIUM'].some(k => cleanUpperName.startsWith(k)) ||
                    INSTRUMENT_META[baseSymbol]?.market === 'MCX');

                const isIndexOption = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'BANK NIFTY', 'NIFTY 50'].some(k => cleanUpperName.startsWith(k));

                let optionIntradayExposure = 5;
                let optionHoldingExposure = 2;

                if (isMcxOption) {
                    optionIntradayExposure = parseFloat(userConfig.optionsMcxIntraday || userConfig.options_mcx_intraday || userConfig.optionsMcxIntradayMargin || 5);
                    optionHoldingExposure = parseFloat(userConfig.optionsMcxHolding || userConfig.options_mcx_holding || userConfig.optionsMcxHoldingMargin || 2);
                } else if (isIndexOption) {
                    optionIntradayExposure = parseFloat(userConfig.optionsIndexIntraday || userConfig.options_index_intraday || userConfig.optionsIndexIntradayMargin || 5);
                    optionHoldingExposure = parseFloat(userConfig.optionsIndexHolding || userConfig.options_index_holding || userConfig.optionsIndexHoldingMargin || 2);
                } else {
                    // Equity Options
                    optionIntradayExposure = parseFloat(userConfig.optionsEquityIntraday || userConfig.options_equity_intraday || userConfig.optionsEquityIntradayMargin || 5);
                    optionHoldingExposure = parseFloat(userConfig.optionsEquityHolding || userConfig.options_equity_holding || userConfig.optionsEquityHoldingMargin || 2);
                }

                let optionMultiplier = 1;
                if (isMcxOption) {
                    const cleanName = cleanUpperName.split(':').pop().trim();
                    const baseMatch = cleanName.match(/^([A-Z]+)/);
                    const baseSym = baseMatch ? baseMatch[1] : cleanName;
                    optionMultiplier = INSTRUMENT_META[baseSym]?.multiplier || 1;
                }

                return {
                    multiplier: optionMultiplier,
                    intradayExposure: optionIntradayExposure,
                    holdingExposure: optionHoldingExposure,
                    market: 'OPTIONS',
                    isDynamic: true,
                    isExposureBased: true
                };
            }

            // B. Check for Instrument Specific Settings first (mcxLotMargins for MCX Futures)

            // ✅ FIX: Read mcxExposureType FIRST - if TURNOVER, skip lot-wise config entirely
            const mcxExpType = userConfig.mcxExposureType || 'per_lot';
            const isMcxTurnover = mcxExpType === 'per_turnover' || mcxExpType === 'PER_TURNOVER_BASIS' || mcxExpType === 'per_crore';

            const globalIntradayMCX = parseFloat(userConfig.mcxIntradayMargin || userConfig.mcx_intraday_exposure || userConfig.mcxExposureMultiplier || 500);
            const globalHoldingMCX = parseFloat(userConfig.mcxHoldingMargin || userConfig.mcx_holding_exposure || 100);

            if (isMcxTurnover) {
                // TURNOVER-based: ignore mcxLotMargins, use global exposure values
                const isMCXSym = (resolvedMarket === 'MCX' || cleanUpperName.startsWith('MCX:') ||
                    ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD', 'ALUMINIUM'].some(k => cleanUpperName.startsWith(k)) ||
                    INSTRUMENT_META[baseSymbol]?.market === 'MCX');
                if (isMCXSym) {
                    return {
                        multiplier: INSTRUMENT_META[baseSymbol]?.multiplier || 1,
                        intradayExposure: globalIntradayMCX,
                        holdingExposure: globalHoldingMCX,
                        market: 'MCX',
                        isDynamic: true,
                        isExposureBased: true
                    };
                }
            }

            if (userConfig.mcxLotMargins) {
                const sortedKeys = Object.keys(userConfig.mcxLotMargins).sort((a, b) => b.length - a.length);
                for (const key of sortedKeys) {
                    const upperKey = key.toUpperCase();
                    if (cleanUpperName === upperKey || cleanUpperName.startsWith(upperKey)) {
                        const config = userConfig.mcxLotMargins[key];
                        const lot = parseFloat(config?.LOT || config?.lot) || 1;
                        const intradayMargin = parseFloat(config?.MARGIN || config?.INTRADAY || config?.exposure) || 0;
                        const holdingMargin = parseFloat(config?.HOLDING || config?.holding_exposure) || 0;

                        // Only return if margins are set, otherwise allow fallback to global settings
                        if (lot && (intradayMargin > 0 || holdingMargin > 0)) {
                            return {
                                multiplier: lot,
                                intradayMargin: intradayMargin || 500,
                                holdingMargin: holdingMargin || 100,
                                market: 'MCX',
                                isDynamic: true
                            };
                        }
                    }
                }
            }

            // B. Check for Global MCX Settings (Mapped to exact keys in Admin Dashboard)
            const globalLot = parseFloat(userConfig.mcxMaxLot || userConfig.mcx_lot_size || userConfig.max_mcx_lot) || null;

            // Priority: Dashboard fields "mcxIntradayMargin" (500) and "mcxHoldingMargin" (100)
            // Use mcxHoldingMargin first for holding, and mcxIntradayMargin for intraday
            const globalIntraday = globalIntradayMCX;
            const globalHolding = globalHoldingMCX;

            // Determine if this is an MCX or NSE instrument
            const isMCX = (resolvedMarket === 'MCX' || cleanUpperName.startsWith('MCX:') ||
                ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD', 'ALUMINIUM'].some(k => cleanUpperName.startsWith(k)) ||
                INSTRUMENT_META[baseSymbol]?.market === 'MCX');

            const isNSE = !isMCX;

            if (isMCX) {
                return {
                    multiplier: globalLot || (INSTRUMENT_META[baseSymbol]?.multiplier || 1),
                    intradayMargin: globalIntraday,
                    holdingMargin: globalHolding,
                    market: 'MCX',
                    isDynamic: true
                };
            }

            // NSE Equity - use exposure-based margins
            if (isNSE) {
                const equityIntradayExposure = parseFloat(userConfig.equityIntradayMargin || userConfig.equityIntradayExposure || 500);
                const equityHoldingExposure = parseFloat(userConfig.equityHoldingMargin || userConfig.equityHoldingExposure || 100);
                return {
                    multiplier: 1,
                    intradayExposure: equityIntradayExposure,
                    holdingExposure: equityHoldingExposure,
                    market: 'NSE',
                    isDynamic: true,
                    isExposureBased: true
                };
            }
        }

        const isExp = resolvedMarket === 'NSE' || resolvedMarket === 'CRYPTO' || resolvedMarket === 'FOREX' || resolvedMarket === 'COMEX' || resolvedMarket === 'COMMODITY';
        const defaultExp = 100;

        // 2. Exact match from static meta (Secondary fallback)
        if (INSTRUMENT_META[upperName]) {
            return {
                ...INSTRUMENT_META[upperName],
                intradayMargin: 0,
                holdingMargin: 0,
                intradayExposure: defaultExp,
                holdingExposure: defaultExp,
                market: resolvedMarket || 'MCX',
                isDynamic: false,
                isExposureBased: isExp
            };
        }

        // 3. Prefix match from static meta
        const metaKeys = Object.keys(INSTRUMENT_META).sort((a, b) => b.length - a.length);
        for (const key of metaKeys) {
            if (upperName.startsWith(key)) {
                return {
                    ...INSTRUMENT_META[key],
                    intradayMargin: 0,
                    holdingMargin: 0,
                    intradayExposure: defaultExp,
                    holdingExposure: defaultExp,
                    market: resolvedMarket || 'MCX',
                    isDynamic: false,
                    isExposureBased: isExp
                };
            }
        }

        return {
            multiplier: 1,
            intradayMargin: 0,
            holdingMargin: 0,
            intradayExposure: defaultExp,
            holdingExposure: defaultExp,
            market: resolvedMarket,
            isDynamic: false,
            isExposureBased: isExp
        };
    };

    // --- Helper: Get Hardcoded Multiplier (not dynamic) ---
    const getHardcodedMultiplier = (name) => {
        if (!name) return 1;
        const upperName = name.replace(/\s+/g, '').toUpperCase();
        const cleanUpperName = upperName.includes(':') ? upperName.split(':')[1] : upperName;
        const baseSymbolMatch = cleanUpperName.match(/^([A-Z]+)/);
        const baseSymbol = baseSymbolMatch ? baseSymbolMatch[1] : cleanUpperName;
        return INSTRUMENT_META[baseSymbol]?.multiplier || 1;
    };

    // --- M2M & Portfolio Aggregation Logic ---
    const aggregatedPositions = useMemo(() => {
        const activeTrades = trades.filter(t => !t.isCompleted && !t.isPending);
        const positions = {};

        activeTrades.forEach(trade => {
            const key = trade.name;
            const meta = getInstrumentMeta(trade.name, trade.market);
            if (!positions[key]) {
                const hardcodedMultiplier = getHardcodedMultiplier(trade.name);

                positions[key] = {
                    ...trade,
                    entryTimeRaw: trade.entryTimeRaw || trade.entry_time || trade.time,
                    latestEntryTimeRaw: trade.entryTimeRaw || trade.entry_time || trade.time,
                    netQty: 0,
                    totalBuyQty: 0,
                    totalSellQty: 0,
                    totalBuyCost: 0,
                    totalSellCost: 0,
                    totalHoldingMargin: 0,
                    totalPL: 0,
                    hardcodedMultiplier: hardcodedMultiplier,
                    multiplier: hardcodedMultiplier,
                    dynamicMarginPerLot: meta?.intradayMargin || 0,
                    dynamicHoldingMarginPerLot: meta?.holdingMargin || 0,
                    intradayExposure: meta?.intradayExposure || 100,
                    holdingExposure: meta?.holdingExposure || 100,
                    tradeIds: [],
                    market: meta?.market || 'MCX',
                    isDynamic: meta?.isDynamic || false,
                    isExposureBased: meta?.isExposureBased || false
                };
            } else {
                const curTime = positions[key].latestEntryTimeRaw || positions[key].entryTimeRaw || '';
                const newTime = trade.entryTimeRaw || trade.entry_time || trade.time || '';
                if (newTime && String(newTime) > String(curTime)) {
                    positions[key].latestEntryTimeRaw = newTime;
                    positions[key].entryTimeRaw = newTime;
                }
            }

            const side = trade.type === 'BUY' ? 1 : -1;
            const qty = Number(trade.qty) || 0;
            const entry = Number(trade.entryPrice) || 0;
            const margin = Number(trade.margin_used) || 0;

            positions[key].netQty += (side * qty);
            positions[key].tradeIds.push(trade.id);
            if (trade.executedFromPending) {
                positions[key].executedFromPending = true;
            }

            if (trade.type === 'BUY') {
                positions[key].totalBuyQty += qty;
                positions[key].totalBuyCost += (qty * entry);
            } else {
                positions[key].totalSellQty += qty;
                positions[key].totalSellCost += (qty * entry);
            }

            // Calculate holding/used margin for this trade using standard segment margin helper
            const hardcodedMult = getHardcodedMultiplier(trade.name) || getHardcodedMultiplier(trade.symbol);
            const tradeMargin = calculateSegmentMargin({
                marketType: trade.market || trade.market_type || 'MCX',
                symbol: trade.name || trade.symbol,
                price: entry,
                qty: qty,
                lotSize: hardcodedMult > 1 ? hardcodedMult : (trade.lot_size || meta?.multiplier || 1),
                isHolding: true,
                clientConfig: userConfig || {},
                isUnitMode: userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true
            });
            positions[key].totalHoldingMargin += (tradeMargin > 0 ? tradeMargin : margin);

            // Calculate real-time P/L for this trade
            const normKey = normalizeSymbol(trade.name);
            const cleanSym = (trade.name || trade.symbol || '').includes(':') ? (trade.name || trade.symbol).split(':')[1] : (trade.name || trade.symbol || '');
            const cleanNorm = normalizeSymbol(cleanSym);

            const liveData = livePrices[normKey] || livePrices[cleanNorm] || livePrices[trade.name] || livePrices[trade.fullSymbol] || livePrices[trade.symbol] || { ltp: 0, bid: 0, ask: 0 };
            const ltp = liveData.ltp && liveData.ltp > 0 ? liveData.ltp : entry;
            const bid = (liveData.bid && liveData.bid > 0) ? liveData.bid : ltp;
            const ask = (liveData.ask && liveData.ask > 0) ? liveData.ask : ltp;

            const exitPrice = trade.type === 'BUY' ? bid : ask;
            let tradePL = 0;

            const mType = (trade.market || '').toUpperCase();
            const isUsdSegment = trade.is_usd_segment || mType === 'COMMODITY' || mType === 'COMEX' || mType === 'FOREX' || mType === 'CRYPTO';

            if (isUsdSegment) {
                const dbLotVal = getDbLotSize(trade.name) || getDbLotSize(trade.fullSymbol);
                const meta = getInstrumentMeta(trade.name, trade.market);
                const lotSize = parseFloat(trade.lot_size || dbLotVal || trade.lot_size_at_entry || meta?.multiplier || 1);
                const fallbackUsdInr = Number(trade.usdinr_value) || 95.1;

                const usdInrLive = livePrices['USD/INR'] || livePrices['USDINR'] || livePrices['USD_INR'];
                const liveBid = usdInrLive ? parseFloat(usdInrLive.bid) || null : null;
                const liveAsk = usdInrLive ? parseFloat(usdInrLive.ask) || null : null;

                const tradeSym = trade.name || trade.symbol || trade.fullSymbol || '';
                let calcRes;
                if (mType === 'CRYPTO') {
                    calcRes = calculateCryptoPnL({ symbol: tradeSym, type: trade.type, entryPrice: entry, exitPrice: exitPrice, qty: qty, qtyInput: trade.qty_input, lotSize, fallbackUsdInr, liveBid, liveAsk });
                } else if (mType === 'FOREX') {
                    calcRes = calculateForexPnL({ symbol: tradeSym, type: trade.type, entryPrice: entry, exitPrice: exitPrice, qty: qty, qtyInput: trade.qty_input, lotSize, fallbackUsdInr, liveBid, liveAsk });
                } else {
                    calcRes = calculateComexPnL({ symbol: tradeSym, type: trade.type, entryPrice: entry, exitPrice: exitPrice, qty: qty, qtyInput: trade.qty_input, lotSize, fallbackUsdInr, liveBid, liveAsk });
                }

                tradePL = calcRes.pnlInr;
            } else {
                // MCX / NSE / NFO / OPTIONS (INR Segments)
                const hardcodedMult = getHardcodedMultiplier(trade.name) || getHardcodedMultiplier(trade.fullSymbol);
                const dbLotVal = getDbLotSize(trade.name) || getDbLotSize(trade.fullSymbol);
                const lotSize = parseFloat(trade.lot_size || dbLotVal || trade.lot_size_at_entry || (hardcodedMult > 1 ? hardcodedMult : null) || positions[key]?.hardcodedMultiplier || 1);
                const isMcxTrade = mType === 'MCX' || (trade.market || trade.market_type || '').toUpperCase() === 'MCX' || isMcxSymbol(trade.name || trade.fullSymbol || '');

                if (isMcxTrade) {
                    tradePL = calculateMcxPnL({
                        type: trade.type,
                        entryPrice: entry,
                        exitPrice: exitPrice,
                        qty: qty,
                        qtyInput: trade.qty_input,
                        lotSize: lotSize
                    });
                } else {
                    tradePL = calculateEquityPnL({
                        type: trade.type,
                        entryPrice: entry,
                        exitPrice: exitPrice,
                        qty: qty,
                        qtyInput: trade.qty_input,
                        actualQty: trade.actual_qty,
                        lotSize: lotSize,
                        tradeMode: trade.trade_mode,
                        equityUnitsMode: trade.equity_units_mode
                    });
                }
            }

            positions[key].totalPL += tradePL;
        });

        return Object.values(positions).map(pos => {
            const normKey = normalizeSymbol(pos.name);
            const cleanSym = (pos.name || pos.symbol || '').includes(':') ? (pos.name || pos.symbol).split(':')[1] : (pos.name || pos.symbol || '');
            const cleanNorm = normalizeSymbol(cleanSym);
            const liveData = livePrices[normKey] || livePrices[cleanNorm] || livePrices[pos.name] || livePrices[pos.fullSymbol] || livePrices[pos.symbol] || { ltp: 0, bid: 0, ask: 0 };
            const ltp = liveData.ltp && liveData.ltp > 0 ? liveData.ltp : (pos.avgPrice || 0); // Fallback to average entry price
            const bid = (liveData.bid && liveData.bid > 0) ? liveData.bid : ltp;
            const ask = (liveData.ask && liveData.ask > 0) ? liveData.ask : ltp;

            const netQty = pos.netQty;
            const qty = Math.abs(netQty);

            // Determine if net position is BUY or SELL
            const isBuyPosition = netQty > 0 || (netQty === 0 && pos.totalBuyQty >= pos.totalSellQty);
            const type = isBuyPosition ? 'BUY' : 'SELL';

            // Calculate average price of the active/dominant side
            let avgPrice = 0;
            if (isBuyPosition) {
                avgPrice = pos.totalBuyQty > 0 ? pos.totalBuyCost / pos.totalBuyQty : 0;
            } else {
                avgPrice = pos.totalSellQty > 0 ? pos.totalSellCost / pos.totalSellQty : 0;
            }

            return {
                ...pos,
                qty: qty,
                type: type,
                avgPrice,
                entryPrice: avgPrice.toFixed(2),
                pnl: pos.totalPL,
                margin_used: pos.totalHoldingMargin,
                ltp: ltp,
                bid: bid,
                ask: ask,
                tradeIds: pos.tradeIds,
                market: pos.market || 'MCX'
            };
        });
    }, [trades, livePrices, userConfig]);

    // Active P/L derived from aggregated positions
    const activePL = useMemo(() => {
        const pl = aggregatedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        return pl;
    }, [aggregatedPositions]);

    // Total Dynamic Holding Margin Required
    const totalDynamicMargin = useMemo(() => {
        return aggregatedPositions.reduce((sum, pos) => sum + (pos.totalHoldingMargin || 0), 0);
    }, [aggregatedPositions]);

    // Segment-wise holding margin calculated dynamically to ensure 100% match with cards
    const dynamicMarginBySegment = useMemo(() => {
        const segments = { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0, FOREX: 0, CRYPTO: 0 };
        aggregatedPositions.forEach(pos => {
            let mkt = pos.market || 'MCX';
            // Map NSE to EQUITY for UI summary consistency
            if (mkt === 'NSE') mkt = 'EQUITY';

            if (segments[mkt] !== undefined) {
                segments[mkt] += (pos.totalHoldingMargin || 0);
            }
        });
        return segments;
    }, [aggregatedPositions]);

    // realized P/L — net of brokerage, sourced from /portfolio/balance API (refreshes every 10s)
    const realizedPL = apiNetPL;

    // Total M2M = Ledger Balance + All Profits/Losses (Active + Realized)
    // This shows your total account value after all P&L
    const totalM2M = useMemo(() => ledgerBalance + activePL, [ledgerBalance, activePL]);

    // CORRECTED: Calculate Margin Available properly
    // Available Margin = Ledger Balance - INTRADAY Margin Used + Active P&L
    // (NOT Holding margin — that's for overnight holding)
    const calculatedMarginAvailable = useMemo(() => {
        // Calculate current total margin used from aggregatedPositions
        const totalMarginUsed = aggregatedPositions.reduce((sum, pos) => {
            const qty = Math.abs(pos.netQty);
            const avgPrice = pos.avgPrice || 0;
            const turnover = avgPrice * qty * (pos.multiplier || 1);

            let m = 0;
            if (pos.isExposureBased && pos.intradayExposure > 0) {
                // NSE/NFO exposure-based margin
                m = turnover / pos.intradayExposure;
            } else if (pos.dynamicMarginPerLot > 0) {
                // MCX per-lot margin
                m = pos.dynamicMarginPerLot * qty;
            }
            return sum + m;
        }, 0);

        const available = ledgerBalance - totalMarginUsed + activePL;
        return Math.max(0, available);
    }, [ledgerBalance, aggregatedPositions, activePL]);

    // Helper function to generate random price near base price
    const generateRandomPrice = (basePrice) => {
        const base = parseFloat(basePrice);
        const variance = base * 0.01; // 1% variance
        const random = base + (Math.random() - 0.5) * variance * 2;
        return random.toFixed(2);
    };

    // ─── Market Data State (live from Kite API — replaces every 5s) ───────────
    // This is the FULL market feed: MCX selected contracts, NSE stocks, Options, Crypto, Forex
    // DO NOT modify this with user add/remove — it's a READ-ONLY market feed
    const [kiteMarketData, setKiteMarketData] = useState([]);
    const [kiteStatus, setKiteStatus] = useState({ connected: false, error: null, message: null });
    const [dataError, setDataError] = useState(null);

    // ─── User Included Pins (items shown in watchlist) ───────────────────────
    // A Set of item.name strings the user has PINNED from the search screen
    // By default, this is empty, meaning NO market data is shown in Dashboard until added
    const [includedPins, setIncludedPins] = useState(new Set());

    // watchlist = kiteMarketData (the full market data — Dashboard filters by category)
    // We expose this as 'watchlist' so DashboardScreen doesn't need changes
    const watchlist = kiteMarketData;
    const setWatchlist = setKiteMarketData; // alias used internally by Kite fetch

    // Indices start with 0 — live values fetched from API
    const [indices, setIndices] = useState([
        { name: 'NIFTY 50', ltp: 0, change: 0, pct: 0 },
        { name: 'BANK NIFTY', ltp: 0, change: 0, pct: 0 },
        { name: 'FINNIFTY', ltp: 0, change: 0, pct: 0 },
    ]);


    // ─── Alert Engine Refs (avoid stale closures in intervals) ────
    const userAlertsRef = useRef([]);
    const alertSettingsRef = useRef({});
    const triggeredRef = useRef(new Set()); // track fired alert IDs
    const lastPriceRef = useRef({});        // track prev price per symbol
    const marketFiredRef = useRef(new Set()); // track market timing fired
    const priceHistorySnap = useRef({});    // snapshot for technical alerts

    // Simulation removed - using Socket.IO from lines 63-88
    useEffect(() => {
        // We still want to update indices locally or fetch them
    }, []);

    // ── Market Timing Alerts ──────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => {
            if (!alertSettingsRef.current.marketTiming) return;
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const day = now.toDateString();

            const fire = (key, title, message) => {
                if (marketFiredRef.current.has(key)) return;
                marketFiredRef.current.add(key);
                setNotifications(pn => [{
                    id: Date.now().toString() + key,
                    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    title, message, type: 'info'
                }, ...pn]);
            };

            if (h === 9 && m === 15) fire(`open-${day}`, '🟢 Market Opened', 'NSE & BSE markets are now open for trading. Good luck!');
            if (h === 15 && m === 15) fire(`soon-${day}`, '⏰ Market Closing Soon', 'Markets close in 15 minutes (3:30 PM). Review your open positions.');
            if (h === 15 && m === 30) fire(`closed-${day}`, '🔴 Market Closed', 'NSE & BSE markets closed for the day.');
        }, 30000);
        return () => clearInterval(t);
    }, []);

    // ── Technical Alerts (RSI-like from price history) ────────────
    useEffect(() => {
        const t = setInterval(() => {
            if (!alertSettingsRef.current.technical) return;
            const snap = priceHistorySnap.current;
            Object.keys(snap).forEach(symbol => {
                const prices = snap[symbol] || [];
                if (prices.length < 10) return;
                const recent = prices.slice(-10);
                let ups = 0, downs = 0;
                for (let i = 1; i < recent.length; i++) {
                    if (recent[i] > recent[i - 1]) ups++;
                    else if (recent[i] < recent[i - 1]) downs++;
                }
                const minKey = Math.floor(Date.now() / 120000); // fire at most once per 2 min per symbol
                if (ups >= 8) {
                    const k = `rsi-ob-${symbol}-${minKey}`;
                    if (!triggeredRef.current.has(k)) {
                        triggeredRef.current.add(k);
                        setNotifications(pn => [{
                            id: k, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            title: `⚡ RSI Overbought: ${symbol}`,
                            message: `${symbol} showing overbought signals. Price rose in 8/10 recent intervals. Consider booking profits.`,
                            type: 'warning'
                        }, ...pn]);
                    }
                }
                if (downs >= 8) {
                    const k = `rsi-os-${symbol}-${minKey}`;
                    if (!triggeredRef.current.has(k)) {
                        triggeredRef.current.add(k);
                        setNotifications(pn => [{
                            id: k, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            title: `⚡ RSI Oversold: ${symbol}`,
                            message: `${symbol} showing oversold signals. Price fell in 8/10 recent intervals. Potential bounce opportunity.`,
                            type: 'info'
                        }, ...pn]);
                    }
                }
            });
        }, 10000);
        return () => clearInterval(t);
    }, []);

    // ─── Kite Market Data → Dynamic Watchlist (same unified API as web MarketWatchPage) ───
    const kiteIntervalRef = useRef(null);
    const kiteLoadedRef = useRef(false);
    const isFetchingKiteRef = useRef(false);
    const allowedContractsRef = useRef(null); // Admin-selected contracts (same as web)

    // Fetch admin-selected contracts once (same as web MarketWatchPage useEffect)
    useEffect(() => {
        const fetchAllowedContracts = async () => {
            if (!api.hasSession()) return;
            try {
                const response = await api.getSelectedContracts();
                if (response && response.data && Array.isArray(response.data)) {
                    allowedContractsRef.current = new Set(response.data);
                    console.log('✅ Allowed contracts loaded:', response.data.length);
                } else if (response && Array.isArray(response)) {
                    allowedContractsRef.current = new Set(response);
                    console.log('✅ Allowed contracts loaded:', response.length);
                } else {
                    allowedContractsRef.current = null;
                }
            } catch (err) {
                console.log('ℹ️ Could not fetch allowed contracts:', err.message);
                allowedContractsRef.current = null;
            }
        };
        fetchAllowedContracts();
    }, []);

    // Smart contract filtering — exact same logic as web MarketWatchPage filteredRows
    const shouldShowRow = (symbol) => {
        const allowedContracts = allowedContractsRef.current;
        if (!allowedContracts || allowedContracts.size === 0) return true;

        // Extract commodity name (e.g., CRUDEOIL from MCX:CRUDEOIL26APRFUT)
        const parts = symbol.split(':');
        const tradingSymbol = parts[1] || symbol;
        const commodityMatch = tradingSymbol.match(/^([A-Z]+)\d{1,2}[A-Z]{3}\d{0,2}FUT$/);
        const commodityName = commodityMatch ? commodityMatch[1] : null;

        // If not a futures contract, always show (options, NSE stocks pass through)
        if (!commodityName) return true;

        // Check if this commodity has ANY selection
        const commodityHasSelection = Array.from(allowedContracts).some(contract => {
            const contractParts = contract.split(':');
            const contractSymbol = contractParts[1] || contract;
            const contractMatch = contractSymbol.match(/^([A-Z]+)\d{1,2}[A-Z]{3}\d{0,2}FUT$/);
            const contractCommodity = contractMatch ? contractMatch[1] : null;
            return contractCommodity === commodityName;
        });

        // If this commodity has selection, show ONLY selected ones
        // If this commodity has NO selection, show ALL of it
        if (commodityHasSelection && !allowedContracts.has(symbol)) {
            return false;
        }

        return true;
    };

    // OHLC cache from dashboard (refreshed separately at slower interval)
    const ohlcCacheRef = useRef({}); // symbol → { open, high, low, close }

    // Fetch OHLC data from dashboard API (has open/high/low/close that unified watchlist doesn't)
    const fetchOhlcData = async () => {
        if (!api.hasSession()) return;
        try {
            const dashboard = await api.getKiteDashboard();
            if (!dashboard || !dashboard.data) return;

            const allData = {
                ...(dashboard.data.nse || {}),
                ...(dashboard.data.mcx || {}),
                ...(dashboard.data.nfo || {}),
            };

            const ohlc = {};
            const ohlcByNormalized = {}; // Also index by normalized symbol for livePrices updates
            for (const [symbol, quote] of Object.entries(allData)) {
                ohlc[symbol] = {
                    open: quote.open || 0,
                    high: quote.high || 0,
                    low: quote.low || 0,
                    close: quote.close || 0,
                };
                // Also store with normalized key so OrderDetailScreen can access OHLC via livePrices
                const normKey = normalizeSymbol(symbol);
                ohlcByNormalized[normKey] = ohlc[symbol];
            }
            ohlcCacheRef.current = ohlc;

            // Update livePrices with OHLC data so OrderDetailScreen gets it in real-time
            setLivePrices(prev => {
                const updated = { ...prev };
                for (const [normKey, ohlcData] of Object.entries(ohlcByNormalized)) {
                    if (updated[normKey]) {
                        updated[normKey] = { ...updated[normKey], ...ohlcData };
                    } else {
                        updated[normKey] = ohlcData;
                    }
                }
                return updated;
            });
        } catch (err) {
            // Silent — OHLC is supplementary, don't block main flow
            if (err.message && !err.message.includes('503') && !err.message.includes('not connected')) {
                console.log('ℹ️ OHLC fetch error:', err.message);
            }
        }
    };

    // Refresh OHLC every 5 seconds (slower than main poll since OHLC changes less frequently)
    useEffect(() => {
        const ohlcInterval = setInterval(fetchOhlcData, 5000);
        return () => clearInterval(ohlcInterval);
    }, []);

    // Kite fetch — uses same unified watchlist API as web's MarketWatchPage.jsx
    const fetchKiteMarketData = async () => {
        if (!api.hasSession()) return;
        if (isFetchingKiteRef.current) return;
        isFetchingKiteRef.current = true;

        try {
            // Same API as web: GET /api/kite/market/watchlist → flat array of rows
            const rows = await api.getKiteUnifiedWatchlist();

            if (!Array.isArray(rows) || rows.length === 0) return;

            // Debug: Log all NIFTY instruments from API
            const niftyRows = rows.filter(r => r.symbol?.toUpperCase?.().includes('NIFTY'));
            if (niftyRows.length > 0) {
                console.log('📊 NIFTY Instruments from API (with lotSize):', JSON.stringify(niftyRows.map(r => ({ symbol: r.symbol, lotSize: r.lotSize, ltp: r.ltp })).slice(0, 3), null, 2));
            }

            const ohlcData = ohlcCacheRef.current;
            const watchlistItems = [];
            const newLivePrices = {};
            let idCounter = 1;

            for (const row of rows) {
                const symbol = row.symbol || '';
                if (!symbol) continue; // skip empty rows

                const parts = symbol.split(':');
                const exchange = parts[0] || 'MCX';
                const tradingSymbol = parts[1] || symbol;

                // Category mapping for app tabs
                let category = exchange;
                if (exchange === 'NFO') {
                    category = (row.type === 'NFO_OPT' || row.optionType || row.strike != null) ? 'NFO_OPT' : 'NFO_FUT';
                } else if (exchange === 'MCX') {
                    category = (row.type === 'MCX_OPT' || row.optionType || row.strike != null) ? 'MCX_OPT' : 'MCX_FUT';
                } else if (exchange === 'NSE') {
                    category = 'NSE';
                }

                // Display name — EXACTLY match web's displaySymbol() logic
                let displayName = tradingSymbol;

                // Crypto/Forex — show name if available
                if ((exchange === 'CRYPTO' || exchange === 'FOREX') && row?.name) {
                    displayName = row.name;
                } else {
                    // For futures, keep existing contract prettifier
                    const futMatch = tradingSymbol.match(/^([A-Z]+)(\d{1,2}[A-Z]{3}\d{0,2})FUT$/);
                    if (futMatch) {
                        displayName = `${futMatch[1]} ${futMatch[2]}`;
                    } else if (row.strike != null && row.optionType) {
                        displayName = `${tradingSymbol} (${row.strike} ${row.optionType})`;
                    } else {
                        displayName = tradingSymbol;
                    }
                }

                // Values directly from API — same source as web
                const ltp = row.ltp || 0;
                const changePct = Number(row.change || 0);

                // Merge OHLC from dashboard data (unified watchlist doesn't have it)
                const symbolOhlc = ohlcData[symbol] || {};

                const finalHigh = row.high != null ? row.high : (symbolOhlc.high || 0);
                const finalLow = row.low != null ? row.low : (symbolOhlc.low || 0);
                const finalOpen = row.open != null ? row.open : (symbolOhlc.open || 0);
                const finalClose = row.close != null ? row.close : (symbolOhlc.close || 0);

                watchlistItems.push({
                    id: `kite-${idCounter++}`,
                    name: displayName,
                    fullSymbol: symbol,
                    category,
                    exchange,
                    type: row.type || '',
                    ltp: String(ltp),
                    bid: String(row.bid || 0),
                    ask: String(row.ask || 0),
                    change: String(changePct),
                    changePct: String(changePct),
                    high: String(finalHigh),
                    low: String(finalLow),
                    open: String(finalOpen),
                    close: String(finalClose),
                    volume: String(row.volume || 0),
                    oi: String(row.oi || 0),
                    strike: row.strike != null ? String(row.strike) : null,
                    optionType: row.optionType || null,
                    expiry: row.expiry || null,
                    date: row.expiry || new Date().toISOString().split('T')[0],
                    lotSize: row.lotSize || 1,
                    status: 'active',
                });

                const normKey = normalizeSymbol(symbol);
                const cleanNorm = normalizeSymbol(tradingSymbol);
                const displayNorm = normalizeSymbol(displayName);

                const priceObj = {
                    ltp,
                    bid: row.bid || ltp,
                    ask: row.ask || ltp,
                    high: Number(finalHigh),
                    low: Number(finalLow),
                    open: Number(finalOpen),
                    close: Number(finalClose),
                    change: changePct,
                    volume: row.volume || 0
                };

                if (!newLivePrices[normKey]) newLivePrices[normKey] = priceObj;
                if (cleanNorm && !newLivePrices[cleanNorm]) newLivePrices[cleanNorm] = priceObj;
                if (displayNorm && !newLivePrices[displayNorm]) newLivePrices[displayNorm] = priceObj;
                if (symbol && !newLivePrices[symbol]) newLivePrices[symbol] = priceObj;
                if (tradingSymbol && !newLivePrices[tradingSymbol]) newLivePrices[tradingSymbol] = priceObj;
                if (displayName && !newLivePrices[displayName]) newLivePrices[displayName] = priceObj;

                // --- Percent Change Alerts Engine ---
                if (alertSettingsRef.current.percentChange) {
                    const threshold = alertSettingsRef.current.percentThreshold || 2;
                    const pct = Math.abs(Number(row.change || 0));
                    if (pct >= threshold) {
                        const k = `pct-chg-${symbol}-${new Date().toDateString()}`;
                        if (!triggeredRef.current.has(k)) {
                            triggeredRef.current.add(k);
                            addNotification({
                                title: `🚀 % Change Alert: ${displayName}`,
                                message: `${displayName} has moved ${pct.toFixed(2)}% from today's open.`,
                                type: 'info',
                                category: 'percentChange'
                            });
                        }
                    }
                }
            }

            if (watchlistItems.length > 0) {
                scheduleIdleTask(() => {
                    setWatchlist(watchlistItems);
                    setLivePrices(prev => {
                        const fresh = { ...prev };
                        Object.keys(newLivePrices).forEach(k => {
                            fresh[k] = newLivePrices[k];
                        });
                        return fresh;
                    });
                    kiteLoadedRef.current = true;
                });
            }

            // ── Market Data (Crypto + Forex) — Fetch in background non-blocking ──
            (async () => {
                try {
                    const res = await api.getAllMarketData();
                    if (res && res.status === 'success') {
                        const rawCrypto = res.crypto || [];
                        const rawForex = res.forex || [];
                        const rawCommodity = res.commodity || [];

                        const cryptoSet = new Set();
                        rawCrypto.forEach(i => {
                            if (i.symbol) cryptoSet.add(i.symbol);
                            if (i.name) cryptoSet.add(i.name);
                        });
                        allowedCryptoSymbolsRef.current = cryptoSet;

                        const forexSet = new Set();
                        rawForex.forEach(i => {
                            if (i.symbol) forexSet.add(i.symbol);
                            if (i.name) forexSet.add(i.name);
                        });
                        allowedForexSymbolsRef.current = forexSet;

                        const commoditySet = new Set();
                        rawCommodity.forEach(i => {
                            if (i.symbol) commoditySet.add(i.symbol);
                            if (i.name) commoditySet.add(i.name);
                        });
                        allowedCommoditySymbolsRef.current = commoditySet;

                        const cryptoRows = rawCrypto.map(item => ({
                            id: `crypto-${item.symbol}`,
                            name: item.name || item.symbol,
                            fullSymbol: item.symbol.includes(':') ? item.symbol : `CRYPTO:${item.symbol}`,
                            category: 'CRYPTO',
                            exchange: 'CRYPTO',
                            type: 'CRYPTO',
                            ltp: String(item.ltp || item.price || 0),
                            bid: String(item.bid || item.ltp || item.price || 0),
                            ask: String(item.ask || item.ltp || item.price || 0),
                            change: String(item.changePct || item.chg_pct || item.change || 0),
                            changePct: String(item.changePct || item.chg_pct || 0),
                            high: String(item.high || 0),
                            low: String(item.low || 0),
                            open: String(item.open || 0),
                            close: String(item.close || 0),
                            date: new Date().toISOString().split('T')[0],
                            lotSize: Number(item.lotSize || item.lot_size || 1),
                            status: 'active',
                        }));

                        const forexRows = (res.forex || []).map(item => ({
                            id: `forex-${item.symbol}`,
                            name: item.name || item.symbol,
                            fullSymbol: item.symbol.includes(':') ? item.symbol : `FOREX:${item.symbol}`,
                            category: 'FOREX',
                            exchange: 'FOREX',
                            type: 'FOREX',
                            ltp: String(item.ltp || item.price || 0),
                            bid: String(item.bid || item.ltp || item.price || 0),
                            ask: String(item.ask || item.ltp || item.price || 0),
                            change: String(item.changePct || item.chg_pct || item.change || 0),
                            changePct: String(item.changePct || item.chg_pct || 0),
                            high: String(item.high || 0),
                            low: String(item.low || 0),
                            open: String(item.open || 0),
                            close: String(item.close || 0),
                            date: new Date().toISOString().split('T')[0],
                            lotSize: Number(item.lotSize || item.lot_size || 1),
                            status: 'active',
                        }));

                        const commodityRows = (res.commodity || []).map(item => ({
                            id: `commodity-${item.symbol}`,
                            name: item.name || item.symbol,
                            fullSymbol: item.symbol.includes(':') ? item.symbol : `COMMODITY:${item.symbol}`,
                            category: 'COMMODITY',
                            exchange: 'COMMODITY',
                            type: 'COMMODITY',
                            ltp: String(item.ltp || item.price || 0),
                            bid: String(item.bid || item.ltp || item.price || 0),
                            ask: String(item.ask || item.ltp || item.price || 0),
                            change: String(item.changePct || item.chg_pct || item.change || 0),
                            changePct: String(item.changePct || item.chg_pct || 0),
                            high: String(item.high || 0),
                            low: String(item.low || 0),
                            open: String(item.open || 0),
                            close: String(item.close || 0),
                            date: new Date().toISOString().split('T')[0],
                            lotSize: Number(item.lotSize || item.lot_size || 1),
                            status: 'active',
                        }));

                        const seenIds = new Set();
                        const extraRows = [...cryptoRows, ...forexRows, ...commodityRows].filter(item => {
                            const key = item.id || item.fullSymbol || item.name;
                            if (!key || seenIds.has(key)) return false;
                            seenIds.add(key);
                            return true;
                        });

                        setExtraMarketData(extraRows);

                        if (extraRows.length > 0) {
                            scheduleIdleTask(() => {
                                setWatchlist(prev => {
                                    const existingKeys = new Set(prev.map(item => item.id || item.fullSymbol || item.name));
                                    const newUniqueRows = extraRows.filter(item => {
                                        const key = item.id || item.fullSymbol || item.name;
                                        return !existingKeys.has(key);
                                    });
                                    if (newUniqueRows.length === 0) return prev;
                                    return [...prev, ...newUniqueRows];
                                });
                            });
                        }
                    }
                } catch (cfErr) {
                    if (cfErr.message && !cfErr.message.includes('503') && !cfErr.message.includes('not connected')) {
                        console.log('ℹ️ Crypto/Forex REST fetch error:', cfErr.message);
                    }
                }
            })();
        } catch (err) {

            // Determine error type and set appropriate message
            let errorMsg = 'Unable to load market data';
            let errorType = 'UNKNOWN';

            if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
                errorMsg = '❌ Session Expired - Please login again';
                errorType = 'TOKEN_EXPIRED';
            } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
                errorMsg = '❌ Access Denied - Check Zerodha connection';
                errorType = 'FORBIDDEN';
            } else if (err.message?.includes('Network') || err.message?.includes('ECONNREFUSED')) {
                errorMsg = '⚠️ Network Error - Check your internet connection';
                errorType = 'NETWORK_ERROR';
            } else if (err.message?.includes('timeout')) {
                errorMsg = '⏱️ Request Timeout - Server not responding';
                errorType = 'TIMEOUT';
            }

            setKiteStatus({
                connected: false,
                error: errorType,
                message: errorMsg
            });
            setDataError(errorMsg);
        } finally {
            isFetchingKiteRef.current = false;
        }
    };

    // Poll every 5 seconds (exact same as web MarketWatchPage: setInterval(fetchMarketData, 5000))
    useEffect(() => {
        kiteIntervalRef.current = setInterval(fetchKiteMarketData, 5000);
        return () => { if (kiteIntervalRef.current) clearInterval(kiteIntervalRef.current); };
    }, []);

    // ─── Auto-refresh trades every 5 seconds for live updates ───
    const tradesIntervalRef = useRef(null);

    const refreshTrades = async () => {
        if (!api.hasSession()) return;
        try {
            const allTrades = await api.getTrades('');
            const newTrades = (allTrades && Array.isArray(allTrades)) ? allTrades.filter(t => t.status !== 'DELETED').map(mapApiTrade) : [];
            setTrades(newTrades);
        } catch (err) {
            // Silent fail — don't spam logs for background refresh
        }
    };

    useEffect(() => {
        tradesIntervalRef.current = setInterval(refreshTrades, 5000);
        return () => { if (tradesIntervalRef.current) clearInterval(tradesIntervalRef.current); };
    }, []);

    // ─── Auto-refresh balance every 10 seconds for portfolio ───
    const balanceIntervalRef = useRef(null);

    const refreshBalance = async () => {
        if (!api.hasSession()) return;
        try {
            const bal = await api.getBalance();
            if (bal) {
                setLedgerBalance(Number(bal.balance) || 0);
                setMarginUsed(Number(bal.margin_used) || 0);
                setMarginAvailable(Number(bal.margin_available) || 0);
                setApiNetPL(Number(bal.net_pl) || 0);
                setMarginBySegment(bal.margin_by_segment || { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0 });
            }
        } catch (err) {
            // Silent fail for background refresh
        }
    };

    useEffect(() => {
        balanceIntervalRef.current = setInterval(refreshBalance, 10000);
        return () => { if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current); };
    }, []);

    // ─── Auto-refresh alerts every 10 seconds ───
    const alertsIntervalRef = useRef(null);
    const refreshAlerts = async () => {
        if (!api.hasSession()) return;
        try {
            const alerts = await api.getAlerts();
            if (alerts) {
                const mappedAlerts = (Array.isArray(alerts) ? alerts : (alerts.data || [])).map(a => ({
                    ...a,
                    id: a.id.toString(),
                    targetPrice: Number(a.target_price || a.targetPrice || 0)
                }));
                setUserAlerts(mappedAlerts);
            }
        } catch (err) { }
    };

    useEffect(() => {
        alertsIntervalRef.current = setInterval(refreshAlerts, 10000);
        return () => { if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current); };
    }, []);

    // globalSearchData — ALL live market data, for Search screen
    // Indices are placed FIRST so they appear at the top of NSE list
    const globalSearchData = useMemo(() => {
        const indexItems = indices.map(idx => {
            const ltp = Number(idx.ltp) || 0;
            const bid = Number(idx.bid) || ltp;   // use API bid if available, else ltp
            const ask = Number(idx.ask) || ltp;   // use API ask if available, else ltp
            return {
                ...idx,
                id: `index-${idx.name}`,
                fullSymbol: `NSE:${idx.name}`,
                exchange: 'NSE',
                category: 'NSE',
                type: 'INDEX',
                ltp: String(ltp),
                bid: String(bid),
                ask: String(ask),
                high: String(Number(idx.high) || 0),
                low: String(Number(idx.low) || 0),
                open: String(Number(idx.open) || 0),
                close: String(Number(idx.close) || 0),
                change: String(Number(idx.change) || 0),
                changePct: String(Number(idx.pct) || 0),
            };
        });
        const all = [...indexItems, ...kiteMarketData, ...extraMarketData];
        const seen = new Set();
        return all.filter(item => {
            const key = item.id || item.fullSymbol || item.name;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [kiteMarketData, indices, extraMarketData]);

    // toggleWatchlist — toggles includedPins (adds/removes items from the watchlist)
    const toggleWatchlist = async (item) => {
        const symName = typeof item === 'string' ? item : (item?.name || item?.fullSymbol || item?.symbol);
        if (!symName) return;

        const next = new Set(includedPins);
        if (next.has(symName)) {
            next.delete(symName); // Remove from watchlist (exact match)
        } else {
            next.add(symName); // Add to watchlist
        }
        setIncludedPins(next);

        // Sync with server for persistence
        try {
            await api.saveUserWatchlist(Array.from(next));
        } catch (err) {
            console.log('ℹ️ Watchlist sync error:', err.message);
        }
    };

    // isPinned — An item is 'pinned' (green checkbox) if it is in includedPins
    const isPinned = (name) => includedPins.has(name);

    // ─── User Price Alerts ────────────────────────────────────────
    const [userAlerts, setUserAlerts] = useState([]);

    const [alertSettings, setAlertSettings] = useState({
        priceAlerts: true,
        percentChange: true,
        percentThreshold: 2,
        marketTiming: true,
        technical: true,
        tradeAlerts: true,
    });

    // Keep refs in sync so intervals always have fresh values
    useEffect(() => { userAlertsRef.current = userAlerts; }, [userAlerts]);
    useEffect(() => { alertSettingsRef.current = alertSettings; }, [alertSettings]);

    // Sync priceHistory into a ref for technical alert engine
    useEffect(() => { priceHistorySnap.current = priceHistory; }, [priceHistory]);

    const addUserAlert = (alert) => {
        // Optimistic update
        setUserAlerts(prev => [{
            id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            ...alert,
            status: 'active',
            createdAt: new Date(),
        }, ...prev]);
        refreshAlerts(); // Sync with API
    };

    const removeUserAlert = (id) => {
        setUserAlerts(prev => prev.filter(a => a.id !== id));
        triggeredRef.current.delete(id);
    };

    const resetUserAlert = (id) => {
        setUserAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'active', triggeredAt: null } : a));
        triggeredRef.current.delete(id);
    };

    const updateAlertSetting = (id, value) => {
        setAlertSettings((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'Order Executed',
            message: 'Your buy order for CRUDEOIL 26FEBFUT at 5770.00 has been executed successfully.',
            time: 'Just now',
            type: 'success'
        },
        {
            id: '2',
            title: 'Withdrawal Success',
            message: 'Your withdrawal request for ₹5,000 has been processed.',
            time: '2 hours ago',
            type: 'info'
        }
    ]);

    const addNotification = (notif) => {
        // If notif has a category, check if it's enabled in alertSettings
        if (notif.category) {
            const isEnabled = alertSettingsRef.current[notif.category];
            if (isEnabled === false) return; // Explicitly disabled
        }

        // If it's a trade execution alert (placed/closed from screens), check tradeAlerts setting
        if (notif.title?.includes('Order placed') || notif.title?.includes('Trade Closed')) {
            if (alertSettingsRef.current.tradeAlerts === false) return;
        }

        setNotifications(prev => [{
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...notif
        }, ...prev]);
    };

    const clearNotifications = () => setNotifications([]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // ─── Admin Notification System ───────────────────────────────
    const [adminNotifications, setAdminNotifications] = useState([]);

    // ─── Tickers from superadmin (shown in TickerTape alert banner) ───
    const [tickers, setTickers] = useState([]);

    const acknowledgeNotification = (id) => {
        setAdminNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, acknowledged: true, acknowledgedAt: new Date() } : n)
        );
    };

    const addAdminNotification = (notif) => {
        setAdminNotifications(prev => [{
            id: 'a' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            sentAt: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            acknowledged: false,
            ...notif
        }, ...prev]);
    };

    const unreadAdminCount = adminNotifications.filter(n => !n.acknowledged).length;

    // Support Tickets Unread Count
    const [unreadSupportCount, setUnreadSupportCount] = useState(0);

    const refreshSupportCount = async () => {
        try {
            const tickets = await api.getSupportTickets();
            if (tickets && Array.isArray(tickets)) {
                const unread = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
                setUnreadSupportCount(unread);
            }
        } catch (e) {
            console.log('Failed to fetch support unread count:', e.message);
        }
    };

    const [withdrawalRequests, setWithdrawalRequests] = useState([]);

    const addWithdrawalRequest = async (formData) => {
        try {
            await api.createWithdrawal(formData);
            addNotification({
                title: 'Withdrawal Requested',
                message: `Your request for ₹${formData.amount} has been submitted for admin review.`,
                type: 'info'
            });
            // Fetch fresh requests
            const reqs = await api.getWithdrawals();
            setWithdrawalRequests(reqs);
        } catch (err) {
            throw err;
        }
    };

    // Admin manually updates status (for real backend integration)
    const updateWithdrawalStatus = (id, status, remark = '') => {
        setWithdrawalRequests(prev =>
            prev.map(r => r.id === id
                ? { ...r, status, remark, statusUpdatedAt: new Date() }
                : r
            )
        );
    };


    const allowedCategories = useMemo(() => {
        if (!userConfig) {
            return ['NFO_FUT', 'NFO_OPT', 'MCX_FUT', 'MCX_OPT'];
        }
        const isTruthy = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'Active' || v === 'active';
        const isNotFalse = (v) => v !== false && v !== 'false' && v !== 0 && v !== '0' && v !== 'Disabled' && v !== 'disabled';
        const cats = [];
        if (isNotFalse(userConfig.equityTrading)) cats.push('NFO_FUT');
        if (isNotFalse(userConfig.indexOptionsTrading) || isNotFalse(userConfig.equityOptionsTrading)) cats.push('NFO_OPT');
        if (isNotFalse(userConfig.mcxTrading)) cats.push('MCX_FUT');
        if (isNotFalse(userConfig.mcxOptionsTrading)) cats.push('MCX_OPT');
        if (isTruthy(userConfig.cryptoTrading)) cats.push('CRYPTO');
        if (isTruthy(userConfig.forexTrading)) cats.push('FOREX');
        if (isTruthy(userConfig.comexTrading) || isTruthy(userConfig.commodityTrading)) cats.push('COMMODITY');
        return cats.length > 0 ? cats : ['NFO_FUT', 'MCX_FUT'];
    }, [userConfig]);

    return (
        <TradeContext.Provider value={{
            trades,
            addTrade,
            allowedCategories,
            livePrices,
            priceHistory,
            closeTrade,
            cancelTrade,
            setTargetSL,
            fetchInitialData,
            refreshTrades,
            refreshAlerts,
            ledgerBalance,
            activePL,
            realizedPL,
            totalM2M,
            aggregatedPositions,
            totalDynamicMargin,
            dynamicMarginBySegment,
            marginUsed: totalDynamicMargin,
            marginAvailable: calculatedMarginAvailable, // = Ledger - Margin Used
            marginBySegment: dynamicMarginBySegment,
            notifications,
            addNotification,
            clearNotifications,
            removeNotification,
            adminNotifications,
            acknowledgeNotification,
            addAdminNotification,
            unreadAdminCount,
            tickers,
            withdrawalRequests,
            addWithdrawalRequest,
            updateWithdrawalStatus,
            INSTRUMENT_META,
            getInstrumentMeta,
            refreshBalance,
            watchlist,
            toggleWatchlist,
            includedPins,
            isPinned,
            globalSearchData,
            indices,
            userAlerts,
            addUserAlert,
            removeUserAlert,
            resetUserAlert,
            alertSettings,
            updateAlertSetting,
            kiteStatus,
            dataError,
            userConfig,
            unreadSupportCount,
            refreshSupportCount
        }}>
            {children}
            <TradeSuccessPopup
                visible={successPopupVisible}
                title={successPopupTitle}
                message={successPopupMessage}
                onConfirm={() => {
                    setSuccessPopupVisible(false);
                    if (successPopupTitle === 'Pending Order Executed') {
                        const RootNavigation = require('../navigation/RootNavigation');
                        RootNavigation.navigate('Main', {
                            screen: 'Trades',
                            params: {
                                screen: 'TradesHome',
                                params: { initialTab: 'Active' }
                            }
                        });
                    }
                }}
            />
        </TradeContext.Provider>
    );
};

export default TradeContext;
