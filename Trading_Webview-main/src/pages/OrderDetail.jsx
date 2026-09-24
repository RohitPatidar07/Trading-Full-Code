import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTrades, normalizeSymbol } from '../context/TradeContext';
import { formatPrice } from '../utils/formatPrice';
import { X, Lock, Check } from 'lucide-react';
import * as api from '../services/api';
import useResponsive from '../hooks/useResponsive';
import TradeWarningPopup from '../components/TradeWarningPopup';
import { isSameInstrument, checkHoldTimeAllowed, detectSegment, getMinHoldTimeSeconds, getSecondsHeld } from '../utils/holdTimeUtils';

const formatSymbolName = (name) => {
    if (!name) return '';
    let cleanName = name.includes(':') ? name.split(':')[1] : name;
    cleanName = cleanName.replace(/\s*\([^)]*\)/g, '').trim();
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

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isMobile } = useResponsive();
    const location = useLocation();

    const { addTrade, addNotification, livePrices, watchlist, userConfig, trades } = useTrades();

    // Retrieve state item fallback
    const passedItem = location.state?.item || {};

    const liveItem = useMemo(() => {
        return watchlist.find(i => i.name === id || i.fullSymbol === passedItem.fullSymbol) || passedItem;
    }, [watchlist, id, passedItem.fullSymbol]);

    const name = liveItem.name || id || '';
    const exchange = liveItem.exchange || 'MCX';
    const lotSize = Number(liveItem.lotSize) || 1;

    const isNSE = exchange === 'NSE';
    const isNFO = exchange === 'NFO';
    const isMCX = exchange === 'MCX';

    // Apply "Units" logic to NSE and NFO as configured
    const tradeEquityAsUnits = userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true;
    const isUnitMode = (isNSE || isNFO) && tradeEquityAsUnits;

    // Normalize symbol for live price matching
    const normKey = normalizeSymbol(name);
    const liveData = livePrices[normKey] || {};

    const ltp = Number(liveData.ltp || liveItem.ltp || 0);
    const bid = Number(liveData.bid || liveItem.bid || 0) || Number((ltp * 0.9995).toFixed(2));
    const ask = Number(liveData.ask || liveItem.ask || 0) || Number((ltp * 1.0005).toFixed(2));
    const high = Number(liveData.high || liveItem.high || 0) || Number((ltp * 1.015).toFixed(2));
    const low = Number(liveData.low || liveItem.low || 0) || Number((ltp * 0.985).toFixed(2));
    const open = Number(liveData.open || liveItem.open || 0) || Number((ltp * 0.995).toFixed(2));
    const close = Number(liveData.close || liveItem.close || 0) || Number((ltp * 1.002).toFixed(2));

    const chgVal = Number(liveData.change !== undefined ? liveData.change : (liveItem.changePct || liveItem.change || 0));
    const volVal = Number(liveData.volume !== undefined ? liveData.volume : (liveItem.volume || 100000));

    const [activeTab, setActiveTab] = useState('Market');
    const [lots, setLots] = useState('1');
    const [price, setPrice] = useState(String(ltp));
    const [txnPassword, setTxnPassword] = useState('');
    const [showPlainPassword, setShowPlainPassword] = useState(false);

    const [placing, setPlacing] = useState(false);
    const [placingType, setPlacingType] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Anti-scalping / Hold Time Warning
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    // Sync input price with live LTP when switching tabs to Market
    useEffect(() => {
        if (activeTab === 'Market') {
            setPrice(String(ltp));
        }
    }, [activeTab, ltp]);

    const userInput = parseInt(lots) || 1;
    const actualQty = isUnitMode ? userInput : (userInput * lotSize);

    const sellPrice = activeTab === 'Market' ? bid : Number(price);
    const buyPrice = activeTab === 'Market' ? ask : Number(price);

    const currentUser = api.getSessionUser();
    const isTrader = currentUser?.role === 'TRADER';

    const handleOrder = async (type) => {
        if (!isTrader && !txnPassword.trim()) {
            setModalMessage('Transaction password is required in the field below.');
            setIsError(true);
            setModalVisible(true);
            return;
        }

        setPlacing(true);
        setPlacingType(type);
        setIsError(false);

        try {
            // --- Anti-scalping Hold Time Check ---
            if (trades && Array.isArray(trades) && trades.length > 0 && userConfig) {
                const targetSym = (liveItem.fullSymbol || name || '').toUpperCase();
                const isMarketOrder = activeTab === 'Market';
                const oppositeType = type === 'BUY' ? 'SELL' : 'BUY';

                // 1. Opposite Direction Trade Check (Position Close / Netting)
                const openOppositeTrades = trades.filter(t => {
                    if (t.isCompleted || t.status === 'CLOSED' || t.status === 'DELETED' || t.isPending) return false;
                    if ((t.type || '').toUpperCase() !== oppositeType) return false;
                    const tSym = (t.name || t.fullSymbol || t.symbol || '').toUpperCase();
                    return isSameInstrument(tSym, targetSym);
                });

                if (openOppositeTrades.length > 0) {
                    const segment = detectSegment(targetSym, liveItem.exchange || '');
                    const minTimeSeconds = getMinHoldTimeSeconds(segment, userConfig);

                    if (minTimeSeconds > 0) {
                        for (const openTrade of openOppositeTrades) {
                            const holdCheck = checkHoldTimeAllowed(openTrade, userConfig);
                            if (!holdCheck.allowed) {
                                setWarningMessage(
                                    `Minimum hold time is ${holdCheck.minTime} seconds. Please wait ${holdCheck.remaining} more second(s) before closing your position.`
                                );
                                setWarningVisible(true);
                                return;
                            }
                        }
                    }
                }

                // 2. Limit Order Check on active scrip
                if (!isMarketOrder) {
                    const activeSameTrades = trades.filter(t => {
                        if (t.isCompleted || t.status === 'CLOSED' || t.status === 'DELETED' || t.isPending) return false;
                        const tSym = (t.name || t.fullSymbol || t.symbol || '').toUpperCase();
                        return isSameInstrument(tSym, targetSym);
                    });

                    if (activeSameTrades.length > 0) {
                        for (const openTrade of activeSameTrades) {
                            const holdCheck = checkHoldTimeAllowed(openTrade, userConfig);
                            if (!holdCheck.allowed) {
                                setWarningMessage(
                                    `Limit orders are blocked for ${name} during the active hold duration. Please wait ${holdCheck.remaining} more second(s).`
                                );
                                setWarningVisible(true);
                                return;
                            }
                        }
                    }
                }
            }
            // --- End Hold Time Check ---

            const isMarket = activeTab === 'Market';
            const finalPrice = type === 'SELL' ? sellPrice : buyPrice;

            let instrumentType = '';
            if (isNFO) {
                instrumentType = name.toUpperCase().endsWith('CE') || name.toUpperCase().endsWith('PE') ? 'OPT' : 'FUT';
            } else if (isNSE) {
                instrumentType = 'EQ';
            }

            await addTrade({
                name: liveItem.fullSymbol || name,
                type: type,
                qty: userInput.toString(),
                actual_qty: actualQty,
                lot_size_at_entry: lotSize,
                price: String(finalPrice),
                isPending: !isMarket,
                transactionPassword: txnPassword,
                equity_units_mode: isUnitMode ? 1 : 0,
                instrument_type: instrumentType
            });

            const action = type === 'SELL' ? 'Sold' : 'Bought';
            const qtyLabel = isUnitMode ? 'qty' : 'lot';

            addNotification({
                title: `${isMarket ? 'Market' : 'Limit'} Order placed`,
                message: `${action} ${userInput} ${qtyLabel} of ${name} at ${formatPrice(finalPrice)}`,
                type: 'success',
            });

            setModalMessage(`${activeTab} ${type} Success\n${action} ${userInput} ${qtyLabel} of ${name}\nAT ${formatPrice(finalPrice)}${!isUnitMode && (isNSE || isNFO) && lotSize > 1 ? `\n(Total Qty: ${actualQty})` : ''}`);
            setIsError(false);
            setModalVisible(true);
        } catch (err) {
            // Special handling for scalping/hold-time backend errors
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
                setModalMessage(err.message || 'Order failed');
                setIsError(true);
                setModalVisible(true);
            }
        } finally {
            setPlacing(false);
            setPlacingType(null);
        }
    };

    const handleModalConfirm = () => {
        setModalVisible(false);
        if (!isError) {
            navigate('/portfolio');
        }
    };

    return (
        <div style={styles.container}>
            {/* Anti-scalping Warning Popup */}
            <TradeWarningPopup
                visible={warningVisible}
                title="Action Restricted"
                message={warningMessage}
                onConfirm={() => setWarningVisible(false)}
            />
            <div style={styles.contentWrapper}>
                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerTitleCol}>
                        <h2 style={styles.headerTitle}>{formatSymbolName(name)}</h2>
                    </div>
                    <button onClick={() => navigate(-1)} style={styles.closeBtn}>
                        <X size={20} color="white" />
                    </button>
                </header>

                {/* Exchange / Category Bar */}
                <div style={styles.exchangeBar}>
                    <span style={{
                        ...styles.exchangeTag,
                        backgroundColor: exchange === 'MCX'
                            ? 'rgba(255,152,0,0.15)'
                            : exchange === 'NFO'
                                ? 'rgba(156,39,176,0.15)'
                                : exchange === 'COMMODITY'
                                    ? 'rgba(233,30,99,0.15)'
                                    : 'rgba(33,150,243,0.15)',
                        color: exchange === 'MCX'
                            ? '#FFB74D'
                            : exchange === 'NFO'
                                ? '#CE93D8'
                                : exchange === 'COMMODITY'
                                    ? '#E91E63'
                                    : '#64B5F6'
                    }}>
                        {exchange}
                    </span>
                </div>

                <div style={styles.scrollContent}>
                    {/* Market / Order Tab Selection */}
                    <div style={styles.tabOuter}>
                        <button
                            onClick={() => setActiveTab('Market')}
                            style={{
                                ...styles.tabPart,
                                ...(activeTab === 'Market' ? styles.bgActive : styles.bgInactive),
                                color: activeTab === 'Market' ? '#1a2240' : '#ffffff'
                            }}
                        >
                            Market
                        </button>
                        <button
                            onClick={() => setActiveTab('Order')}
                            style={{
                                ...styles.tabPart,
                                ...(activeTab === 'Order' ? styles.bgActive : styles.bgInactive),
                                color: activeTab === 'Order' ? '#1a2240' : '#ffffff'
                            }}
                        >
                            Order
                        </button>
                    </div>

                    {/* Inputs */}
                    <div style={styles.inputSection}>
                        <div style={styles.fieldBlock}>
                            <label style={styles.hintLabel}>{isUnitMode ? 'Quantity' : 'Lot'}</label>
                            <input
                                type="number"
                                min="1"
                                value={lots}
                                onChange={(e) => setLots(e.target.value)}
                                style={styles.valInput}
                            />
                            {!isUnitMode && (isNSE || isNFO) && lotSize > 1 && (
                                <span style={{ color: '#FFB74D', fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
                                    1 Lot = {lotSize} qty
                                </span>
                            )}
                            {!isUnitMode && (isNSE || isNFO) && lotSize > 1 && (
                                <span style={{ color: '#a0b0c0', fontSize: '11px', marginTop: '2px' }}>
                                    Total Quantity: {actualQty}
                                </span>
                            )}
                            {isUnitMode && (
                                <span style={{ color: '#a0b0c0', fontSize: '11px', marginTop: '4px' }}>
                                    Trading in Units
                                </span>
                            )}
                            <div style={styles.lineDivider} />
                        </div>

                        {activeTab === 'Order' && (
                            <div style={styles.fieldBlock}>
                                <label style={styles.hintLabel}>Price</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    style={styles.valInput}
                                />
                                <div style={styles.lineDivider} />
                            </div>
                        )}

                        {!isTrader && (
                            <div style={styles.fieldBlock}>
                                <label style={{ ...styles.hintLabel, color: '#FFB74D' }}>Transaction Password</label>
                                <div style={styles.passwordWrapper}>
                                    <input
                                        type={showPlainPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={txnPassword}
                                        onChange={(e) => setTxnPassword(e.target.value)}
                                        style={{ ...styles.valInput, flex: 1 }}
                                    />
                                    <button
                                        onClick={() => setShowPlainPassword(!showPlainPassword)}
                                        style={styles.lockBtn}
                                    >
                                        <Lock size={18} color={txnPassword ? '#FFB74D' : '#546E7A'} />
                                    </button>
                                </div>
                                <div style={{ ...styles.lineDivider, backgroundColor: 'rgba(255,183,77,0.3)' }} />
                            </div>
                        )}
                    </div>

                    {/* Sell / Buy Buttons */}
                    <div style={styles.marketPriceRow}>
                        <button
                            onClick={() => handleOrder('SELL')}
                            disabled={placing}
                            style={{ ...styles.marketPriceBtn, ...styles.sellBtn, ...(placing ? styles.btnDisabled : {}) }}
                        >
                            {placing && placingType === 'SELL' ? (
                                <span style={{ color: 'white' }}>Placing...</span>
                            ) : activeTab === 'Order' ? (
                                <span style={{ fontSize: '15px', fontWeight: '800' }}>Place Sell Order</span>
                            ) : (
                                <>
                                    <span style={styles.marketPriceLabel}>Sell @</span>
                                    <span style={styles.marketPriceVal}>{formatPrice(sellPrice)}</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => handleOrder('BUY')}
                            disabled={placing}
                            style={{ ...styles.marketPriceBtn, ...styles.buyBtn, ...(placing ? styles.btnDisabled : {}) }}
                        >
                            {placing && placingType === 'BUY' ? (
                                <span style={{ color: 'white' }}>Placing...</span>
                            ) : activeTab === 'Order' ? (
                                <span style={{ fontSize: '15px', fontWeight: '800' }}>Place Buy Order</span>
                            ) : (
                                <>
                                    <span style={styles.marketPriceLabel}>Buy @</span>
                                    <span style={styles.marketPriceVal}>{formatPrice(buyPrice)}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Market Stats Grid */}
                    <div style={styles.statsWrapper}>
                        <StatRow label="Bid" value={formatPrice(bid)} />
                        <StatRow label="Ask" value={formatPrice(ask)} />
                        <StatRow label="LTP" value={formatPrice(ltp)} />

                        <StatRow label="High" value={formatPrice(high)} />
                        <StatRow label="Low" value={formatPrice(low)} />
                        <StatRow
                            label="Change %"
                            value={`${chgVal > 0 ? '+' : ''}${chgVal.toFixed(2)}%`}
                            color={chgVal >= 0 ? '#4CAF50' : '#EF5350'}
                        />

                        <StatRow label="Open" value={formatPrice(open)} />
                        <StatRow label="Close" value={formatPrice(close)} />
                        <StatRow label="Volume" value={volVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            {modalVisible && (
                <div style={styles.modalOverlay}>
                    <div style={styles.dialog}>
                        <div style={{
                            ...styles.pwdIconBox,
                            backgroundColor: isError ? '#FF3B30' : '#10B981',
                            margin: '0 auto 12px auto'
                        }}>
                            {isError ? <X size={28} color="white" /> : <Check size={28} color="white" />}
                        </div>
                        <h3 style={{
                            ...styles.dialogTitle,
                            color: isError ? '#EF4444' : '#10B981'
                        }}>
                            {isError ? 'Order Failed' : 'Order Placed!'}
                        </h3>
                        <p style={styles.dialogMsg}>{modalMessage}</p>
                        <button onClick={handleModalConfirm} style={{
                            ...styles.dialogBtn,
                            backgroundColor: isError ? '#FF3B30' : '#10B981',
                            color: 'white'
                        }}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatRow = ({ label, value, color }) => (
    <div style={styles.statCell}>
        <div style={styles.statCellLabel}>{label}</div>
        <div style={{ ...styles.statCellValue, ...(color ? { color } : {}) }}>{value}</div>
    </div>
);

const styles = {
    container: {
        backgroundColor: 'transparent',
        minHeight: '100dvh',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
    },
    contentWrapper: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        boxSizing: 'border-box',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        paddingBottom: '10px',
    },
    headerTitleCol: {
        flex: 1,
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#ffffff',
        margin: 0,
    },
    closeBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '18px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
    },
    exchangeBar: {
        display: 'flex',
        justifyContent: 'flex-start',
        paddingBottom: '16px',
    },
    exchangeTag: {
        fontSize: '10px',
        fontWeight: '800',
        letterSpacing: '0.5px',
        padding: '3px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase',
    },
    scrollContent: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    tabOuter: {
        display: 'flex',
        height: '42px',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: '#1a2240',
    },
    tabPart: {
        flex: 1,
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgActive: {
        backgroundColor: '#FFFFFF',
    },
    bgInactive: {
        backgroundColor: '#1a2240',
    },
    inputSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '24px',
    },
    fieldBlock: {
        display: 'flex',
        flexDirection: 'column',
    },
    hintLabel: {
        color: '#a0b0c0',
        fontSize: '12px',
        fontWeight: '600',
        marginBottom: '6px',
        letterSpacing: '0.3px',
    },
    valInput: {
        color: 'white',
        fontSize: '17px',
        height: '32px',
        padding: 0,
        fontWeight: '800',
        border: 'none',
        backgroundColor: 'transparent',
        outline: 'none',
        width: '100%',
    },
    lineDivider: {
        height: '1.5px',
        backgroundColor: 'rgba(100,181,246,0.3)',
        marginTop: '4px',
    },
    passwordWrapper: {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
    },
    lockBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
    },
    marketPriceRow: {
        display: 'flex',
        height: '58px',
        marginBottom: '24px',
        borderRadius: '6px',
        overflow: 'hidden',
        gap: '2px',
    },
    marketPriceBtn: {
        flex: 1,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sellBtn: {
        backgroundColor: '#C62828',
    },
    buyBtn: {
        backgroundColor: '#2E7D32',
    },
    btnDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    marketPriceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.3px',
    },
    marketPriceVal: {
        color: 'white',
        fontSize: '18px',
        fontWeight: '900',
        marginTop: '2px',
    },
    statsWrapper: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        paddingTop: '12px',
        paddingBottom: '12px',
        paddingLeft: '4px',
        paddingRight: '4px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    statCell: {
        width: '33.33%',
        marginBottom: '16px',
        paddingLeft: '8px',
        paddingRight: '8px',
        boxSizing: 'border-box',
    },
    statCellLabel: {
        color: '#a0b0c0',
        fontSize: '11px',
        marginBottom: '4px',
        fontWeight: '600',
        letterSpacing: '0.2px',
    },
    statCellValue: {
        color: '#ECEFF1',
        fontSize: '14px',
        fontWeight: '800',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    dialog: {
        backgroundColor: '#1a2240',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '24px',
        width: '88%',
        maxWidth: '380px',
        textAlign: 'center',
    },
    pwdIconBox: {
        width: '48px',
        height: '48px',
        borderRadius: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogTitle: {
        color: 'white',
        fontSize: '18px',
        fontWeight: '800',
        marginTop: '12px',
        marginBottom: '8px',
    },
    dialogMsg: {
        color: '#ECEFF1',
        fontSize: '14px',
        marginBottom: '20px',
        lineHeight: '1.4',
        whiteSpace: 'pre-line',
    },
    dialogBtn: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '700',
        fontSize: '15px',
        cursor: 'pointer',
    }
};
