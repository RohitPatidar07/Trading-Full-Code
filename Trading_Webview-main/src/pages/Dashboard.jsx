import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades, normalizeSymbol } from '../context/TradeContext';
import { formatPrice } from '../utils/formatPrice';
import { Search, Bell, Filter, X, ArrowUpDown, TrendingUp, TrendingDown, LayoutList, Plus, Check, Wallet, ClipboardList, ChevronLeft, Trash2, CheckCheck, RefreshCw } from 'lucide-react';
import * as api from '../services/api';
import CuteBot from '../components/CuteBot';
import TickerTape from '../components/TickerTape';
import useResponsive from '../hooks/useResponsive';

const CATEGORIES = ['NFO_FUT', 'NFO_OPT', 'MCX_FUT', 'MCX_OPT', 'CRYPTO', 'FOREX', 'COMMODITY'];
const CAT_COLORS = {
    ALL: '#2196F3',
    NFO_FUT: '#a855f7', // Purple
    NFO_OPT: '#ec4899', // Pink
    MCX_FUT: '#f97316', // Orange
    MCX_OPT: '#ef4444', // Red
    CRYPTO: '#eab308',  // Yellow
    FOREX: '#22c55e',   // Green
    COMMODITY: '#14b8a6' // Teal
};

const CAT_LABEL = {
    NFO_FUT: 'NFO Fut', NFO_OPT: 'NFO Opt',
    MCX_FUT: 'MCX Fut', MCX_OPT: 'MCX Opt',
    CRYPTO: 'Crypto', FOREX: 'Forex', COMMODITY: 'Commodity'
};

const SORT_OPTIONS = [
    { key: 'default', label: 'Default', icon: LayoutList },
    { key: 'name_asc', label: 'Name A-Z', icon: ArrowUpDown },
    { key: 'name_desc', label: 'Name Z-A', icon: ArrowUpDown },
    { key: 'price_high', label: 'Price High→Low', icon: TrendingDown },
    { key: 'price_low', label: 'Price Low→High', icon: TrendingUp },
    { key: 'change_high', label: 'Change High→Low', icon: TrendingDown },
    { key: 'change_low', label: 'Change Low→High', icon: TrendingUp },
];

const formatSymbolName = (name) => {
    if (!name) return '';
    const cleanName = name.replace(/\s*\([^)]*\)/g, '').trim();
    const optMatch = cleanName.match(/^(.*?)(?:\d{2}[A-Z]{3}|\d{6}|\d{5})?(\d+)([CP]E)$/i);
    if (optMatch) {
        return `${optMatch[1]} ${optMatch[2]} ${optMatch[3].toUpperCase()}`;
    }
    const futMatch = cleanName.match(/^(.*?)(?:\d{2}[A-Z]{3}|\d{6}|\d{5})?FUT$/i);
    if (futMatch) {
        return `${futMatch[1]} FUT`;
    }
    return cleanName;
};

const formatExpiryDate = (dateStr) => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const year = match[1];
        const month = months[parseInt(match[2], 10) - 1] || match[2];
        const day = parseInt(match[3], 10);
        return `${day} ${month} ${year}`;
    }
    return dateStr;
};

const parsePriceVal = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/[^0-9.-]/g, '')) || 0;
};

const FlashingPriceBox = React.memo(({ value, baseStyle, defaultColor }) => {
    const prevValueRef = useRef(value);
    const [flashDir, setFlashDir] = useState(null); // 'up', 'down', null

    useEffect(() => {
        const current = parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;
        const prev = parseFloat(prevValueRef.current.toString().replace(/[^0-9.]/g, '')) || 0;

        if (current !== prev && prev !== 0) {
            const dir = current > prev ? 'up' : 'down';
            setFlashDir(dir);
            const timer = setTimeout(() => setFlashDir(null), 500);
            prevValueRef.current = current;
            return () => clearTimeout(timer);
        }
        prevValueRef.current = current;
    }, [value]);

    let backgroundColor = defaultColor;
    let textColor = baseStyle.color || '#ffffff';
    let fontWeight = baseStyle.fontWeight || 'bold';

    if (flashDir === 'up') {
        backgroundColor = '#22C55E'; // Green flash
        textColor = '#ffffff'; // High contrast white
        fontWeight = '900'; // Ultra-bold
    } else if (flashDir === 'down') {
        backgroundColor = '#EF4444'; // Red flash
        textColor = '#ffffff'; // High contrast white
        fontWeight = '900'; // Ultra-bold
    }

    return (
        <div style={{
            ...baseStyle,
            backgroundColor,
            color: textColor,
            fontWeight,
            transition: 'all 0.25s ease',
            transform: flashDir ? 'scale(1.08)' : 'scale(1)',
            textShadow: flashDir ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
        }}>
            {value}
        </div>
    );
});

