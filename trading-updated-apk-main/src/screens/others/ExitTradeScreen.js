import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTrades, normalizeSymbol, INSTRUMENT_META, formatScriptSymbol } from '../../context/TradeContext';
import { calculateEquityPnL, calculateMcxPnL } from '../../utils/equityPnL';
import { calculateUsdPnL } from '../../utils/usdPnL';
import { isMcxSymbol } from '../../utils/segmentMargin';

import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import FluctuatingPrice from '../../components/FluctuatingPrice';
import TradeSuccessPopup from '../../components/TradeSuccessPopup';
import TradeWarningPopup from '../../components/TradeWarningPopup';

const ExitTradeScreen = ({ route, navigation }) => {
    const { trade } = route.params || {};
    const { closeTrade, livePrices, getInstrumentMeta, addNotification, watchlist, fetchInitialData, userConfig } = useTrades();
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    };

    if (!trade) return null;

    const meta = getInstrumentMeta(trade.name, trade.market);
    const normKey = normalizeSymbol(trade.name);
    const cleanSym = (trade.name || trade.symbol || '').includes(':') ? (trade.name || trade.symbol).split(':')[1] : (trade.name || trade.symbol || '');
    const cleanNorm = normalizeSymbol(cleanSym);
    const liveData = livePrices[normKey] || livePrices[cleanNorm] || livePrices[trade.name] || livePrices[trade.fullSymbol] || livePrices[trade.symbol] || { ltp: 0, bid: 0, ask: 0 };
    const livePrice = liveData.ltp || parseFloat(trade.entryPrice);
    const entryPrice = trade.avgPrice !== undefined && trade.avgPrice !== null ? Number(trade.avgPrice) : parseFloat(trade.entryPrice || 0);
    const effectiveQty = Math.abs(trade.netQty !== undefined ? trade.netQty : parseInt(trade.qty || 1));
    const qty = effectiveQty;
    const isBuy = trade.type === 'BUY';
    const displayName = formatScriptSymbol(trade);

    // Get multiplier directly from INSTRUMENT_META (hardcoded standard values, not dynamic config)
    // Sort by length (longest first) to match specific names (MGOLD) before generic ones (GOLD)
    const upperTradeName = (trade.name || '').toUpperCase();
    const baseSymbol = Object.keys(INSTRUMENT_META)
        .sort((a, b) => b.length - a.length)
        .find(key => upperTradeName.includes(key));

    const hardcodedMultiplier = baseSymbol && INSTRUMENT_META[baseSymbol] ? INSTRUMENT_META[baseSymbol].multiplier : null;
    const dbLotSize = Number(trade.lot_size) || 1;
    const effectiveLotSize = hardcodedMultiplier && hardcodedMultiplier > 1 ? hardcodedMultiplier : (dbLotSize > 1 ? dbLotSize : (meta?.multiplier || 1));
    const instrumentMultiplier = effectiveLotSize;

    const isUsdSegment = trade.is_usd_segment || (trade.market === 'COMMODITY') || (trade.market === 'COMEX') || (trade.market === 'FOREX') || (trade.market === 'CRYPTO');
    const isCommodity = isUsdSegment;
    const usdInr = Number(trade.usdinr_value) || 95.1;

    // Find live market data for this instrument
    const marketData = watchlist.find(item => {
        const itemNorm = normalizeSymbol(item.name);
        return itemNorm === normKey || itemNorm === cleanNorm || item.name === trade.name || item.name === cleanSym;
    }) || {};

    // Use live values if available
    const liveHigh = marketData.high && marketData.high !== '0' ? marketData.high : livePrice.toFixed(2);
    const liveLow = marketData.low && marketData.low !== '0' ? marketData.low : livePrice.toFixed(2);
    const liveOpen = marketData.open && marketData.open !== '0' ? marketData.open : livePrice.toFixed(2);
    const liveClose = marketData.close && marketData.close !== '0' ? marketData.close : livePrice.toFixed(2);
    const liveVolume = marketData.volume && marketData.volume !== '0' ? marketData.volume : '0';
    const liveOI = marketData.oi && marketData.oi !== '0' ? marketData.oi : '0';
    // Change as absolute value (Current - Previous Close)
    const prevCloseNum = parseFloat(liveClose) || parseFloat(livePrice) || 0;
    const currentPriceNum = parseFloat(livePrice) || 0;
    const changeValue = currentPriceNum - prevCloseNum;
    const liveChange = isNaN(changeValue) ? '0.00' : changeValue.toFixed(2);

    // Use consistent bid/ask from socket
    const bidValue = liveData.bid || livePrice;
    const askValue = liveData.ask || livePrice;

    // Use BID for BUY exit (selling at bid), ASK for SELL exit (buying at ask)
    const exitPrice = isBuy ? bidValue : askValue;

    // Real market data only - no fake/calculated values
    const bidQty = marketData.bidQty || liveData.bidQty || null;
    const askQty = marketData.askQty || liveData.askQty || null;
    const lastQty = marketData.lastQty || liveData.lastQty || null;
    const priceNum = parseFloat(livePrice) || 0;
    const bidNum = parseFloat(bidValue) || priceNum;
    const askNum = parseFloat(askValue) || priceNum;
    const upperCircuit = marketData.upperCircuit || null;
    const lowerCircuit = marketData.lowerCircuit || null;
    const atp = marketData.atp || null;

    const isMcxTrade = (trade.market === 'MCX') || (trade.market_type === 'MCX') || isMcxSymbol(trade.name || trade.symbol || '');
    const isAggregated = (trade.tradeIds && trade.tradeIds.length > 0) || trade.netQty !== undefined;

    const usdInrLive = livePrices['USD/INR'] || livePrices['USDINR'] || livePrices['USD_INR'] || livePrices['USD_INR'];
    const usdLiveBid = usdInrLive ? parseFloat(usdInrLive.bid) || null : null;
    const usdLiveAsk = usdInrLive ? parseFloat(usdInrLive.ask) || null : null;

    let rawPl = 0;
    if (isUsdSegment) {
        const usdRes = calculateUsdPnL({
            symbol: trade.name || trade.symbol,
            type: trade.type || (isBuy ? 'BUY' : 'SELL'),
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            qty: effectiveQty,
            qtyInput: isAggregated ? effectiveQty : trade.qty_input,
            lotSize: effectiveLotSize,
            fallbackUsdInr: usdInr,
            liveBid: usdLiveBid,
            liveAsk: usdLiveAsk
        });
        rawPl = usdRes.pnlInr;
    } else if (isMcxTrade) {
        rawPl = calculateMcxPnL({
            type: trade.type || (isBuy ? 'BUY' : 'SELL'),
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            qty: effectiveQty,
            qtyInput: isAggregated ? effectiveQty : trade.qty_input,
            lotSize: effectiveLotSize
        });
    } else {
        rawPl = calculateEquityPnL({
            type: trade.type || (isBuy ? 'BUY' : 'SELL'),
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            qty: effectiveQty,
            qtyInput: isAggregated ? undefined : trade.qty_input,
            actualQty: trade.actual_qty ? (isAggregated ? effectiveQty : trade.actual_qty) : effectiveQty,
            lotSize: effectiveLotSize,
            tradeMode: trade.trade_mode,
            equityUnitsMode: trade.equity_units_mode
        });
    }

    const pl = rawPl;
    const isProfit = pl >= 0;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleExit = async () => {
        if (isLoading) return;

        // Check dynamic min hold time constraint
        const symStr = (trade.symbol || trade.name || '').toUpperCase();
        const market = (trade.market || trade.market_type || '').toUpperCase();
        let minTimeSeconds = 0;
        if (userConfig) {
            if (symStr.endsWith('CE') || symStr.endsWith('PE') || market === 'OPTIONS' || market.includes('OPT')) {
                minTimeSeconds = parseInt(userConfig.optionsMinTimeToBookProfit || 0);
            } else if (market === 'MCX') {
                minTimeSeconds = parseInt(userConfig.mcxMinTimeToBookProfit || 0);
            } else if (market === 'EQUITY' || market === 'NSE' || market === 'NFO') {
                minTimeSeconds = parseInt(userConfig.equityMinTimeToBookProfit || 0);
            } else if (market === 'CRYPTO') {
                minTimeSeconds = parseInt(userConfig.cryptoConfig?.minTimeToBookProfit || userConfig.cryptoMinTimeToBookProfit || 0);
            } else if (market === 'FOREX') {
                minTimeSeconds = parseInt(userConfig.forexConfig?.minTimeToBookProfit || userConfig.forexMinTimeToBookProfit || 0);
            } else if (market === 'COMEX' || market === 'COMMODITY') {
                minTimeSeconds = parseInt(userConfig.comexConfig?.minTimeToBookProfit || userConfig.comexMinTimeToBookProfit || 0);
            }
            if (!minTimeSeconds) {
                minTimeSeconds = parseInt(userConfig.min_time_to_book_profit || userConfig.minTimeToBookProfit || 0);
            }
        }

        if (minTimeSeconds > 0) {
            const rawTime = trade.latestEntryTimeRaw || trade.entryTimeRaw || trade.entry_time || trade.time;
            let entryMs = null;
            if (rawTime) {
                if (rawTime instanceof Date) entryMs = rawTime.getTime();
                else if (typeof rawTime === 'number') entryMs = rawTime;
                else if (typeof rawTime === 'string') {
                    let clean = rawTime.trim();
                    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
                        entryMs = new Date(clean.replace(' ', 'T')).getTime();
                    } else {
                        const dmy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2}):(\d{2})(?:\s*(am|pm))?/i);
                        if (dmy) {
                            let [_, d, m, y, h, min, s, ampm] = dmy;
                            let hr = parseInt(h, 10);
                            if (ampm) {
                                if (ampm.toLowerCase() === 'pm' && hr < 12) hr += 12;
                                if (ampm.toLowerCase() === 'am' && hr === 12) hr = 0;
                            }
                            entryMs = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${String(hr).padStart(2, '0')}:${min.padStart(2, '0')}:${s.padStart(2, '0')}`).getTime();
                        } else {
                            entryMs = new Date(clean).getTime();
                        }
                    }
                }
            }

            if (entryMs && !isNaN(entryMs)) {
                let secondsHeld = Math.floor((Date.now() - entryMs) / 1000);
                if (secondsHeld >= 18000 && secondsHeld <= 21600) secondsHeld -= 19800;
                else if (secondsHeld <= -18000 && secondsHeld >= -21600) secondsHeld += 19800;
                if (secondsHeld < 0) secondsHeld = 0;

                if (secondsHeld < minTimeSeconds) {
                    const remaining = minTimeSeconds - secondsHeld;
                    setWarningMessage(`Minimum hold time is ${minTimeSeconds} seconds. Please wait ${remaining} more second(s).`);
                    setWarningVisible(true);
                    setIsLoading(false);
                    return;
                }
            }
        }

        // Optimistic Flow: Move to success immediately
        setIsLoading(true);
        setError(null);

        try {
            const exitTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const ids = trade.tradeIds || trade.id;

            // Pass calculated P/L to backend so it stores the exact P/L shown to user
            await closeTrade(ids, exitPrice.toFixed(2), exitTime, pl.toFixed(2));

            // Hide loading and show success immediately
            setIsLoading(false);
            setModalVisible(true);

            // Silently add notification
            addNotification({
                title: 'Trade Closed',
                message: `${displayName} position was closed at ${exitPrice.toFixed(2)}. P/L: ${pl.toFixed(2)}`,
                type: isProfit ? 'success' : 'alert'
            });
        } catch (err) {
            console.log('Exit failed:', err.message);
            setIsLoading(false);
            setError(null);
            setWarningMessage(err.message || 'Failed to close trade. Please try again.');
            setWarningVisible(true);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        navigation.popToTop();
        navigation.navigate('Main', {
            screen: 'Trades',
            params: {
                screen: 'TradesHome',
                params: { initialTab: 'Closed' }
            }
        });
    };

    return (
        <ScreenWrapper>
            <ScreenHeader title="Exit Trade" showBackButton />

            {/* Symbol Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.symbolTitle}>{displayName}</Text>
            </View>

            {/* Exit Button */}
            <TouchableOpacity
                style={[
                    styles.exitButton,
                    {
                        backgroundColor: isProfit ? '#2E7D32' : '#C62828',
                        opacity: isLoading ? 0.9 : 1
                    }
                ]}
                onPress={handleExit}
                disabled={isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <View style={styles.loadingInner}>
                        <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
                        <Text style={styles.exitButtonText}>CLOSING POSITION...</Text>
                    </View>
                ) : (
                    <FluctuatingPrice
                        value={`EXIT ${isBuy ? 'BUY' : 'SELL'} — ${isProfit ? 'PROFIT' : 'LOSS'} ${Math.abs(pl).toFixed(2)}`}
                        showLabel={false}
                        textStyle={styles.exitButtonText}
                    />
                )}
            </TouchableOpacity>

            {/* Market Depth / Stats */}
            <ScrollView
                contentContainerStyle={styles.statsContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
            >
                <View style={styles.statsGrid}>
                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <FluctuatingPrice
                                label="Bid"
                                value={bidValue}
                                numericValue={parseFloat(bidValue)}
                                textStyle={styles.statText}
                            />
                        </View>
                        <View style={styles.colRight}>
                            <FluctuatingPrice
                                label="Ask"
                                value={askValue}
                                numericValue={parseFloat(askValue)}
                                textStyle={styles.statText}
                            />
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <FluctuatingPrice
                                label="Last"
                                value={livePrice.toFixed(2)}
                                numericValue={livePrice}
                                textStyle={styles.statText}
                            />
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.statLabelRight} numberOfLines={1}>Change : {liveChange}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <FluctuatingPrice
                                label="High"
                                value={liveHigh}
                                numericValue={parseFloat(liveHigh)}
                                textStyle={styles.statText}
                            />
                        </View>
                        <View style={styles.colRight}>
                            <FluctuatingPrice
                                label="Low"
                                value={liveLow}
                                numericValue={parseFloat(liveLow)}
                                textStyle={styles.statText}
                            />
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <FluctuatingPrice
                                label="Open"
                                value={liveOpen}
                                numericValue={parseFloat(liveOpen)}
                                textStyle={styles.statText}
                            />
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.statLabelRight} numberOfLines={1}>Bid Qty : {bidQty || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <FluctuatingPrice
                                label="Close"
                                value={liveClose}
                                numericValue={parseFloat(liveClose)}
                                textStyle={styles.statText}
                            />
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.statLabelRight} numberOfLines={1}>Ask Qty : {askQty || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <FluctuatingPrice
                                label="Volume"
                                value={liveVolume}
                                numericValue={parseFloat(liveVolume)}
                                textStyle={styles.statText}
                            />
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.statLabelRight} numberOfLines={1}>Last Traded Qty : {lastQty || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <Text style={styles.statLabel} numberOfLines={1}>Upper ckt : {upperCircuit || '-'}</Text>
                        </View>
                        <View style={styles.colRight}>
                            <FluctuatingPrice
                                label="Open Interest"
                                value={liveOI}
                                numericValue={parseFloat(liveOI)}
                                textStyle={[styles.statText, styles.boldOI]}
                            />
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft}>
                            <Text style={styles.statLabel} numberOfLines={1}>Atp : {atp || '-'}</Text>
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.statLabelRight} numberOfLines={1}>Lower ckt : {lowerCircuit || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.colLeft} />
                        <View style={styles.colRight}>
                            <Text style={styles.statLabelRight} numberOfLines={1}>Lot Size : {instrumentMultiplier}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Custom Styled Success Banner/Popup */}
            <TradeSuccessPopup
                visible={modalVisible}
                title="Success"
                message={`${isBuy ? 'Sold' : 'Bought'} ${qty} lots of ${displayName} at ${livePrice.toFixed(2)}`}
                buttonText="OK"
                onConfirm={handleModalClose}
            />

            {/* Custom Warning Modal */}
            <TradeWarningPopup
                visible={warningVisible}
                title="Action Restricted"
                message={warningMessage}
                onConfirm={() => setWarningVisible(false)}
            />
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F3D3E',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: 'black',
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    symbolTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    exitButton: {
        marginHorizontal: 15,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    exitButtonDisabled: {
        opacity: 0.8,
    },
    loadingInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    exitButtonText: {
        color: 'white',
        fontSize: 19.5,
        fontWeight: 'bold',
    },
    statsContainer: {
        paddingHorizontal: 22,
        paddingBottom: 25,
    },
    statsGrid: {
        marginTop: 10,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    colLeft: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    colRight: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    statLabel: {
        color: '#B0BEC5',
        fontSize: 17.5,
        fontWeight: '500',
        textAlign: 'left',
    },
    statLabelRight: {
        color: '#B0BEC5',
        fontSize: 17.5,
        fontWeight: '500',
        textAlign: 'right',
    },
    statText: {
        color: 'white',
        fontSize: 17.5,
        fontWeight: '700',
    },
    boldOI: {
        fontWeight: '900',
    }
});

export default ExitTradeScreen;
