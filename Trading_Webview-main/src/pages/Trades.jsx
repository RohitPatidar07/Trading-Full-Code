import React, { useState, useEffect } from 'react';
import { useTrades, normalizeSymbol } from '../context/TradeContext';
import { calculateSegmentMargin } from '../utils/segmentMargin';
import { formatPrice } from '../utils/formatPrice';
import { Edit2, X, AlertTriangle, ChevronLeft, RefreshCw } from 'lucide-react';
import * as api from '../services/api';
import useResponsive from '../hooks/useResponsive';
import TradeWarningPopup from '../components/TradeWarningPopup';
import { checkHoldTimeAllowed, isSameInstrument, detectSegment, getMinHoldTimeSeconds, getSecondsHeld } from '../utils/holdTimeUtils';

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

const getLiveTradePnl = (trade, livePrices, getInstrumentMeta) => {
    if (!trade) return 0;
    const normKey = normalizeSymbol ? normalizeSymbol(trade.name) : trade.name.toLowerCase();
    const liveData = livePrices[normKey] || {};
    const ltp = liveData.ltp || parseFloat(trade.exitPrice) || parseFloat(trade.entryPrice) || 0;
    const bid = liveData.bid || ltp;
    const ask = liveData.ask || ltp;
    const currentPrice = trade.type === 'BUY' ? bid : ask;
    const entry = parseFloat(trade.entryPrice) || 0;
    const qty = parseFloat(trade.qty) || 1;

    let tradePL = 0;
    const meta = getInstrumentMeta ? getInstrumentMeta(trade.name, trade.market) : null;
    const multiplier = meta?.multiplier || 1;

    if (trade.is_commodity) {
        const lotSize = Number(trade.lot_size) || 1;
        const fallbackUsdInr = Number(trade.usdinr_value) || 95.1;
        const usdInrLive = livePrices['USD/INR'] || livePrices['USDINR'];
        const liveBid = usdInrLive ? parseFloat(usdInrLive.bid) || null : null;
        const liveAsk = usdInrLive ? parseFloat(usdInrLive.ask) || null : null;

        const rawPnlUsd = trade.type === 'BUY'
            ? (currentPrice - entry) * lotSize * qty
            : (entry - currentPrice) * lotSize * qty;

        let usdInr = rawPnlUsd >= 0
            ? (liveAsk || fallbackUsdInr * 0.90)
            : (liveBid || fallbackUsdInr * 1.10);

        tradePL = rawPnlUsd * usdInr;
    } else {
        tradePL = trade.type === 'BUY'
            ? (currentPrice - entry) * qty * multiplier
            : (entry - currentPrice) * qty * multiplier;
    }
    return tradePL;
};

