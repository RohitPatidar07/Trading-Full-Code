import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ImageBackground,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Edit2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useTrades, formatScriptSymbol, normalizeSymbol } from '../../context/TradeContext';
import { calculateSegmentMargin } from '../../utils/segmentMargin';
import { modifyPendingOrder } from '../../services/api';

const { width } = Dimensions.get('window');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatTradeDate = (dateVal, fallback) => {
    if (!dateVal) return fallback || '';
    try {
        let clean = typeof dateVal === 'string' ? dateVal.trim() : '';

        if (clean) {
            // If already in DD Mon, h:mm:ss a format (e.g. '07 Jul, 8:11:40 pm')
            if (/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s*/i.test(clean)) {
                return clean;
            }

            // Check if matches DD/MM/YYYY, h:mm:ss a or DD/MM/YY, h:mm:ss a
            const ddmmyyyyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:,\s*|\s+)(.*)$/);
            if (ddmmyyyyMatch) {
                const day = ddmmyyyyMatch[1].padStart(2, '0');
                const mNum = parseInt(ddmmyyyyMatch[2], 10);
                const monthName = MONTHS[mNum - 1] || 'Jan';
                const timePart = ddmmyyyyMatch[4] ? ddmmyyyyMatch[4].trim() : '';
                return timePart ? `${day} ${monthName}, ${timePart}` : `${day} ${monthName}`;
            }
        }

        let d = dateVal;
        if (typeof dateVal === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
                d = new Date(clean.replace(' ', 'T'));
            } else {
                d = new Date(clean);
            }
        } else if (typeof dateVal === 'number') {
            d = new Date(dateVal);
        }

        if (!d || isNaN(d.getTime())) {
            return clean || String(dateVal);
        }

        const day = String(d.getDate()).padStart(2, '0');
        const monthName = MONTHS[d.getMonth()] || 'Jan';
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        return `${day} ${monthName}, ${hours}:${minutes}:${seconds} ${ampm}`;
    } catch (e) {
        return String(dateVal);
    }
};

const getTradeTimestampMs = (rawTime) => {
    if (!rawTime) return 0;
    if (rawTime instanceof Date) return rawTime.getTime();
    if (typeof rawTime === 'number') return rawTime;
    if (typeof rawTime === 'string') {
        const clean = rawTime.trim();
        if (!clean) return 0;
        if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
            const ms = new Date(clean.replace(' ', 'T')).getTime();
            if (!isNaN(ms)) return ms;
        }
        const ddmmyyyyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:,\s*|\s+)?(.*)$/);
        if (ddmmyyyyMatch) {
            const day = parseInt(ddmmyyyyMatch[1], 10);
            const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
            const yearStr = ddmmyyyyMatch[3];
            const year = parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr, 10);
            const timePart = ddmmyyyyMatch[4] ? ddmmyyyyMatch[4].trim() : '';
            if (timePart) {
                const tMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i);
                if (tMatch) {
                    let hrs = parseInt(tMatch[1], 10);
                    const mins = parseInt(tMatch[2], 10);
                    const secs = tMatch[3] ? parseInt(tMatch[3], 10) : 0;
                    const ampm = tMatch[4] ? tMatch[4].toLowerCase() : null;
                    if (ampm === 'pm' && hrs < 12) hrs += 12;
                    if (ampm === 'am' && hrs === 12) hrs = 0;
                    const ms = new Date(year, month, day, hrs, mins, secs).getTime();
                    if (!isNaN(ms)) return ms;
                }
            }
            const ms = new Date(year, month, day).getTime();
            if (!isNaN(ms)) return ms;
        }
        const ms = new Date(clean).getTime();
        if (!isNaN(ms)) return ms;
    }
    return 0;
};

const formatTradePrice = (val) => {
    if (val === undefined || val === null || val === '') return '0';
    let s = String(val).trim();
    if (s.includes('.')) {
        // Strip trailing zeros after the decimal point
        // Keeps actual decimal values like 15200.1432 full, but cleans 15200.9000 -> 15200.9 and 4128.3400 -> 4128.34
        s = s.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
    }
    return s;
};

const getRemarkStyle = (remark) => {
    const text = (remark || '').toUpperCase();
    if (text.includes('LOSS') || text.includes('SL') || text.includes('STOP LOSS')) {
        return {
            badge: {
                backgroundColor: 'rgba(239, 83, 80, 0.15)',
                borderColor: 'rgba(239, 83, 80, 0.4)',
                borderWidth: 0.5,
            },
            text: {
                color: '#EF5350',
            }
        };
    }
    if (text.includes('TARGET') || text.includes('PROFIT')) {
        return {
            badge: {
                backgroundColor: 'rgba(74, 186, 120, 0.15)',
                borderColor: 'rgba(74, 186, 120, 0.4)',
                borderWidth: 0.5,
            },
            text: {
                color: '#4ABA78',
            }
        };
    }
    if (text.includes('MARGIN') || text.includes('EXPIRY') || text.includes('ROLLOVER') || text.includes('CLOSE') || text.includes('INSUFFICIENT') || text.includes('INSUFICENT')) {
        return {
            badge: {
                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                borderColor: 'rgba(255, 152, 0, 0.4)',
                borderWidth: 0.5,
            },
            text: {
                color: '#FF9800',
            }
        };
    }
    return {
        badge: {
            backgroundColor: 'rgba(1, 180, 234, 0.15)',
            borderColor: 'rgba(1, 180, 234, 0.4)',
            borderWidth: 0.5,
        },
        text: {
            color: '#01B4EA',
        }
    };
};

