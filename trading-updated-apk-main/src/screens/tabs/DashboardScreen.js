import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    FlatList,
    Animated,
    Easing,
    Modal,
    Pressable,
    RefreshControl,
    Platform,
    useWindowDimensions,
    ScrollView,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Bell, Wallet, Sparkles, X, ArrowUpDown, TrendingUp, TrendingDown, LayoutList } from 'lucide-react-native';
import { useTrades, normalizeSymbol } from '../../context/TradeContext';
import { formatPrice, formatScriptSymbol } from '../../utils/formatPrice';

import ScreenWrapper from '../../components/ScreenWrapper';
import TickerTape from '../../components/TickerTape';
import CuteBot from '../../components/CuteBot';
import ScreenHeader from '../../components/ScreenHeader';
import MarketUpdatePopup from '../../components/MarketUpdatePopup';

const CATEGORIES = ['NFO_FUT', 'NFO_OPT', 'MCX_FUT', 'MCX_OPT', 'CRYPTO', 'FOREX', 'COMMODITY'];
const CAT_LABEL = {
    NFO_FUT: 'NFO Fut', NFO_OPT: 'NFO Opt',
    MCX_FUT: 'MCX Fut', MCX_OPT: 'MCX Opt', CRYPTO: 'Crypto', FOREX: 'Forex', COMMODITY: 'Comex Commodity'
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


import FluctuatingPrice from '../../components/FluctuatingPrice';

const WatchlistItemComponent = ({ item, livePrice, navigation, screenWidth }) => {
    const prevPriceRef = React.useRef(livePrice);
    const [movementArrow, setMovementArrow] = useState(null);

    const liveData = livePrice || {};
    const currentPrice = typeof liveData === 'object' ? (liveData.ltp || 0) : (liveData || 0);

    // Responsive sizing based on screen width
    const isSmallScreen = screenWidth < 375;
    const isMediumScreen = screenWidth < 412;

    useEffect(() => {
        if (currentPrice !== prevPriceRef.current) {
            const dir = currentPrice > prevPriceRef.current ? 'up' : 'down';
            setMovementArrow(dir);
            prevPriceRef.current = currentPrice;
            const t = setTimeout(() => setMovementArrow(null), 600);
            return () => clearTimeout(t);
        }
    }, [currentPrice]);

    const change = typeof liveData === 'object' && liveData.change !== undefined ? parseFloat(liveData.change) : (parseFloat(item.change) || 0);
    const high = typeof liveData === 'object' && liveData.high ? parseFloat(liveData.high) : (parseFloat(item.high) || 0);
    const low = typeof liveData === 'object' && liveData.low ? parseFloat(liveData.low) : (parseFloat(item.low) || 0);
    const open = typeof liveData === 'object' && liveData.open ? parseFloat(liveData.open) : (parseFloat(item.open) || 0);

    // Use live bid/ask if available, fallback to item data
    const bid = typeof liveData === 'object' ? (Number(liveData.bid) || parseFloat(item.bid) || 0) : (parseFloat(item.bid) || 0);
    const ask = typeof liveData === 'object' ? (Number(liveData.ask) || parseFloat(item.ask) || 0) : (parseFloat(item.ask) || 0);

    const isUp = change > 0;
    const isDown = change < 0;

    // Daily Net Trend Color (matches web)
    const trendColor = isUp ? '#00E676' : isDown ? '#FF5252' : '#B0BEC5';
    const trendBg = isUp ? 'rgba(0, 230, 118, 0.12)' : isDown ? 'rgba(255, 82, 82, 0.12)' : 'rgba(255,255,255,0.08)';

    const catRaw = item.category || item.exchange || 'MCX_FUT';
    const isCrypto = catRaw === 'CRYPTO';
    const isForex = catRaw === 'FOREX';

    const badgeColors = {
        NSE: { bg: 'rgba(33, 150, 243, 0.15)', text: '#2196F3' },
        NFO_FUT: { bg: 'rgba(147, 51, 234, 0.15)', text: '#9333EA' },
        NFO_OPT: { bg: 'rgba(236, 64, 122, 0.15)', text: '#EC407A' },
        MCX_FUT: { bg: 'rgba(251, 140, 0, 0.15)', text: '#FB8C00' },
        MCX_OPT: { bg: 'rgba(255, 112, 67, 0.15)', text: '#FF7043' },
        CRYPTO: { bg: 'rgba(255, 214, 0, 0.15)', text: '#FFD600' },
        FOREX: { bg: 'rgba(0, 230, 118, 0.15)', text: '#00E676' },
        COMMODITY: { bg: 'rgba(233, 30, 99, 0.15)', text: '#E91E63' }
    };

    const currentBadge = badgeColors[catRaw] || { bg: 'rgba(120, 144, 156, 0.15)', text: '#B0BEC5' };

    // Dynamic responsive scaling based on screen width (baseline: 390px)
    const scale = Math.min(Math.max((screenWidth || 390) / 390, 0.88), 1.25);

    const responsiveStyles = {
        symbolNameSize: Math.round(17.5 * scale * 10) / 10,
        arrowSize: Math.round(14 * scale),
        dateTextSize: Math.round(13.5 * scale * 10) / 10,
        statsTextSize: Math.round(12.5 * scale * 10) / 10,
        priceBoxFontSize: Math.round(16.0 * scale * 10) / 10,
        priceBoxWidth: Math.round(98 * scale),
        stackedColMinWidth: Math.round(98 * scale),
        priceBoxPaddingV: Math.round(5 * scale),
        priceBoxPaddingH: Math.round(5 * scale),
        colGap: Math.round(8 * scale),
        statsRowMarginTop: Math.round(5 * scale),
        cardWrapperPadding: Math.round(10 * scale),
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OrderDetail', {
                item,
                name: item.name,
                category: item.category,
                fullSymbol: item.fullSymbol,
                lotSize: item.lotSize
            })}
            style={[styles.cardWrapper, { paddingHorizontal: responsiveStyles.cardWrapperPadding, paddingVertical: responsiveStyles.cardWrapperPadding }]}
        >
            {/* Top Row: Symbol Info (Left) + Bid Price Box (Middle) + Ask Price Box (Right) */}
            <View style={styles.topCardRow}>
                {/* 1. Left: Symbol Name & Date */}
                <View style={styles.leftColTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.symbolName, { fontSize: responsiveStyles.symbolNameSize }]} numberOfLines={1}>{formatScriptSymbol(item.name)}</Text>
                        {movementArrow && (
                            <Text style={{ color: movementArrow === 'up' ? '#00E676' : '#FF5252', fontSize: responsiveStyles.arrowSize, fontWeight: '900', marginLeft: 4 }}>
                                {movementArrow === 'up' ? '↑' : '↓'}
                            </Text>
                        )}
                    </View>
                    <Text 
                        style={[styles.dateText, { fontSize: responsiveStyles.dateTextSize }]}
                        numberOfLines={1}
                    >
                        {item.date || item.expiry || ''}
                    </Text>
                </View>

                {/* 2. Middle: Bid Box */}
                <View style={[styles.priceBoxCol, { minWidth: responsiveStyles.stackedColMinWidth, width: responsiveStyles.priceBoxWidth }]}>
                    <FluctuatingPrice
                        value={formatPrice(bid)}
                        numericValue={bid}
                        containerStyle={[styles.priceBox, { backgroundColor: '#2E7D32', width: responsiveStyles.priceBoxWidth, paddingVertical: responsiveStyles.priceBoxPaddingV, paddingHorizontal: responsiveStyles.priceBoxPaddingH }]}
                        textStyle={[styles.priceBoxText, { fontSize: responsiveStyles.priceBoxFontSize, fontWeight: '900' }]}
                    />
                </View>

                {/* 3. Right: Ask Box */}
                <View style={[styles.priceBoxCol, { marginLeft: responsiveStyles.colGap, minWidth: responsiveStyles.stackedColMinWidth, width: responsiveStyles.priceBoxWidth }]}>
                    <FluctuatingPrice
                        value={formatPrice(ask)}
                        numericValue={ask}
                        containerStyle={[styles.priceBox, { backgroundColor: '#C62828', width: responsiveStyles.priceBoxWidth, paddingVertical: responsiveStyles.priceBoxPaddingV, paddingHorizontal: responsiveStyles.priceBoxPaddingH }]}
                        textStyle={[styles.priceBoxText, { fontSize: responsiveStyles.priceBoxFontSize, fontWeight: '900' }]}
                    />
                </View>
            </View>

            {/* Bottom Row: Chg & H (Left) + L (Middle) + O (Right) — GUARANTEED PERFECT HORIZONTAL LINE ALIGNMENT */}
            <View style={[styles.bottomStatsRow, { marginTop: responsiveStyles.statsRowMarginTop }]}>
                {/* 1. Left: Chg & H */}
                <View style={styles.leftColBottom}>
                    <Text 
                        style={[styles.statsText, { fontSize: responsiveStyles.statsTextSize }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        Chg: {formatPrice(change)}  H: {formatPrice(high)}
                    </Text>
                </View>

                {/* 2. Middle: L (centered directly under Bid Box) */}
                <View style={[styles.statCol, { minWidth: responsiveStyles.stackedColMinWidth, width: responsiveStyles.priceBoxWidth }]}>
                    <Text 
                        style={[styles.statsText, { fontSize: responsiveStyles.statsTextSize }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        L: {formatPrice(low)}
                    </Text>
                </View>

                {/* 3. Right: O (centered directly under Ask Box) */}
                <View style={[styles.statCol, { marginLeft: responsiveStyles.colGap, minWidth: responsiveStyles.stackedColMinWidth, width: responsiveStyles.priceBoxWidth }]}>
                    <Text 
                        style={[styles.statsText, { fontSize: responsiveStyles.statsTextSize }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        O: {formatPrice(open)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const areWatchlistPropsEqual = (prevProps, nextProps) => {
    if (prevProps.item?.id !== nextProps.item?.id) return false;
    if (prevProps.item?.name !== nextProps.item?.name) return false;
    if (prevProps.item?.fullSymbol !== nextProps.item?.fullSymbol) return false;
    if (prevProps.screenWidth !== nextProps.screenWidth) return false;

    const prevL = prevProps.livePrice || {};
    const nextL = nextProps.livePrice || {};

    return (
        prevL.ltp === nextL.ltp &&
        prevL.bid === nextL.bid &&
        prevL.ask === nextL.ask &&
        prevL.high === nextL.high &&
        prevL.low === nextL.low &&
        prevL.open === nextL.open &&
        prevL.change === nextL.change
    );
};

const WatchlistItem = React.memo(WatchlistItemComponent, areWatchlistPropsEqual);

const getMarketStatus = (category) => {
    // Get current time in India (IST)
    const now = new Date();
    // Convert to IST offset (UTC + 5.5 hours)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));

    const day = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const timeVal = hours * 100 + minutes; // e.g. 15:30 -> 1530

    // Crypto is always open 24/7/365
    if (category === 'CRYPTO') {
        return { isOpen: true };
    }

    const isWeekend = day === 0 || day === 6; // Saturday or Sunday

    // Weekends: All non-crypto markets are closed
    if (isWeekend) {
        return { isOpen: false, reason: 'Closed for the weekend.' };
    }

    // Weekdays (Monday to Friday)
    if (category === 'NFO_FUT' || category === 'NFO_OPT') {
        // NFO: 9:15 AM to 3:30 PM (0915 to 1530)
        if (timeVal < 915 || timeVal > 1530) {
            return { isOpen: false, reason: 'Hours: 9:15 AM - 3:30 PM.' };
        }
    } else if (category === 'MCX_FUT' || category === 'MCX_OPT') {
        // MCX: 9:00 AM to 11:30 PM (0900 to 2330)
        if (timeVal < 900 || timeVal > 2330) {
            return { isOpen: false, reason: 'Hours: 9:00 AM - 11:30 PM.' };
        }
    } else if (category === 'FOREX' || category === 'COMMODITY') {
        // Forex / Commodity are open 24h on weekdays (closed on weekends)
        return { isOpen: true };
    }

    return { isOpen: true };
};

const DashboardScreen = ({ navigation }) => {
    const { width: screenWidth } = useWindowDimensions();
    const dynamicScale = Math.min(Math.max((screenWidth || 390) / 390, 0.88), 1.25);
    const { watchlist, globalSearchData, livePrices, unreadAdminCount, adminNotifications, acknowledgeNotification, fetchInitialData, includedPins, isPinned, kiteStatus, dataError, allowedCategories } = useTrades();

    const allItems = React.useMemo(() => {
        const raw = globalSearchData && globalSearchData.length > 0 ? globalSearchData : (watchlist || []);
        const seen = new Set();
        return raw.filter(item => {
            const key = item.id || item.fullSymbol || item.name;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [globalSearchData, watchlist]);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [showPromo, setShowPromo] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [refreshing, setRefreshing] = useState(false);

    const pagerRef = React.useRef(null);
    const tabScrollRef = React.useRef(null);
    const tabLayouts = React.useRef({});
    const isProgrammaticScroll = React.useRef(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    };

    // AI Icon Animation
    const floatAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -5,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 5,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Show popup on start if there's an unacknowledged admin message
    useEffect(() => {
        const unack = adminNotifications.find(n => !n.acknowledged);
        if (unack) {
            const timer = setTimeout(() => {
                setShowPromo(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);



    const handleAcknowledge = () => {
        const unacknowledged = adminNotifications.find(n => !n.acknowledged);
        if (unacknowledged) {
            acknowledgeNotification(unacknowledged.id);
        }
        setShowPromo(false);
    };

    // Filter categories to include all categories allowed for this user by client profile config
    const activeCategories = useMemo(() => {
        if (!allowedCategories || allowedCategories.length === 0) {
            return ['NFO_FUT', 'NFO_OPT', 'MCX_FUT', 'MCX_OPT'];
        }
        return CATEGORIES.filter(cat => allowedCategories.includes(cat));
    }, [allowedCategories]);

    const activeCategoriesKey = useMemo(() => activeCategories.join(','), [activeCategories]);

    useEffect(() => {
        if (activeCategories.length > 0 && !activeCategories.includes(selectedCategory)) {
            setSelectedCategory(activeCategories[0]);
        }
    }, [activeCategoriesKey, selectedCategory]);

    // categoryData: Pre-compute pinned items for all active categories for instant zero-flash sliding
    const categoryData = useMemo(() => {
        const map = {};
        activeCategories.forEach(cat => {
            const seenSyms = new Set();
            let items = allItems.filter(item => {
                const itemCat = item.category || item.exchange || 'MCX';
                if (itemCat !== cat) return false;
                const symKey = item.id || item.fullSymbol || item.name;
                if (!isPinned(item.name) && !isPinned(item.symbol) && !isPinned(item.fullSymbol)) return false;
                if (seenSyms.has(symKey)) return false;
                seenSyms.add(symKey);
                return true;
            });

            if (sortBy !== 'default') {
                items = [...items].sort((a, b) => {
                    const normKeyA = normalizeSymbol(a.name || a.fullSymbol);
                    const ltpA = livePrices[normKeyA]?.ltp || 0;
                    const normKeyB = normalizeSymbol(b.name || b.fullSymbol);
                    const ltpB = livePrices[normKeyB]?.ltp || 0;

                    const changeA = parseFloat(livePrices[normKeyA]?.change || a.change || 0);
                    const changeB = parseFloat(livePrices[normKeyB]?.change || b.change || 0);

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
            } else {
                items = [...items].sort((a, b) =>
                    (a.name || '').localeCompare(b.name || '')
                );
            }
            map[cat] = items;
        });
        return map;
    }, [activeCategories, allItems, sortBy, isPinned, sortBy === 'default' ? null : livePrices]);

    // counts: active (included) items per category
    const counts = useMemo(() => {
        const c = {};
        activeCategories.forEach(cat => {
            c[cat] = (categoryData[cat] || []).length;
        });
        return c;
    }, [activeCategories, categoryData]);

    const handleTabLayout = (index, event) => {
        tabLayouts.current[index] = event.nativeEvent.layout;
    };

    const scrollTabIntoView = (index) => {
        const layout = tabLayouts.current[index];
        if (layout && tabScrollRef.current) {
            const targetX = layout.x - screenWidth / 2 + layout.width / 2;
            tabScrollRef.current.scrollTo({ x: Math.max(0, targetX), animated: true });
        }
    };

    const handleTabPress = (index, cat) => {
        isProgrammaticScroll.current = true;
        setSelectedCategory(cat);
        scrollTabIntoView(index);
        pagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
        setTimeout(() => {
            isProgrammaticScroll.current = false;
        }, 400);
    };

    const handlePagerScroll = (e) => {
        if (isProgrammaticScroll.current) return;
        const offsetX = e.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / screenWidth);
        if (pageIndex >= 0 && pageIndex < activeCategories.length) {
            const newCat = activeCategories[pageIndex];
            if (newCat !== selectedCategory) {
                setSelectedCategory(newCat);
                scrollTabIntoView(pageIndex);
            }
        }
    };

    const handlePagerMomentumEnd = (e) => {
        isProgrammaticScroll.current = false;
        const offsetX = e.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / screenWidth);
        if (pageIndex >= 0 && pageIndex < activeCategories.length) {
            const newCat = activeCategories[pageIndex];
            if (newCat !== selectedCategory) {
                setSelectedCategory(newCat);
            }
            scrollTabIntoView(pageIndex);
        }
    };

    const renderMarketItem = React.useCallback(({ item }) => {
        const normKey = normalizeSymbol(item.name || item.fullSymbol);
        return (
            <WatchlistItem
                item={item}
                livePrice={livePrices[normKey]}
                navigation={navigation}
                screenWidth={screenWidth}
            />
        );
    }, [livePrices, navigation, screenWidth]);

    return (
        <ScreenWrapper style={styles.container}>
            <ScreenHeader
                title="Market Watch"
                leftComponent={
                    <TouchableOpacity
                        style={styles.aiBtn}
                        onPress={() => navigation.navigate('AiAssistant')}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                            <CuteBot size={28} />
                        </Animated.View>
                    </TouchableOpacity>
                }
                rightComponent={
                    <View style={styles.rightIcons}>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => navigation.navigate('Funds')}
                            activeOpacity={0.7}
                        >
                            <Wallet size={18} color="white" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => navigation.navigate('Notifications')}
                            activeOpacity={0.7}
                        >
                            <Bell size={18} color="white" strokeWidth={2} />
                            {unreadAdminCount > 0 && (
                                <View style={styles.iconBadge}>
                                    <Text style={styles.badgeText}>
                                        {unreadAdminCount > 9 ? '9+' : String(unreadAdminCount)}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                }
            />

            <TickerTape />

            <View style={styles.tabBarContainer}>
                <ScrollView
                    ref={tabScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    {activeCategories.map((cat, index) => (
                        <TouchableOpacity
                            key={cat}
                            onLayout={(e) => handleTabLayout(index, e)}
                            style={[styles.tab, selectedCategory === cat && styles.activeTab]}
                            onPress={() => handleTabPress(index, cat)}
                        >
                            <Text style={[styles.tabText, { fontSize: Math.round(14.5 * dynamicScale * 10) / 10 }, selectedCategory === cat && styles.activeTabText]}>
                                {CAT_LABEL[cat] || cat}
                            </Text>
                            <Text style={[styles.tabCountText, { fontSize: Math.round(11.5 * dynamicScale * 10) / 10 }, selectedCategory === cat && styles.activeTabCountText]}>
                                ({counts[cat] || 0})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#9E9E9E" />
                    <TouchableOpacity
                        style={styles.searchClickable}
                        onPress={() => navigation.navigate('Search', { initialTab: selectedCategory })}
                    >
                        <Text style={[styles.searchPlaceholder, { fontSize: Math.round(14.5 * dynamicScale * 10) / 10 }]}>Search & Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowFilterModal(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Filter size={18} color={sortBy !== 'default' ? '#2196F3' : '#9E9E9E'} fill={sortBy !== 'default' ? '#2196F3' : '#9E9E9E'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Horizontal Pager for Category Watchlists */}
            <ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                directionalLockEnabled={true}
                scrollEventThrottle={16}
                onScroll={handlePagerScroll}
                onMomentumScrollEnd={handlePagerMomentumEnd}
                style={styles.pagerContainer}
            >
                {activeCategories.map((cat) => {
                    const catData = categoryData[cat] || [];
                    const status = getMarketStatus(cat);

                    return (
                        <View key={cat} style={{ width: screenWidth, flex: 1 }}>
                            {/* Weekend Banner if closed */}
                            {!status.isOpen && (
                                <View style={styles.weekendBanner}>
                                    <Text style={[styles.weekendBannerText, { fontSize: Math.round(13.5 * dynamicScale * 10) / 10 }]}>
                                        ⚠️ {CAT_LABEL[cat] || cat} Market is Closed. {status.reason}
                                    </Text>
                                </View>
                            )}

                            {/* Watchlist — pinned items only for this category */}
                            <FlatList
                                data={catData}
                                renderItem={renderMarketItem}
                                keyExtractor={(item, index) => `${item.id || item.fullSymbol || item.name || 'item'}-${index}`}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                initialNumToRender={15}
                                maxToRenderPerBatch={10}
                                windowSize={5}
                                removeClippedSubviews={Platform.OS === 'android'}
                                getItemLayout={(data, index) => (
                                    { length: 88, offset: 88 * index, index }
                                )}
                                updateCellsBatchingPeriod={50}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196F3" />
                                }
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyIcon}>📋</Text>
                                        <Text style={styles.emptyTitle}>No {CAT_LABEL[cat] || cat} items in watchlist</Text>
                                        <Text style={styles.emptySubtext}>
                                            Use Search to add {CAT_LABEL[cat] || cat} instruments
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.emptyAddBtn}
                                            onPress={() => navigation.navigate('Search', { initialTab: cat })}
                                        >
                                            <Text style={styles.emptyAddBtnText}>＋ Search & Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            />
                        </View>
                    );
                })}
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sort & Filter</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <X size={22} color="#B0BEC5" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalDivider} />
                        {SORT_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = sortBy === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.filterOption, isActive && styles.filterOptionActive]}
                                    onPress={() => { setSortBy(opt.key); setShowFilterModal(false); }}
                                >
                                    <Icon size={18} color={isActive ? '#2196F3' : '#78909C'} />
                                    <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{opt.label}</Text>
                                    {isActive && <View style={styles.activeDot} />}
                                </TouchableOpacity>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>

            <MarketUpdatePopup
                visible={showPromo}
                onClose={() => setShowPromo(false)}
                onAcknowledge={handleAcknowledge}
                title={adminNotifications.find(n => !n.acknowledged)?.title}
                message={adminNotifications.find(n => !n.acknowledged)?.message}
            />
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSideContainer: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontSize: 21,
        fontWeight: '900',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    titleWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2,
    },
    totalCountText: {
        color: '#2196F3',
        fontSize: 11.5,
        fontWeight: '800',
        marginTop: 2,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    tabCountText: {
        fontSize: 10.5,
        color: '#546E7A',
        fontWeight: '700',
        marginTop: 2,
        opacity: 0.8,
    },
    activeTabCountText: {
        color: '#2196F3',
        opacity: 1,
    },
    headerIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
        position: 'relative',
    },
    aiBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(147, 51, 234, 0.15)',
        borderWidth: 1.5,
        borderColor: '#9333EA',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#9333EA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    iconBadge: {
        position: 'absolute',
        top: -1,
        right: -1,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#061A37',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
    },
    tabBarContainer: {
        backgroundColor: '#0A0E1A',
        height: 52,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    tabScrollContent: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    tab: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2.5,
        borderBottomColor: '#2196F3',
    },
    tabText: {
        color: '#546E7A',
        fontSize: 13.5,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    activeTabText: {
        color: '#ffffff',
    },
    searchSection: {
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 0,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    searchClickable: {
        flex: 1,
        paddingHorizontal: 8,
    },
    searchPlaceholder: {
        color: '#546E7A',
        fontSize: 14,
        fontWeight: '500',
    },
    pagerContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 0,
        paddingBottom: 35,
        flexGrow: 1,
    },
    cardWrapper: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        minHeight: 80,
    },
    topCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftColTop: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 8,
    },
    priceBoxCol: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftColBottom: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 8,
    },
    statCol: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    symbolName: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    dateText: {
        color: '#B0BEC5',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    ltpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 1,
    },
    priceMain: {
        fontSize: 16.5,
        fontWeight: '800',
    },
    arrowIcon: {
        fontSize: 13.5,
        marginLeft: 2,
    },
    statsText: {
        color: '#ECEFF1',
        fontSize: 12.5,
        fontWeight: '700',
        opacity: 0.95,
    },
    priceBox: {
        width: 98,
        paddingVertical: 5,
        paddingHorizontal: 5,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceBoxText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111827',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    modalTitle: {
        color: '#ECEFF1',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    modalDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginBottom: 6,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 14,
    },
    filterOptionActive: {
        backgroundColor: 'rgba(33,150,243,0.1)',
    },
    filterOptionText: {
        color: '#B0BEC5',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    filterOptionTextActive: {
        color: '#2196F3',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2196F3',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 30,
    },
    emptyIcon: {
        fontSize: 42,
        marginBottom: 12,
    },
    emptyTitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    emptyAddBtn: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyAddBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    errorBanner: {
        backgroundColor: '#d32f2f',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 8,
        marginVertical: 8,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorBannerText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    errorRetryBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    errorRetryBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    weekendBanner: {
        backgroundColor: 'rgba(255, 160, 0, 0.08)',
        borderColor: 'rgba(255, 160, 0, 0.25)',
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 8,
        marginVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekendBannerText: {
        color: '#FFA000',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default DashboardScreen;
