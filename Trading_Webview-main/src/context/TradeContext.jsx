import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/Config';
import { calculateEquityPnL, calculateMcxPnL } from '../utils/equityPnL';
import { calculateUsdPnL, calculateCryptoPnL, calculateForexPnL, calculateComexPnL } from '../utils/usdPnL';
import { calculateSegmentMargin, isMcxSymbol } from '../utils/segmentMargin';
import * as api from '../services/api';

const MOCK_WATCHLIST_DATA = [
    // NFO_FUT
    { symbol: 'NFO:NIFTY26APRFUT', name: 'NIFTY 26APR FUT', ltp: 17620, change: 0.45, category: 'NFO_FUT', exchange: 'NFO', type: 'NFO_FUT', lotSize: 50 },
    { symbol: 'NFO:BANKNIFTY26APRFUT', name: 'BANKNIFTY 26APR FUT', ltp: 41250, change: -0.12, category: 'NFO_FUT', exchange: 'NFO', type: 'NFO_FUT', lotSize: 25 },
    // NFO_OPT
    { symbol: 'NFO:NIFTY26APR17500CE', name: 'NIFTY 26APR 17500 CE', ltp: 185, change: 12.5, category: 'NFO_OPT', exchange: 'NFO', type: 'NFO_OPT', strike: '17500', optionType: 'CE', lotSize: 50 },
    { symbol: 'NFO:NIFTY26APR17500PE', name: 'NIFTY 26APR 17500 PE', ltp: 65, change: -8.3, category: 'NFO_OPT', exchange: 'NFO', type: 'NFO_OPT', strike: '17500', optionType: 'PE', lotSize: 50 },
    // MCX_FUT
    { symbol: 'MCX:CRUDEOIL26APRFUT', name: 'CRUDEOIL 26APR FUT', ltp: 6450, change: 1.25, category: 'MCX_FUT', exchange: 'MCX', type: 'MCX_FUT', lotSize: 100 },
    { symbol: 'MCX:GOLD26APRFUT', name: 'GOLD 26APR FUT', ltp: 60210, change: 0.35, category: 'MCX_FUT', exchange: 'MCX', type: 'MCX_FUT', lotSize: 100 },
    { symbol: 'MCX:SILVER26APRFUT', name: 'SILVER 26APR FUT', ltp: 74300, change: -0.65, category: 'MCX_FUT', exchange: 'MCX', type: 'MCX_FUT', lotSize: 30 },
    // MCX_OPT
    { symbol: 'MCX:CRUDEOIL26APR6000CE', name: 'CRUDEOIL 26APR 6000 CE', ltp: 480, change: 15.2, category: 'MCX_OPT', exchange: 'MCX', type: 'MCX_OPT', strike: '6000', optionType: 'CE', lotSize: 100 },
    { symbol: 'MCX:CRUDEOIL26APR6000PE', name: 'CRUDEOIL 26APR 6000 PE', ltp: 120, change: -18.5, category: 'MCX_OPT', exchange: 'MCX', type: 'MCX_OPT', strike: '6000', optionType: 'PE', lotSize: 100 },
    // CRYPTO
    { symbol: 'CRYPTO:BTCUSDT', name: 'BTC/USDT', ltp: 28450, change: 2.15, category: 'CRYPTO', exchange: 'CRYPTO', type: 'CRYPTO', lotSize: 1 },
    { symbol: 'CRYPTO:ETHUSDT', name: 'ETH/USDT', ltp: 1860, change: 1.85, category: 'CRYPTO', exchange: 'CRYPTO', type: 'CRYPTO', lotSize: 1 },
    { symbol: 'CRYPTO:SOLUSDT', name: 'SOL/USDT', ltp: 22.4, change: -3.4, category: 'CRYPTO', exchange: 'CRYPTO', type: 'CRYPTO', lotSize: 1 },
    // FOREX
    { symbol: 'FOREX:EURUSD', name: 'EUR/USD', ltp: 1.0950, change: 0.12, category: 'FOREX', exchange: 'FOREX', type: 'FOREX', lotSize: 1000 },
    { symbol: 'FOREX:GBPUSD', name: 'GBP/USD', ltp: 1.2420, change: -0.05, category: 'FOREX', exchange: 'FOREX', type: 'FOREX', lotSize: 1000 },
    { symbol: 'FOREX:USDINR', name: 'USD/INR', ltp: 82.15, change: 0.08, category: 'FOREX', exchange: 'FOREX', type: 'FOREX', lotSize: 1000 },
    // COMMODITY
    { symbol: 'COMMODITY:USOIL', name: 'USOIL', ltp: 80.45, change: 1.15, category: 'COMMODITY', exchange: 'COMMODITY', type: 'COMMODITY', lotSize: 10 },
    { symbol: 'COMMODITY:XAUUSD', name: 'XAU/USD', ltp: 2010.50, change: 0.42, category: 'COMMODITY', exchange: 'COMMODITY', type: 'COMMODITY', lotSize: 10 },
    { symbol: 'COMMODITY:COPPER', name: 'COPPER', ltp: 13393.09, change: -0.32, category: 'COMMODITY', exchange: 'COMMODITY', type: 'COMMODITY', lotSize: 2500 },
];

const TradeContext = createContext();

export const useTrades = () => useContext(TradeContext);

const INITIAL_MARKET_STATE = {};

export const INSTRUMENT_META = {
    'CRUDEOIL': { multiplier: 100, market: 'MCX' },
    'CRUDEOILM': { multiplier: 10, market: 'MCX' },
    'MCRUDEOIL': { multiplier: 10, market: 'MCX' },
    'NATURALGAS': { multiplier: 1250, market: 'MCX' },
    'NATURALGASM': { multiplier: 125, market: 'MCX' },
    'MNATURALGAS': { multiplier: 125, market: 'MCX' },
    'GOLD': { multiplier: 100, market: 'MCX' },
    'GOLDM': { multiplier: 10, market: 'MCX' },
    'MGOLD': { multiplier: 10, market: 'MCX' },
    'GOLDGUINEA': { multiplier: 8, market: 'MCX' },
    'GOLDPETAL': { multiplier: 1, market: 'MCX' },
    'SILVER': { multiplier: 30, market: 'MCX' },
    'SILVERM': { multiplier: 5, market: 'MCX' },
    'MSILVER': { multiplier: 5, market: 'MCX' },
    'SILVERMIC': { multiplier: 1, market: 'MCX' },
    'COPPER': { multiplier: 2500, market: 'MCX' },
    'COPPERM': { multiplier: 250, market: 'MCX' },
    'ZINC': { multiplier: 5000, market: 'MCX' },
    'ZINCMINI': { multiplier: 1000, market: 'MCX' },
    'NICKEL': { multiplier: 1500, market: 'MCX' },
    'LEAD': { multiplier: 5000, market: 'MCX' },
    'LEADMINI': { multiplier: 1000, market: 'MCX' },
    'ALUMINIUM': { multiplier: 5000, market: 'MCX' },
    'ALUMINIUMM': { multiplier: 1000, market: 'MCX' },
    'TCS': { multiplier: 1, market: 'NSE' },
    'RELIANCE': { multiplier: 1, market: 'NSE' },
    'SBIN': { multiplier: 1, market: 'NSE' },
    'INFY': { multiplier: 1, market: 'NSE' },
    'HDFCBANK': { multiplier: 1, market: 'NSE' },
    'BTC/USDT': { multiplier: 1, market: 'Crypto' }
};

export const normalizeSymbol = (symbol) => {
    if (!symbol) return '';
    
    // Convert to string and trim
    let tradingSymbol = String(symbol).trim();

    // Remove exchange prefix if present at start (case-insensitive)
    const prefixes = ['MCX:', 'NFO:', 'NSE:', 'BSE:', 'CRYPTO:', 'FOREX:', 'COMEX:', 'COMMODITY:'];
    for (const prefix of prefixes) {
        if (tradingSymbol.toUpperCase().startsWith(prefix)) {
            tradingSymbol = tradingSymbol.substring(prefix.length);
            break;
        }
    }

    // Replace colons with slashes for unified pair standardization (e.g. BTC:USDT -> BTC/USDT)
    tradingSymbol = tradingSymbol.replace(/:/g, '/');

    // Strip any parenthesized details (like Option strike/type)
    tradingSymbol = tradingSymbol.replace(/\s*\(.*\)\s*/g, '');

    // Standardize indices
    if (tradingSymbol.startsWith('NIFTY 50')) return 'NIFTY 50';
    if (tradingSymbol.startsWith('BANK NIFTY')) return 'BANK NIFTY';

    // Remove spaces, strip "FUT" suffix, and convert to uppercase
    return tradingSymbol
        .replace(/\s+/g, '')
        .replace(/FUT$/i, '')
        .toUpperCase();
};

