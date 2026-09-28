import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    Pressable,
    RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrades, normalizeSymbol, formatScriptSymbol } from '../../context/TradeContext';
import { calculateSegmentMargin } from '../../utils/segmentMargin';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

import FluctuatingPrice from '../../components/FluctuatingPrice';

const { width } = Dimensions.get('window');

// Optimized TradeCard component with isolated normalized price subscription
const TradeCardComponent = ({ trade, livePrice: singleLivePrice, meta, navigation }) => {
    const avgEntry = trade.avgPrice || parseFloat(trade.entryPrice);

    const liveData = singleLivePrice || { ltp: trade.ltp || 0, bid: trade.bid || 0, ask: trade.ask || 0 };

    // Validate that we have valid prices (not 0 or NaN)
    const ltp = liveData.ltp && liveData.ltp > 0 ? liveData.ltp : (trade.ltp && trade.ltp > 0 ? trade.ltp : 0);
    const bid = liveData.bid && liveData.bid > 0 ? liveData.bid : (trade.bid && trade.bid > 0 ? trade.bid : ltp);
    const ask = liveData.ask && liveData.ask > 0 ? liveData.ask : (trade.ask && trade.ask > 0 ? trade.ask : ltp);

    // BUY exits at BID, SELL exits at ASK — same logic as P/L calculation in TradeContext
    const cmp = trade.type === 'BUY'
        ? (bid > 0 ? bid : (ltp > 0 ? ltp : avgEntry))
        : (ask > 0 ? ask : (ltp > 0 ? ltp : avgEntry));
    const livePrice = cmp > 0 ? cmp : avgEntry;
    const { userConfig } = useTrades();
    const pnl = trade.pnl || 0;

    const isUnitMode = userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true;
    let holdingMargin = calculateSegmentMargin({
        marketType: trade.market || trade.market_type || trade.marketType || 'MCX',
        symbol: trade.name || trade.symbol,
        price: avgEntry,
        qty: Math.abs(trade.qty || 1),
        lotSize: trade.lot_size || meta?.multiplier || 1,
        isHolding: true,
        clientConfig: userConfig || {},
        isUnitMode: isUnitMode
    });

    if (holdingMargin <= 0 && parseFloat(trade.margin_used || 0) > 0) {
        holdingMargin = parseFloat(trade.margin_used || 0);
    }

    const handlePress = () => {
        navigation.navigate('ExitTrade', { trade });
    };

    return (
        <Pressable
            style={styles.tradeCard}
            onPress={handlePress}
        >
            <View style={styles.tradeHeaderTop}>
                <View style={styles.tradeLabelContainer}>
                    <Text style={[
                        styles.tradeLabel,
                        trade.type === 'SELL' && { color: '#FF3B30', backgroundColor: 'rgba(255, 59, 48, 0.2)' }
                    ]}>
                        {trade.type === 'BUY' ? 'Bought' : 'Sold'}
                    </Text>
                    <View style={styles.qtyBadge}>
                        <Text style={styles.tradeQty}>QTY {trade.qty}</Text>
                    </View>
                </View>
                <View style={styles.marginSection2}>
                    <Text style={styles.marginLabel2}>Holding Margin Required</Text>
                    <Text style={styles.marginValue2}>{holdingMargin.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.tradeDetails}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tradeName}>{formatScriptSymbol(trade)}</Text>
                    <View style={styles.priceInfoContainer}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Avg  </Text>
                            <Text style={styles.priceValue}>{avgEntry.toFixed(2)}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>CMP  </Text>
                            <FluctuatingPrice
                                value={livePrice.toFixed(2)}
                                numericValue={livePrice}
                                showLabel={false}
                                textStyle={styles.priceValue}
                            />
                        </View>
                    </View>

                    {trade.executedFromPending && (
                        <View style={styles.executedFromPendingBadge}>
                            <Text style={styles.executedFromPendingText}>● Executed from Pending {trade.type === 'BUY' ? 'Buy' : 'Sell'}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.tradeFooter}>
                <View style={styles.plContainer}>
                    <Text style={styles.plLabel}>P/L </Text>
                    <FluctuatingPrice
                        value={`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                        numericValue={pnl}
                        showLabel={false}
                        textStyle={[styles.plValue, { color: pnl >= 0 ? '#4CAF50' : '#FF3B30' }]}
                    />
                </View>

                <Pressable
                    style={({ pressed }) => [
                        { borderRadius: 8, overflow: 'hidden', opacity: pressed ? 0.6 : 1 }
                    ]}
                    onPress={handlePress}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <View pointerEvents="none">
                        <LinearGradient
                            colors={['#f87d7d', '#fa854a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>Close Trades</Text>
                        </LinearGradient>
                    </View>
                </Pressable>
            </View>
        </Pressable>
    );
};

const areTradeCardPropsEqual = (prevProps, nextProps) => {
    if (prevProps.trade?.name !== nextProps.trade?.name) return false;
    if (prevProps.trade?.qty !== nextProps.trade?.qty) return false;
    if (prevProps.trade?.avgPrice !== nextProps.trade?.avgPrice) return false;
    if (prevProps.trade?.pnl !== nextProps.trade?.pnl) return false;
    if (prevProps.trade?.type !== nextProps.trade?.type) return false;
    if (prevProps.meta?.multiplier !== nextProps.meta?.multiplier) return false;

    const prevL = prevProps.livePrice || {};
    const nextL = nextProps.livePrice || {};

    return (
        prevL.ltp === nextL.ltp &&
        prevL.bid === nextL.bid &&
        prevL.ask === nextL.ask
    );
};

const TradeCard = React.memo(TradeCardComponent, areTradeCardPropsEqual);

const PortfolioScreen = ({ navigation }) => {
    const {
        trades,
        livePrices,
        activePL,
        totalDynamicMargin,
        dynamicMarginBySegment,
        totalM2M,
        ledgerBalance,
        marginAvailable,
        realizedPL,
        fetchInitialData,
        getInstrumentMeta,
        aggregatedPositions,
        marginUsed,
        marginBySegment
    } = useTrades();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    }, [fetchInitialData]);


    const renderHeader = () => (
        <View>
            <ScreenHeader title="Portfolio" />

            {/* Unified Stats & Margin Card */}
            <View style={styles.section}>
                <View style={styles.unifiedCard}>
                    <View style={styles.topRow}>
                        <View style={styles.topItem}>
                            <Text style={styles.statLabel}>Ledger Balance</Text>
                            <Text style={styles.statValue}>
                                {ledgerBalance.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.topItem}>
                            <Text style={styles.statLabel}>Margin Available</Text>
                            <Text style={styles.statValue}>
                                {marginAvailable.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.topRow}>
                        <View style={styles.topItem}>
                            <Text style={styles.statLabel}>Active P/L</Text>
                            <Text style={[styles.statValue, { color: activePL >= 0 ? '#4CAF50' : '#FF3B30' }]}>
                                {activePL.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.topItem}>
                            <Text style={styles.statLabel}>M2M</Text>
                            <Text style={[styles.statValue, { color: totalM2M >= 0 ? '#4CAF50' : '#FF3B30' }]}>
                                {totalM2M.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.marginSection}>
                        <View style={styles.marginRow}>
                            <Text style={styles.marginTitleText}>Net Holding Margin Required:</Text>
                            <Text style={styles.marginRowValue}>{totalDynamicMargin.toFixed(2)}</Text>
                        </View>
                        <View style={styles.marginRow}>
                            <Text style={styles.marginTitleText}>NSE / BSE</Text>
                            <Text style={styles.marginRowValue}>{(dynamicMarginBySegment.EQUITY || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.marginRow}>
                            <Text style={styles.marginTitleText}>MCX</Text>
                            <Text style={styles.marginRowValue}>{(dynamicMarginBySegment.MCX || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.marginRow}>
                            <Text style={styles.marginTitleText}>Options</Text>
                            <Text style={styles.marginRowValue}>{(dynamicMarginBySegment.OPTIONS || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.marginRow}>
                            <Text style={styles.marginTitleText}>COMEX</Text>
                            <Text style={styles.marginRowValue}>{(dynamicMarginBySegment.COMEX || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const normKey = normalizeSymbol(item.name);
        const cleanSym = (item.name || item.symbol || '').includes(':') ? (item.name || item.symbol).split(':')[1] : (item.name || item.symbol || '');
        const cleanNorm = normalizeSymbol(cleanSym);
        const singlePrice = livePrices[normKey] || livePrices[cleanNorm] || livePrices[item.name] || livePrices[item.fullSymbol] || livePrices[item.symbol] || null;

        return (
            <View style={styles.section}>
                <TradeCard
                    trade={item}
                    livePrice={singlePrice}
                    meta={getInstrumentMeta(item.name, item.market)}
                    navigation={navigation}
                />
            </View>
        );
    };
    return (
        <ScreenWrapper>
            <FlatList
                data={aggregatedPositions}
                renderItem={renderItem}
                keyExtractor={(item) => item.name}
                ListHeaderComponent={renderHeader}
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💼</Text>
                        <Text style={styles.emptyTitle}>No Active Positions</Text>
                        <Text style={styles.emptySubtext}>Open trades will appear here with live P/L</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#E8E8E8',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    unifiedCard: {
        backgroundColor: 'rgba(11, 27, 44, 0.88)',
        borderRadius: 14,
        padding: 16,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,

    },
    topItem: {
        flex: 1,
        paddingHorizontal: 6,
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.4,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    divider: {
        height: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginVertical: 8,
    },
    marginSection: {
        marginTop: 4,
    },
    marginRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 3,
    },
    marginTitleText: {
        color: '#E8E8E8',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    marginRowLabel: {
        color: '#CBD5E1',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    marginRowValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    cardsGrid: {
        flexDirection: 'row',
        gap: 0,
    },
    statCard: {
        backgroundColor: 'rgba(142, 87, 87, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    cardLabel: {
        color: '#94A3B8',
        fontSize: 12.5,
        fontWeight: '600',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    segmentCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    segmentTitle: {
        color: '#E8E8E8',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
        marginBottom: 14,
    },
    segmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    },
    segmentLabel: {
        color: '#CBD5E1',
        fontSize: 14.5,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    segmentValue: {
        fontSize: 15.5,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    tradeCard: {
        backgroundColor: 'rgba(11, 27, 44, 0.88)',
        borderRadius: 14,
        padding: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        marginBottom: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        fontSize: 38,
        marginBottom: 10,
    },
    emptyTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        textAlign: 'center',
    },
    tradeHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    tradeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tradeLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tradeLabel: {
        color: '#4CAF50',
        fontSize: 12.5,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderRadius: 6,
        letterSpacing: 0.3,
    },
    qtyBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    tradeQty: {
        color: '#CBD5E1',
        fontSize: 12.5,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    tradeMargin: {
        color: '#94A3B8',
        fontSize: 12.5,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    marginSection2: {
        alignItems: 'flex-end',
    },
    marginLabel2: {
        color: '#94A3B8',
        fontSize: 12.5,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    marginValue2: {
        color: '#E8E8E8',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tradeDetails: {
        marginBottom: 12,
    },
    tradeName: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    priceInfoContainer: {
        flexDirection: 'column',
        marginTop: 2,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
    },
    priceLabel: {
        color: '#94A3B8',
        fontSize: 13.5,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    priceValue: {
        color: '#E8E8E8',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    executedFromPendingBadge: {
        backgroundColor: 'rgba(0, 200, 255, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 200, 255, 0.3)',
    },
    executedFromPendingText: {
        color: '#00C8FF',
        fontSize: 11.5,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    tradePriceInfo: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    tradeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    plContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plLabel: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#E8E8E8',
        letterSpacing: 0.3,
    },
    plValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FF6B5B',
        letterSpacing: 0.3,
    },
    tradePL: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FF6B5B',
        letterSpacing: 0.3,
    },
    closeButton: {
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    closeButtonText: {
        color: '#1a1a1a',
        fontSize: 13.5,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});

export default PortfolioScreen;
