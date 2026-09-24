import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ScrollView,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { X, Lock } from 'lucide-react-native';
import { useTrades, normalizeSymbol } from '../../context/TradeContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import { getSessionUser } from '../../services/api';
import TradeSuccessPopup from '../../components/TradeSuccessPopup';
import TradeWarningPopup from '../../components/TradeWarningPopup';
import { formatPrice } from '../../utils/formatPrice';

const { width } = Dimensions.get('window');

const parseOptionSymbol = (sym) => {
    if (!sym) return null;
    const clean = sym.includes(':') ? sym.split(':')[1] : sym;
    const s = clean.trim().toUpperCase();

    const matchType = s.match(/(CE|PE)$/);
    if (!matchType) return null;
    const optionType = matchType[1];

    const body = s.slice(0, -2).trim();

    const rootMatch = body.match(/^([A-Z]+)/);
    if (!rootMatch) return null;
    const root = rootMatch[1];

    const remainder = body.slice(root.length).replace(/[\s\-_]/g, '');
    if (!remainder) return null;

    let strike = '';
    let expiry = '';

    const monthMatch = remainder.match(/^(\d{2}[A-Z]{3}\d{0,2})(\d+)$/);
    if (monthMatch) {
        expiry = monthMatch[1];
        strike = monthMatch[2];
    } else if (remainder.length >= 8) {
        const weeklyMatch = remainder.match(/^(\d{5})(\d+)$/);
        if (weeklyMatch) {
            expiry = weeklyMatch[1];
            strike = weeklyMatch[2];
        } else {
            const digitMatch = remainder.match(/(\d+)$/);
            strike = digitMatch ? digitMatch[1] : remainder;
        }
    } else {
        strike = remainder;
    }

    const cleanStrike = parseInt(strike, 10);
    return { root, strike: isNaN(cleanStrike) ? strike : cleanStrike.toString(), optionType, expiry };
};

const getMcxBaseScrip = (symbol) => {
    if (!symbol) return '';
    const s = symbol.split(':').pop().toUpperCase();
    const mcxBases = [
        'GOLDGUINEA', 'GOLDPETAL', 'GOLDM', 'GOLD', 'MGOLD',
        'SILVERMIC', 'SILVERM', 'SILVER', 'MSILVER',
        'CRUDEOILM', 'CRUDEOIL', 'MCRUDEOIL',
        'NATGASMINI', 'NATURALGAS', 'MNATURALGAS',
        'COPPERM', 'COPPER', 'MCOPPER',
        'ZINCMINI', 'ZINC', 'MZINC',
        'LEADMINI', 'LEAD', 'MLEAD',
        'NICKELMINI', 'NICKEL',
        'ALUMINI', 'ALUMINIUM', 'MALUMINIUM',
        'MENTHAOIL', 'COTTONCNDY', 'COTTON',
        'MCXBULLDEX', 'BULLDEX'
    ];
    for (const base of mcxBases) {
        if (s.startsWith(base)) return base;
    }
    return '';
};

const parseFuturesBaseSymbol = (sym) => {
    if (!sym) return '';
    const clean = sym.includes(':') ? sym.split(':')[1] : sym;
    let s = clean.replace(/[\s\-_]/g, '').toUpperCase();
    s = s.replace(/(EQ|BE|FUT)$/, '');
    s = s.replace(/\d{2}[A-Z]{3}|\d{6}|\d{5}/g, '');
    s = s.replace(/(FUT)$/, '');
    return s;
};