const WatchlistRow = React.memo(({
    item,
    bid,
    ask,
    change,
    high,
    low,
    open,
    onClick,
    styles
}) => {
    return (
        <tr style={styles.tr} onClick={onClick}>
            <td style={styles.tdLeft}>
                <div style={styles.tableSymbolName}>
                    {formatSymbolName(item.name)}
                    {item.isBanned && (
                        <span style={{
                            backgroundColor: '#EF4444',
                            color: '#ffffff',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            marginLeft: '6px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                        }}>
                            BANNED
                        </span>
                    )}
                </div>
                <div style={styles.tableSubText}>
                    {item.expiry || item.date ? `${item.expiry || item.date} • ` : ''}
                    Lot:{item.lotSize || item.lot_size || 1}
                </div>
            </td>
            <td style={styles.tdRight}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{
                        color: change >= 0 ? '#4CAF50' : '#EF5350',
                        fontSize: '13px',
                        fontWeight: 'bold'
                    }}>
                        Chg: {change.toFixed(2)}
                    </span>
                    <span style={styles.tableBoxLabel}>H: {Number(high || 0)}</span>
                </div>
            </td>
            <td style={styles.tdCenter}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FlashingPriceBox value={formatPrice(bid)} baseStyle={styles.tableBidBox} defaultColor="#2E7D32" />
                    <span style={styles.tableBoxLabel}>L: {formatPrice(low || 0)}</span>
                </div>
            </td>
            <td style={styles.tdCenter}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FlashingPriceBox value={formatPrice(ask)} baseStyle={styles.tableAskBox} defaultColor="#C62828" />
                    <span style={styles.tableBoxLabel}>O: {formatPrice(open || 0)}</span>
                </div>
            </td>
        </tr>
    );
});

const SearchRow = React.memo(({
    item,
    isPinned,
    bid,
    ask,
    change,
    high,
    low,
    open,
    onToggle,
    styles
}) => {
    return (
        <tr 
            style={{ 
                ...styles.tr, 
                ...(isPinned ? { backgroundColor: 'rgba(76, 175, 80, 0.04)' } : {}) 
            }}
            onClick={onToggle}
        >
            <td style={styles.tdLeft}>
                <div style={styles.tableSymbolName}>
                    {formatSymbolName(item.name)}
                    {item.isBanned && (
                        <span style={{
                            backgroundColor: '#EF4444',
                            color: '#ffffff',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            marginLeft: '6px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                        }}>
                            BANNED
                        </span>
                    )}
                </div>
                <div style={styles.tableSubText}>
                    {item.expiry || item.date ? `${item.expiry || item.date} • ` : ''}
                    Lot:{item.lotSize || item.lot_size || 1}
                </div>
            </td>
            <td style={styles.tdRight}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ 
                        color: change >= 0 ? '#4CAF50' : '#EF5350', 
                        fontSize: '13px', 
                        fontWeight: 'bold' 
                    }}>
                        Chg: {change.toFixed(2)}
                    </span>
                    <span style={styles.tableBoxLabel}>H: {Number(high || 0)}</span>
                </div>
            </td>
            <td style={styles.tdCenter}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FlashingPriceBox value={formatPrice(bid)} baseStyle={styles.tableBidBox} defaultColor="#2E7D32" />
                    <span style={styles.tableBoxLabel}>L: {formatPrice(low || 0)}</span>
                </div>
            </td>
            <td style={styles.tdCenter}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FlashingPriceBox value={formatPrice(ask)} baseStyle={styles.tableAskBox} defaultColor="#C62828" />
                    <span style={styles.tableBoxLabel}>O: {formatPrice(open || 0)}</span>
                </div>
            </td>
            <td style={styles.tdCenter}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{
                        ...styles.checkbox,
                        margin: 0,
                        backgroundColor: isPinned ? '#4CAF50' : 'transparent',
                        borderColor: isPinned ? '#4CAF50' : 'rgba(255,255,255,0.35)'
                    }}>
                        {isPinned && <Check size={11} color="#ffffff" strokeWidth={4} />}
                    </div>
                </div>
            </td>
        </tr>
    );
});

