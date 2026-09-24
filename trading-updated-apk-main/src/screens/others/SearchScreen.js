import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
    ScrollView,
    Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Check, Search } from 'lucide-react-native';
import { useTrades, normalizeSymbol } from '../../context/TradeContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import FluctuatingPrice from '../../components/FluctuatingPrice';
import { formatPrice, formatScriptSymbol } from '../../utils/formatPrice';
import * as api from '../../services/api';
import { setSearchKeyboardActive } from '../../utils/searchKeyboardState';

const SEARCH_TABS = ['ALL', 'NFO_FUT', 'NFO_OPT', 'MCX_FUT', 'MCX_OPT', 'CRYPTO', 'FOREX', 'COMMODITY'];

const TAB_LABEL = {
    ALL: 'All',
    NFO_FUT: 'NFO Fut', NFO_OPT: 'NFO Opt',
    MCX_FUT: 'MCX Fut', MCX_OPT: 'MCX Opt', CRYPTO: 'Crypto', FOREX: 'Forex', COMMODITY: 'Comex Commodity'
};

const TAB_COLORS = {
    ALL: { active: '#2196F3', bg: 'rgba(33,150,243,0.15)', badge: 'rgba(33,150,243,0.2)', text: '#2196F3' },
    NFO_FUT: { active: '#9333EA', bg: 'rgba(147,51,234,0.15)', badge: 'rgba(147,51,234,0.2)', text: '#9333EA' },
    NFO_OPT: { active: '#EC407A', bg: 'rgba(236,64,122,0.15)', badge: 'rgba(236,64,122,0.2)', text: '#EC407A' },
    MCX_FUT: { active: '#FB8C00', bg: 'rgba(251,140,0,0.15)', badge: 'rgba(251,140,0,0.2)', text: '#FB8C00' },
    MCX_OPT: { active: '#FF7043', bg: 'rgba(255,112,67,0.15)', badge: 'rgba(255,112,67,0.2)', text: '#FF7043' },
    CRYPTO: { active: '#FFD600', bg: 'rgba(255,214,0,0.15)', badge: 'rgba(255,214,0,0.2)', text: '#FFD600' },
    FOREX: { active: '#00E676', bg: 'rgba(0,230,118,0.15)', badge: 'rgba(0,230,118,0.2)', text: '#00E676' },
    COMMODITY: { active: '#E91E63', bg: 'rgba(233,30,99,0.15)', badge: 'rgba(233,30,99,0.2)', text: '#E91E63' },
};


// ── Individual row — React.memo so only re-renders when its own price changes ──
const SearchItem = React.memo(({ item, livePrices, pinned, onToggle, getInstrumentMeta }) => {
    const normKey = normalizeSymbol(item.name || item.fullSymbol || '');
    const liveData = livePrices[normKey] || {};

    const isCrypto = item.exchange === 'CRYPTO' || item.category === 'CRYPTO';
    const isForex = item.exchange === 'FOREX' || item.category === 'FOREX';

    const bid = Number(liveData.bid) || parseFloat(item.bid || item.ltp || 0);
    const ask = Number(liveData.ask) || parseFloat(item.ask || item.ltp || 0);
    const high = liveData.high !== undefined ? parseFloat(liveData.high) : parseFloat(item.high || 0);
    const low = liveData.low !== undefined ? parseFloat(liveData.low) : parseFloat(item.low || 0);
    const open = liveData.open !== undefined ? parseFloat(liveData.open) : parseFloat(item.open || 0);
    const change = liveData.change !== undefined ? parseFloat(liveData.change) : parseFloat(item.change || 0);

    const meta = getInstrumentMeta(item.name || '', item.exchange || item.category || null);
    const lotSize = item.lotSize || item.lot_size || meta?.multiplier || 1;

    return (
        <TouchableOpacity
            style={[styles.itemRow, pinned && styles.itemRowPinned]}
            activeOpacity={0.7}
            onPress={() => onToggle(item)}
        >
            {/* Left: Symbol, date, H:, Lot Size */}
            <View style={styles.leftCol}>
                <Text style={styles.symbolName} numberOfLines={1}>{formatScriptSymbol(item.name)}</Text>
                <Text style={styles.dateText}>{item.expiry || item.date || ''}</Text>
                <Text style={styles.statsText}>Chg:{formatPrice(change)} H:{formatPrice(high)}</Text>
                <Text style={styles.statsText}>Lot Size:{lotSize}</Text>
            </View>

            {/* Mid: Bid (green box) + L: below */}
            <View style={styles.priceCol}>
                <FluctuatingPrice
                    value={formatPrice(bid)}
                    numericValue={bid}
                    containerStyle={styles.priceBox}
                    textStyle={styles.priceBoxText}
                />
                <Text style={styles.subText}>L: {formatPrice(low)}</Text>
            </View>

            {/* Right: Ask (red box) + O: below */}
            <View style={[styles.priceCol, { marginLeft: 8 }]}>
                <FluctuatingPrice
                    value={formatPrice(ask)}
                    numericValue={ask}
                    containerStyle={styles.priceBox}
                    textStyle={styles.priceBoxText}
                />
                <Text style={styles.subText}>O: {formatPrice(open)}</Text>
            </View>

            {/* Checkbox */}
            <View style={styles.checkCol}>
                <View style={[
                    styles.checkbox,
                    pinned
                        ? { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }
                        : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.35)' }
                ]}>
                    {pinned && <Check size={13} color="white" strokeWidth={3} />}
                </View>
            </View>
        </TouchableOpacity>
    );
});