const isSameInstrument = (sym1, sym2) => {
    if (!sym1 || !sym2) return false;
    const s1 = String(sym1).trim().toUpperCase();
    const s2 = String(sym2).trim().toUpperCase();

    if (s1 === s2) return true;

    const clean1 = s1.includes(':') ? s1.split(':')[1] : s1;
    const clean2 = s2.includes(':') ? s2.split(':')[1] : s2;
    if (clean1 === clean2) return true;

    const noSpace1 = clean1.replace(/[\s\-_]/g, '');
    const noSpace2 = clean2.replace(/[\s\-_]/g, '');
    if (noSpace1 === noSpace2) return true;

    const mcxBase1 = getMcxBaseScrip(s1) || getMcxBaseScrip(clean1);
    const mcxBase2 = getMcxBaseScrip(s2) || getMcxBaseScrip(clean2);
    if (mcxBase1 && mcxBase2 && mcxBase1 === mcxBase2) return true;

    const opt1 = parseOptionSymbol(s1);
    const opt2 = parseOptionSymbol(s2);
    if (opt1 && opt2) {
        return opt1.root === opt2.root && opt1.strike === opt2.strike && opt1.optionType === opt2.optionType;
    }
    if ((opt1 && !opt2) || (!opt1 && opt2)) {
        return false;
    }

    const futBase1 = parseFuturesBaseSymbol(s1);
    const futBase2 = parseFuturesBaseSymbol(s2);
    if (futBase1 && futBase2 && futBase1 === futBase2) return true;

    const eq1 = noSpace1.replace(/(EQ|BE)$/, '');
    const eq2 = noSpace2.replace(/(EQ|BE)$/, '');
    if (eq1 === eq2) return true;

    const norm1 = noSpace1.replace(/USDT$/, 'USD');
    const norm2 = noSpace2.replace(/USDT$/, 'USD');
    if (norm1 === norm2) return true;

    const COMMODITY_MAP = {
        'XAU/USD': 'GOLD', 'XAUUSD': 'GOLD', 'GOLD': 'GOLD',
        'XAG/USD': 'SILVER', 'XAGUSD': 'SILVER', 'SILVER': 'SILVER',
        'USOIL': 'CRUDEOIL', 'CRUDEOIL': 'CRUDEOIL',
        'NGAS': 'NATURALGAS', 'NATURALGAS': 'NATURALGAS'
    };
    const c1 = COMMODITY_MAP[clean1] || COMMODITY_MAP[noSpace1] || clean1;
    const c2 = COMMODITY_MAP[clean2] || COMMODITY_MAP[noSpace2] || clean2;
    if (c1 === c2) return true;

    return false;
};