export const getLivePriceObject = (symbolName, livePrices) => {
    if (!symbolName || !livePrices) return null;
    const raw = String(symbolName).trim();
    const upper = raw.toUpperCase();
    const clean = upper.includes(':') ? upper.split(':')[1] : upper;
    const norm = normalizeSymbol(raw);

    const possibleKeys = [
        norm,
        upper,
        clean,
        raw,
        `NFO:${clean}`,
        `MCX:${clean}`,
        `NSE:${clean}`,
        clean.replace(/\s+/g, ''),
        clean.replace(/\s+/g, '') + 'FUT',
        upper.replace(/\s+/g, ''),
        raw.toLowerCase(),
        norm.toLowerCase()
    ];

    for (const k of possibleKeys) {
        if (livePrices[k] && (parseFloat(livePrices[k].ltp) > 0 || parseFloat(livePrices[k].bid) > 0 || parseFloat(livePrices[k].ask) > 0)) {
            return livePrices[k];
        }
    }

    const liveKeys = Object.keys(livePrices);
    const noSpaceClean = clean.replace(/[\s\-_]/g, '');
    for (const k of liveKeys) {
        const noSpaceK = k.toUpperCase().replace(/^.*:/, '').replace(/[\s\-_]/g, '');
        if (noSpaceK === noSpaceClean || (noSpaceClean.length > 3 && (noSpaceK.includes(noSpaceClean) || noSpaceClean.includes(noSpaceK)))) {
            const data = livePrices[k];
            if (data && (parseFloat(data.ltp) > 0 || parseFloat(data.bid) > 0 || parseFloat(data.ask) > 0)) {
                return data;
            }
        }
    }

    return null;
};

