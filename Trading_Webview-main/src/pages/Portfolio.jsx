import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades, normalizeSymbol, getLivePriceObject } from '../context/TradeContext';
import { calculateSegmentMargin } from '../utils/segmentMargin';
import { formatPrice } from '../utils/formatPrice';
import { X, ChevronLeft, RefreshCw } from 'lucide-react';
import useResponsive from '../hooks/useResponsive';
import TradeWarningPopup from '../components/TradeWarningPopup';
import { checkHoldTimeAllowed } from '../utils/holdTimeUtils';

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

export default function Portfolio() {
    const { aggregatedPositions, livePrices, closeTrade, userConfig, fetchInitialData, activePL, totalDynamicMargin, dynamicMarginBySegment, totalM2M, ledgerBalance, marginAvailable, getInstrumentMeta } = useTrades();
    const navigate = useNavigate();
    const { isMobile } = useResponsive();

    const [selectedTrade, setSelectedTrade] = useState(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Anti-scalping / Hold Time Warning
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleCloseTradeConfirm = async () => {
        if (!selectedTrade) return;
        setLoading(true);
        setErrorMessage('');

        // --- Anti-scalping: Minimum Hold Time Check ---
        // For aggregated positions, check the oldest underlying trade (FIFO)
        const tradeToCheck = selectedTrade.oldestTrade || selectedTrade;
        const holdCheck = checkHoldTimeAllowed(tradeToCheck, userConfig);
        if (!holdCheck.allowed) {
            setWarningMessage(
                `Minimum hold time is ${holdCheck.minTime} seconds. Please wait ${holdCheck.remaining} more second(s).`
            );
            setWarningVisible(true);
            setLoading(false);
            return;
        }
        // --- End Hold Time Check ---

        const liveQuote = getLivePriceObject(selectedTrade.name, livePrices) || getLivePriceObject(selectedTrade.displayName, livePrices) || {};
        const ltp = parseFloat(liveQuote.ltp) || parseFloat(selectedTrade.exitPrice) || parseFloat(selectedTrade.avgPrice) || 0;
        const bid = parseFloat(liveQuote.bid) || ltp;
        const ask = parseFloat(liveQuote.ask) || ltp;
        const exitPrice = selectedTrade.type === 'BUY' ? bid : ask;

        try {
            await closeTrade(selectedTrade.tradeIds, exitPrice, new Date().toISOString(), selectedTrade.pnl);
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

    if (showCloseModal && selectedTrade) {
        const liveData = getLivePriceObject(selectedTrade.name, livePrices) || getLivePriceObject(selectedTrade.displayName, livePrices) || {};
        const ltp = parseFloat(liveData.ltp) || parseFloat(selectedTrade.exitPrice) || parseFloat(selectedTrade.avgPrice) || 0;
        
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

        const isBuy = selectedTrade.type === 'BUY';
        const exitPrice = isBuy ? bidVal : askVal;

        const isCommodity = selectedTrade.is_commodity || (selectedTrade.market === 'COMMODITY');
        const fallbackUsdInr = Number(selectedTrade.usdinr_value) || 95.1;
        const usdInrLive = livePrices['USD/INR'] || livePrices['USDINR'];
        const liveBid = usdInrLive ? parseFloat(usdInrLive.bid) || null : null;
        const liveAsk = usdInrLive ? parseFloat(usdInrLive.ask) || null : null;

        const rawPnl = isCommodity
            ? (exitPrice - selectedTrade.avgPrice) * selectedTrade.qty * lotSizeVal * (isBuy ? 1 : -1)
            : (exitPrice - selectedTrade.avgPrice) * selectedTrade.qty * selectedTrade.hardcodedMultiplier * (isBuy ? 1 : -1);

        let usdInrAdjusted = 1;
        if (isCommodity) {
            usdInrAdjusted = rawPnl >= 0 ? (liveAsk || fallbackUsdInr * 0.90) : (liveBid || fallbackUsdInr * 1.10);
        }
        const currentPnl = isCommodity ? rawPnl * usdInrAdjusted : rawPnl;
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
                <header style={styles.header}>
                    <h2 style={styles.headerTitle}>PORTFOLIO</h2>
                </header>

                {/* Margin and Balance Stats Cards */}
                <div style={styles.summaryCard}>
                    <div style={styles.summaryRow}>
                        <div style={styles.summaryItem}>
                            <span style={styles.label}>Ledger Balance</span>
                            <span style={styles.val}>{ledgerBalance.toFixed(2)}</span>
                        </div>
                        <div style={styles.summaryItemRight}>
                            <span style={styles.label}>Margin Available</span>
                            <span style={styles.val}>{marginAvailable.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.summaryRow}>
                        <div style={styles.summaryItem}>
                            <span style={styles.label}>Active P/L</span>
                            <span style={{
                                ...styles.val,
                                color: activePL >= 0 ? '#4caf50' : '#ff3b30'
                            }}>
                                {activePL.toFixed(2)}
                            </span>
                        </div>
                        <div style={styles.summaryItemRight}>
                            <span style={styles.label}>M2M</span>
                            <span style={{
                                ...styles.val,
                                color: totalM2M >= 0 ? '#4caf50' : '#ff3b30'
                            }}>
                                {totalM2M.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.marginBreakdown}>
                        <div style={styles.marginRow}>
                            <span style={styles.marginLabel}>Net Holding Margin Required:</span>
                            <span style={styles.marginVal}>{totalDynamicMargin.toFixed(2)}</span>
                        </div>
                        <div style={styles.subMarginRow}>
                            <span>NSE / BSE</span>
                            <span>{(dynamicMarginBySegment.EQUITY || 0).toFixed(2)}</span>
                        </div>
                        <div style={styles.subMarginRow}>
                            <span>MCX</span>
                            <span>{(dynamicMarginBySegment.MCX || 0).toFixed(2)}</span>
                        </div>
                        <div style={styles.subMarginRow}>
                            <span>Options</span>
                            <span>{(dynamicMarginBySegment.OPTIONS || 0).toFixed(2)}</span>
                        </div>
                        <div style={styles.subMarginRow}>
                            <span>COMEX</span>
                            <span>{(dynamicMarginBySegment.COMEX || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {aggregatedPositions.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <span style={styles.emptyText}>No active positions</span>
                    </div>
                ) : (
                    <main style={styles.positionsList}>
                        {aggregatedPositions.map(pos => {
                            const isUnitMode = userConfig?.tradeEquityUnits === 1 || userConfig?.tradeEquityUnits === true;
                            let cardHoldingMargin = calculateSegmentMargin({
                                marketType: pos.market || pos.market_type || pos.marketType || 'MCX',
                                symbol: pos.name || pos.symbol,
                                price: pos.avgPrice || pos.entryPrice || 0,
                                qty: Math.abs(pos.qty || 1),
                                lotSize: pos.lot_size || 1,
                                isHolding: true,
                                clientConfig: userConfig || {},
                                isUnitMode: isUnitMode
                            });
                            if (cardHoldingMargin <= 0 && pos.margin_used > 0) {
                                cardHoldingMargin = pos.margin_used;
                            }

                            return (
                                <div key={pos.name} style={styles.positionCard}>
                                    {/* Header row with badges and holding margin */}
                                    <div style={styles.positionHeaderRow}>
                                        <div style={styles.badgeContainer}>
                                            <span style={{
                                                ...styles.boughtBadge,
                                                backgroundColor: pos.type === 'SELL' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                                                color: pos.type === 'SELL' ? '#ff3b30' : '#4caf50'
                                            }}>
                                                {pos.type === 'BUY' ? 'Bought' : 'Sold'}
                                            </span>
                                            <span style={styles.qtyBadge}>
                                                QTY {pos.qty}
                                            </span>
                                        </div>
                                        <div style={styles.marginSection}>
                                            <span style={styles.marginLabelText}>Holding Margin Required</span>
                                            <span style={styles.marginValText}>{cardHoldingMargin.toFixed(2)}</span>
                                        </div>
                                    </div>

                                {/* Symbol Name */}
                                <div style={styles.symbolRow}>
                                    <span style={styles.symbolName}>{formatSymbolName(pos.displayName || pos.name)}</span>
                                </div>

                                {/* Prices row */}
                                <div style={styles.pricesInfoRow}>
                                    <div style={styles.priceCol}>
                                        <span style={styles.priceLabel}>Avg</span>
                                        <span style={styles.priceVal}>{pos.avgPrice.toFixed(2)}</span>
                                    </div>
                                    <div style={styles.priceCol}>
                                        <span style={styles.priceLabel}>CMP</span>
                                        <span style={styles.priceVal}>{(pos.ltp && pos.ltp > 0 ? pos.ltp : (pos.avgPrice || 0)).toFixed(2)}</span>
                                    </div>
                                </div>

                                {pos.executedFromPending && (
                                     <div style={styles.executedFromPendingBadge}>
                                         <span style={styles.executedFromPendingText}>
                                             ● Executed from Pending {pos.type === 'BUY' ? 'Buy' : 'Sell'}
                                         </span>
                                     </div>
                                 )}

                                {/* Divider line */}
                                <div style={styles.cardDivider} />

                                {/* Footer row with P/L and Close Trades button */}
                                <div style={styles.positionFooterRow}>
                                    <div style={styles.pnlContainer}>
                                        <span style={styles.pnlLabelText}>P/L</span>
                                        <span style={{
                                            ...styles.pnlValText,
                                            color: pos.pnl >= 0 ? '#4caf50' : '#ff3b30'
                                        }}>
                                            {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTrade(pos);
                                            setErrorMessage('');
                                            setShowCloseModal(true);
                                        }}
                                        style={styles.closeTradesBtn}
                                    >
                                        Close Trades
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    </main>
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
        marginBottom: '12px',
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '1px',
        margin: 0,
    },
    summaryCard: {
        backgroundColor: 'rgba(18, 70, 95, 1)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 14px',
        margin: '0 12px 12px 12px',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
    },
    summaryItem: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '0 6px',
    },
    summaryItemRight: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '0 6px',
        alignItems: 'flex-end',
        textAlign: 'right',
    },
    label: {
        fontSize: '10px',
        color: '#94A3B8',
        marginBottom: '4px',
        fontWeight: '500',
        letterSpacing: '0.4px',
    },
    val: {
        fontSize: '17px',
        fontWeight: '700',
        color: '#E8E8E8',
        letterSpacing: '0.3px',
    },
    divider: {
        height: '1.5px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        margin: '8px 0',
    },
    marginBreakdown: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: '4px',
    },
    marginRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 0',
        color: '#E8E8E8',
    },
    marginLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#E8E8E8',
        letterSpacing: '0.3px',
    },
    marginVal: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#E8E8E8',
        letterSpacing: '0.3px',
    },
    subMarginRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 0',
        fontSize: '12px',
        color: '#CBD5E1',
        fontWeight: '500',
        letterSpacing: '0.3px',
    },
    positionsList: {
        display: 'flex',
        flexDirection: 'column',
        padding: '0 12px',
        gap: '12px',
    },
    emptyContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 0',
        backgroundColor: 'rgba(10, 35, 60, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        margin: '0 12px',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: '13px',
    },
    // Aligned position cards matching React Native styling
    positionCard: {
        backgroundColor: 'rgba(10, 35, 60, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '0',
    },
    positionHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
    },
    badgeContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    boughtBadge: {
        fontSize: '11px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '600',
        letterSpacing: '0.3px',
    },
    qtyBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '11px',
        color: '#CBD5E1',
        fontWeight: '500',
        letterSpacing: '0.3px',
    },
    marginSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    marginLabelText: {
        fontSize: '11px',
        color: '#9CA3AF',
        fontWeight: '500',
    },
    marginValText: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    symbolRow: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '-4px',
    },
    symbolName: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    pricesInfoRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    priceCol: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px',
    },
    priceLabel: {
        fontSize: '12px',
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    priceVal: {
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: 'bold',
    },
    cardDivider: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        margin: '12px 0',
    },
    positionFooterRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pnlContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px',
    },
    pnlLabelText: {
        fontSize: '12px',
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    pnlValText: {
        fontSize: '15px',
        fontWeight: 'bold',
    },
    closeTradesBtn: {
        backgroundImage: 'linear-gradient(90deg, #f87d7d 0%, #fa854a 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'opacity 0.15s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    },
    executedFromPendingBadge: {
        backgroundColor: 'rgba(0, 200, 255, 0.08)',
        alignSelf: 'flex-start',
        padding: '3px 8px',
        borderRadius: '4px',
        marginTop: '6px',
        border: '0.5px solid rgba(0, 200, 255, 0.25)',
        display: 'inline-block',
    },
    executedFromPendingText: {
        color: '#00C8FF',
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.2px',
        margin: 0,
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
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
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
    errorAlert: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#EF4444',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
    },
};