const OrderDetailScreen = ({ route, navigation }) => {
    const { name = '', item = {}, category = '', fullSymbol = '', lotSize: paramLotSize } = route.params || {};
    const { addTrade, addNotification, livePrices, watchlist, userConfig, trades } = useTrades();

    // Find live item in watchlist context for real-time updates
    const liveItem = React.useMemo(() => {
        const found = watchlist.find(i =>
            (i.fullSymbol && item.fullSymbol && i.fullSymbol === item.fullSymbol) ||
            (i.name === name)
        );
        return found || item;
    }, [watchlist, name, item.fullSymbol]);

    const isNSE = category.includes('NSE') || item.exchange === 'NSE';
    const isNFO = category.includes('NFO') || item.exchange === 'NFO';
    const isMCX = category.includes('MCX') || item.exchange === 'MCX';
    const isCrypto = category === 'CRYPTO' || item.exchange === 'CRYPTO';
    const isForex = category === 'FOREX' || item.exchange === 'FOREX';
    const isCommodity = category === 'COMMODITY' || item.exchange === 'COMMODITY';

    // Get settings
    const tradeEquityAsUnits = userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true;

    // Apply "Units" logic to NSE and NFO as requested (MCX remains in Lots)
    const isUnitMode = (isNSE || isNFO) && tradeEquityAsUnits;

    // Get lot size from scrip_data (sent in watchlist)
    const lotSize = Number(liveItem.lotSize) || Number(paramLotSize) || Number(item.lotSize) || 1;


    // Use latest live data from livePrices (real-time updates via socket)
    // Normalize the symbol name to match how it's stored in livePrices
    const normalizedName = normalizeSymbol(name);
    const liveData = livePrices[normalizedName] || {};
    const ltp = Number(liveData.ltp || liveItem.ltp || 0);
    const bid = Number(liveData.bid || liveItem.bid || ltp);
    const ask = Number(liveData.ask || liveItem.ask || ltp);
    const highVal = liveData.high || liveItem.high;
    const lowVal = liveData.low || liveItem.low;
    const openVal = liveData.open || liveItem.open;
    const closeVal = liveData.close || liveItem.close;
    const volVal = liveData.volume !== undefined ? liveData.volume : liveItem.volume;
    const chgVal = liveData.change !== undefined ? liveData.change : liveItem.changePct;

    const [activeTab, setActiveTab] = useState('Market');
    const [lots, setLots] = useState('1');
    const [price, setPrice] = useState(String(ltp));

    // Calculate actual qty based on units/lots setting
    const userInput = parseInt(lots) || 1;

    // If in Unit Mode, actualQty is just userInput. 
    // If in Lot Mode, actualQty is userInput * lotSize.
    const actualQty = isUnitMode ? userInput : (userInput * lotSize);
    const [modalVisible, setModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [placing, setPlacing] = useState(false);
    const [isError, setIsError] = useState(false);
    const [pendingOrderType, setPendingOrderType] = useState(''); // 'BUY' or 'SELL'
    const [txnPassword, setTxnPassword] = useState('');
    const [showPlainPassword, setShowPlainPassword] = useState(false);
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [isClosingTrade, setIsClosingTrade] = useState(false);

    const sellPrice = activeTab === 'Market' ? bid : Number(price);
    const buyPrice = activeTab === 'Market' ? ask : Number(price);

    const user = getSessionUser();
    const isTrader = user?.role === 'TRADER';

    // Direct Order Flow
    const handleOrder = async (type) => {
        // Only require password if NOT a trader
        if (!isTrader && !txnPassword.trim()) {
            setSuccessMessage('Transaction password is required in the field below.');
            setIsError(true);
            setModalVisible(true);
            return;
        }

        setPlacing(true);
        setPendingOrderType(type);
        setIsError(false);

        const isMarket = activeTab === 'Market';
        const finalPrice = type === 'SELL' ? sellPrice : buyPrice;

        // Determine instrument type for backend calculation
        let instrumentType = '';
        if (isNFO) {
            const sym = name.toUpperCase();
            if (sym.endsWith('CE') || sym.endsWith('PE')) instrumentType = 'OPT';
            else instrumentType = 'FUT';
        } else if (isNSE) {
            instrumentType = 'EQ';
        }

        // Pre-check for hold time restriction if order is opposite (closing) or a limit order
        if (trades && Array.isArray(trades) && trades.length > 0) {
            const targetSym = (item.fullSymbol || name || '').toUpperCase();
            const oppositeType = type === 'BUY' ? 'SELL' : 'BUY';

            // 1. Check Opposite Direction Trades (Position Close / Netting)
            const openOppositeTrades = trades.filter(t => {
                if (t.isCompleted || t.status === 'CLOSED' || t.status === 'DELETED' || t.isPending) return false;
                if ((t.type || '').toUpperCase() !== oppositeType) return false;
                const tSym = (t.name || t.fullSymbol || t.symbol || '').toUpperCase();
                return isSameInstrument(tSym, targetSym);
            });

            setIsClosingTrade(openOppositeTrades.length > 0);

            if (userConfig) {
                const symName = (item.fullSymbol || name || item.symbol || '').toUpperCase();
                const catStr = (category || item.category || '').toUpperCase();

                let seg = 'EQUITY';
                if (symName.endsWith('CE') || symName.endsWith('PE') || catStr.includes('OPT') || catStr.includes('OPTION')) {
                    seg = 'OPTIONS';
                } else if (isMCX || catStr.includes('MCX') || symName.startsWith('MCX:')) {
                    seg = 'MCX';
                } else if (isCrypto || catStr.includes('CRYPTO') || symName.startsWith('CRYPTO:')) {
                    seg = 'CRYPTO';
                } else if (isForex || catStr.includes('FOREX') || symName.startsWith('FOREX:')) {
                    seg = 'FOREX';
                } else if (isCommodity || catStr.includes('COMEX') || catStr.includes('COMMODITY') || symName.startsWith('COMEX:') || symName.startsWith('COMMODITY:')) {
                    seg = 'COMEX';
                } else {
                    const MCX_SYMBOLS = ['GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'CRUDEOIL', 'COPPER', 'NICKEL', 'ZINC', 'LEAD', 'ALUMINIUM', 'ALUMINI', 'NATURALGAS', 'MENTHAOIL', 'COTTON', 'BULLDEX', 'MGOLD', 'MCRUDEOIL', 'MSILVER'];
                    if (MCX_SYMBOLS.some(s => symName.includes(s))) {
                        seg = 'MCX';
                    }
                }

                let minTimeSeconds = 0;
                if (seg === 'MCX') minTimeSeconds = parseInt(userConfig.mcxMinTimeToBookProfit || 0);
                else if (seg === 'OPTIONS') minTimeSeconds = parseInt(userConfig.optionsMinTimeToBookProfit || 0);
                else if (seg === 'EQUITY') minTimeSeconds = parseInt(userConfig.equityMinTimeToBookProfit || 0);
                else if (seg === 'CRYPTO') minTimeSeconds = parseInt(userConfig.cryptoConfig?.minTimeToBookProfit || userConfig.cryptoMinTimeToBookProfit || 0);
                else if (seg === 'FOREX') minTimeSeconds = parseInt(userConfig.forexConfig?.minTimeToBookProfit || userConfig.forexMinTimeToBookProfit || 0);
                else if (seg === 'COMEX') minTimeSeconds = parseInt(userConfig.comexConfig?.minTimeToBookProfit || userConfig.comexMinTimeToBookProfit || 0);

                if (!minTimeSeconds) {
                    minTimeSeconds = parseInt(userConfig.min_time_to_book_profit || userConfig.minTimeToBookProfit || 0);
                }

                if (minTimeSeconds > 0) {
                    // Check 1: Opposite Trades (Position Close / Netting)
                    if (openOppositeTrades.length > 0) {
                        for (const openTrade of openOppositeTrades) {
                            const rawTime = openTrade.entryTimeRaw || openTrade.entry_time || openTrade.time;
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
                                    setWarningMessage(`Minimum hold time is ${minTimeSeconds} seconds. Please wait ${remaining} more second(s) before closing your position.`);
                                    setWarningVisible(true);
                                    setPlacing(false);
                                    return;
                                }
                            }
                        }
                    }

                    // Check 2: Limit Orders on active scrip
                    if (!isMarket) {
                        const activeSameTrades = trades.filter(t => {
                            if (t.isCompleted || t.status === 'CLOSED' || t.status === 'DELETED' || t.isPending) return false;
                            const tSym = (t.name || t.fullSymbol || t.symbol || '').toUpperCase();
                            return isSameInstrument(tSym, targetSym);
                        });

                        if (activeSameTrades.length > 0) {
                            for (const openTrade of activeSameTrades) {
                                const rawTime = openTrade.entryTimeRaw || openTrade.entry_time || openTrade.time;
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
                                if (entryMs && !isNaN(entryMs)) {
                                    let secondsHeld = Math.floor((Date.now() - entryMs) / 1000);
                                    if (secondsHeld < 0) secondsHeld = 0;
                                    if (secondsHeld < minTimeSeconds) {
                                        const remaining = minTimeSeconds - secondsHeld;
                                        setWarningMessage(`Limit orders are blocked for ${name} during the active hold duration. Please wait ${remaining} more second(s).`);
                                        setWarningVisible(true);
                                        setPlacing(false);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        try {
            await addTrade({
                name: item.fullSymbol || name,
                type: type,
                qty: userInput.toString(), // Send user input (lots or units)
                actual_qty: actualQty,      // Send calculated total units
                lot_size_at_entry: lotSize, // Send lot size used for calculation
                price: String(finalPrice),
                isPending: !isMarket,
                transactionPassword: txnPassword,
                equity_units_mode: isUnitMode ? 1 : 0,
                instrument_type: instrumentType
            });

            // Success feedback
            const action = type === 'SELL' ? 'Sold' : 'Bought';
            const qtyLabel = isUnitMode ? 'qty' : 'lot';
            const displayQty = userInput;
            addNotification({
                title: `${isMarket ? 'Market' : 'Limit'} Order placed`,
                message: `${action} ${displayQty} ${qtyLabel} of ${name} at ${formatPrice(finalPrice)}`,
                type: 'success',
            });

            setSuccessMessage(`${activeTab} ${type} Success\n${action} ${displayQty} ${qtyLabel} of ${name}\nAT ${formatPrice(finalPrice)}${!isUnitMode && (isNSE || isNFO) && lotSize > 1 ? `\n(Total Qty: ${actualQty})` : ''}`);
            setIsError(false);
            setModalVisible(true);
        } catch (err) {
            console.log('Order failed:', err.message);
            const isScalpingError = err.message && (
                err.message.toLowerCase().includes('scalping') ||
                err.message.toLowerCase().includes('hold time') ||
                err.message.toLowerCase().includes('minimum hold time') ||
                err.message.toLowerCase().includes('hold duration')
            );
            if (isScalpingError) {
                setWarningMessage(err.message);
                setWarningVisible(true);
            } else {
                setSuccessMessage(err.message || 'Order failed');
                setIsError(true);
                setModalVisible(true);
            }
        } finally {
            setPlacing(false);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        navigation.popToTop();
        if (isClosingTrade) {
            navigation.navigate('Main', {
                screen: 'Trades',
                params: {
                    screen: 'TradesHome',
                    params: { initialTab: 'Closed' }
                }
            });
        } else {
            // Redirect to Active trades tab for Market orders, and Pending trades tab for Limit/Order orders
            const destinationTab = activeTab === 'Market' ? 'Active' : 'Pending';
            navigation.navigate('Main', {
                screen: 'Trades',
                params: {
                    screen: 'TradesHome',
                    params: { initialTab: destinationTab }
                }
            });
        }
    };

    return (
        <ScreenWrapper>
            <ScreenHeader title={name} rightComponent={
                <TouchableOpacity
                    onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
                    style={styles.closeBtn}
                >
                    <X size={22} color="white" />
                </TouchableOpacity>
            } />

            {/* Exchange Badge */}
            <View style={styles.exchangeBar}>
                <View style={[styles.exchangeTag, {
                    backgroundColor: item.exchange === 'MCX'
                        ? 'rgba(255,152,0,0.15)'
                        : item.exchange === 'NFO'
                            ? 'rgba(156,39,176,0.15)'
                            : item.exchange === 'COMMODITY'
                                ? 'rgba(233,30,99,0.15)'
                                : 'rgba(33,150,243,0.15)'
                }]}>
                    <Text style={[styles.exchangeTagText, {
                        color: item.exchange === 'MCX'
                            ? '#FFB74D'
                            : item.exchange === 'NFO'
                                ? '#CE93D8'
                                : item.exchange === 'COMMODITY'
                                    ? '#E91E63'
                                    : '#64B5F6'
                    }]}>{item.exchange || 'MCX'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>

                {/* Market / Order Tabs */}
                <View style={styles.tabOuter}>
                    {['Market', 'Order'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabPart, activeTab === tab ? styles.bgActive : styles.bgInactive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabLabel, activeTab === tab ? styles.labelDark : styles.labelWhite]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Lot/Quantity Input */}
                <View style={styles.fieldBlock}>
                    <Text style={styles.hintLabel}>{isUnitMode ? 'Quantity' : 'Lot'}</Text>
                    <TextInput style={styles.valInput} value={lots} onChangeText={setLots} keyboardType="numeric" placeholderTextColor="#546E7A" />
                    {!isUnitMode && (isNSE || isNFO) && lotSize > 1 && (
                        <Text style={{ color: '#FFB74D', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                            1 Lot = {lotSize} qty
                        </Text>
                    )}
                    {!isUnitMode && (isNSE || isNFO) && lotSize > 1 && (
                        <Text style={{ color: '#78909C', fontSize: 11, marginTop: 2 }}>
                            Total Quantity: {actualQty}
                        </Text>
                    )}
                    {isUnitMode && (
                        <Text style={{ color: '#78909C', fontSize: 11, marginTop: 4 }}>
                            Trading in Units
                        </Text>
                    )}
                    <View style={styles.lineDivider} />
                </View>

                {/* Price Input (Order mode) */}
                {activeTab === 'Order' && (
                    <View style={styles.fieldBlock}>
                        <Text style={styles.hintLabel}>Price</Text>
                        <TextInput style={styles.valInput} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#546E7A" />
                        <View style={styles.lineDivider} />
                    </View>
                )}

                {/* Transaction Password Input (Bypass for Traders) */}
                {!isTrader && (
                    <View style={styles.fieldBlock}>
                        <Text style={[styles.hintLabel, { color: '#FFB74D' }]}>Transaction Password</Text>
                        <View style={styles.passwordInputWrapper}>
                            <TextInput
                                style={[styles.valInput, { flex: 1 }]}
                                value={txnPassword}
                                onChangeText={setTxnPassword}
                                secureTextEntry={!showPlainPassword}
                                placeholder="Enter password"
                                placeholderTextColor="#455A64"
                                keyboardType="numeric"
                            />
                            <TouchableOpacity onPress={() => setShowPlainPassword(!showPlainPassword)}>
                                <Lock size={18} color={txnPassword ? '#FFB74D' : '#546E7A'} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.lineDivider, { backgroundColor: 'rgba(255,183,77,0.3)' }]} />
                    </View>
                )}

                {/* Sell / Buy Buttons */}
                <View style={styles.marketPriceRow}>
                    <TouchableOpacity
                        style={[styles.marketPriceBtn, styles.sellBtn, placing && styles.btnDisabled]}
                        onPress={() => handleOrder('SELL')}
                        disabled={placing}
                    >
                        {placing && pendingOrderType === 'SELL' ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            activeTab === 'Order' ? (
                                <Text style={[styles.marketPriceLabel, { fontSize: 15, fontWeight: '800' }]}>Place Sell Order</Text>
                            ) : (
                                <>
                                    <Text style={styles.marketPriceLabel}>Sell @</Text>
                                    <Text style={styles.marketPriceVal}>{formatPrice(sellPrice)}</Text>
                                </>
                            )
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.marketPriceBtn, styles.buyBtn, placing && styles.btnDisabled]}
                        onPress={() => handleOrder('BUY')}
                        disabled={placing}
                    >
                        {placing && pendingOrderType === 'BUY' ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            activeTab === 'Order' ? (
                                <Text style={[styles.marketPriceLabel, { fontSize: 15, fontWeight: '800' }]}>Place Buy Order</Text>
                            ) : (
                                <>
                                    <Text style={styles.marketPriceLabel}>Buy @</Text>
                                    <Text style={styles.marketPriceVal}>{formatPrice(buyPrice)}</Text>
                                </>
                            )
                        )}
                    </TouchableOpacity>
                </View>

                {/* Market Stats Grid */}
                <View style={styles.statsWrapper}>
                    <StatRow label="Bid" value={formatPrice(bid)} />
                    <StatRow label="Ask" value={formatPrice(ask)} />
                    <StatRow label="LTP" value={formatPrice(ltp)} />

                    <StatRow label="High" value={formatPrice(highVal)} />
                    <StatRow label="Low" value={formatPrice(lowVal)} />
                    <StatRow
                        label="Change %"
                        value={`${Number(chgVal) > 0 ? '+' : ''}${formatPrice(chgVal)}%`}
                        color={Number(chgVal) >= 0 ? '#4CAF50' : '#EF5350'}
                    />

                    <StatRow label="Open" value={formatPrice(openVal)} />
                    <StatRow label="Close" value={formatPrice(closeVal)} />
                    <StatRow label="Volume" value={formatPrice(volVal)} />
                </View>

            </ScrollView>



            {/* ─── Success/Error Popups ─────────────────────────────────── */}
            <TradeSuccessPopup
                visible={modalVisible && !isError}
                title="Order Placed!"
                message={successMessage}
                buttonText="OK"
                onConfirm={handleModalClose}
            />
            <TradeWarningPopup
                visible={modalVisible && isError}
                title="Order Failed"
                message={successMessage}
                buttonText="OK"
                onConfirm={() => setModalVisible(false)}
            />

            {/* Custom Warning Modal */}
            <TradeWarningPopup
                visible={warningVisible}
                title="Action Restricted"
                message={warningMessage || successMessage}
                onConfirm={() => setWarningVisible(false)}
            />
        </ScreenWrapper>
    );
};

const StatRow = ({ label, value, color }) => (
    <View style={styles.statCell}>
        <Text style={styles.statCellLabel}>{label}</Text>
        <Text style={[styles.statCellValue, color ? { color } : null]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    title: {
        color: 'white',
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
        flex: 1,
        letterSpacing: 0.3,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exchangeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    exchangeTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    exchangeTagText: {
        fontSize: 11.5,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ltpHeader: {
        color: '#90A4AE',
        fontSize: 14.5,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 14,
        paddingTop: 4,
        paddingBottom: 30,
    },
    tabOuter: {
        flexDirection: 'row',
        height: 44,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabPart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgActive: { backgroundColor: '#FFFFFF' },
    bgInactive: { backgroundColor: '#1a2240' },
    tabLabel: { fontSize: 15.5, fontWeight: '700' },
    labelWhite: { color: 'white' },
    labelDark: { color: '#1a2240' },
    fieldBlock: {
        marginBottom: 16,
    },
    hintLabel: {
        color: '#78909C',
        fontSize: 13.5,
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    valInput: {
        color: 'white',
        fontSize: 19,
        height: 34,
        padding: 0,
        fontWeight: '800',
    },
    lineDivider: {
        height: 1.5,
        backgroundColor: 'rgba(100,181,246,0.3)',
        marginTop: 4,
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
    },
    marketPriceRow: {
        flexDirection: 'row',
        height: 60,
        marginBottom: 20,
        borderRadius: 6,
        overflow: 'hidden',
    },
    marketPriceBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sellBtn: { backgroundColor: '#C62828' },
    buyBtn: { backgroundColor: '#2E7D32' },
    btnDisabled: { opacity: 0.6 },
    marketPriceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12.5,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    marketPriceVal: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 2,
    },
    statsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    statCell: {
        width: '33.33%',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    statCellLabel: {
        color: '#78909C',
        fontSize: 12.5,
        marginBottom: 4,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    statCellValue: {
        color: '#ECEFF1',
        fontSize: 15.5,
        fontWeight: '800',
    },
    // ─── Transaction Password Modal ──────────────────
    modalBgLayer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    passwordCard: {
        backgroundColor: '#1a2240',
        width: '88%',
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    pwdHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    pwdIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    pwdTitle: {
        color: 'white',
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 6,
    },
    pwdSubtitle: {
        color: '#90A4AE',
        fontSize: 13.5,
        fontWeight: '600',
        textAlign: 'center',
    },
    pwdInputBox: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 8,
    },
    pwdInput: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingVertical: 14,
        textAlign: 'center',
        letterSpacing: 4,
    },
    pwdError: {
        color: '#EF5350',
        fontSize: 13.5,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    pwdBtnRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    pwdCancelBtn: {
        flex: 1,
        height: 46,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pwdCancelText: {
        color: '#90A4AE',
        fontSize: 15.5,
        fontWeight: '700',
    },
    pwdConfirmBtn: {
        flex: 1.5,
        height: 46,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pwdConfirmText: {
        color: 'white',
        fontSize: 15.5,
        fontWeight: '800',
    },
});

export default OrderDetailScreen;