export const TradeProvider = ({ children }) => {
    const [trades, setTrades] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_trades');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [userConfig, setUserConfig] = useState(null);
    const [dbLotSizes, setDbLotSizes] = useState({});

    const getDbLotSize = (name) => {
        if (!name) return null;
        const cleanSym = name.includes(':') ? name.split(':')[1] : name;
        const normKey = normalizeSymbol(cleanSym);
        const upperSym = cleanSym.toUpperCase();
        return dbLotSizes[name] || dbLotSizes[cleanSym] || dbLotSizes[upperSym] || dbLotSizes[normKey] || null;
    };

    const allowedCryptoSymbolsRef = useRef(null);
    const allowedForexSymbolsRef = useRef(null);
    const allowedCommoditySymbolsRef = useRef(null);
    
    // Popup state
    const [successPopupVisible, setSuccessPopupVisible] = useState(false);
    const [successPopupMessage, setSuccessPopupMessage] = useState('');
    const [successPopupTitle, setSuccessPopupTitle] = useState('');

    const [livePrices, setLivePrices] = useState(INITIAL_MARKET_STATE);
    const [priceHistory, setPriceHistory] = useState(() => {
        const initialHistory = {};
        Object.keys(INITIAL_MARKET_STATE).forEach(key => {
            initialHistory[key] = [INITIAL_MARKET_STATE[key], INITIAL_MARKET_STATE[key]];
        });
        return initialHistory;
    });

    const [ledgerBalance, setLedgerBalance] = useState(() => Number(localStorage.getItem('vtrkm_cache_ledger_balance')) || 0);
    const [marginUsed, setMarginUsed] = useState(() => Number(localStorage.getItem('vtrkm_cache_margin_used')) || 0);
    const [marginAvailable, setMarginAvailable] = useState(() => Number(localStorage.getItem('vtrkm_cache_margin_available')) || 0);
    const [marginBySegment, setMarginBySegment] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_margin_by_segment');
            return saved ? JSON.parse(saved) : { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0 };
        } catch { return { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0 }; }
    });
    const [apiNetPL, setApiNetPL] = useState(() => Number(localStorage.getItem('vtrkm_cache_net_pl')) || 0);

    const [kiteMarketData, setKiteMarketData] = useState([]);
    const [kiteStatus, setKiteStatus] = useState({ connected: false, error: null, message: null });
    const [dataError, setDataError] = useState(null);
    const [includedPins, setIncludedPins] = useState(new Set());
    const [indices, setIndices] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_indices');
            return saved ? JSON.parse(saved) : [
                { name: 'NIFTY 50', ltp: 0, change: 0, pct: 0 },
                { name: 'BANK NIFTY', ltp: 0, change: 0, pct: 0 },
                { name: 'FINNIFTY', ltp: 0, change: 0, pct: 0 },
            ];
        } catch {
            return [
                { name: 'NIFTY 50', ltp: 0, change: 0, pct: 0 },
                { name: 'BANK NIFTY', ltp: 0, change: 0, pct: 0 },
                { name: 'FINNIFTY', ltp: 0, change: 0, pct: 0 },
            ];
        }
    });

    const [userAlerts, setUserAlerts] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_user_alerts');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [alertSettings, setAlertSettings] = useState({
        priceAlerts: true,
        percentChange: true,
        percentThreshold: 2,
        marketTiming: true,
        technical: true,
        tradeAlerts: true,
    });

    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'Market Closed',
            message: 'NSE & BSE markets closed for the day.',
            time: '3:30 PM',
            type: 'error'
        },
        {
            id: '2',
            title: 'Order Executed',
            message: 'Your buy order for CRUDEOIL 26FEBFUT at 5770.00 has been executed successfully.',
            time: 'Just now',
            type: 'success'
        },
        {
            id: '3',
            title: 'Withdrawal Success',
            message: 'Your withdrawal request for ₹5,000 has been processed.',
            time: '2 hours ago',
            type: 'info'
        }
    ]);
    const [adminNotifications, setAdminNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_admin_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [tickers, setTickers] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_tickers');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [withdrawalRequests, setWithdrawalRequests] = useState(() => {
        try {
            const saved = localStorage.getItem('vtrkm_cache_withdrawal_requests');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const userAlertsRef = useRef([]);
    const alertSettingsRef = useRef({});
    const triggeredRef = useRef(new Set());
    const lastPriceRef = useRef({});
    const marketFiredRef = useRef(new Set());
    const priceHistorySnap = useRef({});

    useEffect(() => { userAlertsRef.current = userAlerts; }, [userAlerts]);
    useEffect(() => { alertSettingsRef.current = alertSettings; }, [alertSettings]);
    useEffect(() => { priceHistorySnap.current = priceHistory; }, [priceHistory]);

    // Automatic refresh when the webview is focused or online status returns
    useEffect(() => {
        if (!api.hasSession()) return;

        const handleFocusOrOnline = () => {
            console.log('🔄 [Webview] Window focused or online, refreshing data...');
            fetchInitialData();
        };

        window.addEventListener('focus', handleFocusOrOnline);
        window.addEventListener('online', handleFocusOrOnline);

        return () => {
            window.removeEventListener('focus', handleFocusOrOnline);
            window.removeEventListener('online', handleFocusOrOnline);
        };
    }, []);

    // Live Price Socket Integration
    useEffect(() => {
        if (!api.hasSession()) return;
        console.log('🔌 [Socket] Initializing socket connection to:', SOCKET_URL);
        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity
        });

        socket.on('connect', () => {
            console.log('✅ [Socket] Connected successfully');
            const user = api.getSessionUser();
            socket.emit('join', {
                userId: user?.id || 'web-user',
                role: user?.role || 'TRADER',
                username: user?.username || 'anonymous'
            });
        });

        const priceBuffer = {};
        let flushTimeout = null;

        const flushPrices = () => {
            setLivePrices(prev => {
                const next = { ...prev };
                let changed = false;
                for (const [normKey, data] of Object.entries(priceBuffer)) {
                    const old = prev[normKey] || {};
                    if (
                        old.ltp !== data.ltp ||
                        old.bid !== data.bid ||
                        old.ask !== data.ask ||
                        old.open !== data.open ||
                        old.high !== data.high ||
                        old.low !== data.low ||
                        old.close !== data.close ||
                        old.volume !== data.volume ||
                        old.change !== data.change
                    ) {
                        next[normKey] = data;
                        changed = true;
                    }
                }
                // Clear buffer
                for (const key of Object.keys(priceBuffer)) {
                    delete priceBuffer[key];
                }
                return changed ? next : prev;
            });
            flushTimeout = null;
        };

        socket.on('price_update', (newPrices) => {
            Object.keys(newPrices).forEach(symbol => {
                const data = newPrices[symbol];
                const normKey = normalizeSymbol(symbol);

                let newLtp = 0, newBid = 0, newAsk = 0;
                let newOpen = 0, newHigh = 0, newLow = 0, newClose = 0, newVolume = 0, newChange = 0;
                if (typeof data === 'object') {
                    newLtp = data.ltp || data.price || 0;
                    newBid = data.bid || (data.depth?.buy?.[0]?.price) || newLtp;
                    newAsk = data.ask || (data.depth?.sell?.[0]?.price) || newLtp;
                    newOpen = data.open || data.ohlc?.open || 0;
                    newHigh = data.high || data.ohlc?.high || 0;
                    newLow = data.low || data.ohlc?.low || 0;
                    newClose = data.close || data.ohlc?.close || 0;
                    newVolume = data.volume !== undefined ? data.volume : (data.vol !== undefined ? data.vol : 0);
                    newChange = data.change !== undefined ? data.change : (data.chg !== undefined ? data.chg : 0);
                } else {
                    newLtp = data;
                    newBid = data;
                    newAsk = data;
                }

                priceBuffer[normKey] = {
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
            });

            if (!flushTimeout) {
                flushTimeout = setTimeout(flushPrices, 16);
            }
        });

        socket.on('disconnect', (reason) => {
            console.warn(`⚠️ [Socket] Disconnected. Reason:`, reason);
        });

        socket.on('error', (err) => {
            console.error(`❌ [Socket] Error:`, err);
        });

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

            addAdminNotification(notifObj);

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
            } else {
                // Web safe equivalent for Alert.alert
                addNotification({
                    title: notifObj.title,
                    message: notifObj.message,
                    type: 'info'
                });
            }
        });

        socket.on('alert_triggered', (data) => {
            if (!alertSettingsRef.current.priceAlerts) return;
            console.log('🔔 Price Alert Triggered:', data);

            setUserAlerts(prev => prev.map(a =>
                a.id === data.id.toString()
                    ? { ...a, status: 'triggered', triggeredAt: new Date() }
                    : a
            ));

            addNotification({
                title: 'Price Alert Hit! 🎯',
                message: data.message || `${data.symbol} hit your target of ₹${data.targetPrice}`,
                type: 'success'
            });
        });

        socket.on('trade_update', (data) => {
            console.log('🔄 Trade update received via socket:', data);
            refreshTrades();
            refreshBalance();
        });

        socket.on('market_data_update', (update) => {
            const { type, data: rawData } = update || {};
            if (!rawData || !Array.isArray(rawData)) return;

            let basePrefix = 'FOREX';
            let baseCat = 'FOREX';
            let allowedSet = null;
            if (type === 'crypto') {
                basePrefix = 'CRYPTO';
                baseCat = 'CRYPTO';
                allowedSet = allowedCryptoSymbolsRef.current;
            } else if (type === 'commodity') {
                basePrefix = 'COMMODITY';
                baseCat = 'COMMODITY';
                allowedSet = allowedCommoditySymbolsRef.current;
            } else if (type === 'forex') {
                allowedSet = allowedForexSymbolsRef.current;
            }

            let dataToMap = rawData;
            if (allowedSet) {
                dataToMap = dataToMap.filter(item => allowedSet.has(item.symbol) || allowedSet.has(item.name));
            }

            setKiteMarketData(prev => {
                const updated = [...prev];

                dataToMap.forEach(item => {
                    const cleanSym = item.symbol.replace(/:/g, '').toUpperCase();
                    const isMetal = cleanSym === 'XAUUSD' || cleanSym === 'XAGUSD' || cleanSym === 'XAU/USD' || cleanSym === 'XAG/USD';
                    const prefix = isMetal ? 'COMMODITY' : basePrefix;
                    const cat = isMetal ? 'COMMODITY' : baseCat;

                    let symbol = item.symbol;
                    if (isMetal) {
                        const rawSym = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                        symbol = `COMMODITY:${rawSym}`;
                    } else {
                        symbol = item.symbol.includes(':') ? item.symbol : `${prefix}:${item.symbol}`;
                    }
                    const displayName = (item.name || item.symbol).replace(/:/g, '/');
                    const normKey = normalizeSymbol(displayName);

                    const ltp = item.ltp || item.price || 0;
                    const changePct = Number(item.chg_pct || item.changePct || item.change || 0);

                    const existingIdx = updated.findIndex(r => normalizeSymbol(r.name) === normKey);
                    if (existingIdx !== -1) {
                        const existing = { ...updated[existingIdx] };
                        existing.ltp = String(ltp);
                        existing.bid = String(item.bid || ltp);
                        existing.ask = String(item.ask || ltp);
                        existing.change = String(changePct);
                        existing.changePct = String(changePct);
                        if (item.high != null) existing.high = String(item.high);
                        if (item.low != null) existing.low = String(item.low);
                        if (item.open != null) existing.open = String(item.open);
                        if (item.close != null) existing.close = String(item.close);
                        existing.category = cat;
                        existing.exchange = prefix;
                        existing.type = prefix;
                        updated[existingIdx] = existing;
                    } else {
                        updated.push({
                            id: `${type}-${item.symbol}`,
                            name: displayName,
                            fullSymbol: symbol,
                            category: cat,
                            exchange: prefix,
                            type: prefix,
                            ltp: String(ltp),
                            bid: String(item.bid || ltp),
                            ask: String(item.ask || ltp),
                            change: String(changePct),
                            changePct: String(changePct),
                            high: String(item.high || 0),
                            low: String(item.low || 0),
                            open: String(item.open || 0),
                            close: String(item.close || 0),
                            date: new Date().toISOString().split('T')[0],
                            lotSize: Number(item.lotSize || item.lot_size || 1),
                            status: 'active',
                        });
                    }
                });
                return updated;
            });

            setLivePrices(prev => {
                const next = { ...prev };
                let changed = false;
                dataToMap.forEach(item => {
                    const normKey = normalizeSymbol(item.name || item.symbol);
                    const ltp = parseFloat(item.ltp || item.price) || 0;
                    const bid = parseFloat(item.bid) || ltp;
                    const ask = parseFloat(item.ask) || ltp;
                    const changeVal = parseFloat(item.chg_pct || item.changePct || item.change) || 0;

                    const prevData = prev[normKey] || {};
                    if (prevData.ltp !== ltp || prevData.bid !== bid || prevData.ask !== ask) {
                        next[normKey] = {
                            ...prevData,
                            ltp,
                            bid,
                            ask,
                            change: changeVal,
                            high: parseFloat(item.high) || prevData.high || 0,
                            low: parseFloat(item.low) || prevData.low || 0,
                            open: parseFloat(item.open) || prevData.open || 0,
                            close: parseFloat(item.close) || prevData.close || 0,
                        };
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        });

        return () => {
            if (flushTimeout) clearTimeout(flushTimeout);
            socket.disconnect();
        };
    }, []);

    const parseTradeSymbol = (symbol) => {
        const parts = symbol.split(':');
        const exchange = parts.length > 1 ? parts[0] : '';
        const tradingSymbol = parts.length > 1 ? parts[1] : symbol;

        const standardized = tradingSymbol.replace(/:/g, '/');
        let name = standardized;
        const futMatch = standardized.match(/^([A-Z]+)(\d{1,2}[A-Z]{3}\d{0,2})FUT$/);
        if (futMatch) {
            name = `${futMatch[1]} ${futMatch[2]}`;
        }

        return { name, displayName: standardized, exchange };
    };

    const mapApiTrade = (t) => {
        const parsed = parseTradeSymbol(t.symbol || '');

        let displayName = parsed.displayName;
        let name = parsed.name;
        if ((t.market_type === 'CRYPTO' || t.market_type === 'FOREX' || t.market_type === 'COMMODITY' || t.market_type === 'COMEX') && t.symbol) {
            let cleanSymbol = t.symbol;
            let foundActualSymbol = false;

            while (!foundActualSymbol && cleanSymbol) {
                if (cleanSymbol.startsWith('CRYPTO:')) {
                    cleanSymbol = cleanSymbol.substring(7);
                } else if (cleanSymbol.startsWith('FOREX:')) {
                    cleanSymbol = cleanSymbol.substring(6);
                } else if (cleanSymbol.startsWith('COMMODITY:')) {
                    cleanSymbol = cleanSymbol.substring(10);
                } else if (cleanSymbol.startsWith('COMEX:')) {
                    cleanSymbol = cleanSymbol.substring(6);
                } else {
                    foundActualSymbol = true;
                }
            }

            if (cleanSymbol) {
                displayName = cleanSymbol;
                name = cleanSymbol;
            }
        }

        const isTradeCompleted =
            t.status === 'CLOSED' ||
            t.status === 'COMPLETED' ||
            t.is_completed === 1 ||
            (t.exit_price !== null && t.exit_price !== undefined && t.exit_price !== '');

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
            time: t.entry_time ? new Date(t.entry_time).toLocaleString('en-IN') : '',
            exitTime: t.exit_time ? new Date(t.exit_time).toLocaleString('en-IN') : null,
            isCompleted: isTradeCompleted,
            isPending: isTradePending,
            executedFromPending: t.executed_from_pending === 1,
            market: t.market_type || 'MCX',
            market_type: t.market_type || 'MCX',
            username: t.username || 'Unknown',
            closed_by: t.closed_by || 'Unknown',
            closeRemark: t.close_remark || null,
            is_commodity: t.is_commodity === 1 || t.is_commodity === true || (t.market_type === 'COMMODITY') || (t.market_type === 'FOREX') || (t.market_type === 'CRYPTO'),
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
        if (!api.hasSession()) return;

        try {
            // Fetch DB lot sizes map from backend
            try {
                const token = api.getToken();
                if (token) {
                    const scripRes = await fetch(`${SOCKET_URL}/api/dashboard/scrips`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (scripRes.ok) {
                        const scripMapData = await scripRes.json();
                        setDbLotSizes(scripMapData);
                    }
                }
            } catch (e) {
                console.warn('⚠️ Could not fetch DB scrips lot sizes:', e.message);
            }

            const promises = [
                api.getMe().catch(meErr => {
                    console.warn('⚠️ Could not fetch current user details:', meErr.message);
                }),
                api.getTrades('').then(allTrades => {
                    if (allTrades && Array.isArray(allTrades)) {
                        const mappedTrades = allTrades.filter(t => t.status !== 'DELETED').map(mapApiTrade);
                        setTrades(mappedTrades);
                        localStorage.setItem('vtrkm_cache_trades', JSON.stringify(mappedTrades));
                    }
                }).catch(tradesErr => {
                    console.warn('⚠️ Could not fetch trades:', tradesErr.message);
                }),
                api.getIndices().then(idx => {
                    if (idx && idx.length > 0) {
                        setIndices(idx);
                        localStorage.setItem('vtrkm_cache_indices', JSON.stringify(idx));
                    }
                }).catch(indicesErr => {
                    console.warn('⚠️ Could not fetch indices:', indicesErr.message);
                }),
                fetchOhlcData(),
                fetchKiteMarketData(),
                api.getFunds().then(bal => {
                    if (bal) {
                        setLedgerBalance(Number(bal.balance) || 0);
                        setMarginUsed(Number(bal.margin_used) || 0);
                        setMarginAvailable(Number(bal.margin_available) || 0);
                        setApiNetPL(Number(bal.net_pl) || 0);
                        const seg = bal.margin_by_segment || {};
                        const mappedSegment = {
                            MCX: Number(seg.MCX) || 0,
                            EQUITY: Number(seg.EQUITY) || 0,
                            OPTIONS: Number(seg.OPTIONS) || 0,
                            COMEX: Number(seg.COMEX) || 0
                        };
                        setMarginBySegment(mappedSegment);

                        localStorage.setItem('vtrkm_cache_ledger_balance', (bal.balance || 0).toString());
                        localStorage.setItem('vtrkm_cache_margin_used', (bal.margin_used || 0).toString());
                        localStorage.setItem('vtrkm_cache_margin_available', (bal.margin_available || 0).toString());
                        localStorage.setItem('vtrkm_cache_net_pl', (bal.net_pl || 0).toString());
                        localStorage.setItem('vtrkm_cache_margin_by_segment', JSON.stringify(mappedSegment));
                    }
                }).catch(balErr => {
                    console.warn('❌ Could not fetch funds:', balErr.message);
                }),
                api.getWithdrawals().then(wds => {
                    if (wds && wds.length > 0) {
                        setWithdrawalRequests(wds);
                        localStorage.setItem('vtrkm_cache_withdrawal_requests', JSON.stringify(wds));
                    }
                }).catch(wdsErr => {
                    console.warn('⚠️ Could not fetch withdrawals:', wdsErr.message);
                }),
                api.getNotifications().then(notifs => {
                    if (notifs && Array.isArray(notifs)) {
                        const mappedNotifs = notifs.map(n => ({
                            id: n.id?.toString(),
                            title: n.title || 'Notification',
                            message: n.message || '',
                            type: n.type || 'info',
                            time: n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Just now',
                            acknowledged: !!n.is_read,
                            createdAt: new Date(n.created_at || Date.now())
                        }));
                        setAdminNotifications(mappedNotifs);
                        localStorage.setItem('vtrkm_cache_admin_notifications', JSON.stringify(mappedNotifs));
                    }
                }).catch(notifErr => {
                    console.log('ℹ️ Could not fetch notifications:', notifErr.message);
                }),
                api.getAlertSettings().then(alertSets => {
                    if (alertSets) setAlertSettings(prev => ({ ...prev, ...alertSets }));
                }).catch(alertSetsErr => {
                    console.warn('⚠️ Could not fetch alert settings:', alertSetsErr.message);
                }),
                api.getTickers().then(tickerData => {
                    if (tickerData && Array.isArray(tickerData)) {
                        setTickers(tickerData);
                        localStorage.setItem('vtrkm_cache_tickers', JSON.stringify(tickerData));
                    }
                }).catch(tickerErr => {
                    console.log('ℹ️ Could not fetch tickers:', tickerErr.message);
                }),
                api.getUserWatchlist().then(savedWatchlist => {
                    if (Array.isArray(savedWatchlist) && savedWatchlist.length > 0) {
                        // Standardize colons to slashes for saved watchlists as well
                        const mapped = savedWatchlist.map(s => s.replace(/:/g, '/'));
                        setIncludedPins(new Set(mapped));
                        return true;
                    }
                    return false;
                }).then(hasPins => {
                    if (!hasPins) {
                        const defaultPins = [
                            'NIFTY 26APR FUT', 'BANKNIFTY 26APR FUT',
                            'NIFTY 26APR 17500 CE', 'NIFTY 26APR 17500 PE',
                            'CRUDEOIL 26APR FUT', 'GOLD 26APR FUT', 'SILVER 26APR FUT',
                            'CRUDEOIL 26APR 6000 CE', 'CRUDEOIL 26APR 6000 PE',
                            'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
                            'EUR/USD', 'GBP/USD', 'USD/INR',
                            'USOIL', 'XAU/USD'
                        ];
                        setIncludedPins(new Set(defaultPins));
                    }
                }).catch(wlErr => {
                    console.log('ℹ️ No saved watchlist found, using defaults:', wlErr.message);
                    const defaultPins = [
                        'NIFTY 26APR FUT', 'BANKNIFTY 26APR FUT',
                        'NIFTY 26APR 17500 CE', 'NIFTY 26APR 17500 PE',
                        'CRUDEOIL 26APR FUT', 'GOLD 26APR FUT', 'SILVER 26APR FUT',
                        'CRUDEOIL 26APR 6000 CE', 'CRUDEOIL 26APR 6000 PE',
                        'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
                        'EUR/USD', 'GBP/USD', 'USD/INR',
                        'USOIL', 'XAU/USD'
                    ];
                    setIncludedPins(new Set(defaultPins));
                }),
                api.getAlerts().then(alerts => {
                    if (alerts) {
                        const mapped = (Array.isArray(alerts) ? alerts : (alerts.data || [])).map(a => ({
                            ...a,
                            id: a.id.toString(),
                            targetPrice: Number(a.target_price || 0)
                        }));
                        setUserAlerts(mapped);
                        localStorage.setItem('vtrkm_cache_user_alerts', JSON.stringify(mapped));
                    }
                }).catch(alertsErr => {
                    console.log('ℹ️ Error loading price alerts:', alertsErr.message);
                })
            ];

            const user = api.getSessionUser();
            if (user && user.id) {
                promises.push(
                    api.getUserProfile(user.id).then(profileData => {
                        if (profileData && profileData.settings) {
                            const settings = profileData.settings;
                            const parsedConfig = typeof settings.config_json === 'string'
                                ? JSON.parse(settings.config_json)
                                : (settings.config_json || {});
                            setUserConfig({ ...settings, ...parsedConfig, tradeEquityUnits: settings.trade_equity_units });
                        }
                    }).catch(configErr => {
                        console.warn('⚠️ Could not fetch dynamic lot sizes:', configErr.message);
                    })
                );
            }

            await Promise.allSettled(promises);
        } catch (err) {
            console.error('❌ Unexpected error in fetchInitialData:', err);
        }
    };

    const addTrade = async (trade) => {
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
            await refreshTrades();
            return res;
        } catch (err) {
            setTrades(prev => prev.filter(t => t.id !== tempId));
            throw err;
        }
    };

    const closeTrade = async (ids, exitPrice, exitTime, pnl) => {
        const idList = (Array.isArray(ids) ? ids : [ids]).map(id => id.toString());
        try {
            const firstId = idList[0];
            await api.closeTrade(firstId, parseFloat(exitPrice), pnl ? parseFloat(pnl) : null);

            setTrades(prevTrades => {
                return prevTrades.map(t => {
                    if (idList.includes(t.id.toString())) {
                        return {
                            ...t,
                            isCompleted: true,
                            exitPrice: exitPrice.toString(),
                            exitTime: exitTime,
                            status: 'CLOSED'
                        };
                    }
                    return t;
                });
            });

            // Silent rest close
            (async () => {
                try {
                    const otherIds = idList.slice(1);
                    if (otherIds.length > 0) {
                        await Promise.all(otherIds.map(id => 
                            api.closeTrade(id, parseFloat(exitPrice), pnl ? parseFloat(pnl) : null).catch(() => {})
                        ));
                    }
                    await Promise.all([refreshTrades(), refreshBalance()]);
                } catch (bgErr) {
                    console.error('Background sync close error:', bgErr);
                }
            })();

            return { success: true };
        } catch (err) {
            throw err;
        }
    };

    const setTargetSL = async (id, target, sl) => {
        try {
            await api.setTargetSL(id, target, sl);
            setTrades(prev => prev.map(t => t.id === id ? { ...t, target, target_price: target, sl, stop_loss: sl, stopLoss: sl } : t));
            return { success: true };
        } catch (err) {
            throw err;
        }
    };

    const cancelTrade = async (id) => {
        const tradeToCancel = trades.find(t => t.id === id);
        if (!tradeToCancel) throw new Error('Trade not found');

        try {
            await api.closeTrade(id, 0);
            setTrades(prev => prev.filter(t => t.id !== id));
            addNotification({
                title: 'Order Cancelled',
                message: `Your ${tradeToCancel.type} order for ${tradeToCancel.displayName} has been cancelled.`,
                type: 'success'
            });
            await refreshBalance();
        } catch (err) {
            addNotification({
                title: 'Cancel Failed',
                message: `Failed to cancel order: ${err.message}`,
                type: 'error'
            });
            throw err;
        }
    };

    const getInstrumentMeta = (name, marketType = null) => {
        if (!name) return { multiplier: 1, intradayMargin: 0, holdingMargin: 0 };
        const upperName = name.replace(/\s+/g, '').toUpperCase();

        // Extract base symbol (e.g. "GOLD" from "GOLD 26MAY" or "GOLD26MAYFUT")
        // Improved regex to handle various formats
        const baseSymbolMatch = upperName.match(/^([A-Z]+)/);
        const baseSymbol = baseSymbolMatch ? baseSymbolMatch[1] : upperName;

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
                }
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

            // B. Check for Instrument Specific Settings first (mcxLotMargins)
            if (userConfig.mcxLotMargins) {
                const sortedKeys = Object.keys(userConfig.mcxLotMargins).sort((a, b) => b.length - a.length);
                for (const key of sortedKeys) {
                    const upperKey = key.toUpperCase();
                    if (upperName === upperKey || upperName.startsWith(upperKey)) {
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
            const globalIntraday = parseFloat(userConfig.mcxIntradayMargin || userConfig.mcx_intraday_exposure || userConfig.mcxExposureMultiplier || 500);
            const globalHolding = parseFloat(userConfig.mcxHoldingMargin || userConfig.mcx_holding_exposure || 100);

            // Determine if this is an Options instrument
            const isOptions = upperName.endsWith('CE') || upperName.endsWith('PE') || /\d{5,}[CP]E/i.test(upperName);

            // Determine if this is an MCX or NSE instrument
            const isMCX = !isOptions && (upperName.includes('FUT') ||
                ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD', 'ALUMINIUM'].some(k => upperName.startsWith(k)) ||
                INSTRUMENT_META[baseSymbol]?.market === 'MCX');

            const isNSE = !isOptions && !isMCX && (INSTRUMENT_META[baseSymbol]?.market === 'NSE' ||
                ['TCS', 'RELIANCE', 'SBIN', 'INFY', 'HDFCBANK', 'NIFTY', '3600NE', 'BANKNIFTY', 'FINNIFTY'].some(k => upperName.startsWith(k)));

            if (isOptions) {
                // User wants OPTIONS to use the EQUITY exposure logic 
                const equityIntradayExposure = parseFloat(userConfig.equityIntradayMargin || userConfig.equityIntradayExposure || 500);
                const equityHoldingExposure = parseFloat(userConfig.equityHoldingMargin || userConfig.equityHoldingExposure || 100);
                return {
                    multiplier: 1,
                    intradayExposure: equityIntradayExposure,
                    holdingExposure: equityHoldingExposure,
                    market: 'OPTIONS',
                    isDynamic: true,
                    isExposureBased: true
                };
            }

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

    const getHardcodedMultiplier = (name) => {
        if (!name) return 1;
        const upperName = name.replace(/\s+/g, '').toUpperCase();
        const baseSymbolMatch = upperName.match(/^([A-Z]+)/);
        const baseSymbol = baseSymbolMatch ? baseSymbolMatch[1] : upperName;
        return INSTRUMENT_META[baseSymbol]?.multiplier || 1;
    };

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
            }

            const side = trade.type === 'BUY' ? 1 : -1;
            const qty = Number(trade.qty) || 0;
            const entry = Number(trade.entryPrice) || 0;
            const margin = Number(trade.margin_used) || 0;

            positions[key].netQty += (side * qty);
            positions[key].tradeIds.push(trade.id);
            if (trade.executedFromPending) positions[key].executedFromPending = true;

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

            const liveData = getLivePriceObject(trade.name, livePrices) || getLivePriceObject(trade.displayName, livePrices) || {};
            const liveLtp = parseFloat(liveData.ltp || 0);
            const ltp = liveLtp > 0 ? liveLtp : (Number(trade.entryPrice) || 0);
            const bid = (liveData && parseFloat(liveData.bid) > 0) ? parseFloat(liveData.bid) : ltp;
            const ask = (liveData && parseFloat(liveData.ask) > 0) ? parseFloat(liveData.ask) : ltp;

            const exitPrice = trade.type === 'BUY' ? bid : ask;
            const mType = (trade.market || trade.market_type || '').toUpperCase();
            let tradePL = 0;
            if (trade.is_commodity) {
                const lotSize = Number(trade.lot_size) || 1;
                const fallbackUsdInr = Number(trade.usdinr_value) || 95.1;
                const usdInrLive = livePrices['USD/INR'] || livePrices['USDINR'];
                const liveBid = usdInrLive ? parseFloat(usdInrLive.bid) || null : null;
                const liveAsk = usdInrLive ? parseFloat(usdInrLive.ask) || null : null;

                const tradeSym = trade.name || trade.symbol || '';
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
                const hardcodedMult = getHardcodedMultiplier(trade.name) || getHardcodedMultiplier(trade.fullSymbol);
                const dbLotVal = getDbLotSize(trade.name) || getDbLotSize(trade.fullSymbol);
                const lotSize = parseFloat(trade.lot_size || dbLotVal || trade.lot_size_at_entry || (hardcodedMult > 1 ? hardcodedMult : null) || positions[key]?.hardcodedMultiplier || 1);
                const isMcxTrade = mType === 'MCX' || isMcxSymbol(trade.name || trade.fullSymbol || '');
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
            const liveData = getLivePriceObject(pos.name, livePrices) || getLivePriceObject(pos.displayName, livePrices) || {};
            const liveLtp = parseFloat(liveData.ltp || 0);
            const ltp = liveLtp > 0 ? liveLtp : (pos.avgPrice || 0);
            const bid = (liveData && parseFloat(liveData.bid) > 0) ? parseFloat(liveData.bid) : ltp;
            const ask = (liveData && parseFloat(liveData.ask) > 0) ? parseFloat(liveData.ask) : ltp;

            const netQty = pos.netQty;
            const qty = Math.abs(netQty);
            const isBuyPosition = netQty > 0 || (netQty === 0 && pos.totalBuyQty >= pos.totalSellQty);
            const type = isBuyPosition ? 'BUY' : 'SELL';

            let avgPrice = isBuyPosition
                ? (pos.totalBuyQty > 0 ? pos.totalBuyCost / pos.totalBuyQty : 0)
                : (pos.totalSellQty > 0 ? pos.totalSellCost / pos.totalSellQty : 0);

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

    const activePL = useMemo(() => aggregatedPositions.reduce((sum, pos) => sum + pos.pnl, 0), [aggregatedPositions]);
    const totalDynamicMargin = useMemo(() => aggregatedPositions.reduce((sum, pos) => sum + (pos.totalHoldingMargin || 0), 0), [aggregatedPositions]);

    const dynamicMarginBySegment = useMemo(() => {
        const segments = { MCX: 0, EQUITY: 0, OPTIONS: 0, COMEX: 0, FOREX: 0, CRYPTO: 0 };
        aggregatedPositions.forEach(pos => {
            let mkt = pos.market || 'MCX';
            if (mkt === 'NSE') mkt = 'EQUITY';
            if (segments[mkt] !== undefined) segments[mkt] += (pos.totalHoldingMargin || 0);
        });
        return segments;
    }, [aggregatedPositions]);

    const totalM2M = useMemo(() => ledgerBalance + activePL, [ledgerBalance, activePL]);
    const realizedPL = apiNetPL;

    const calculatedMarginAvailable = useMemo(() => {
        const totalMarginUsed = aggregatedPositions.reduce((sum, pos) => {
            const qty = Math.abs(pos.netQty);
            const turnover = (pos.avgPrice || 0) * qty;

            let m = 0;
            if (pos.isExposureBased && pos.intradayExposure > 0) {
                m = turnover / pos.intradayExposure;
            } else if (pos.dynamicMarginPerLot > 0) {
                m = pos.dynamicMarginPerLot * qty;
            }
            return sum + m;
        }, 0);

        return Math.max(0, ledgerBalance - totalMarginUsed + activePL);
    }, [ledgerBalance, aggregatedPositions, activePL]);

    const allowedContractsRef = useRef(null);
    useEffect(() => {
        const fetchAllowedContracts = async () => {
            if (!api.hasSession()) return;
            try {
                const response = await api.getSelectedContracts();
                if (response && Array.isArray(response.data)) {
                    allowedContractsRef.current = new Set(response.data);
                } else if (response && Array.isArray(response)) {
                    allowedContractsRef.current = new Set(response);
                }
            } catch (err) {
                console.log('Allowed contracts fetch error:', err.message);
            }
        };
        fetchAllowedContracts();
    }, []);

    const ohlcCacheRef = useRef({});
    const kiteLoadedRef = useRef(false);
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
            const ohlcByNormalized = {};
            for (const [symbol, quote] of Object.entries(allData)) {
                ohlc[symbol] = {
                    open: quote.open || 0,
                    high: quote.high || 0,
                    low: quote.low || 0,
                    close: quote.close || 0,
                };
                ohlcByNormalized[normalizeSymbol(symbol)] = ohlc[symbol];
            }
            ohlcCacheRef.current = ohlc;

            setLivePrices(prev => {
                const updated = { ...prev };
                for (const [normKey, ohlcData] of Object.entries(ohlcByNormalized)) {
                    updated[normKey] = updated[normKey] ? { ...updated[normKey], ...ohlcData } : ohlcData;
                }
                return updated;
            });
        } catch {}
    };

    useEffect(() => {
        if (!api.hasSession()) return;
        fetchOhlcData();
        const ohlcInterval = setInterval(fetchOhlcData, 5000);
        return () => clearInterval(ohlcInterval);
    }, []);

    const fetchKiteMarketData = async () => {
        if (!api.hasSession()) return;
        
        // 1. Initialize map with the 19 standard fallback scripts to prevent array size shrinking or flickering
        const mergedItemsMap = new Map();
        
        const baseMockWatchlistItems = MOCK_WATCHLIST_DATA.map((item, idx) => ({
            id: `kite-mock-${idx}`,
            name: item.name,
            fullSymbol: item.symbol,
            category: item.category,
            exchange: item.exchange,
            type: item.type,
            ltp: String(item.ltp),
            bid: String(Number((item.ltp * 0.9995).toFixed(2))),
            ask: String(Number((item.ltp * 1.0005).toFixed(2))),
            change: String(item.change),
            changePct: String(item.change),
            high: String(Number((item.ltp * 1.02).toFixed(2))),
            low: String(Number((item.ltp * 0.98).toFixed(2))),
            open: String(Number((item.ltp * 0.995).toFixed(2))),
            close: String(Number((item.ltp * 1.005).toFixed(2))),
            volume: '100000',
            oi: '50000',
            strike: item.strike || null,
            optionType: item.optionType || null,
            expiry: null,
            date: new Date().toISOString().split('T')[0],
            lotSize: item.lotSize,
            status: 'active',
        }));

        baseMockWatchlistItems.forEach(item => {
            mergedItemsMap.set(normalizeSymbol(item.name), item);
        });

        const ohlcData = ohlcCacheRef.current;
        const newLivePrices = {};
        let serverSuccess = false;

        // 2. Try fetching from server
        try {
            const rows = await api.getKiteUnifiedWatchlist();
            if (Array.isArray(rows) && rows.length > 0) {
                serverSuccess = true;
                setKiteStatus({ connected: true, error: null, message: 'Connected' });
                setDataError(null);

                // Update standard scripts & append new ones from server
                rows.forEach(row => {
                    const symbol = row.symbol || '';
                    if (!symbol) return;

                    const parts = symbol.split(':');
                    const exchange = parts[0] || 'MCX';
                    const tradingSymbol = parts[1] || symbol;

                    let category = exchange;
                    if (exchange === 'NFO') {
                        category = (row.type === 'NFO_OPT' || row.optionType || row.strike != null) ? 'NFO_OPT' : 'NFO_FUT';
                    } else if (exchange === 'MCX') {
                        category = (row.type === 'MCX_OPT' || row.optionType || row.strike != null) ? 'MCX_OPT' : 'MCX_FUT';
                    }

                    let displayName = (exchange === 'CRYPTO' || exchange === 'FOREX') && row?.name ? row.name : tradingSymbol;
                    const futMatch = tradingSymbol.match(/^([A-Z]+)(\d{1,2}[A-Z]{3}\d{0,2})FUT$/);
                    if (futMatch) {
                        displayName = `${futMatch[1]} ${futMatch[2]}`;
                    } else if (row.strike != null && row.optionType) {
                        displayName = `${tradingSymbol} (${row.strike} ${row.optionType})`;
                    }
                    displayName = displayName.replace(/:/g, '/');
                    const ltp = row.ltp || 0;
                    const changePct = Number(row.change || 0);
                    const symbolOhlc = ohlcData[symbol] || {};

                    const finalHigh = row.high != null ? row.high : (symbolOhlc.high || 0);
                    const finalLow = row.low != null ? row.low : (symbolOhlc.low || 0);
                    const finalOpen = row.open != null ? row.open : (symbolOhlc.open || 0);
                    const finalClose = row.close != null ? row.close : (symbolOhlc.close || 0);

                    const normKey = normalizeSymbol(displayName);
                    const parsedLtp = parseFloat(ltp) || 0;

                    // Save to active server prices cache
                    newLivePrices[normKey] = {
                        ltp: parsedLtp,
                        bid: parseFloat(row.bid) || parsedLtp,
                        ask: parseFloat(row.ask) || parsedLtp,
                        high: parseFloat(finalHigh) || 0,
                        low: parseFloat(finalLow) || 0,
                        open: parseFloat(finalOpen) || 0,
                        close: parseFloat(finalClose) || 0,
                        change: changePct,
                        volume: row.volume || 100000
                    };

                    if (mergedItemsMap.has(normKey)) {
                        const existing = mergedItemsMap.get(normKey);
                        existing.ltp = String(ltp);
                        existing.bid = String(row.bid || ltp);
                        existing.ask = String(row.ask || ltp);
                        existing.change = String(changePct);
                        existing.changePct = String(changePct);
                        existing.high = String(finalHigh);
                        existing.low = String(finalLow);
                        existing.open = String(finalOpen);
                        existing.close = String(finalClose);
                        existing.fullSymbol = symbol;
                    } else {
                        mergedItemsMap.set(normKey, {
                            id: `kite-server-${normKey}`,
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
                    }
                });
            }
        } catch (err) {
            console.warn('⚠️ Server watchlist query offline:', err.message);
        }

        // 2b. If unified Kite watchlist is empty or failed, load fallback watchlist from server
        if (!serverSuccess) {
            try {
                const wl = await api.getWatchlist();
                if (Array.isArray(wl) && wl.length > 0) {
                    serverSuccess = true;
                    wl.forEach(row => {
                        const symbol = row.symbol || row.fullSymbol || '';
                        if (!symbol) return;

                        const parts = symbol.split(':');
                        const exchange = parts[0] || 'MCX';
                        const tradingSymbol = parts[1] || symbol;

                        let category = row.category || exchange;
                        if (exchange === 'NFO') {
                            category = (row.type === 'NFO_OPT' || row.optionType || row.strike != null) ? 'NFO_OPT' : 'NFO_FUT';
                        } else if (exchange === 'MCX') {
                            category = (row.type === 'MCX_OPT' || row.optionType || row.strike != null) ? 'MCX_OPT' : 'MCX_FUT';
                        }

                        let displayName = row.name || tradingSymbol;
                        displayName = displayName.replace(/:/g, '/');

                        const normKey = normalizeSymbol(displayName);
                        const ltp = row.ltp || 0;
                        const changePct = Number(row.change || 0);

                        newLivePrices[normKey] = {
                            ltp: parseFloat(ltp) || 0,
                            bid: parseFloat(row.bid) || parseFloat(ltp) || 0,
                            ask: parseFloat(row.ask) || parseFloat(ltp) || 0,
                            high: parseFloat(row.high) || 0,
                            low: parseFloat(row.low) || 0,
                            open: parseFloat(row.open) || 0,
                            close: parseFloat(row.close) || 0,
                            change: changePct,
                            volume: row.volume || 100000
                        };

                        if (mergedItemsMap.has(normKey)) {
                            const existing = mergedItemsMap.get(normKey);
                            existing.ltp = String(ltp);
                            existing.bid = String(row.bid || ltp);
                            existing.ask = String(row.ask || ltp);
                            existing.change = String(changePct);
                            existing.changePct = String(changePct);
                            existing.high = String(row.high || 0);
                            existing.low = String(row.low || 0);
                            existing.open = String(row.open || 0);
                            existing.close = String(row.close || 0);
                            existing.fullSymbol = symbol;
                        } else {
                            mergedItemsMap.set(normKey, {
                                id: `watchlist-server-${normKey}`,
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
                                high: String(row.high || 0),
                                low: String(row.low || 0),
                                open: String(row.open || 0),
                                close: String(row.close || 0),
                                volume: String(row.volume || 0),
                                oi: String(row.oi || 0),
                                strike: row.strike != null ? String(row.strike) : null,
                                optionType: row.optionType || null,
                                expiry: row.expiry || null,
                                date: row.expiry || new Date().toISOString().split('T')[0],
                                lotSize: row.lotSize || 1,
                                status: 'active',
                            });
                        }
                    });
                }
            } catch (wlErr) {
                console.warn('⚠️ Server fallback watchlist query offline:', wlErr.message);
            }
        }

        // 3. Query extra market segments (Crypto, Forex, etc.) from server if online
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

                const mapExtra = (items, prefix, catName) => {
                    items.forEach(item => {
                        const cleanSym = item.symbol.replace(/:/g, '').toUpperCase();
                        const isMetal = cleanSym === 'XAUUSD' || cleanSym === 'XAGUSD' || cleanSym === 'XAU/USD' || cleanSym === 'XAG/USD';
                        const itemPrefix = isMetal ? 'COMMODITY' : prefix;
                        const itemCat = isMetal ? 'COMMODITY' : catName;

                        let symbol = item.symbol;
                        if (isMetal) {
                            const rawSym = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                            symbol = `COMMODITY:${rawSym}`;
                        } else {
                            symbol = item.symbol.includes(':') ? item.symbol : `${itemPrefix}:${item.symbol}`;
                        }
                        const displayName = (item.name || item.symbol).replace(/:/g, '/');
                        const normKey = normalizeSymbol(displayName);
                        const price = parseFloat(item.ltp || item.price) || 0;
                        const changeVal = parseFloat(item.changePct || item.change) || 0;

                        newLivePrices[normKey] = {
                            ltp: price,
                            bid: parseFloat(item.bid) || price,
                            ask: parseFloat(item.ask) || price,
                            high: parseFloat(item.high) || 0,
                            low: parseFloat(item.low) || 0,
                            open: parseFloat(item.open) || 0,
                            close: parseFloat(item.close) || 0,
                            change: changeVal,
                            volume: parseFloat(item.volume) || 100000
                        };

                        if (mergedItemsMap.has(normKey)) {
                            const existing = mergedItemsMap.get(normKey);
                            existing.ltp = String(price);
                            existing.bid = String(item.bid || price);
                            existing.ask = String(item.ask || price);
                            existing.change = String(changeVal);
                            existing.changePct = String(changeVal);
                            existing.high = String(item.high || 0);
                            existing.low = String(item.low || 0);
                            existing.open = String(item.open || 0);
                            existing.close = String(item.close || 0);
                            existing.category = itemCat;
                            existing.exchange = itemPrefix;
                            existing.type = itemPrefix;
                            if (item.isBanned) existing.isBanned = true;
                        } else {
                            mergedItemsMap.set(normKey, {
                                id: `kite-extra-${normKey}`,
                                name: displayName,
                                fullSymbol: symbol,
                                category: itemCat,
                                exchange: itemPrefix,
                                type: itemPrefix,
                                ltp: String(price),
                                bid: String(item.bid || price),
                                ask: String(item.ask || price),
                                change: String(changeVal),
                                changePct: String(changeVal),
                                high: String(item.high || 0),
                                low: String(item.low || 0),
                                open: String(item.open || 0),
                                close: String(item.close || 0),
                                date: new Date().toISOString().split('T')[0],
                                lotSize: Number(item.lotSize || 1),
                                status: 'active',
                                isBanned: Boolean(item.isBanned)
                            });
                        }
                    });
                };

                for (const [key, value] of mergedItemsMap.entries()) {
                    if (value.category === 'CRYPTO') {
                        mergedItemsMap.delete(key);
                    }
                }
                if (rawCrypto.length > 0) {
                    mapExtra(rawCrypto, 'CRYPTO', 'CRYPTO');
                }

                for (const [key, value] of mergedItemsMap.entries()) {
                    if (value.category === 'FOREX') {
                        mergedItemsMap.delete(key);
                    }
                }
                if (rawForex.length > 0) {
                    mapExtra(rawForex, 'FOREX', 'FOREX');
                }

                for (const [key, value] of mergedItemsMap.entries()) {
                    if (value.category === 'COMMODITY') {
                        mergedItemsMap.delete(key);
                    }
                }
                if (rawCommodity.length > 0) {
                    mapExtra(rawCommodity, 'COMMODITY', 'COMMODITY');
                }
            }
        } catch (extraErr) {
            console.log('ℹ️ Extra market segment fetch error:', extraErr.message);
        }

        // 4. Force offline/demo status if both attempts resulted in no server data
        if (!serverSuccess) {
            setKiteStatus({ connected: false, error: 'API_OFFLINE', message: '⚠️ Demo Mode - Kite API Offline (Showing Simulated Prices)' });
            setDataError('⚠️ Demo Mode - Kite API Offline (Showing Simulated Prices)');
        }

        // 5. Run price fluctuations for all inactive/simulated scripts in the merged map
        mergedItemsMap.forEach(item => {
            const normKey = normalizeSymbol(item.name);
            if (!newLivePrices.hasOwnProperty(normKey)) {
                const currentLtp = parseFloat(item.ltp) || 0;
                const randomChange = (Math.random() - 0.5) * 0.002 * currentLtp;
                const newLtp = Number((currentLtp + randomChange).toFixed(2));
                const baseChange = parseFloat(item.change) || 0;
                const changePct = Number((baseChange + (randomChange / currentLtp) * 100).toFixed(2));

                newLivePrices[normKey] = {
                    ltp: newLtp,
                    bid: Number((newLtp * 0.9995).toFixed(2)),
                    ask: Number((newLtp * 1.0005).toFixed(2)),
                    high: Number((newLtp * 1.02).toFixed(2)),
                    low: Number((newLtp * 0.98).toFixed(2)),
                    open: Number((newLtp * 0.995).toFixed(2)),
                    close: Number((newLtp * 1.005).toFixed(2)),
                    change: changePct,
                    volume: 100000
                };

                item.ltp = String(newLtp);
                item.change = String(changePct);
                item.changePct = String(changePct);
                item.high = String(newLivePrices[normKey].high);
                item.low = String(newLivePrices[normKey].low);
                item.open = String(newLivePrices[normKey].open);
                item.close = String(newLivePrices[normKey].close);
            }
        });

        // 6. Commit merged watchlist array to state to prevent lists resizing or flashing
        const finalWatchlist = Array.from(mergedItemsMap.values());
        setKiteMarketData(finalWatchlist);
        setLivePrices(prev => ({ ...prev, ...newLivePrices }));
        
        if (!kiteLoadedRef.current) {
            kiteLoadedRef.current = true;
        }
    };

    useEffect(() => {
        if (api.hasSession()) {
            fetchInitialData();
        }
    }, []);

    useEffect(() => {
        if (!api.hasSession()) return;
        fetchKiteMarketData();
        const interval = setInterval(fetchKiteMarketData, 5000);
        return () => clearInterval(interval);
    }, []);

    const refreshTrades = async () => {
        if (!api.hasSession()) return;
        try {
            const allTrades = await api.getTrades('');
            if (allTrades && Array.isArray(allTrades)) {
                setTrades(allTrades.filter(t => t.status !== 'DELETED').map(mapApiTrade));
            }
        } catch {}
    };

    useEffect(() => {
        if (!api.hasSession()) return;
        refreshTrades();
        const interval = setInterval(refreshTrades, 5000);
        return () => clearInterval(interval);
    }, []);

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
        } catch {}
    };

    useEffect(() => {
        if (!api.hasSession()) return;
        refreshBalance();
        const interval = setInterval(refreshBalance, 10000);
        return () => clearInterval(interval);
    }, []);

    const refreshAlerts = async () => {
        if (!api.hasSession()) return;
        try {
            const alerts = await api.getAlerts();
            if (alerts) {
                setUserAlerts((Array.isArray(alerts) ? alerts : (alerts.data || [])).map(a => ({
                    ...a,
                    id: a.id.toString(),
                    targetPrice: Number(a.target_price || 0)
                })));
            }
        } catch {}
    };

    useEffect(() => {
        if (!api.hasSession()) return;
        refreshAlerts();
        const interval = setInterval(refreshAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    const globalSearchData = useMemo(() => {
        const indexItems = indices.map(idx => {
            const ltp = Number(idx.ltp) || 0;
            return {
                ...idx,
                id: `index-${idx.name}`,
                fullSymbol: `NSE:${idx.name}`,
                exchange: 'NSE',
                category: 'NSE',
                type: 'INDEX',
                ltp: String(ltp),
                bid: String(ltp),
                ask: String(ltp),
                high: '0', low: '0', open: '0', close: '0', change: '0', changePct: '0'
            };
        });
        return [...indexItems, ...kiteMarketData];
    }, [kiteMarketData, indices]);

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

        try {
            await api.saveUserWatchlist(Array.from(next));
        } catch (err) {
            console.log('Watchlist sync error:', err.message);
        }
    };

    const isPinned = (name) => {
        if (!name || !includedPins || includedPins.size === 0) return false;
        return includedPins.has(name);
    };

    const addUserAlert = async (alert) => {
        try {
            await api.createAlert(alert);
            refreshAlerts();
        } catch (err) {
            console.error('Failed to create alert:', err);
        }
    };

    const removeUserAlert = async (id) => {
        try {
            await api.deleteAlert(id);
            setUserAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Failed to delete alert:', err);
        }
    };

    const resetUserAlert = async (id) => {
        try {
            await api.updateAlertStatus(id, 'active');
            refreshAlerts();
        } catch (err) {
            console.error('Failed to reset alert:', err);
        }
    };

    const updateAlertSetting = async (id, value) => {
        const updated = { ...alertSettings, [id]: value };
        setAlertSettings(updated);
        try {
            await api.updateAlertSettings(updated);
        } catch (err) {
            console.error('Failed to update alert settings:', err);
        }
    };

    const addNotification = (notif) => {
        setNotifications(prev => [{
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...notif
        }, ...prev]);
    };

    const clearNotifications = () => setNotifications([]);
    const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

    const acknowledgeNotification = async (id) => {
        try {
            await api.markNotificationRead(id);
            setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n));
        } catch {}
    };

    const addAdminNotification = (notif) => {
        setAdminNotifications(prev => [{
            id: 'a' + Date.now().toString(),
            acknowledged: false,
            ...notif
        }, ...prev]);
    };

    const unreadAdminCount = adminNotifications.filter(n => !n.acknowledged).length;

    const addWithdrawalRequest = async (formData) => {
        await api.createWithdrawal(formData);
        addNotification({
            title: 'Withdrawal Requested',
            message: `Your request for ₹${formData.amount} has been submitted for admin review.`,
            type: 'info'
        });
        const reqs = await api.getWithdrawals();
        setWithdrawalRequests(reqs);
    };

    const updateWithdrawalStatus = (id, status, remark = '') => {
        setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status, remark } : r));
    };

    return (
        <TradeContext.Provider value={{
            trades,
            addTrade,
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
            marginAvailable: calculatedMarginAvailable,
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
            getDbLotSize,
            dbLotSizes,
            getInstrumentMeta,
            refreshBalance,
            watchlist: kiteMarketData,
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
            userConfig
        }}>
            {children}
            
            {/* Custom Web Success Dialog replacement */}
            {successPopupVisible && (
                <div style={popupStyles.overlay}>
                    <div style={popupStyles.dialog}>
                        <h3 style={popupStyles.title}>{successPopupTitle}</h3>
                        <p style={popupStyles.message}>{successPopupMessage}</p>
                        <button style={popupStyles.button} onClick={() => setSuccessPopupVisible(false)}>OK</button>
                    </div>
                </div>
            )}
        </TradeContext.Provider>
    );
};

const popupStyles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    dialog: {
        backgroundColor: '#111111',
        padding: '24px',
        borderRadius: '12px',
        width: '85%',
        maxWidth: '400px',
        textAlign: 'center',
        border: '1px solid #222'
    },
    title: {
        color: '#10B981',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 12px 0'
    },
    message: {
        color: '#9CA3AF',
        fontSize: '14px',
        margin: '0 0 24px 0',
        lineHeight: '1.5'
    },
    button: {
        backgroundColor: '#10B981',
        color: '#000000',
        border: 'none',
        padding: '10px 24px',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px'
    }
};