const getExchange = (item) => {
    // Prefer explicit exchange/category fields first
    if (item.exchange) return item.exchange;
    if (item.category) return item.category;
    // Extract exchange from fullSymbol or symbol field
    if (item.fullSymbol && item.fullSymbol.includes(':')) {
        return item.fullSymbol.split(':')[0];
    }
    if (item.symbol && item.symbol.includes(':')) {
        return item.symbol.split(':')[0];
    }
    return 'NSE';
};

const SearchScreen = ({ navigation, route }) => {
    const {
        toggleWatchlist,
        isPinned,
        globalSearchData,
        includedPins,
        livePrices,
        getInstrumentMeta,
        allowedCategories,
    } = useTrades();

    const initialTabParam = route?.params?.initialTab || route?.params?.category;
    const [selectedTab, setSelectedTab] = useState(
        initialTabParam && SEARCH_TABS.includes(initialTabParam) ? initialTabParam : 'ALL'
    );

    useEffect(() => {
        const tabParam = route?.params?.initialTab || route?.params?.category;
        if (tabParam && SEARCH_TABS.includes(tabParam)) {
            setSelectedTab(tabParam);
        }
    }, [route?.params?.initialTab, route?.params?.category]);

    const [searchText, setSearchText] = useState('');
    const inputRef = useRef(null);

    // Search API integration
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchAbortRef = useRef(0);

    // Reset search when tab changes
    React.useEffect(() => {
        setSearchText('');
    }, [selectedTab]);

    // Zero-delay navbar coordination: keep navbar hidden while typing, restore when keyboard hides
    useFocusEffect(
        useCallback(() => {
            setSearchKeyboardActive(true);
            return () => {
                setSearchKeyboardActive(true);
            };
        }, [])
    );

    useEffect(() => {
        setSearchKeyboardActive(true);

        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setSearchKeyboardActive(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setSearchKeyboardActive(false)
        );

        return () => {
            showSub.remove();
            hideSub.remove();
            setSearchKeyboardActive(true);
        };
    }, []);

    // MCX curated list - use only for local search in MCX
    const MCX_CURATED_UPPER = ['ALUMINI', 'ALUMINIUM', 'COPPER', 'COPPERM', 'COTTON', 'COTTONCNDY', 'CRUDEOIL', 'CRUDEOILM', 'GOLD', 'GOLDGUINEA', 'GOLDM', 'GOLDPETAL', 'LEAD', 'LEADMINI', 'MENTHAOIL', 'NATGASMINI', 'NATURALGAS', 'NICKEL', 'NICKELMINI', 'SILVER', 'SILVERM', 'SILVERMICRO', 'ZINC', 'ZINCMINI', 'MGOLD', 'MCRUDEOIL'];

    useEffect(() => {
        setSearchResults(null);
        setSearchLoading(false);
    }, [searchText, selectedTab]);

    // Helper: categorize item to a tab exactly matching web exchangeFromRow
    const getItemTab = (item) => {
        if (item.category === 'NFO_OPT' || item.category === 'MCX_OPT') return item.category;
        if (item.category === 'NFO_FUT' || item.category === 'MCX_FUT') return item.category;
        if (item.category === 'CRYPTO' || item.category === 'FOREX' || item.category === 'COMMODITY') return item.category;

        const sym = (item.symbol || item.fullSymbol || item.name || '').toUpperCase();
        if (sym.startsWith('CRYPTO:')) return 'CRYPTO';
        if (sym.startsWith('FOREX:')) return 'FOREX';
        if (sym.startsWith('COMMODITY:')) return 'COMMODITY';
        if (sym.startsWith('NSE:')) return 'NSE';

        const type = String(item.type || '').toUpperCase();
        const isOption = item.strike != null || item.optionType || sym.endsWith('CE') || sym.endsWith('PE') || /\d+(CE|PE)$/i.test(sym);

        if (sym.startsWith('NFO:') || item.exchange === 'NFO') {
            if (type === 'FUT' || type === 'FUTIDX' || type === 'FUTSTK') return 'NFO_FUT';
            if (type === 'NFO_OPT' || type === 'OPT' || type === 'OPTIDX' || type === 'OPTSTK') return 'NFO_OPT';
            return isOption ? 'NFO_OPT' : 'NFO_FUT';
        }
        if (sym.startsWith('MCX:') || item.exchange === 'MCX') {
            if (type === 'MCX_FUT' || type === 'FUTCOM') return 'MCX_FUT';
            if (type === 'MCX_OPT' || type === 'OPTCOM') return 'MCX_OPT';
            return isOption ? 'MCX_OPT' : 'MCX_FUT';
        }

        // Fallbacks
        if (item.category === 'crypto' || item.type === 'CRYPTO') return 'CRYPTO';
        if (item.category === 'forex' || item.type === 'FOREX') return 'FOREX';
        if (item.category === 'commodity' || item.type === 'COMMODITY') return 'COMMODITY';
        if (item.type === 'NSE') return 'NSE';
        return 'OTHER';
    };

    // Count active (pinned) items per tab — always from full list, never filtered by search
    const pinnedCounts = useMemo(() => {
        const counts = {};
        SEARCH_TABS.forEach(tab => { counts[tab] = 0; });
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

    // Count ALL available items per tab — always from full list, never filtered by search
    const categoryCounts = useMemo(() => {
        const counts = {};
        SEARCH_TABS.forEach(tab => { counts[tab] = 0; });
        globalSearchData.forEach(item => {
            const tab = getItemTab(item);
            if (tab && tab !== 'NSE' && tab !== 'OTHER' && counts[tab] !== undefined) {
                counts[tab]++;
                counts['ALL']++;
            }
        });
        return counts;
    }, [globalSearchData]);

    // Filter data: by selected tab + search text
    // MCX curated list (strict search filtering)
    const MCX_CURATED = ['ALUMINI', 'ALUMINIUM', 'COPPER', 'COPPERM', 'COTTON', 'COTTONCNDY', 'CRUDEOIL', 'CRUDEOILM', 'GOLD', 'GOLDGUINEA', 'GOLDM', 'GOLDPETAL', 'LEAD', 'LEADMINI', 'MENTHAOIL', 'NATGASMINI', 'NATURALGAS', 'NICKEL', 'NICKELMINI', 'SILVER', 'SILVERM', 'SILVERMICRO', 'ZINC', 'ZINCMINI', 'MGOLD', 'MCRUDEOIL'];

    const filteredData = useMemo(() => {
        const q = searchText.trim().toLowerCase().replace(/\s+/g, '');

        let items = [];
        if (selectedTab === 'ALL') {
            items = globalSearchData.filter(item => {
                const tab = getItemTab(item);
                return tab && tab !== 'NSE' && tab !== 'OTHER';
            });
        } else {
            items = globalSearchData.filter(item => getItemTab(item) === selectedTab);
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

                const parts = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);
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

        const seen = new Set();
        return items.filter(item => {
            const key = item.id || item.fullSymbol || item.name;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [globalSearchData, selectedTab, searchText]);

    const activeSearchTabs = useMemo(() => {
        return SEARCH_TABS.filter(tab => {
            if (tab === 'ALL') return true;
            if (allowedCategories && !allowedCategories.includes(tab)) return false;
            return true;
        });
    }, [allowedCategories]);

    const tabColor = TAB_COLORS[selectedTab] || TAB_COLORS.MCX;

    const renderItem = ({ item }) => (
        <SearchItem
            item={item}
            livePrices={livePrices}
            pinned={isPinned(item.name)}
            onToggle={toggleWatchlist}
            getInstrumentMeta={getInstrumentMeta}
        />
    );

    return (
        <ScreenWrapper>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => {
                        Keyboard.dismiss();
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('WatchlistHome');
                        }
                    }} 
                    style={styles.backBtn}
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.searchBox}>
                    <Search size={15} color="rgba(255,255,255,0.5)" />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder={`Search in ${TAB_LABEL[selectedTab] || selectedTab}...`}
                        placeholderTextColor="rgba(255,255,255,0.45)"
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus={true}
                        onFocus={() => setSearchKeyboardActive(true)}
                        onBlur={() => setSearchKeyboardActive(false)}
                        cursorColor="white"
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Text style={styles.clearText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Category Tabs ── */}
            <View style={styles.tabBarContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    {activeSearchTabs.map(tab => {
                        const isActive = tab === selectedTab;
                        const tc = TAB_COLORS[tab];
                        const pinCount = pinnedCounts[tab] || 0;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, isActive && { borderBottomColor: tc.active, borderBottomWidth: 2.5 }]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[styles.tabText, isActive && { color: 'white', fontWeight: '800' }]}>
                                    {TAB_LABEL[tab] || tab}
                                </Text>
                                <View style={styles.tabCountRow}>
                                    <Text style={[styles.tabCount, isActive && { color: tc.active }]}>
                                        ({categoryCounts[tab] || 0})
                                    </Text>
                                    {pinCount > 0 && (
                                        <View style={[styles.pinBadge, { backgroundColor: tc.active }]}>
                                            <Text style={styles.pinBadgeText}>{pinCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Info Bar ── */}
            <View style={[styles.infoBar, { borderLeftColor: tabColor.active, borderLeftWidth: 3 }]}>
                <Text style={styles.infoText}>
                    {filteredData.length} {TAB_LABEL[selectedTab] || selectedTab} instruments
                    {searchText.trim() ? ` found for "${searchText}"` : ''}
                    {'  ·  '}Tap to add / remove from watchlist
                </Text>
            </View>

            {/* ── List ── */}
            <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.id || item.fullSymbol || item.name || 'search'}-${index}`}
                contentContainerStyle={styles.listContainer}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                initialNumToRender={25}
                maxToRenderPerBatch={20}
                windowSize={7}
                removeClippedSubviews={true}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>
                            {searchText ? '🔍' : '📭'}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {searchText ? `No results for "${searchText}"` : `No ${TAB_LABEL[selectedTab] || selectedTab} data`}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchText
                                ? `Try a different search term`
                                : `Market data will load shortly`}
                        </Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 56,
        gap: 8,
        marginTop: Platform.OS === 'ios' ? 0 : 4,
    },
    backBtn: {
        padding: 4,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16.5,
        fontWeight: '500',
        paddingVertical: 0,
    },
    clearText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15.5,
        fontWeight: '700',
        paddingHorizontal: 4,
    },
    tabBarContainer: {
        backgroundColor: '#0A0E1A',
        height: 52,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    tabScrollContent: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    tab: {
        paddingHorizontal: 14,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    tabText: {
        color: '#546E7A',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tabCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    tabCount: {
        color: '#37474F',
        fontSize: 10.5,
        fontWeight: '700',
    },
    pinBadge: {
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    pinBadgeText: {
        color: 'white',
        fontSize: 9.5,
        fontWeight: '900',
    },
    infoBar: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
        marginBottom: 2,
    },
    infoText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12.5,
        fontWeight: '500',
    },
    listContainer: {
        paddingBottom: 30,
    },
    // ── Row layout ──
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    itemRowPinned: {
        backgroundColor: 'rgba(76,175,80,0.05)',
    },
    leftCol: {
        flex: 1,
        paddingRight: 6,
    },
    symbolName: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '900',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    dateText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13.5,
        fontWeight: '600',
        marginBottom: 1,
    },
    statsText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13.5,
        fontWeight: '600',
    },
    priceCol: {
        alignItems: 'center',
        minWidth: 84,
    },
    priceBox: {
        width: 84,
        paddingVertical: 7,
        paddingHorizontal: 4,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceBoxText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '900',
    },
    subText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 3,
        textAlign: 'center',
    },
    checkCol: {
        width: 34,
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 6,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 30,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 17.5,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 14.5,
        textAlign: 'center',
    },
});

export default SearchScreen;
