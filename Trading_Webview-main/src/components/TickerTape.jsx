import React, { useMemo } from 'react';
import { useTrades } from '../context/TradeContext';

const TickerTape = () => {
    const { tickers } = useTrades();

    const items = useMemo(() => {
        if (!tickers || tickers.length === 0) return [];
        return tickers.map(t => t.text);
    }, [tickers]);

    if (items.length === 0) return null;

    const tickerText = items.join('      📢      ');

    return (
        <div style={styles.container}>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(50%); }
                    100% { transform: translateX(-100%); }
                }
                .marquee-text {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marquee 30s linear infinite;
                    padding-left: 20px;
                }
            `}</style>
            <div style={styles.tickerWrapper}>
                <span style={styles.alertLabel}>📢:</span>
                <div style={styles.track}>
                    <div className="marquee-text" style={styles.text}>
                        {tickerText}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '28px',
        backgroundColor: '#050a12',
        borderBottom: '1px solid rgba(99,179,237,0.2)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    tickerWrapper: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        paddingLeft: '10px',
    },
    alertLabel: {
        color: '#63B3ED',
        fontSize: '11px',
        fontWeight: 'bold',
        marginRight: '8px',
        zIndex: 2,
        backgroundColor: '#050a12',
        paddingRight: '6px',
    },
    track: {
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: '100%',
    },
    text: {
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
    }
};

export default TickerTape;