const TradeItem = ({ item, activeTab, livePrice, meta, onOpenCloseModal, onCancel, onSetTargetSL, onEdit }) => {
    const isActive = activeTab === 'Active';
    const isPending = activeTab === 'Pending';
    const isClosed = activeTab === 'Closed';

    const { userConfig } = useTrades();

    const qty = Math.abs(item.qty || 1);
    const entry = parseFloat(item.entryPrice || 0);

    const isUnitMode = userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true;

    let displayMarginUsed = calculateSegmentMargin({
        marketType: item.market || item.marketType || item.market_type || 'MCX',
        symbol: item.symbol || item.name || '',
        price: entry,
        qty: qty,
        lotSize: item.lot_size || meta?.multiplier || 1,
        isHolding: false,
        clientConfig: userConfig || {},
        isUnitMode: isUnitMode
    });

    let holdingMargin = calculateSegmentMargin({
        marketType: item.market || item.marketType || item.market_type || 'MCX',
        symbol: item.symbol || item.name || '',
        price: entry,
        qty: qty,
        lotSize: item.lot_size || meta?.multiplier || 1,
        isHolding: true,
        clientConfig: userConfig || {},
        isUnitMode: isUnitMode
    });

    if (displayMarginUsed <= 0 && parseFloat(item.margin_used || 0) > 0) {
        displayMarginUsed = parseFloat(item.margin_used);
    }
    if (holdingMargin <= 0 && displayMarginUsed > 0) {
        holdingMargin = displayMarginUsed;
    }

    // Formatting name cleanly across all contract types
    const formattedName = formatScriptSymbol(item);

    // Handle livePrice being an object {ltp, bid, ask} or a number, with fallback to item.ltp
    const currentLtp = (typeof livePrice === 'object' ? livePrice.ltp : livePrice) || (item.ltp && item.ltp > 0 ? item.ltp : 0);

    if (isClosed) {
        // Use stored P/L from database (calculated at the exact moment of exit on frontend)
        const pnlValue = parseFloat(item.pnl || 0);
        const brokerage = Math.abs(parseFloat(item.brokerage || 0));
        const isNeg = pnlValue < 0;

        const entryTimeString = formatTradeDate(item.entryTimeRaw || item.entry_time || item.time, '07 Jul, 8:11:40 pm');
        const exitTimeString = formatTradeDate(item.exitTimeRaw || item.exit_time || item.exitTime, '08 Jul, 1:03:59 am');

        return (
            <View style={styles.tradeItem}>
                {/* Row 1: Symbol Name + PnL Badge + QTY Badge */}
                <View style={styles.closedHeader}>
                    <Text style={styles.symbolName} numberOfLines={1}>{formattedName}</Text>
                    <View style={styles.closedBadges}>
                        <View style={[styles.pnlBadge, { backgroundColor: isNeg ? '#FFCDD2' : '#C8E6C9' }]}>
                            <Text style={[styles.pnlBadgeText, { color: isNeg ? '#D32F2F' : '#2E7D32' }]}>
                                {pnlValue.toFixed(2)} / -{brokerage.toFixed(2)}
                            </Text>
                        </View>
                        <View style={[styles.qtyBadge, { backgroundColor: isNeg ? '#FFCDD2' : '#C8E6C9' }]}>
                            <Text style={[styles.qtyBadgeText, { color: isNeg ? '#D32F2F' : '#2E7D32' }]}>QTY:{item.qty || '1'}</Text>
                        </View>
                    </View>
                </View>

                {/* Row 2: Prices Row */}
                <View style={styles.closedPricesRow}>
                    <View style={styles.priceInfo}>
                        <Text style={styles.priceLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                            {item.type === 'BUY' ? `Bought By ${item.username || 'trader'}` : `Sold By ${item.username || 'trader'}`}
                        </Text>
                        <View style={styles.priceBoxRed}>
                            <Text style={styles.priceBoxText}>{formatTradePrice(item.entryPrice)}</Text>
                        </View>
                    </View>
                    <View style={styles.priceInfoRight}>
                        <Text style={styles.priceLabelRight} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                            {item.type === 'BUY'
                                ? `Sold By ${item.closed_by || 'trader'}`
                                : `Bought By ${item.closed_by || 'trader'}`}
                        </Text>
                        <View style={styles.priceBoxGreen}>
                            <Text style={styles.priceBoxText}>{formatTradePrice(item.exitPrice)}</Text>
                        </View>
                    </View>
                </View>

                {/* Row 3: Remark Badge (if present) */}
                {item.closeRemark && (() => {
                    const rStyle = getRemarkStyle(item.closeRemark);
                    return (
                        <View style={[styles.executedFromPendingBadge, rStyle.badge, { marginTop: 2, marginBottom: 6 }]}>
                            <Text style={[styles.executedFromPendingText, rStyle.text]}>● {item.closeRemark}</Text>
                        </View>
                    );
                })()}

                {/* Row 4: Timestamps Row */}
                <View style={styles.closedTimeRow}>
                    <Text style={styles.timeValue} numberOfLines={1}>{entryTimeString}</Text>
                    <Text style={styles.timeValueRight} numberOfLines={1}>{exitTimeString}</Text>
                </View>

                <View style={styles.divider} />
            </View>
        );
    }

    // --- PENDING TRADE UI ---
    if (isPending) {
        return (
            <View style={styles.pendingTradeItem}>
                {/* Row 1: Symbol Name | Price */}
                <View style={styles.pendingRow1}>
                    <Text style={styles.pendingSymbolName} numberOfLines={1} ellipsizeMode="tail">{formattedName}</Text>
                    <Text style={styles.pendingPriceText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        {formatTradePrice(item.entryPrice)}
                    </Text>
                </View>

                {/* Target / SL Order Badge */}
                {item.isTargetSLOrder && (
                    <View style={[
                        styles.executedFromPendingBadge,
                        { backgroundColor: 'rgba(74, 186, 120, 0.15)', borderColor: 'rgba(74, 186, 120, 0.4)', marginTop: 4, marginBottom: 4, alignSelf: 'flex-start' }
                    ]}>
                        <Text style={[styles.executedFromPendingText, { color: '#4ABA78', fontWeight: 'bold' }]}>
                            ● 🎯 Target / SL Order (Exit Order)
                        </Text>
                    </View>
                )}

                {/* Row 2: Buy/Sell Qty, Time | Edit & Cancel Buttons */}
                <View style={styles.pendingRow2}>
                    <View style={styles.pendingRow2Left}>
                        <Text style={styles.pendingTypeQty} numberOfLines={1}>{item.type === 'BUY' ? 'Bought' : 'Sold'} X {item.qty}</Text>
                        <Text style={styles.pendingTime} numberOfLines={1}>
                            {formatTradeDate(item.entryTimeRaw || item.entry_time || item.time, item.time || '17:17:39')}
                        </Text>
                    </View>
                    <View style={styles.pendingActionButtons}>
                        <TouchableOpacity
                            style={styles.pendingEditBtn}
                            onPress={onEdit}
                            activeOpacity={0.7}
                        >
                            <Edit2 size={15} color="white" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.pendingCancelBtn}
                            onPress={onCancel}
                            activeOpacity={0.7}
                        >
                            <X size={15} color="white" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Row 3: Target/SL / Limit Price & Margin Required */}
                <View style={styles.pendingRow3}>
                    {item.isTargetSLOrder ? (
                        <View style={{ flexDirection: 'row', gap: 14 }}>
                            {item.displayTarget ? (
                                <View>
                                    <Text style={styles.pendingInfoLabel}>Target Price</Text>
                                    <Text style={[styles.pendingInfoValue, { color: '#4ABA78' }]} numberOfLines={1}>
                                        ₹{formatTradePrice(item.displayTarget)}
                                    </Text>
                                </View>
                            ) : null}
                            {item.displaySL ? (
                                <View>
                                    <Text style={styles.pendingInfoLabel}>Stop Loss Price</Text>
                                    <Text style={[styles.pendingInfoValue, { color: '#EF5350' }]} numberOfLines={1}>
                                        ₹{formatTradePrice(item.displaySL)}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <View style={styles.pendingColLeft}>
                            <Text style={styles.pendingInfoLabel}>Limit Price</Text>
                            <Text style={styles.pendingInfoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                                {formatTradePrice(item.entryPrice)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.pendingColRight}>
                        <Text style={styles.pendingInfoLabelRight}>Margin Required</Text>
                        <Text style={styles.pendingInfoValueRight} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                            {parseFloat(displayMarginUsed || 0).toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Row 4: Holding Margin Required */}
                <View style={styles.pendingRow4}>
                    <Text style={styles.pendingHoldingText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        Holding Margin Required{' '}
                        <Text style={styles.pendingHoldingValue}>
                            {parseFloat(holdingMargin || 0).toFixed(2)}
                        </Text>
                    </Text>
                </View>

                <View style={styles.pendingDivider} />
            </View>
        );
    }

    // --- ACTIVE TRADE UI ---
    const activeTimeString = formatTradeDate(item.entryTimeRaw || item.entry_time || item.time, item.time || '17:17:39');
    const targetVal = item.target || item.target_price;
    const slVal = item.stop_loss || item.stopLoss || item.sl;
    const hasTargetOrSL = !!(targetVal || slVal);

    return (
        <View style={styles.tradeItem}>
            {/* Row 1: Symbol Name (Left) + LTP (Right) */}
            <View style={styles.activeRow1}>
                <Text style={styles.symbolName} numberOfLines={1}>{formattedName}</Text>
                <Text style={styles.ltpText}>{currentLtp ? currentLtp.toFixed(2) : '---'}</Text>
            </View>

            {/* Row 2: Type/Qty Badge (Left) + Close Trade Button (Right) */}
            <View style={styles.activeRow2}>
                <View style={[styles.boughtBadge, item.type === 'SELL' && styles.soldBadge]}>
                    <Text style={[styles.boughtBadgeText, item.type === 'SELL' && styles.soldBadgeText]}>
                        {item.type === 'BUY' ? 'Bought' : 'Sold'} X {item.qty || 1}
                    </Text>
                </View>
                <TouchableOpacity style={styles.closeTradeBtn} onPress={onOpenCloseModal}>
                    <Text style={styles.closeTradeBtnText}>Close Trade</Text>
                </TouchableOpacity>
            </View>

            {/* Row 3: Entry Price (Left) + Set Target/SL Button (Right) */}
            <View style={styles.activeRow3}>
                <Text style={styles.traderText}>
                    {`${item.type === 'BUY' ? 'Bought' : 'Sold'} at ${formatTradePrice(item.entryPrice)}`}
                </Text>
                <TouchableOpacity style={styles.setTargetBtn} onPress={onSetTargetSL}>
                    <Text style={styles.setTargetBtnText}>{hasTargetOrSL ? 'Edit Target/SL' : 'Set Target/SL'}</Text>
                </TouchableOpacity>
            </View>

            {/* Row 4: Dedicated Execution Time (Left) + Target/SL Badges (Right if present) */}
            <View style={styles.activeRow4}>
                <Text style={styles.activeTimeText} numberOfLines={1}>
                    {activeTimeString}
                </Text>
                {hasTargetOrSL && (
                    <View style={styles.targetSlDisplayRow}>
                        {targetVal ? <Text style={styles.targetDisplayBadge}>Target: ₹{formatTradePrice(targetVal)}</Text> : null}
                        {slVal ? <Text style={styles.slDisplayBadge}>SL: ₹{formatTradePrice(slVal)}</Text> : null}
                    </View>
                )}
            </View>

            {/* Row 5: Margin Used (Left) + Holding Margin (Right) */}
            <View style={styles.activeMarginRow}>
                <Text style={styles.marginTextLeft} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    Margin Used: ₹{parseFloat(displayMarginUsed || 0).toFixed(2)}
                </Text>
                <Text style={styles.marginTextRight} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    Holding Margin: ₹{parseFloat(holdingMargin || 0).toFixed(2)}
                </Text>
            </View>

            {item.executedFromPending && (
                <View style={styles.executedFromPendingBadge}>
                    <Text style={styles.executedFromPendingText}>● Executed from Pending {item.type === 'BUY' ? 'Buy' : 'Sell'}</Text>
                </View>
            )}

            <View style={styles.divider} />
        </View>
    );
};

import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import TradeSuccessPopup from '../../components/TradeSuccessPopup';
import TradeWarningPopup from '../../components/TradeWarningPopup';

const TradesScreen = ({ navigation, route }) => {
    const { trades, cancelTrade, livePrices, getInstrumentMeta, setTargetSL, refreshTrades, userConfig } = useTrades();
    const [activeTab, setActiveTab] = useState('Pending'); // Match photo state

    React.useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params?.initialTab]);

    // Target/SL Modal State
    const [targetModalVisible, setTargetModalVisible] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [targetPrice, setTargetPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');

    // Cancel Confirmation Modal State
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [tradeToCancel, setTradeToCancel] = useState(null);

    // Edit Pending Order Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [tradeToEdit, setTradeToEdit] = useState(null);
    const [editQty, setEditQty] = useState('');
    const [editPrice, setEditPrice] = useState('');

    // Custom Styled Banner / Popup State
    const [successPopupVisible, setSuccessPopupVisible] = useState(false);
    const [successPopupTitle, setSuccessPopupTitle] = useState('');
    const [successPopupMessage, setSuccessPopupMessage] = useState('');
    const [warningPopupVisible, setWarningPopupVisible] = useState(false);
    const [warningPopupTitle, setWarningPopupTitle] = useState('');
    const [warningPopupMessage, setWarningPopupMessage] = useState('');

    const filteredTrades = React.useMemo(() => {
        if (activeTab === 'Pending') {
            const list = [];
            trades.forEach(t => {
                // 1. Standard pending entry orders
                if (t.isPending && !t.isCompleted && !t.exitPrice) {
                    list.push(t);
                }
                // 2. Active trades with Target / SL set (Combined into ONE card)
                if (!t.isPending && !t.isCompleted && !t.exitPrice) {
                    const targetVal = t.target || t.target_price;
                    const slVal = t.stop_loss || t.stopLoss || t.sl;
                    if (targetVal || slVal) {
                        list.push({
                            ...t,
                            id: `target_sl_${t.id}`,
                            parentTradeId: t.id,
                            isTargetSLOrder: true,
                            type: t.type === 'BUY' ? 'SELL' : 'BUY',
                            displayTarget: targetVal,
                            displaySL: slVal,
                            entryPrice: targetVal || slVal,
                            parentTrade: t
                        });
                    }
                }
            });
            return list;
        }
        if (activeTab === 'Active') {
            return trades.filter(t => !t.isCompleted && !t.isPending && !t.exitPrice);
        }
        if (activeTab === 'Closed') {
            return trades
                .filter(t => t.isCompleted || t.exitPrice)
                .sort((a, b) => {
                    const timeA = getTradeTimestampMs(a.exitTimeRaw || a.exit_time || a.exitTime || a.updated_at || a.updatedAt || a.entryTimeRaw || a.entry_time || a.time);
                    const timeB = getTradeTimestampMs(b.exitTimeRaw || b.exit_time || b.exitTime || b.updated_at || b.updatedAt || b.entryTimeRaw || b.entry_time || b.time);
                    if (timeB !== timeA) return timeB - timeA;
                    return (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0);
                });
        }
        return [];
    }, [trades, activeTab]);

    const getHoldTimeRemaining = (trade) => {
        if (!trade || !userConfig) return 0;
        const rawTime = trade.entryTimeRaw || trade.entry_time || trade.time;
        let entryMs = null;
        if (rawTime) {
            if (rawTime instanceof Date) entryMs = rawTime.getTime();
            else if (typeof rawTime === 'number') entryMs = rawTime;
            else if (typeof rawTime === 'string') {
                let clean = rawTime.trim();
                if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
                    entryMs = new Date(clean.replace(' ', 'T')).getTime();
                } else {
                    entryMs = new Date(clean).getTime();
                }
            }
        }
        if (!entryMs || isNaN(entryMs)) return 0;
        let secondsHeld = Math.floor((Date.now() - entryMs) / 1000);
        if (secondsHeld < 0) secondsHeld = 0;

        const seg = (trade.market || trade.market_type || '').toUpperCase();
        let minTime = parseInt(userConfig.min_time_to_book_profit || userConfig.minTimeToBookProfit || 0);
        if (seg === 'MCX') minTime = parseInt(userConfig.mcxMinTimeToBookProfit || minTime);
        else if (seg === 'OPTIONS') minTime = parseInt(userConfig.optionsMinTimeToBookProfit || minTime);
        else if (seg === 'EQUITY') minTime = parseInt(userConfig.equityMinTimeToBookProfit || minTime);

        if (minTime > 0 && secondsHeld < minTime) {
            return minTime - secondsHeld;
        }
        return 0;
    };

    const handleSetTargetSL = async () => {
        if (selectedTrade) {
            const remaining = getHoldTimeRemaining(selectedTrade);
            if (remaining > 0) {
                setTargetModalVisible(false);
                setTimeout(() => {
                    setWarningPopupTitle('Hold Time Warning');
                    setWarningPopupMessage(`Target/SL cannot be set during the active hold duration. Please wait ${remaining} more second(s).`);
                    setWarningPopupVisible(true);
                }, 300);
                return;
            }

            const entry = parseFloat(selectedTrade.entryPrice || selectedTrade.entry_price || 0);
            const isBuy = selectedTrade.type === 'BUY';
            const targetVal = targetPrice ? parseFloat(targetPrice) : null;
            const slVal = slPrice ? parseFloat(slPrice) : null;

            if (isBuy) {
                if (targetVal !== null && !isNaN(targetVal) && targetVal <= entry) {
                    setTargetModalVisible(false);
                    setTimeout(() => {
                        setWarningPopupTitle('Invalid Target Price');
                        setWarningPopupMessage(`For BUY trade at ${entry}, Target Price must be greater than entry price (${entry}).`);
                        setWarningPopupVisible(true);
                    }, 300);
                    return;
                }
                if (slVal !== null && !isNaN(slVal) && slVal >= entry) {
                    setTargetModalVisible(false);
                    setTimeout(() => {
                        setWarningPopupTitle('Invalid Stop Loss');
                        setWarningPopupMessage(`For BUY trade at ${entry}, Stop Loss must be less than entry price (${entry}).`);
                        setWarningPopupVisible(true);
                    }, 300);
                    return;
                }
            } else {
                if (targetVal !== null && !isNaN(targetVal) && targetVal >= entry) {
                    setTargetModalVisible(false);
                    setTimeout(() => {
                        setWarningPopupTitle('Invalid Target Price');
                        setWarningPopupMessage(`For SELL trade at ${entry}, Target Price must be less than entry price (${entry}).`);
                        setWarningPopupVisible(true);
                    }, 300);
                    return;
                }
                if (slVal !== null && !isNaN(slVal) && slVal <= entry) {
                    setTargetModalVisible(false);
                    setTimeout(() => {
                        setWarningPopupTitle('Invalid Stop Loss');
                        setWarningPopupMessage(`For SELL trade at ${entry}, Stop Loss must be greater than entry price (${entry}).`);
                        setWarningPopupVisible(true);
                    }, 300);
                    return;
                }
            }

            try {
                await setTargetSL(selectedTrade.id, targetPrice, slPrice);
                setTargetModalVisible(false);
                setTargetPrice('');
                setSlPrice('');
                setSelectedTrade(null);
                setTimeout(() => {
                    setSuccessPopupTitle('Target & Stop Loss Set');
                    setSuccessPopupMessage('Target and Stop Loss have been updated successfully.');
                    setSuccessPopupVisible(true);
                }, 300);
            } catch (err) {
                setTargetModalVisible(false);
                setTimeout(() => {
                    setWarningPopupTitle('Unable to Set Target/SL');
                    setWarningPopupMessage(err.message || 'An error occurred while updating Target/Stop Loss. Please try again.');
                    setWarningPopupVisible(true);
                }, 300);
            }
        }
    };

    const openTargetModal = (trade) => {
        const remaining = getHoldTimeRemaining(trade);
        if (remaining > 0) {
            setWarningPopupTitle('Hold Time Warning');
            setWarningPopupMessage(`Target/SL cannot be set during the active hold duration. Please wait ${remaining} more second(s).`);
            setWarningPopupVisible(true);
            return;
        }
        setSelectedTrade(trade);
        setTargetPrice(trade.target || trade.target_price ? String(trade.target || trade.target_price) : '');
        setSlPrice(trade.stop_loss || trade.stopLoss || trade.sl ? String(trade.stop_loss || trade.stopLoss || trade.sl) : '');
        setTargetModalVisible(true);
    };

    const handleCancelOrder = (trade) => {
        setTradeToCancel(trade);
        setCancelModalVisible(true);
    };

    const handleEditOrder = (trade) => {
        if (trade.isTargetSLOrder) {
            openTargetModal(trade.parentTrade || trade);
            return;
        }
        setTradeToEdit(trade);
        setEditQty((trade.qty || trade.quantity || 0).toString());
        setEditPrice((trade.entryPrice || trade.entry_price || trade.price || 0).toString());
        setEditModalVisible(true);
    };

    const confirmEditOrder = async () => {
        try {
            if (!editPrice) {
                setEditModalVisible(false);
                setTimeout(() => {
                    setWarningPopupTitle('Input Required');
                    setWarningPopupMessage('Please enter price.');
                    setWarningPopupVisible(true);
                }, 300);
                return;
            }

            if (!editQty) {
                setEditModalVisible(false);
                setTimeout(() => {
                    setWarningPopupTitle('Input Required');
                    setWarningPopupMessage('Please enter quantity.');
                    setWarningPopupVisible(true);
                }, 300);
                return;
            }

            const result = await modifyPendingOrder(
                tradeToEdit.id,
                parseInt(editQty),
                parseFloat(editPrice)
            );

            if (result) {
                setEditModalVisible(false);
                setTradeToEdit(null);
                setEditQty('');
                setEditPrice('');

                setTimeout(() => {
                    setSuccessPopupTitle('Order Modified');
                    setSuccessPopupMessage(result.message || 'Pending order modified successfully.');
                    setSuccessPopupVisible(true);
                }, 300);

                // Refresh trades list from server
                await refreshTrades();
            } else {
                setEditModalVisible(false);
                setTimeout(() => {
                    setWarningPopupTitle('Modification Failed');
                    setWarningPopupMessage('Failed to modify order: Unknown error');
                    setWarningPopupVisible(true);
                }, 300);
            }
        } catch (error) {
            console.error('❌ Error modifying order:', error);
            setEditModalVisible(false);
            setTimeout(() => {
                setWarningPopupTitle('Modification Error');
                setWarningPopupMessage(error.message || 'Error modifying order');
                setWarningPopupVisible(true);
            }, 300);
        }
    };

    const confirmCancelOrder = async () => {
        if (tradeToCancel) {
            try {
                // Handle Target/SL order cancellation
                if (tradeToCancel.isTargetSLOrder) {
                    await setTargetSL(tradeToCancel.parentTradeId, null, null);
                    setCancelModalVisible(false);
                    setTradeToCancel(null);

                    setTimeout(() => {
                        setSuccessPopupTitle('Target & SL Cancelled');
                        setSuccessPopupMessage('Target and Stop Loss cancelled successfully.');
                        setSuccessPopupVisible(true);
                    }, 300);
                    return;
                }

                // Await standard cancel operation to complete
                await cancelTrade(tradeToCancel.id);

                // Close modal after successful cancel
                setCancelModalVisible(false);
                setTradeToCancel(null);

                setTimeout(() => {
                    setSuccessPopupTitle('Order Cancelled');
                    setSuccessPopupMessage('Pending order cancelled successfully.');
                    setSuccessPopupVisible(true);
                }, 300);

                // Refresh trades to ensure UI is updated
                await refreshTrades();
            } catch (error) {
                console.error('Error cancelling order:', error);
                setCancelModalVisible(false);
                setTradeToCancel(null);
                setTimeout(() => {
                    setWarningPopupTitle('Cancel Failed');
                    setWarningPopupMessage(error.message || 'Failed to cancel order. Please try again.');
                    setWarningPopupVisible(true);
                }, 300);
            }
        }
    };

    return (
        <ScreenWrapper>
            <ScreenHeader title="Trades" />

            {/* Thin Black Tab Bar */}
            <View style={styles.tabBar}>
                {['Pending', 'Active', 'Closed'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTrades}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const normKey = normalizeSymbol(item.name);
                    const cleanSym = (item.name || item.symbol || '').includes(':') ? (item.name || item.symbol).split(':')[1] : (item.name || item.symbol || '');
                    const cleanNorm = normalizeSymbol(cleanSym);
                    const itemLivePrice = livePrices[normKey] || livePrices[cleanNorm] || livePrices[item.name] || livePrices[item.fullSymbol] || livePrices[item.symbol];

                    return (
                        <TradeItem
                            item={item}
                            activeTab={activeTab}
                            livePrice={itemLivePrice}
                            meta={getInstrumentMeta(item.name, item.market_type || item.market)}
                            onOpenCloseModal={() => navigation.navigate('ExitTrade', { trade: item })}
                            onCancel={() => handleCancelOrder(item)}
                            onSetTargetSL={() => openTargetModal(item)}
                            onEdit={() => handleEditOrder(item)}
                        />
                    );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {activeTab} Orders</Text>
                        <View style={styles.emptyDivider} />
                    </View>
                }
            />

            {/* Target/SL Modal */}
            <Modal
                visible={targetModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setTargetModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ width: '100%', alignItems: 'center' }}
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalText}>Set Target & Stop Loss</Text>
                                <Text style={[styles.passwordLabel, { fontSize: 16, marginBottom: 15 }]}>{formatScriptSymbol(selectedTrade)}</Text>

                                <Text style={styles.passwordLabel}>Target Price</Text>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={targetPrice}
                                    onChangeText={setTargetPrice}
                                    keyboardType="numeric"
                                    placeholder="Enter Target Price"
                                    placeholderTextColor="#999"
                                />

                                <Text style={styles.passwordLabel}>Stop Loss Price</Text>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={slPrice}
                                    onChangeText={setSlPrice}
                                    keyboardType="numeric"
                                    placeholder="Enter Stop Loss Price"
                                    placeholderTextColor="#999"
                                />

                                <TouchableOpacity style={styles.submitBtn} onPress={handleSetTargetSL}>
                                    <Text style={styles.submitBtnText}>SET VALUES</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setTargetModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Cancel Order Confirmation Modal */}
            <Modal
                visible={cancelModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Cancel Order?</Text>
                        <Text style={styles.confirmMessage}>
                            Are you sure you want to cancel this order for {formatScriptSymbol(tradeToCancel)}?
                        </Text>

                        <View style={styles.confirmButtonRow}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.confirmYesBtn]}
                                onPress={confirmCancelOrder}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.confirmYesText}>Yes, Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.confirmNoBtn]}
                                onPress={() => setCancelModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.confirmNoText}>No, Keep It</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Pending Order Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ width: '100%', alignItems: 'center' }}
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalText}>Edit Pending Order</Text>
                                <Text style={[styles.passwordLabel, { fontSize: 16, marginBottom: 15 }]}>{formatScriptSymbol(tradeToEdit)}</Text>

                                <Text style={styles.passwordLabel}>Quantity</Text>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={editQty}
                                    onChangeText={setEditQty}
                                    keyboardType="numeric"
                                    placeholder="Enter Quantity"
                                    placeholderTextColor="#999"
                                />

                                <Text style={styles.passwordLabel}>Price</Text>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={editPrice}
                                    onChangeText={setEditPrice}
                                    keyboardType="decimal-pad"
                                    placeholder="Enter Price"
                                    placeholderTextColor="#999"
                                />

                                <TouchableOpacity style={styles.submitBtn} onPress={confirmEditOrder}>
                                    <Text style={styles.submitBtnText}>UPDATE ORDER</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Custom Styled Success Banner/Popup */}
            <TradeSuccessPopup
                visible={successPopupVisible}
                title={successPopupTitle}
                message={successPopupMessage}
                onConfirm={() => setSuccessPopupVisible(false)}
            />

            {/* Custom Styled Warning/Error Banner/Popup */}
            <TradeWarningPopup
                visible={warningPopupVisible}
                title={warningPopupTitle}
                message={warningPopupMessage}
                buttonText="OK"
                onConfirm={() => setWarningPopupVisible(false)}
            />
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'black',
        height: 46,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: 'white',
    },
    tabText: {
        color: '#757575',
        fontSize: 15,
        fontWeight: '700',
    },
    activeTabText: {
        color: 'white',
    },
    listContent: {
        paddingTop: 14,
        paddingBottom: 50,
    },
    emptyContainer: {
        paddingHorizontal: 15,
        marginTop: 5,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    emptyText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8,
    },
    emptyDivider: {
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginTop: 10,
    },
    activeRow1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeRow2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeRow3: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeRow4: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeTimeText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
    },
    activeCompactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activeLeft: {
        flex: 1,
    },
    activeRight: {
        alignItems: 'flex-end',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    activeSubRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    activeMarginRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    symbolNameLarge: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '900',
        letterSpacing: 0.3,
        flex: 1,
        marginRight: 8,
    },
    ltpText: {
        color: 'white',
        fontSize: 17.5,
        fontWeight: '800',
        marginBottom: 5,
    },
    boughtBadge: {
        backgroundColor: '#D1FFD4',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 3,
        marginRight: 10,
    },
    boughtBadgeText: {
        color: '#1B5E20',
        fontSize: 13,
        fontWeight: '800',
    },
    soldBadge: {
        backgroundColor: '#FFCDD2',
    },
    soldBadgeText: {
        color: '#C62828',
        fontSize: 13,
        fontWeight: '800',
    },
    dateText: {
        color: 'white',
        fontSize: 13,
        opacity: 0.85,
        fontWeight: '500',
    },
    traderText: {
        color: '#B0BEC5',
        fontSize: 13.5,
        fontWeight: '600',
        opacity: 0.9,
    },
    closeTradeBtn: {
        backgroundColor: '#C64756',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 4,
    },
    closeTradeBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '800',
    },
    setTargetBtn: {
        backgroundColor: '#2D864D',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    setTargetBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    marginText: {
        color: '#B0BEC5',
        fontSize: 12.5,
        fontWeight: '600',
        opacity: 0.85,
    },
    marginTextLeft: {
        color: '#B0BEC5',
        fontSize: 12.5,
        fontWeight: '600',
        opacity: 0.85,
        flex: 1,
        textAlign: 'left',
        marginRight: 6,
    },
    marginTextRight: {
        color: '#B0BEC5',
        fontSize: 12.5,
        fontWeight: '600',
        opacity: 0.85,
        flex: 1,
        textAlign: 'right',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginTop: 12,
        marginBottom: 2,
    },
    executedFromPendingBadge: {
        backgroundColor: 'rgba(1, 180, 234, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(1, 180, 234, 0.4)',
    },
    executedFromPendingText: {
        color: '#01B4EA',
        fontSize: 12.5,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    tradeItem: {
        paddingTop: 14,
        paddingBottom: 4,
        paddingHorizontal: 15,
    },

    // --- Closed Trade Styles ---
    closedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    symbolName: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '900',
        letterSpacing: 0.3,
        flex: 1,
        marginRight: 8,
    },
    closedBadges: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pnlBadge: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    pnlBadgeText: {
        fontWeight: '800',
        fontSize: 12.5,
    },
    qtyBadge: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBadgeText: {
        fontWeight: '800',
        fontSize: 12.5,
    },
    closedPricesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    priceInfo: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginRight: 8,
    },
    priceInfoRight: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    priceLabel: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    priceLabelRight: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'right',
    },
    priceBoxRed: {
        backgroundColor: '#FFCDD2',
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceBoxGreen: {
        backgroundColor: '#C8E6C9',
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceBoxText: {
        color: '#000000',
        fontWeight: '800',
        fontSize: 13,
    },
    closedTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    timeValue: {
        color: '#CFD8DC',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    timeValueRight: {
        color: '#CFD8DC',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        marginLeft: 8,
    },
    closedBrokerageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    brokerageText: {
        color: '#B0BEC5',
        fontSize: 12.5,
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        width: width * 0.85,
        borderRadius: 8,
        padding: 24,
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
        marginBottom: 20,
    },
    passwordLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 8,
    },
    passwordInput: {
        backgroundColor: '#F5F5F5',
        height: 48,
        borderRadius: 4,
        paddingHorizontal: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 20,
        color: 'black'
    },
    submitBtn: {
        backgroundColor: '#2E7D32',
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        backgroundColor: '#C62828',
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // --- Grid Layout Styles (Matched with Dashboard) ---
    tradeItemGrid: {
        paddingTop: 10,
        paddingHorizontal: 15,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    leftCol: {
        flex: 1.3,
        justifyContent: 'center',
        paddingRight: 10,
    },
    priceColGrid: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    symbolNameGrid: {
        color: 'white',
        fontSize: 17,
        fontWeight: '800',
    },
    dateTextGrid: {
        color: '#B0BEC5',
        fontSize: 13.5,
        fontWeight: '600',
        marginVertical: 2,
        opacity: 0.9,
    },
    labelsBottomGrid: {
        color: '#B0BEC5',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 3,
        opacity: 0.9,
    },
    priceBoxGrid: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 4,
        width: '95%',
        maxWidth: 90,
        alignItems: 'center',
        marginBottom: 4,
    },
    priceValTextGrid: {
        color: 'white',
        fontSize: 14.5,
        fontWeight: '800',
    },
    labelSmallGrid: {
        color: '#B0BEC5',
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.9,
    },
    actionRowGrid: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
        marginBottom: 10,
    },
    actionButtonGrid: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 3,
        marginLeft: 8,
    },
    actionButtonTextGrid: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },
    // --- Pending Trade Item Styles ---
    pendingTradeItem: {
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    pendingRow1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    pendingSymbolName: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '900',
        letterSpacing: 0.3,
        flex: 1,
        marginRight: 10,
    },
    pendingPriceText: {
        color: 'white',
        fontSize: 20.5,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    pendingRow2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    pendingRow2Left: {
        flex: 1,
        marginRight: 10,
    },
    pendingTypeQty: {
        color: 'white',
        fontSize: 14.5,
        fontWeight: '600',
        marginBottom: 4,
    },
    pendingTime: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
    },
    pendingActionButtons: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    pendingEditBtn: {
        backgroundColor: '#42A5F5',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1976D2',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    pendingCancelBtn: {
        backgroundColor: '#EF5350',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    pendingRow3: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    pendingColLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    pendingColRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    pendingInfoLabel: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.9,
    },
    pendingInfoLabelRight: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.9,
        textAlign: 'right',
    },
    pendingInfoValue: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 2,
    },
    pendingInfoValueRight: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 2,
        textAlign: 'right',
    },
    pendingRow4: {
        marginTop: 5,
        marginBottom: 2,
    },
    pendingHoldingText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.9,
    },
    pendingHoldingValue: {
        color: 'white',
        fontSize: 13.5,
        fontWeight: '700',
    },
    pendingDivider: {
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 8,
    },
    separatorGrid: {
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    // --- Confirmation Modal Styles ---
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    confirmModal: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    confirmTitle: {
        color: '#000',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    confirmMessage: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmYesBtn: {
        backgroundColor: '#FF5252',
    },
    confirmYesText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    confirmNoBtn: {
        backgroundColor: '#E0E0E0',
    },
    confirmNoText: {
        color: '#333',
        fontSize: 14,
    },
    remarkRow: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    remarkText: {
        color: '#E0E0E0',
        fontSize: 11,
        fontWeight: '600',
    },
    targetSlDisplayRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
        marginBottom: 2,
    },
    targetDisplayBadge: {
        backgroundColor: 'rgba(74, 186, 120, 0.15)',
        borderColor: 'rgba(74, 186, 120, 0.4)',
        borderWidth: 0.5,
        color: '#4ABA78',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    slDisplayBadge: {
        backgroundColor: 'rgba(239, 83, 80, 0.15)',
        borderColor: 'rgba(239, 83, 80, 0.4)',
        borderWidth: 0.5,
        color: '#EF5350',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
});

export default TradesScreen;