export default function Trades() {
    const { isMobile } = useResponsive();
    const {
        trades,
        livePrices,
        closeTrade,
        cancelTrade,
        setTargetSL,
        fetchInitialData,
        refreshTrades,
        getInstrumentMeta,
        userConfig,
    } = useTrades();

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('vtrkm_trades_active_tab') || 'Active';
    });

    useEffect(() => {
        localStorage.setItem('vtrkm_trades_active_tab', activeTab);
    }, [activeTab]);
    
    // Modals & Action overlays
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTargetSlModal, setShowTargetSlModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form inputs
    const [editQty, setEditQty] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Anti-scalping / Hold Time Warning
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Filter trades based on activeTab (aligned with mobile app TradesScreen.js)
    const filteredTrades = React.useMemo(() => {
        if (activeTab === 'Pending') {
            const list = [];
            trades.forEach(t => {
                if (t.isPending && !t.isCompleted && !t.exitPrice) {
                    list.push(t);
                }
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
            return trades.filter(t => t.isCompleted || !!t.exitPrice);
        }
        return [];
    }, [trades, activeTab]);

    const handleOpenCloseModal = (trade) => {
        setSelectedTrade(trade);
        setErrorMessage('');
        setShowCloseModal(true);
    };

    const handleCloseTradeConfirm = async () => {
        if (!selectedTrade) return;
        setLoading(true);
        setErrorMessage('');

        // --- Anti-scalping: Minimum Hold Time Check ---
        const holdCheck = checkHoldTimeAllowed(selectedTrade, userConfig);
        if (!holdCheck.allowed) {
            setWarningMessage(
                `Minimum hold time is ${holdCheck.minTime} seconds. Please wait ${holdCheck.remaining} more second(s).`
            );
            setWarningVisible(true);
            setLoading(false);
            return;
        }
        // --- End Hold Time Check ---

        const normKey = normalizeSymbol(selectedTrade.name);
        const liveQuote = livePrices[normKey] || {};
        const ltp = liveQuote.ltp || parseFloat(selectedTrade.exitPrice) || 0;
        const bid = liveQuote.bid || ltp;
        const ask = liveQuote.ask || ltp;
        const exitPrice = selectedTrade.type === 'BUY' ? bid : ask;

        try {
            await closeTrade(selectedTrade.id, exitPrice, new Date().toISOString(), selectedTrade.pnl);
            setShowCloseModal(false);
            setSelectedTrade(null);
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
                setErrorMessage(err.message || 'Failed to close position.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditModal = (trade) => {
        if (trade.isTargetSLOrder) {
            handleOpenTargetSlModal(trade.parentTrade || trade);
            return;
        }
        setSelectedTrade(trade);
        setEditQty(trade.qty);
        setEditPrice(trade.entryPrice);
        setErrorMessage('');
        setShowEditModal(true);
    };

    const handleEditOrderConfirm = async () => {
        if (!selectedTrade) return;
        setLoading(true);
        setErrorMessage('');
        try {
            if (selectedTrade.isTargetSLOrder) {
                const parent = selectedTrade.parentTrade || {};
                let newTarget = parent.target || parent.target_price || null;
                let newSL = parent.stop_loss || parent.stopLoss || parent.sl || null;

                if (selectedTrade.orderKind === 'TARGET') {
                    newTarget = parseFloat(editPrice);
                } else {
                    newSL = parseFloat(editPrice);
                }

                await setTargetSL(selectedTrade.parentTradeId, newTarget, newSL);
                await refreshTrades();
                setShowEditModal(false);
                setSelectedTrade(null);
                return;
            }

            await api.modifyPendingOrder(selectedTrade.id, parseInt(editQty), parseFloat(editPrice));
            await refreshTrades();
            setShowEditModal(false);
            setSelectedTrade(null);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to modify order.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = (trade) => {
        setSelectedTrade(trade);
        setShowCancelModal(true);
    };

    const handleCancelOrderConfirm = async () => {
        if (!selectedTrade) return;
        setLoading(true);
        try {
            if (selectedTrade.isTargetSLOrder) {
                await setTargetSL(selectedTrade.parentTradeId, null, null);
                await refreshTrades();
                setShowCancelModal(false);
                setSelectedTrade(null);
                return;
            }

            await cancelTrade(selectedTrade.id);
            await refreshTrades();
            setShowCancelModal(false);
            setSelectedTrade(null);
        } catch (err) {
            alert(err.message || 'Failed to cancel order.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenTargetSlModal = (trade) => {
        if (userConfig) {
            const holdCheck = checkHoldTimeAllowed(trade, userConfig);
            if (!holdCheck.allowed) {
                setWarningMessage(
                    `Minimum hold time is ${holdCheck.minTime} seconds. Please wait ${holdCheck.remaining} more second(s) before setting Target & Stop Loss.`
                );
                setWarningVisible(true);
                return;
            }
        }
        setSelectedTrade(trade);
        setTargetPrice(trade.target || trade.target_price ? String(trade.target || trade.target_price) : '');
        setStopLoss(trade.stop_loss || trade.stopLoss || trade.sl ? String(trade.stop_loss || trade.stopLoss || trade.sl) : '');
        setErrorMessage('');
        setShowTargetSlModal(true);
    };

    const handleTargetSlConfirm = async () => {
        if (!selectedTrade) return;
        if (userConfig) {
            const holdCheck = checkHoldTimeAllowed(selectedTrade, userConfig);
            if (!holdCheck.allowed) {
                setWarningMessage(
                    `Minimum hold time is ${holdCheck.minTime} seconds. Please wait ${holdCheck.remaining} more second(s) before setting Target & Stop Loss.`
                );
                setWarningVisible(true);
                return;
            }
        }
        const entry = parseFloat(selectedTrade.entryPrice || selectedTrade.entry_price || 0);
        const isBuy = selectedTrade.type === 'BUY';
        const targetVal = targetPrice ? parseFloat(targetPrice) : null;
        const slVal = stopLoss ? parseFloat(stopLoss) : null;

        if (isBuy) {
            if (targetVal !== null && !isNaN(targetVal) && targetVal <= entry) {
                setErrorMessage(`For BUY trade at ${entry}, Target Price must be greater than entry price (${entry}).`);
                return;
            }
            if (slVal !== null && !isNaN(slVal) && slVal >= entry) {
                setErrorMessage(`For BUY trade at ${entry}, Stop Loss must be less than entry price (${entry}).`);
                return;
            }
        } else {
            if (targetVal !== null && !isNaN(targetVal) && targetVal >= entry) {
                setErrorMessage(`For SELL trade at ${entry}, Target Price must be less than entry price (${entry}).`);
                return;
            }
            if (slVal !== null && !isNaN(slVal) && slVal <= entry) {
                setErrorMessage(`For SELL trade at ${entry}, Stop Loss must be greater than entry price (${entry}).`);
                return;
            }
        }

        setLoading(true);
        setErrorMessage('');
        try {
            await setTargetSL(
                selectedTrade.id,
                targetPrice ? parseFloat(targetPrice) : null,
                stopLoss ? parseFloat(stopLoss) : null
            );
            setShowTargetSlModal(false);
            setSelectedTrade(null);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to update SL/Target.');
        } finally {
            setLoading(false);
        }
    };

    if (showCloseModal && selectedTrade) {
        const normKey = normalizeSymbol(selectedTrade.name);
        const liveData = livePrices[normKey] || {};
        const ltp = liveData.ltp || parseFloat(selectedTrade.exitPrice) || parseFloat(selectedTrade.entryPrice) || 0;
        
        // Fallbacks for zero/null stats
        const bidVal = liveData.bid && parseFloat(liveData.bid) !== 0 ? parseFloat(liveData.bid) : ltp * 0.9995;
        const askVal = liveData.ask && parseFloat(liveData.ask) !== 0 ? parseFloat(liveData.ask) : ltp * 1.0005;
        const lastVal = ltp;
        const changeVal = liveData.change || '0.00';
        const highVal = liveData.high && parseFloat(liveData.high) !== 0 ? parseFloat(liveData.high) : ltp * 1.015;
        const lowVal = liveData.low && parseFloat(liveData.low) !== 0 ? parseFloat(liveData.low) : ltp * 0.985;
        const openVal = liveData.open && parseFloat(liveData.open) !== 0 ? parseFloat(liveData.open) : ltp * 0.995;
        const closeVal = liveData.close && parseFloat(liveData.close) !== 0 ? parseFloat(liveData.close) : ltp * 1.002;
        const volumeVal = liveData.volume || 0;
        const lotSizeVal = selectedTrade.lot_size || 1;

        // Dynamic extra fields
        const upperCkt = liveData.upperCkt || liveData.upper_circuit || '-';
        const lowerCkt = liveData.lowerCkt || liveData.lower_circuit || '-';
        const atp = liveData.atp || liveData.averagePrice || '-';
        const bidQty = liveData.bidQty || liveData.bid_qty || '-';
        const askQty = liveData.askQty || liveData.ask_qty || '-';
        const lastTradedQty = liveData.ltq || liveData.lastTradedQty || '-';
        const openInterest = liveData.oi || liveData.openInterest || '0';

        const currentPnl = getLiveTradePnl(selectedTrade, livePrices, getInstrumentMeta);
        const isProfit = currentPnl >= 0;
        const pnlLabel = isProfit ? `PROFIT ${currentPnl.toFixed(2)}` : `LOSS ${Math.abs(currentPnl).toFixed(2)}`;
        const actionBtnColor = isProfit ? '#2e7d32' : '#c62828';

        return (
            <div style={styles.exitTradeOverlay}>
                {/* Anti-scalping Warning Popup */}
                <TradeWarningPopup
                    visible={warningVisible}
                    title="Action Restricted"
                    message={warningMessage}
                    onConfirm={() => setWarningVisible(false)}
                />
                <header style={styles.exitTradeHeader}>
                    <button onClick={() => setShowCloseModal(false)} style={styles.exitTradeBackBtn}>
                        <ChevronLeft size={26} />
                    </button>
                    <h2 style={styles.exitTradeTitle}>EXIT TRADE</h2>
                    <div style={{ width: '26px' }} /> {/* Spacer for centering */}
                </header>

                <div style={styles.exitTradeContentWrapper}>
                    <div style={styles.exitTradeContent}>
                        <div style={styles.exitTradeSymbol}>{formatSymbolName(selectedTrade.displayName || selectedTrade.name)}</div>

                        <button 
                            onClick={handleCloseTradeConfirm} 
                            disabled={loading} 
                            style={{
                                ...styles.exitTradeSubmitBtn,
                                backgroundColor: actionBtnColor
                            }}
                        >
                            {loading ? 'EXITING...' : `EXIT ${selectedTrade.type === 'BUY' ? 'BUY' : 'SELL'} — ${pnlLabel}`}
                        </button>

                        {errorMessage && (
                            <div style={styles.errorAlert}>
                                {errorMessage}
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div style={styles.exitStatsGrid}>
                            <div style={styles.exitStatsCol}>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Bid:</span>
                                    <span style={styles.exitStatValue}>{bidVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Last:</span>
                                    <span style={styles.exitStatValue}>{lastVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>High:</span>
                                    <span style={styles.exitStatValue}>{highVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Open:</span>
                                    <span style={styles.exitStatValue}>{openVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Close:</span>
                                    <span style={styles.exitStatValue}>{closeVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Volume:</span>
                                    <span style={styles.exitStatValue}>{volumeVal}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Upper ckt:</span>
                                    <span style={styles.exitStatValue}>{upperCkt}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Atp:</span>
                                    <span style={styles.exitStatValue}>{atp}</span>
                                </div>
                            </div>

                            <div style={styles.exitStatsCol}>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Ask:</span>
                                    <span style={styles.exitStatValue}>{askVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Change:</span>
                                    <span style={styles.exitStatValue}>{parseFloat(changeVal).toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Low:</span>
                                    <span style={styles.exitStatValue}>{lowVal.toFixed(2)}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Bid Qty:</span>
                                    <span style={styles.exitStatValue}>{bidQty}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Ask Qty:</span>
                                    <span style={styles.exitStatValue}>{askQty}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Last Traded Qty:</span>
                                    <span style={styles.exitStatValue}>{lastTradedQty}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Open Interest:</span>
                                    <span style={styles.exitStatValue}>{openInterest}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Lower ckt:</span>
                                    <span style={styles.exitStatValue}>{lowerCkt}</span>
                                </div>
                                <div style={styles.exitStatItem}>
                                    <span style={styles.exitStatLabel}>Lot Size:</span>
                                    <span style={styles.exitStatValue}>{lotSizeVal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...styles.container, paddingBottom: '90px' }}>
            {/* Anti-scalping Warning Popup */}
            <TradeWarningPopup
                visible={warningVisible}
                title="Action Restricted"
                message={warningMessage}
                onConfirm={() => setWarningVisible(false)}
            />
            <div style={styles.contentWrapper}>
                {/* Header centered "TRADES" */}
            <header style={styles.header}>
                <h2 style={styles.headerTitle}>TRADES</h2>
            </header>

            {/* Tab Bar - Pending, Active, Closed */}
            <div style={styles.tabBar}>
                {['Pending', 'Active', 'Closed'].map((tab) => (
                    <button
                        key={tab}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab(tab)}
                    >
                        <span style={{
                            ...styles.tabText,
                            ...(activeTab === tab ? styles.activeTabText : {})
                        }}>{tab}</span>
                    </button>
                ))}
            </div>

            {/* Trades List */}
            <main style={styles.list}>
                {filteredTrades.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <span style={styles.emptyText}>No {activeTab} Orders</span>
                        <div style={styles.emptyDivider} />
                    </div>
                ) : (
                    filteredTrades.map(trade => {
                        const isSell = trade.type === 'SELL';
                        const normKey = normalizeSymbol(trade.name);
                        const liveQuote = livePrices[normKey] || {};
                        const ltp = liveQuote.ltp || parseFloat(trade.exitPrice) || 0;
                        const bid = liveQuote.bid || ltp;
                        const ask = liveQuote.ask || ltp;
                        const livePrice = trade.type === 'BUY' ? bid : ask;

                        const meta = getInstrumentMeta ? getInstrumentMeta(trade.name, trade.market) : null;
                        
                        // Margin Calculations
                        const qty = Math.abs(trade.qty || 1);
                        const entry = parseFloat(trade.entryPrice || trade.entry_price || 0);
                        const isUnitMode = userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true;

                        let displayMarginUsed = calculateSegmentMargin({
                            marketType: trade.marketType || trade.market_type || trade.market || 'MCX',
                            symbol: trade.name || trade.symbol,
                            price: entry,
                            qty: qty,
                            lotSize: trade.lot_size || meta?.multiplier || 1,
                            isHolding: false,
                            clientConfig: userConfig || {},
                            isUnitMode: isUnitMode
                        });

                        let holdingMargin = calculateSegmentMargin({
                            marketType: trade.marketType || trade.market_type || trade.market || 'MCX',
                            symbol: trade.name || trade.symbol,
                            price: entry,
                            qty: qty,
                            lotSize: trade.lot_size || meta?.multiplier || 1,
                            isHolding: true,
                            clientConfig: userConfig || {},
                            isUnitMode: isUnitMode
                        });

                        if (displayMarginUsed <= 0 && parseFloat(trade.margin_used || 0) > 0) {
                            displayMarginUsed = parseFloat(trade.margin_used);
                        }
                        if (holdingMargin <= 0 && displayMarginUsed > 0) {
                            holdingMargin = displayMarginUsed;
                        }

                        const formattedName = formatSymbolName(trade.displayName || trade.name);

                        // --- PENDING ORDER CARD ---
                        if (activeTab === 'Pending') {
                            return (
                                <div key={trade.id} style={styles.pendingTradeItem}>
                                    {/* Row 1: Symbol Name | Price */}
                                    <div style={styles.pendingRow1}>
                                        <span style={styles.pendingSymbolName}>{formattedName}</span>
                                        <span style={styles.pendingPriceText}>{formatPrice(trade.entryPrice)}</span>
                                    </div>

                                    {/* Target / SL Order Badge */}
                                    {trade.isTargetSLOrder && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(74, 186, 120, 0.15)',
                                            border: '1px solid rgba(74, 186, 120, 0.4)',
                                            color: '#4ABA78',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            marginTop: '4px',
                                            marginBottom: '6px'
                                        }}>
                                            ● 🎯 Target / SL Order (Exit Order)
                                        </div>
                                    )}

                                    {/* Row 2: Type, Qty, Time | Action Buttons */}
                                    <div style={styles.pendingRow2}>
                                        <div>
                                            <div style={styles.pendingTypeQty}>
                                                {trade.type === 'BUY' ? 'Bought' : 'Sold'} X {trade.qty}
                                            </div>
                                            <div style={styles.pendingTime}>
                                                {trade.time || '---'}
                                            </div>
                                        </div>
                                        <div style={styles.pendingActionButtons}>
                                            <button
                                                style={styles.pendingEditBtn}
                                                onClick={() => handleOpenEditModal(trade)}
                                                title="Edit Order"
                                            >
                                                <Edit2 size={16} color="#ffffff" strokeWidth={2} />
                                            </button>
                                            <button
                                                style={styles.pendingCancelBtn}
                                                onClick={() => handleCancelOrder(trade)}
                                                title="Cancel Order"
                                            >
                                                <X size={16} color="#ffffff" strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Row 3: Margins & Target/SL Prices */}
                                    <div style={styles.pendingRow3}>
                                        <div>
                                            {trade.isTargetSLOrder ? (
                                                <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                                                    {trade.displayTarget && (
                                                        <div>
                                                            <div style={styles.pendingInfoLabel}>Target Price</div>
                                                            <div style={{ ...styles.pendingInfoValue, color: '#4ABA78' }}>₹{formatPrice(trade.displayTarget)}</div>
                                                        </div>
                                                    )}
                                                    {trade.displaySL && (
                                                        <div>
                                                            <div style={styles.pendingInfoLabel}>Stop Loss Price</div>
                                                            <div style={{ ...styles.pendingInfoValue, color: '#EF5350' }}>₹{formatPrice(trade.displaySL)}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={styles.pendingInfoLabel}>Limit Price</div>
                                                    <div style={styles.pendingInfoValue}>{formatPrice(trade.entryPrice)}</div>
                                                </>
                                            )}
                                            <div style={{ ...styles.pendingInfoLabel, marginTop: '6px' }}>
                                                Holding Margin Required {holdingMargin.toFixed(2)}
                                            </div>
                                        </div>
                                        <div style={styles.pendingReqCol}>
                                            <div style={styles.pendingInfoLabel}>
                                                Margin Required: {displayMarginUsed.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // --- ACTIVE POSITION CARD ---
                        if (activeTab === 'Active') {
                            const isBuy = trade.type === 'BUY';
                            const badgeBg = isBuy ? '#c8e6c9' : '#ffcdd2';
                            const badgeColor = isBuy ? '#2e7d32' : '#d32f2f';
                            const badgeText = `${isBuy ? 'Bought' : 'Sold'} X ${trade.qty || 1}`;
                            const dateStr = trade.time || '';

                            return (
                                <div key={trade.id} style={styles.apkActiveCard}>
                                    {/* Row 1: Symbol & LTP */}
                                    <div style={styles.apkActiveRow1}>
                                        <span style={styles.apkActiveSymbol}>{formattedName}</span>
                                        <span style={styles.apkActiveLtp}>
                                            {livePrice ? formatPrice(livePrice) : '---'}
                                        </span>
                                    </div>

                                    {/* Row 2: Bought Badge + Time & Close Trade Button */}
                                    <div style={styles.apkActiveRow2}>
                                        <div style={styles.apkActiveLeftCol}>
                                            <span style={{ ...styles.apkActiveBadge, backgroundColor: badgeBg, color: badgeColor }}>
                                                {badgeText}
                                            </span>
                                            <span style={styles.apkActiveDate}>{dateStr}</span>
                                        </div>
                                        <button style={styles.apkActiveCloseBtn} onClick={() => handleOpenCloseModal(trade)}>
                                            Close Trade
                                        </button>
                                    </div>

                                    {/* Row 3: Entry Price Info & Set Target/SL Button */}
                                    {(() => {
                                        const targetVal = trade.target || trade.target_price;
                                        const slVal = trade.stop_loss || trade.stopLoss || trade.sl;
                                        const hasTargetOrSL = !!(targetVal || slVal);
                                        return (
                                            <>
                                                <div style={styles.apkActiveRow3}>
                                                    <div style={styles.apkActiveLeftCol}>
                                                        <span style={styles.apkActiveEntryText}>
                                                            {isBuy ? 'Bought' : 'Sold'} at {formatPrice(trade.entryPrice)}
                                                        </span>
                                                    </div>
                                                    <button style={styles.apkActiveTargetBtn} onClick={() => handleOpenTargetSlModal(trade)}>
                                                        {hasTargetOrSL ? 'Edit Target/SL' : 'Set Target/SL'}
                                                    </button>
                                                </div>

                                                {hasTargetOrSL && (
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
                                                        {targetVal && (
                                                            <span style={{
                                                                backgroundColor: 'rgba(74, 186, 120, 0.15)',
                                                                border: '1px solid rgba(74, 186, 120, 0.4)',
                                                                color: '#4ABA78',
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                Target: ₹{targetVal}
                                                            </span>
                                                        )}
                                                        {slVal && (
                                                            <span style={{
                                                                backgroundColor: 'rgba(239, 83, 80, 0.15)',
                                                                border: '1px solid rgba(239, 83, 80, 0.4)',
                                                                color: '#EF5350',
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                SL: ₹{slVal}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* Row 4: Margin Info */}
                                    <div style={styles.apkActiveRow4}>
                                        <span style={styles.apkActiveMarginText}>Margin Used: ₹{displayMarginUsed.toFixed(2)}</span>
                                        <span style={styles.apkActiveMarginTextRight}>Holding Margin: ₹{holdingMargin.toFixed(2)}</span>
                                    </div>

                                    {/* Row 5: Executed from Pending */}
                                    {trade.executedFromPending && (
                                        <div style={styles.apkActiveRow5}>
                                            <span style={styles.apkActivePendingBadge}>
                                                ● Executed from Pending {isBuy ? 'Buy' : 'Sell'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // --- CLOSED TRADE CARD ---
                        if (activeTab === 'Closed') {
                            const pnlValue = parseFloat(trade.pnl || 0);
                            const brokerage = parseFloat(trade.brokerage || 0);
                            const isNeg = pnlValue < 0;

                            const themeColor = isNeg ? '#D32F2F' : '#2E7D32';
                            const themeBg = isNeg ? '#FFCDD2' : '#C8E6C9';

                            const getRemarkStyle = (remark) => {
                                const r = remark.toLowerCase();
                                if (r.includes('target') || r.includes('profit') || r.includes('reached')) {
                                    return { bg: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', text: '#10B981' };
                                }
                                if (r.includes('sl') || r.includes('stop') || r.includes('loss')) {
                                    return { bg: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', text: '#EF4444' };
                                }
                                return { bg: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', text: '#F59E0B' };
                            };

                            const remarkStyle = trade.closeRemark ? getRemarkStyle(trade.closeRemark) : null;

                            return (
                                <div key={trade.id} style={styles.closedTradeItem}>
                                    {/* Row 1: Symbol + P&L badge + QTY badge */}
                                    <div style={styles.closedHeader}>
                                        <span style={styles.closedSymbolName}>{formattedName}</span>
                                        <div style={styles.closedBadges}>
                                            <div style={{ ...styles.pnlBadge, backgroundColor: themeBg, color: themeColor }}>
                                                {pnlValue.toFixed(2)}{brokerage > 0 ? ` / -${brokerage.toFixed(2)}` : ''}
                                            </div>
                                            <div style={{ ...styles.qtyBadge, backgroundColor: themeBg, color: themeColor }}>
                                                QTY:{trade.qty || '1'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Buy side (label + red price) | Sell side (label + green price) */}
                                    <div style={styles.closedPricesRow}>
                                        <div style={styles.priceInfo}>
                                            <span style={styles.priceLabel}>
                                                {trade.type === 'BUY' ? `Bought By ${trade.username || 'testclient'}` : `Sold By ${trade.username || 'testclient'}`}
                                            </span>
                                            <div style={styles.priceBoxRed}>
                                                {formatPrice(trade.entryPrice)}
                                            </div>
                                        </div>
                                        <div style={styles.priceInfoRight}>
                                            <span style={styles.priceLabel}>
                                                {trade.type === 'BUY' ? `Sold By ${trade.closed_by || 'Unknown'}` : `Bought By ${trade.closed_by || 'Unknown'}`}
                                            </span>
                                            <div style={styles.priceBoxGreen}>
                                                {formatPrice(trade.exitPrice || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remark badge if exists */}
                                    {trade.closeRemark && remarkStyle && (
                                        <div style={{
                                            ...styles.remarkBadgeContainer,
                                            backgroundColor: remarkStyle.bg,
                                            borderColor: remarkStyle.border,
                                            color: remarkStyle.text
                                        }}>
                                            <span>● {trade.closeRemark}</span>
                                        </div>
                                    )}

                                    {/* Row 3: Entry time | Exit time */}
                                    <div style={styles.closedTimeRow}>
                                        <span style={styles.timeValue}>{trade.time || '---'}</span>
                                        <span style={{ ...styles.timeValue, textAlign: 'right' }}>{trade.exitTime || '---'}</span>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })
                )}
            </main>

            {/* Target & SL Modal Overlay */}
            {showTargetSlModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.apkDialog}>
                        <h3 style={styles.apkDialogTitle}>Set Target & Stop Loss</h3>
                        <div style={styles.apkDialogSymbol}>{selectedTrade?.displayName || selectedTrade?.name}</div>
                        
                        {errorMessage && <div style={styles.errorAlert}>{errorMessage}</div>}

                        <div style={styles.apkFormGroup}>
                            <label style={styles.apkInputLabel}>Target Price</label>
                            <input
                                type="number"
                                step="any"
                                value={targetPrice}
                                onChange={e => setTargetPrice(e.target.value)}
                                style={styles.apkInput}
                                placeholder="Enter Target Price"
                            />
                        </div>

                        <div style={styles.apkFormGroup}>
                            <label style={styles.apkInputLabel}>Stop Loss Price</label>
                            <input
                                type="number"
                                step="any"
                                value={stopLoss}
                                onChange={e => setStopLoss(e.target.value)}
                                style={styles.apkInput}
                                placeholder="Enter Stop Loss Price"
                            />
                        </div>

                        <div style={styles.apkModalActions}>
                            <button onClick={handleTargetSlConfirm} disabled={loading} style={styles.apkConfirmBtn}>
                                {loading ? 'SAVING...' : 'SET VALUES'}
                            </button>
                            <button onClick={() => setShowTargetSlModal(false)} style={styles.apkCancelBtn}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Order Modal Overlay */}
            {showEditModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.apkDialog}>
                        <h3 style={styles.apkDialogTitle}>Edit Pending Order</h3>
                        <div style={styles.apkDialogSymbol}>{selectedTrade?.displayName || selectedTrade?.name}</div>

                        {errorMessage && <div style={styles.errorAlert}>{errorMessage}</div>}

                        <div style={styles.apkFormGroup}>
                            <label style={styles.apkInputLabel}>Quantity</label>
                            <input
                                type="number"
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                                style={styles.apkInput}
                            />
                        </div>

                        <div style={styles.apkFormGroup}>
                            <label style={styles.apkInputLabel}>Price</label>
                            <input
                                type="number"
                                step="any"
                                value={editPrice}
                                onChange={e => setEditPrice(e.target.value)}
                                style={styles.apkInput}
                            />
                        </div>

                        <div style={styles.apkModalActions}>
                            <button onClick={handleEditOrderConfirm} disabled={loading} style={styles.apkConfirmBtn}>
                                {loading ? 'SAVING...' : 'UPDATE ORDER'}
                            </button>
                            <button onClick={() => setShowEditModal(false)} style={styles.apkCancelBtn}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Order Confirmation Modal Overlay */}
            {showCancelModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.apkCancelOrderDialog}>
                        <h3 style={styles.apkCancelOrderTitle}>Cancel Order?</h3>
                        <div style={styles.apkCancelOrderMessage}>
                            Are you sure you want to cancel this order for {selectedTrade?.displayName || selectedTrade?.name}?
                        </div>
                        <div style={styles.apkCancelOrderActions}>
                            <button onClick={handleCancelOrderConfirm} disabled={loading} style={styles.apkYesCancelBtn}>
                                {loading ? 'CANCELLING...' : 'Yes, Cancel'}
                            </button>
                            <button onClick={() => { setShowCancelModal(false); setSelectedTrade(null); }} style={styles.apkNoKeepBtn}>
                                No, Keep It
                            </button>
                        </div>
                    </div>
                </div>
            )}


            </div>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: 'transparent',
        minHeight: '100%',
        padding: '0',
        paddingBottom: '90px',
        display: 'flex',
        flexDirection: 'column',
    },
    contentWrapper: {
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingBottom: '16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: 'rgba(8, 10, 22, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '1px',
        margin: 0,
    },
    tabBar: {
        display: 'flex',
        backgroundColor: 'rgba(8, 10, 22, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: '46px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },
    tab: {
        flex: 1,
        backgroundColor: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        height: '100%',
        borderBottom: '2px solid transparent',
        transition: 'all 0.15s ease',
    },
    activeTab: {
        borderBottom: '2px solid #ffffff',
    },
    tabText: {
        color: '#9CA3AF',
        fontSize: '13px',
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#ffffff',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 16px 0 16px',
    },
    emptyContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
    },
    emptyText: {
        color: '#b8c5d6',
        fontSize: '14px',
        fontWeight: '500',
    },
    emptyDivider: {
        marginTop: '10px',
        width: '40px',
        height: '2px',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },

    // --- PENDING ORDER CARD STYLES ---
    pendingTradeItem: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 0',
    },
    pendingRow1: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
    },
    pendingSymbolName: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#ffffff',
    },
    pendingPriceText: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    pendingRow2: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    pendingTypeQty: {
        fontSize: '14px',
        color: '#9CA3AF',
        fontWeight: '500',
    },
    pendingTime: {
        fontSize: '12px',
        color: '#b8c5d6',
        marginTop: '2px',
    },
    pendingActionButtons: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    pendingEditBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#2196F3',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    pendingCancelBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#EF4444',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    pendingRow3: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: '4px',
    },
    pendingInfoLabel: {
        fontSize: '13px',
        color: '#9CA3AF',
    },
    pendingInfoValue: {
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: '500',
        marginTop: '4px',
    },
    pendingReqCol: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    pendingDivider: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginTop: '16px',
        marginBottom: '6px',
    },

    // --- ACTIVE POSITION CARD STYLES ---
    activeTradeItem: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    },
    activeCompactRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    activeLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    symbolNameLarge: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
    },
    activeBadgeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    boughtBadge: {
        backgroundColor: 'rgba(33, 150, 243, 0.12)',
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid rgba(33, 150, 243, 0.25)',
    },
    boughtBadgeText: {
        color: '#2196F3',
        fontSize: '10px',
        fontWeight: 'bold',
    },
    activeDateText: {
        fontSize: '11px',
        color: '#9CA3AF',
    },
    activeRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
    },
    ltpText: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeTradeBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        color: '#ef4444',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 12px',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
    activeSubRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '4px 0 8px 0',
    },
    traderText: {
        fontSize: '13px',
        color: '#9CA3AF',
    },
    setTargetBtn: {
        backgroundColor: 'rgba(33, 150, 243, 0.08)',
        border: '1px solid rgba(33, 150, 243, 0.2)',
        borderRadius: '16px',
        color: '#2196F3',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 12px',
        cursor: 'pointer',
    },
    activeMarginRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#b8c5d6',
        marginBottom: '6px',
    },
    marginText: {
        margin: 0,
    },
    executedFromPendingBadge: {
        backgroundColor: 'rgba(255, 183, 77, 0.08)',
        border: '1px solid rgba(255, 183, 77, 0.2)',
        borderRadius: '4px',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#FFB74D',
        marginTop: '6px',
        alignSelf: 'flex-start',
    },
    executedFromPendingText: {
        margin: 0,
    },
    activeDivider: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginTop: '12px',
        marginBottom: '4px',
    },

    // --- CLOSED TRADE CARD STYLES ---
    closedTradeItem: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 0',
    },
    closedHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    closedSymbolName: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#ffffff',
    },
    closedBadges: {
        display: 'flex',
        gap: '6px',
    },
    pnlBadge: {
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '3px 8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
    },
    qtyBadge: {
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '3px 8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
    },
    closedPricesRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
    },
    priceInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        flex: 1,
    },
    priceInfoRight: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        flex: 1,
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: '12px',
        color: '#9CA3AF',
        marginBottom: '4px',
    },
    priceBoxRed: {
        backgroundColor: '#FFCDD2',
        color: '#D32F2F',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '4px 10px',
        borderRadius: '4px',
        width: 'fit-content',
        textAlign: 'center',
        minWidth: '70px',
    },
    priceBoxGreen: {
        backgroundColor: '#C8E6C9',
        color: '#2E7D32',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '4px 10px',
        borderRadius: '4px',
        width: 'fit-content',
        textAlign: 'center',
        minWidth: '70px',
    },
    remarkBadgeContainer: {
        borderRadius: '4px',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        marginTop: '0',
        marginBottom: '10px',
        display: 'inline-flex',
        alignSelf: 'flex-start',
    },
    closedTimeRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#b8c5d6',
    },
    timeValue: {
        margin: 0,
    },
    cardDivider: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginTop: '12px',
        marginBottom: '4px',
    },

    // --- DIALOGS & OVERLAYS STYLES ---
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    dialog: {
        backgroundColor: 'rgba(8, 10, 22, 0.94)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        padding: '24px',
        width: '85%',
        maxWidth: '400px',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
    },
    dialogTitle: {
        fontSize: '17px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '4px',
    },
    dialogSub: {
        fontSize: '13px',
        color: '#9CA3AF',
        marginBottom: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '14px',
        textAlign: 'left',
    },
    inputLabel: {
        fontSize: '12px',
        color: '#9CA3AF',
        marginBottom: '6px',
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px 12px',
        color: '#f0f4ff',
        fontSize: '14px',
    },
    errorAlert: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        padding: '8px 10px',
        color: '#EF4444',
        fontSize: '12px',
        marginBottom: '15px',
        textAlign: 'left',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        marginTop: '24px',
    },
    cancelBtnText: {
        color: '#9CA3AF',
        fontWeight: 'bold',
        fontSize: '14px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
    },
    confirmBtn: {
        backgroundColor: '#2196F3',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        border: 'none',
        cursor: 'pointer',
    },
    closeBtnConfirm: {
        backgroundColor: '#EF4444',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        border: 'none',
        cursor: 'pointer',
    },
    // APK Matching White Dialog Styles
    apkDialog: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        width: '85%',
        maxWidth: '380px',
        textAlign: 'left',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    apkDialogTitle: {
        fontSize: '18px',
        fontWeight: 'normal',
        color: '#444444',
        textAlign: 'center',
        margin: '0 0 16px 0',
    },
    apkDialogSymbol: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: '20px',
    },
    apkFormGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px',
    },
    apkInputLabel: {
        fontSize: '14px',
        color: '#000000',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    apkInput: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '12px 14px',
        color: '#000000',
        fontSize: '16px',
        outline: 'none',
    },
    apkModalActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '24px',
    },
    apkConfirmBtn: {
        backgroundColor: '#2e7d32',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '14px 0',
        borderRadius: '6px',
        fontSize: '16px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    apkCancelBtn: {
        backgroundColor: '#c62828',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '14px 0',
        borderRadius: '6px',
        fontSize: '16px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    // APK Cancel Order Confirmation Dialog Styles (Light Themed)
    apkCancelOrderDialog: {
        backgroundColor: '#f3f4f6',
        borderRadius: '24px',
        padding: '32px 24px 24px 24px',
        width: '85%',
        maxWidth: '340px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    apkCancelOrderTitle: {
        fontSize: '22px',
        fontWeight: '500',
        color: '#000000',
        margin: '0 0 16px 0',
    },
    apkCancelOrderMessage: {
        fontSize: '15px',
        color: '#4B5563',
        lineHeight: '1.5',
        margin: '0 0 28px 0',
    },
    apkCancelOrderActions: {
        display: 'flex',
        gap: '12px',
    },
    apkYesCancelBtn: {
        flex: 1,
        backgroundColor: '#FF5252',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '12px 0',
        borderRadius: '12px',
        fontSize: '15px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
    },
    apkNoKeepBtn: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        color: '#374151',
        fontWeight: 'bold',
        padding: '12px 0',
        borderRadius: '12px',
        fontSize: '15px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
    },
    // Exit Trade Full-Page Responsive Styles
    exitTradeOverlay: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        minHeight: '100%',
        width: '100%',
    },
    exitTradeHeader: {
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(8, 10, 22, 0.8)',
    },
    exitTradeBackBtn: {
        background: 'none',
        border: 'none',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
    },
    exitTradeTitle: {
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: 0,
        textAlign: 'center',
    },
    exitTradeContentWrapper: {
        flex: 1,
        width: '100%',
        overflowY: 'auto',
    },
    exitTradeContent: {
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
    },
    exitTradeSymbol: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '24px',
    },
    exitTradeSubmitBtn: {
        color: '#ffffff',
        border: 'none',
        height: '52px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginBottom: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    exitStatsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
    },
    exitStatsCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    exitStatItem: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        borderBottom: '1px dashed rgba(255,255,255,0.08)',
        paddingBottom: '4px',
    },
    exitStatLabel: {
        color: '#9CA3AF',
    },
    exitStatValue: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    // APK Matching Active Trades Card Styles
    apkActiveCard: {
        backgroundColor: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    apkActiveRow1: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    apkActiveSymbol: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    apkActiveLtp: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    apkActiveRow2: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    apkActiveLeftCol: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    apkActiveBadge: {
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '3px 8px',
        borderRadius: '4px',
    },
    apkActiveDate: {
        fontSize: '13px',
        color: '#b8c5d6',
    },
    apkActiveCloseBtn: {
        backgroundColor: '#d32f2f',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        border: 'none',
        cursor: 'pointer',
        minWidth: '100px',
        textAlign: 'center',
    },
    apkActiveRow3: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    apkActiveEntryText: {
        fontSize: '14px',
        color: '#9CA3AF',
    },
    apkActiveTargetBtn: {
        backgroundColor: '#2e7d32',
        color: '#ffffff',
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        border: 'none',
        cursor: 'pointer',
        minWidth: '100px',
        textAlign: 'center',
    },
    apkActiveRow4: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2px',
    },
    apkActiveMarginText: {
        fontSize: '13px',
        color: '#9CA3AF',
    },
    apkActiveMarginTextRight: {
        fontSize: '13px',
        color: '#9CA3AF',
        textAlign: 'right',
    },
    apkActiveRow5: {
        display: 'flex',
        marginTop: '2px',
    },
    apkActivePendingBadge: {
        fontSize: '12px',
        color: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontWeight: '500',
    },
};