export default function Dashboard() {
    const navigate = useNavigate();
    const { isMobile, isTablet } = useResponsive();
    const {
        watchlist,
        globalSearchData,
        livePrices,
        includedPins,
        isPinned,
        toggleWatchlist,
        unreadAdminCount,
        adminNotifications,
        acknowledgeNotification,
        notifications,
        clearNotifications,
        removeNotification,
        fetchInitialData,
        dataError
    } = useTrades();

    const [selectedCategory, setSelectedCategory] = useState(() => {
        return localStorage.getItem('vtrkm_dashboard_selected_category') || 'NFO_FUT';
    });
    const [prevCategory, setPrevCategory] = useState(() => {
        return localStorage.getItem('vtrkm_dashboard_selected_category') || 'NFO_FUT';
    }); // store category before search

    useEffect(() => {
        localStorage.setItem('vtrkm_dashboard_selected_category', selectedCategory);
    }, [selectedCategory]);
    const [sortBy, setSortBy] = useState('default');
    const [showSortModal, setShowSortModal] = useState(false);
    const [showPromo, setShowPromo] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTab, setSearchTab] = useState('ALL');
    const [isSearching, setIsSearching] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifActiveTab, setNotifActiveTab] = useState('admin'); // 'admin' | 'system'

    // Initial load sync
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Promo banner trigger for unacknowledged notifications
    useEffect(() => {
        const unack = adminNotifications.find(n => !n.acknowledged);
        if (unack) {
            const timer = setTimeout(() => {
                setShowPromo(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [adminNotifications]);

    const handleAcknowledge = () => {
        const unacknowledged = adminNotifications.find(n => !n.acknowledged);
        if (unacknowledged) {
            acknowledgeNotification(unacknowledged.id);
        }
        setShowPromo(false);
    };

    // Helper: categorize item to a tab — matches app SearchScreen.js exactly
    const getItemTab = (item) => {
        const name = String(item.name || '').toUpperCase();
        if (name === 'XAU/USD' || name === 'XAG/USD' || name === 'XAUUSD' || name === 'XAGUSD') {
            return 'COMMODITY';
        }
        const sym = (item.symbol || item.fullSymbol || '').toUpperCase();
        if (sym.startsWith('CRYPTO:')) return 'CRYPTO';
        if (sym.startsWith('FOREX:')) return 'FOREX';
        if (sym.startsWith('COMMODITY:')) return 'COMMODITY';
        if (sym.startsWith('NSE:')) return 'NSE';

        const type = String(item.type || '').toUpperCase();
        if (sym.startsWith('NFO:')) {
            if (type === 'FUT' || type === 'FUTIDX' || type === 'FUTSTK') return 'NFO_FUT';
            if (type === 'NFO_OPT' || type === 'OPT' || type === 'OPTIDX' || type === 'OPTSTK') return 'NFO_OPT';
            return (item.strike != null || item.optionType) ? 'NFO_OPT' : 'NFO_FUT';
        }
        if (sym.startsWith('MCX:')) {
            if (type === 'MCX_FUT' || type === 'FUTCOM') return 'MCX_FUT';
            if (type === 'MCX_OPT' || type === 'OPTCOM') return 'MCX_OPT';
            return (item.strike != null || item.optionType) ? 'MCX_OPT' : 'MCX_FUT';
        }

        // Fallbacks using category/exchange fields
        const cat = (item.category || item.exchange || '').toUpperCase();
        if (cat === 'CRYPTO') return 'CRYPTO';
        if (cat === 'FOREX') return 'FOREX';
        if (cat === 'COMMODITY') return 'COMMODITY';
        if (cat === 'NFO_FUT') return 'NFO_FUT';
        if (cat === 'NFO_OPT') return 'NFO_OPT';
        if (cat === 'MCX_FUT') return 'MCX_FUT';
        if (cat === 'MCX_OPT') return 'MCX_OPT';
        return 'OTHER';
    };

    // Reset search text when tab changes — matches app behavior
    useEffect(() => {
        setSearchQuery('');
    }, [selectedCategory]);

    // Filter categories to ONLY include categories that have scrips (items) available for this user
    const activeCategories = useMemo(() => {
        if (!globalSearchData || globalSearchData.length === 0) return CATEGORIES;
        const list = CATEGORIES.filter(cat => {
            return globalSearchData.some(item => getItemTab(item) === cat);
        });
        return list.length > 0 ? list : CATEGORIES;
    }, [globalSearchData]);

    useEffect(() => {
        if (activeCategories.length > 0 && !activeCategories.includes(selectedCategory)) {
            setSelectedCategory(activeCategories[0]);
        }
    }, [activeCategories]);

    // Count ALL available items per tab — always from full list, never filtered by search
    const searchCounts = useMemo(() => {
        const counts = {};
        ['ALL', ...CATEGORIES].forEach(tab => { counts[tab] = 0; });
        globalSearchData.forEach(item => {
            const tab = getItemTab(item);
            if (tab && tab !== 'NSE' && tab !== 'OTHER' && counts[tab] !== undefined) {
                counts[tab]++;
                counts['ALL']++;
            }
        });
        return counts;
    }, [globalSearchData]);

    // Count pinned items per tab — for the badge numbers
    const pinnedCounts = useMemo(() => {
        const counts = {};
        ['ALL', ...CATEGORIES].forEach(tab => { counts[tab] = 0; });
        globalSearchData.forEach(item => {
            if (!includedPins.has(item.name)) return;
            const tab = getItemTab(item);
            if (tab && tab !== 'NSE' && tab !== 'OTHER' && counts[tab] !== undefined) {
                counts[tab]++;
                counts['ALL']++;
            }
        });
        return counts;
    }, [globalSearchData, includedPins]);

    // The main display list — matches app SearchScreen.js filteredData exactly
    const displayList = useMemo(() => {
        const q = searchQuery.trim().toLowerCase().replace(/\s+/g, '');

        let items = [];
        if (searchTab === 'ALL') {
            items = globalSearchData.filter(item => {
                const tab = getItemTab(item);
                return tab && tab !== 'NSE' && tab !== 'OTHER';
            });
        } else {
            items = globalSearchData.filter(item => getItemTab(item) === searchTab);
        }

        if (q.length >= 1) {
            items = items.filter(item => {
                const name = (item.name || '').toLowerCase().replace(/\s+/g, '');
                const symbol = (item.symbol || item.fullSymbol || '').toLowerCase().replace(/\s+/g, '');
                const symbolWithoutExchange = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                const strike = item.strike != null ? String(item.strike).toLowerCase().replace(/\s+/g, '') : '';
                const optionType = (item.optionType || '').toLowerCase().replace(/\s+/g, '');
                const expiry = (item.expiry || item.date || '').toLowerCase().replace(/[-]/g, '').replace(/\s+/g, '');

                if (name.includes(q) || symbol.includes(q) || symbolWithoutExchange.includes(q)) return true;

                const combined = `${name}${strike}${optionType}${expiry}`.toLowerCase();
                if (combined.includes(q)) return true;

                // Multi-word search
                const parts = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
                if (parts.length > 1) {
                    return parts.every(part =>
                        name.includes(part) ||
                        symbol.includes(part) ||
                        symbolWithoutExchange.includes(part) ||
                        strike.includes(part) ||
                        optionType.includes(part) ||
                        expiry.includes(part)
                    );
                }

                return false;
            });

            // Sort: items starting with query first, then alphabetically
            items.sort((a, b) => {
                const aName = (a.name || '').toLowerCase().replace(/\s+/g, '');
                const bName = (b.name || '').toLowerCase().replace(/\s+/g, '');
                const aSymbol = (a.symbol || a.fullSymbol || '').toLowerCase().replace(/\s+/g, '');
                const bSymbol = (b.symbol || b.fullSymbol || '').toLowerCase().replace(/\s+/g, '');
                const aSymbolOnly = aSymbol.includes(':') ? aSymbol.split(':')[1] : aSymbol;
                const bSymbolOnly = bSymbol.includes(':') ? bSymbol.split(':')[1] : bSymbol;

                const aStartsWith = aName.startsWith(q) || aSymbolOnly.startsWith(q);
                const bStartsWith = bName.startsWith(q) || bSymbolOnly.startsWith(q);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                return aName.localeCompare(bName);
            });
        } else {
            items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return items;
    }, [globalSearchData, searchTab, searchQuery]);

    const allWatchlistItems = useMemo(() => {
        return globalSearchData && globalSearchData.length > 0 ? globalSearchData : (watchlist || []);
    }, [globalSearchData, watchlist]);

    // ── Watchlist view data (pinned items only, per category) ──
    const filteredWatchlist = useMemo(() => {
        let items = allWatchlistItems.filter(item => {
            const matchesCat = getItemTab(item) === selectedCategory;
            const isIncluded = isPinned(item.name);
            return matchesCat && isIncluded;
        });

        if (sortBy !== 'default') {
            return [...items].sort((a, b) => {
                const normA = normalizeSymbol(a.name);
                const ltpA = parsePriceVal(livePrices[normA]?.ltp || a.ltp || 0);
                const normB = normalizeSymbol(b.name);
                const ltpB = parsePriceVal(livePrices[normB]?.ltp || b.fullSymbol || b.ltp || 0);
                const changeA = parsePriceVal(livePrices[normA]?.change || a.change || 0);
                const changeB = parsePriceVal(livePrices[normB]?.change || b.change || 0);
                switch (sortBy) {
                    case 'name_asc': return (a.name || '').localeCompare(b.name || '');
                    case 'name_desc': return (b.name || '').localeCompare(a.name || '');
                    case 'price_high': return ltpB - ltpA;
                    case 'price_low': return ltpA - ltpB;
                    case 'change_high': return changeB - changeA;
                    case 'change_low': return changeA - changeB;
                    default: return 0;
                }
            });
        }
        return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [allWatchlistItems, selectedCategory, sortBy, isPinned, livePrices]);

    // Watchlist pinned counts per category (for Dashboard tabs)
    const watchlistCounts = useMemo(() => {
        const c = {};
        CATEGORIES.forEach(cat => {
            c[cat] = allWatchlistItems.filter(item =>
                getItemTab(item) === cat && isPinned(item.name)
            ).length;
        });
        return c;
    }, [allWatchlistItems, isPinned]);

    return (
        <div style={{ ...styles.container, paddingBottom: '90px' }}>
            <div style={styles.contentWrapper}>

                {/* ════════════════════════════════════════ */}
                {/* ── VIEW 1: DASHBOARD / WATCHLIST ────── */}
                {/* ════════════════════════════════════════ */}
                {!isSearching && (
                    <>
                        {/* Header */}
                        <header style={styles.header}>
                            <div style={styles.headerTitleRow}>
                                <button onClick={() => navigate('/ai-assistant')} style={styles.botWrapper}>
                                    <CuteBot size={34} />
                                </button>
                                <div style={styles.headerTitleCol}>
                                    <h2 style={styles.headerTitle}>WATCHLIST</h2>
                                    <span style={styles.headerSubtitle}>
                                        {filteredWatchlist.length} {CAT_LABEL[selectedCategory]?.toUpperCase()} ITEMS
                                    </span>
                                </div>
                                <div style={styles.headerActions}>
                                    <button onClick={() => navigate('/account/funds')} style={styles.actionBtnCircle} title="Funds">
                                        <Wallet size={16} color="#ffffff" />
                                    </button>
                                    <button onClick={() => setShowNotifications(true)} style={styles.actionBtnCircle} title="Notifications">
                                        <div style={styles.bellWrapper}>
                                            <Bell size={16} color="#ffffff" />
                                            {unreadAdminCount > 0 && <span style={styles.badgeCount}>{unreadAdminCount}</span>}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </header>

                        <TickerTape />

                        {/* Search bar placeholder */}
                        <div style={styles.searchBarRow}>
                            <div onClick={() => { setPrevCategory(selectedCategory); setIsSearching(true); }} style={{ flex: 1, height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.07)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid rgba(255, 255, 255, 0.08)', cursor: 'pointer' }}>
                                <Search size={18} color="#9E9E9E" style={{ marginRight: '8px' }} />
                                <span style={styles.searchPlaceholder}>Search & Add</span>
                            </div>
                            <button onClick={() => setShowSortModal(true)} style={{ ...styles.filterBtn, marginLeft: '12px' }}>
                                <Filter size={18} color={sortBy !== 'default' ? '#2196F3' : '#9E9E9E'} />
                            </button>
                        </div>

                        {/* Category tabs (NO "All" tab — matches app) */}
                        <div style={{
                            ...styles.tabsContainer,
                            backgroundColor: 'rgba(4, 6, 16, 0.65)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            padding: '4px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            {activeCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        ...styles.tabItem,
                                        ...(selectedCategory === cat ? { ...styles.activeTab, borderBottomColor: CAT_COLORS[cat] } : {})
                                    }}
                                >
                                    <span style={{ ...styles.tabLabelText, color: selectedCategory === cat ? '#ffffff' : '#8e9aa8' }}>{CAT_LABEL[cat]}</span>
                                    <span style={{
                                        ...styles.tabCountText,
                                        color: selectedCategory === cat ? CAT_COLORS[cat] : '#556677'
                                    }}>({watchlistCounts[cat] || 0})</span>
                                </button>
                            ))}
                        </div>

                        {/* Pinned Watchlist items */}

                        {/* Watchlist — pinned items only */}
                        <main style={styles.mainContent}>
                            {filteredWatchlist.length === 0 ? (
                                <div style={styles.emptyWatchlist}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                                    <h3 style={styles.emptyTitle}>
                                        No {CAT_LABEL[selectedCategory]} items in watchlist
                                    </h3>
                                    <p style={styles.emptySubtitle}>
                                        Use Search to add {CAT_LABEL[selectedCategory]} instruments
                                    </p>
                                    <button onClick={() => setIsSearching(true)} style={styles.blueSearchBtn}>
                                        ＋ Search & Add
                                    </button>
                                </div>
                            ) : (
                                <div style={styles.tableContainer}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.thLeft}>Symbol</th>
                                                <th style={styles.thChange}>Change</th>
                                                <th style={styles.thBidAsk}>Bid</th>
                                                <th style={styles.thBidAsk}>Ask</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredWatchlist.map(item => {
                                                const normKey = normalizeSymbol(item.name);
                                                const liveQuote = livePrices[normKey] || {};
                                                const ltp = liveQuote.ltp || parseFloat(item.ltp) || 0;
                                                const bid = liveQuote.bid || parseFloat(item.bid) || ltp;
                                                const ask = liveQuote.ask || parseFloat(item.ask) || ltp;
                                                const change = liveQuote.change !== undefined ? parseFloat(liveQuote.change) : (parseFloat(item.change) || 0);
                                                const high = liveQuote.high || parseFloat(item.high) || 0;
                                                const low = liveQuote.low || parseFloat(item.low) || 0;
                                                const open = liveQuote.open || parseFloat(item.open) || 0;

                                                return (
                                                    <WatchlistRow
                                                        key={item.id}
                                                        item={item}
                                                        bid={bid}
                                                        ask={ask}
                                                        change={change}
                                                        high={high}
                                                        low={low}
                                                        open={open}
                                                        onClick={() => navigate(`/order/${encodeURIComponent(item.name)}`, { state: { item } })}
                                                        styles={styles}
                                                    />
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </main>
                    </>
                )}

                {/* ════════════════════════════════════════ */}
                {/* ── VIEW 2: SEARCH SCREEN ─────────────── */}
                {/* ════════════════════════════════════════ */}
                {isSearching && (
                    <>
                        {/* Search header */}
                        <header style={styles.header}>
                            <div style={styles.searchBarRow}>
                                <button style={styles.backBtn} onClick={() => { setSelectedCategory(prevCategory); setIsSearching(false); setSearchQuery(''); setSearchTab('ALL'); }}>
                                    <ChevronLeft size={24} color="white" />
                                </button>
                                <div style={styles.searchBarInputInline}>
                                    <Search size={15} color="rgba(255,255,255,0.5)" style={{ marginRight: '8px', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        placeholder={`Search in ${searchTab === 'ALL' ? 'All' : CAT_LABEL[searchTab]}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#ffffff', outline: 'none', fontSize: '15px', fontWeight: '500' }}
                                        autoFocus
                                    />
                                    {searchQuery.length > 0 && (
                                        <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                                    )}
                                </div>
                            </div>

                            {/* Search tabs WITH "All" tab */}
                            <div style={styles.tabsContainer}>
                                <button
                                    onClick={() => setSearchTab('ALL')}
                                    style={{ ...styles.tabItem, ...(searchTab === 'ALL' ? { ...styles.activeTab, borderBottomColor: CAT_COLORS.ALL } : {}) }}
                                >
                                    <span style={{ ...styles.tabLabelText, color: searchTab === 'ALL' ? '#ffffff' : '#556677' }}>All</span>
                                    <div style={{ ...styles.tabBadgeRow, marginTop: '2px' }}>
                                        <span style={{ ...styles.tabCountText, color: searchTab === 'ALL' ? CAT_COLORS.ALL : '#556677' }}>({searchCounts['ALL']})</span>
                                        {pinnedCounts['ALL'] > 0 && <span style={{ ...styles.badgeBlue, backgroundColor: CAT_COLORS.ALL }}>{pinnedCounts['ALL']}</span>}
                                    </div>
                                </button>
                                {activeCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSearchTab(cat)}
                                        style={{ ...styles.tabItem, ...(searchTab === cat ? { ...styles.activeTab, borderBottomColor: CAT_COLORS[cat] } : {}) }}
                                    >
                                        <span style={{ ...styles.tabLabelText, color: searchTab === cat ? '#ffffff' : '#556677' }}>{CAT_LABEL[cat]}</span>
                                        <div style={{ ...styles.tabBadgeRow, marginTop: '2px' }}>
                                            <span style={{ ...styles.tabCountText, color: searchTab === cat ? CAT_COLORS[cat] : '#556677' }}>({searchCounts[cat] || 0})</span>
                                            {pinnedCounts[cat] > 0 && <span style={{ ...styles.badgeBlue, backgroundColor: CAT_COLORS[cat] }}>{pinnedCounts[cat]}</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </header>

                        {/* Info bar */}
                        <div style={{ ...styles.subHeaderInfo, borderLeft: `4px solid ${CAT_COLORS[searchTab] || CAT_COLORS.ALL}` }}>
                            <span style={styles.subHeaderText}>
                                {displayList.length} {searchTab === 'ALL' ? 'All' : CAT_LABEL[searchTab]} instruments
                                {searchQuery.trim() ? ` found for "${searchQuery}"` : ''}
                                {'  \u00b7  '}Tap to add / remove from watchlist
                            </span>
                        </div>

                        {/* Search results list */}
                        <main style={styles.mainContent}>
                            {displayList.length === 0 ? (
                                <div style={styles.emptyWatchlist}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                                        {searchQuery ? '🔍' : '📭'}
                                    </div>
                                    <h3 style={styles.emptyTitle}>
                                        {searchQuery
                                            ? `No results for "${searchQuery}"`
                                            : `No ${searchTab === 'ALL' ? '' : CAT_LABEL[searchTab] + ' '}data`}
                                    </h3>
                                    <p style={styles.emptySubtitle}>
                                        {searchQuery ? 'Try a different search term' : 'Market data will load shortly'}
                                    </p>
                                </div>
                            ) : (
                                <div style={styles.tableContainer}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.thLeft}>Symbol</th>
                                                <th style={styles.thChange}>Change</th>
                                                <th style={styles.thBidAsk}>Bid</th>
                                                <th style={styles.thBidAsk}>Ask</th>
                                                <th style={styles.thBidAsk}>Add</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayList.map(item => {
                                                const normKey = normalizeSymbol(item.name);
                                                const liveQuote = livePrices[normKey] || {};
                                                const ltp = liveQuote.ltp || parseFloat(item.ltp) || 0;
                                                const bid = liveQuote.bid || parseFloat(item.bid) || ltp;
                                                const ask = liveQuote.ask || parseFloat(item.ask) || ltp;
                                                const change = liveQuote.change !== undefined ? parseFloat(liveQuote.change) : (parseFloat(item.change) || 0);
                                                const high = liveQuote.high || parseFloat(item.high) || 0;
                                                const low = liveQuote.low || parseFloat(item.low) || 0;
                                                const open = liveQuote.open || parseFloat(item.open) || 0;
                                                const isPinned = includedPins.has(item.name);

                                                return (
                                                    <SearchRow
                                                        key={item.id}
                                                        item={item}
                                                        isPinned={isPinned}
                                                        bid={bid}
                                                        ask={ask}
                                                        change={change}
                                                        high={high}
                                                        low={low}
                                                        open={open}
                                                        onToggle={() => toggleWatchlist(item)}
                                                        styles={styles}
                                                    />
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </main>
                    </>
                )}



                {/* Notifications Modal overlay */}
                {showNotifications && (
                    <div style={styles.notificationsOverlay}>
                        <div style={styles.notificationsContent}>
                            <div style={styles.notificationsHeader}>
                                <button onClick={() => setShowNotifications(false)} style={{ ...styles.closeModalBtn, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <ChevronLeft size={24} color="#ffffff" />
                                </button>
                                <h3 style={{ ...styles.modalTitle, fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#ffffff', margin: 0 }}>NOTIFICATIONS</h3>
                                {notifActiveTab === 'system' && notifications.length > 0 ? (
                                    <button onClick={clearNotifications} style={styles.clearBtnText}>
                                        Clear All
                                    </button>
                                ) : (
                                    <div style={{ width: '60px' }} />
                                )}
                            </div>

                            {/* Tabs */}
                            <div style={styles.notifTabBar}>
                                <button
                                    onClick={() => setNotifActiveTab('admin')}
                                    style={{
                                        ...styles.notifTabItem,
                                        ...(notifActiveTab === 'admin' ? styles.notifTabActive : styles.notifTabInactive)
                                    }}
                                >
                                    Admin Messages
                                </button>
                                <button
                                    onClick={() => setNotifActiveTab('system')}
                                    style={{
                                        ...styles.notifTabItem,
                                        ...(notifActiveTab === 'system' ? styles.notifTabActive : styles.notifTabInactive)
                                    }}
                                >
                                    System Alerts
                                </button>
                            </div>

                            {/* Content List */}
                            <div style={styles.notificationList}>
                                {notifActiveTab === 'admin' ? (
                                    adminNotifications.length === 0 ? (
                                        <div style={styles.emptyNotifBox}>
                                            <Bell size={55} color="rgba(255,255,255,0.15)" />
                                            <div style={styles.emptyNotifText}>No admin messages</div>
                                        </div>
                                    ) : (
                                        adminNotifications.map(item => (
                                            <div key={item.id} style={{
                                                ...styles.adminNotifCard,
                                                ...(item.acknowledged ? styles.adminNotifCardAck : {})
                                            }}>
                                                <div style={styles.adminNotifHeader}>
                                                    <div style={styles.adminNotifHeaderLeft}>
                                                        <div style={{
                                                            ...styles.adminNotifIconCircle,
                                                            ...(item.acknowledged ? styles.adminNotifIconCircleAck : {})
                                                        }}>
                                                            <Bell size={16} color={item.acknowledged ? '#597895' : '#63B3ED'} />
                                                        </div>
                                                        <div>
                                                            <div style={{
                                                                ...styles.adminNotifTitle,
                                                                ...(item.acknowledged ? styles.adminNotifTitleAck : {})
                                                            }}>{item.title}</div>
                                                            <div style={styles.adminNotifTime}>{item.time}</div>
                                                        </div>
                                                    </div>
                                                    <div style={styles.adminNotifTickBox}>
                                                        {item.acknowledged ? (
                                                            <CheckCheck size={20} color="#63B3ED" />
                                                        ) : (
                                                            <Check size={20} color="rgba(255,255,255,0.35)" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    ...styles.adminNotifMsg,
                                                    ...(item.acknowledged ? styles.adminNotifMsgAck : {})
                                                }}>{item.message}</div>

                                                {!item.acknowledged ? (
                                                    <button
                                                        onClick={() => acknowledgeNotification(item.id)}
                                                        style={styles.adminNotifAckBtn}
                                                    >
                                                        <CheckCheck size={15} color="#1a1a2e" style={{ marginRight: '6px' }} />
                                                        Acknowledge
                                                    </button>
                                                ) : (
                                                    <div style={styles.adminNotifAckDone}>
                                                        <CheckCheck size={14} color="#63B3ED" style={{ marginRight: '5px' }} />
                                                        Acknowledged
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )
                                ) : (
                                    notifications.length === 0 ? (
                                        <div style={styles.emptyNotifBox}>
                                            <Bell size={55} color="rgba(255,255,255,0.15)" />
                                            <div style={styles.emptyNotifText}>No system alerts</div>
                                        </div>
                                    ) : (
                                        notifications.map(item => {
                                            const isMarketClosed = item.title?.toLowerCase().includes('market closed');
                                            return (
                                                <div key={item.id} style={styles.sysNotifCard}>
                                                    <div style={styles.sysNotifLeft}>
                                                        <div style={styles.sysNotifIconCircle}>
                                                            <Bell size={18} color="#63B3ED" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={styles.sysNotifHeaderRow}>
                                                                <div style={styles.sysNotifTitleContainer}>
                                                                    {isMarketClosed && <span style={styles.sysNotifBullet}>●</span>}
                                                                    <span style={styles.sysNotifTitle}>{item.title}</span>
                                                                </div>
                                                                <span style={styles.sysNotifTime}>{item.time}</span>
                                                            </div>
                                                            <div style={styles.sysNotifMsg}>{item.message}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeNotification(item.id)} style={styles.sysNotifDeleteBtn}>
                                                        <Trash2 size={16} color="rgba(255,255,255,0.25)" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sort Modal overlay */}
                {showSortModal && (
                    <div style={styles.sortModalOverlay} onClick={() => setShowSortModal(false)}>
                        <div style={styles.sortModal} onClick={e => e.stopPropagation()}>
                            <div style={styles.sortHeader}>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#ECEFF1', letterSpacing: '0.3px' }}>Sort & Filter</h3>
                                <button onClick={() => setShowSortModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0BEC5', display: 'flex', alignItems: 'center' }}>
                                    <X size={22} />
                                </button>
                            </div>
                            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: '6px' }} />
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => { setSortBy(opt.key); setShowSortModal(false); }}
                                    style={{
                                        ...styles.sortOptionItem,
                                        backgroundColor: sortBy === opt.key ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                                        color: sortBy === opt.key ? '#2196F3' : '#B0BEC5'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <opt.icon size={18} color={sortBy === opt.key ? '#2196F3' : '#78909C'} />
                                        <span style={{ fontWeight: '600' }}>{opt.label}</span>
                                    </div>
                                    {sortBy === opt.key && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: '#2196F3'
                                        }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Promo / Admin Alert Modal on Start */}
                {showPromo && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.promoDialog}>
                            <h3 style={styles.promoTitle}>
                                {adminNotifications.find(n => !n.acknowledged)?.title || 'Admin Alert'}
                            </h3>
                            <p style={styles.promoText}>
                                {adminNotifications.find(n => !n.acknowledged)?.message || ''}
                            </p>
                            <button onClick={handleAcknowledge} style={styles.promoBtn}>Acknowledge</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    backBtn: {
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px 0 0',
        cursor: 'pointer',
    },
    searchBarInputInline: {
        flex: 1,
        height: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
    },
    tabBadgeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    badgeBlue: {
        backgroundColor: '#2196F3',
        color: '#ffffff',
        fontSize: '10px',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '10px',
    },
    subHeaderInfo: {
        backgroundColor: 'rgba(15, 28, 36, 0.7)',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    subHeaderText: {
        color: '#8aa0b5',
        fontSize: '12px',
        fontWeight: '500',
    },
    subInfoText: {
        color: '#a0b0c0',
        fontSize: '11px',
        marginTop: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    checkboxContainer: {
        marginLeft: '14px',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        border: '2px solid',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'transparent',
        paddingBottom: '80px',
    },
    contentWrapper: {
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        paddingBottom: '0',
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: 'rgba(8, 10, 22, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },
    headerTitleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    botWrapper: {
        width: '42px',
        height: '42px',
        borderRadius: '21px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1.5px solid rgba(126, 87, 240, 0.3)',
        cursor: 'pointer',
        boxShadow: '0 0 10px rgba(126, 87, 240, 0.2)',
    },
    headerTitleCol: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: '17px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '1px',
    },
    headerSubtitle: {
        fontSize: '10px',
        color: '#2196F3',
        fontWeight: 'bold',
        marginTop: '2px',
        letterSpacing: '0.5px',
    },
    headerActions: {
        display: 'flex',
        gap: '10px',
    },
    actionBtnCircle: {
        width: '36px',
        height: '36px',
        borderRadius: '18px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
    bellWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeCount: {
        position: 'absolute',
        top: '-7px',
        right: '-7px',
        backgroundColor: '#EF4444',
        color: '#ffffff',
        fontSize: '8px',
        fontWeight: 'bold',
        borderRadius: '50%',
        width: '13px',
        height: '13px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        display: 'flex',
        overflowX: 'auto',
        gap: '8px',
        justifyContent: 'space-between',
        paddingBottom: '2px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    },
    tabItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px 8px 12px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#b8c5d6',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        borderBottom: '3px solid transparent',
        flex: '1 0 auto',
    },
    tabLabelText: {
        fontSize: '13px',
        fontWeight: '600',
    },
    tabCountText: {
        fontSize: '10px',
        fontWeight: 'bold',
        marginTop: '2px',
    },
    activeTab: {
        color: '#ffffff',
        borderBottom: '3px solid #2196F3',
    },
    searchBarRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        gap: '12px',
    },
    searchBarInput: {
        flex: 1,
        height: '36px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.08)',
    },
    searchPlaceholder: {
        color: '#a0b0c0',
        fontSize: '13px',
        fontWeight: '500',
    },
    filterBtn: {
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: 'transparent',
        border: 'none',
    },
    errorBannerRow: {
        margin: '12px 16px 0 16px',
        padding: '10px 14px',
        backgroundColor: '#ef4444',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    },
    errorText: {
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: '600',
    },
    retryBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        color: '#ffffff',
        padding: '5px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
    mainContent: {
        flex: 1,
        padding: '12px',
    },
    emptyWatchlist: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '80px',
        textAlign: 'center',
        padding: '0 20px',
    },
    emptyIconContainer: {
        marginBottom: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
    },
    emptyTitle: {
        color: '#f0f4ff',
        fontSize: '16px',
        fontWeight: '700',
        marginBottom: '6px',
    },
    emptySubtitle: {
        color: '#a0b0c0',
        fontSize: '12px',
        marginBottom: '20px',
    },
    blueSearchBtn: {
        backgroundColor: '#2196F3',
        color: '#ffffff',
        padding: '10px 24px',
        borderRadius: '24px',
        fontWeight: 'bold',
        fontSize: '13px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
        transition: 'transform 0.15s, opacity 0.15s',
    },
    tableContainer: {
        width: '100%',
        overflowX: 'auto',
        backgroundColor: 'rgba(8, 10, 22, 0.4)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '0 8px',
        boxSizing: 'border-box',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        color: '#ffffff',
    },
    thChange: {
        padding: '12px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#9CA3AF',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'right',
    },
    thBidAsk: {
        padding: '12px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#9CA3AF',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
    },
    thLeft: {
        padding: '12px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#9CA3AF',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'left',
    },
    tr: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
    tdLeft: {
        padding: '12px 8px',
        textAlign: 'left',
        verticalAlign: 'middle',
    },
    tdRight: {
        padding: '12px 8px',
        textAlign: 'right',
        verticalAlign: 'middle',
    },
    tdCenter: {
        padding: '12px 8px',
        textAlign: 'center',
        verticalAlign: 'middle',
    },
    tableSymbolName: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    tableSubText: {
        fontSize: '11px',
        color: '#9CA3AF',
        marginTop: '2px',
    },
    tableBidBox: {
        backgroundColor: '#1b4332',
        color: '#52b788',
        padding: '6px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        minWidth: '76px',
        textAlign: 'center',
    },
    tableAskBox: {
        backgroundColor: '#4c1e1e',
        color: '#f87171',
        padding: '6px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        minWidth: '76px',
        textAlign: 'center',
    },
    tableBoxLabel: {
        fontSize: '10px',
        color: '#9CA3AF',
        marginTop: '3px',
        fontWeight: 'bold',
    },
    list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
        gap: '12px',
        width: '100%',
    },
    card: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '10px',
        padding: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    cardLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    symbolName: {
        fontSize: '16px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    dateText: {
        fontSize: '11px',
        color: '#9CA3AF',
    },
    changeText: {
        fontSize: '12px',
        fontWeight: 'bold',
    },
    cardRight: {
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
    },
    priceColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    bidBox: {
        backgroundColor: '#1b4332',
        color: '#52b788',
        padding: '6px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '82px',
        textAlign: 'center',
    },
    askBox: {
        backgroundColor: '#4c1e1e',
        color: '#f87171',
        padding: '6px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '82px',
        textAlign: 'center',
    },
    boxLabel: {
        fontSize: '9px',
        color: '#9CA3AF',
        marginTop: '3px',
        fontWeight: 'bold',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '20px',
    },
    modalContent: {
        width: '90%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #222222',
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
    },
    closeModalBtn: {
        color: '#ffffff',
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '15px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        marginRight: '12px',
        color: '#ffffff',
        outline: 'none',
    },
    searchList: {
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
    },
    searchHint: {
        textAlign: 'center',
        color: '#b8c5d6',
        fontSize: '13px',
        margin: '20px 0',
    },
    searchItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    },
    searchItemLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        textAlign: 'left',
    },
    searchItemName: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    searchItemSub: {
        fontSize: '11px',
        color: '#b8c5d6',
    },
    pinBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
    },
    notificationList: {
        overflowY: 'auto',
        padding: '0 24px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
    },
    // Tabs styling
    notifTabBar: {
        display: 'flex',
        backgroundColor: 'rgba(0,0,0,0.3)',
        margin: '0 24px 20px 24px',
        borderRadius: '12px',
        padding: '6px',
    },
    notifTabItem: {
        flex: 1,
        padding: '10px 0',
        textAlign: 'center',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'all 0.2s ease',
    },
    notifTabActive: {
        backgroundColor: '#CFD1C4',
        color: '#1a1a2e',
    },
    notifTabInactive: {
        backgroundColor: 'transparent',
        color: 'rgba(255,255,255,0.5)',
    },
    clearBtnText: {
        color: '#63B3ED',
        fontSize: '14px',
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 10px',
    },
    emptyNotifBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '60px',
        marginBottom: '40px',
    },
    emptyNotifText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: '15px',
        marginTop: '14px',
    },
    // System Alerts styles
    sysNotifCard: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        justifyContent: 'space-between',
    },
    sysNotifLeft: {
        display: 'flex',
        flex: 1,
        alignItems: 'flex-start',
    },
    sysNotifIconCircle: {
        width: '38px',
        height: '38px',
        borderRadius: '19px',
        backgroundColor: 'rgba(99,179,237,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '12px',
        flexShrink: 0,
    },
    sysNotifHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        alignItems: 'center',
    },
    sysNotifTitleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    sysNotifBullet: {
        color: '#EF4444',
        fontSize: '14px',
    },
    sysNotifTitle: {
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '600',
        textAlign: 'left',
    },
    sysNotifTime: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        whiteSpace: 'nowrap',
    },
    sysNotifMsg: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: '13px',
        lineHeight: '1.4',
        textAlign: 'left',
        marginTop: '2px',
    },
    sysNotifDeleteBtn: {
        background: 'none',
        border: 'none',
        padding: '8px',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    // Admin Messages styles
    adminNotifCard: {
        backgroundColor: 'rgba(207, 209, 196, 0.08)',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '12px',
        border: '1px solid rgba(99, 179, 237, 0.25)',
        display: 'flex',
        flexDirection: 'column',
    },
    adminNotifCardAck: {
        backgroundColor: 'rgba(207, 209, 196, 0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    adminNotifHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        justifyContent: 'space-between',
    },
    adminNotifHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        flex: 1,
    },
    adminNotifIconCircle: {
        width: '34px',
        height: '34px',
        borderRadius: '17px',
        backgroundColor: 'rgba(99,179,237,0.12)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '10px',
        flexShrink: 0,
    },
    adminNotifIconCircleAck: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    adminNotifTitle: {
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '700',
        textAlign: 'left',
    },
    adminNotifTitleAck: {
        color: 'rgba(255,255,255,0.5)',
    },
    adminNotifTime: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        marginTop: '2px',
        textAlign: 'left',
    },
    adminNotifTickBox: {
        paddingLeft: '6px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
    },
    adminNotifMsg: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: '14px',
        lineHeight: '1.4',
        marginBottom: '12px',
        textAlign: 'left',
    },
    adminNotifMsgAck: {
        color: 'rgba(255,255,255,0.38)',
    },
    adminNotifAckBtn: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#CFD1C4',
        alignSelf: 'flex-start',
        padding: '7px 14px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        gap: '6px',
        color: '#1a1a2e',
        fontWeight: 'bold',
        fontSize: '13px',
    },
    adminNotifAckDone: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        color: '#63B3ED',
        fontSize: '12px',
        fontWeight: '600',
    },
    sortModalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    sortModal: {
        width: '90%',
        maxWidth: '400px',
        backgroundColor: 'rgba(10, 15, 30, 0.95)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 201,
    },
    sortHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    sortOptionItem: {
        width: '100%',
        padding: '12px 14px',
        textAlign: 'left',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease',
        margin: '2px 0',
    },
    promoDialog: {
        backgroundColor: 'rgba(8, 10, 22, 0.92)',
        padding: '24px',
        borderRadius: '16px',
        width: '85%',
        maxWidth: '400px',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.12)',
        alignSelf: 'center',
        marginTop: '30%',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
    },
    promoTitle: {
        color: '#10B981',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '12px',
    },
    promoText: {
        color: '#9CA3AF',
        fontSize: '14px',
        marginBottom: '24px',
        lineHeight: '1.5',
    },
    promoBtn: {
        backgroundColor: '#10B981',
        color: '#000000',
        padding: '10px 24px',
        borderRadius: '6px',
        fontWeight: 'bold',
    },
    searchTabContainer: {
        display: 'flex',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    },
    searchTabBtn: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#b8c5d6',
        borderRadius: '20px',
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'inline-block',
    },
    searchTabActiveBtn: {
        backgroundColor: '#d6d9ce',
        color: '#1e201e',
        border: 'none',
    },
    searchModalOverlay: {
        position: 'fixed',
        top: 0,
        bottom: '66px',
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: 'rgba(4, 6, 14, 0.70)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
    },
    searchModalContent: {
        width: '100%',
        maxWidth: '900px',
        height: '100%',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
    },
    searchModalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(4, 6, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },
    notificationsOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 25, 35, 0.70)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
    },
    notificationsContent: {
        width: '100%',
        maxWidth: '700px',
        height: '100dvh',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
    },
    notificationsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'transparent',
    },
};
