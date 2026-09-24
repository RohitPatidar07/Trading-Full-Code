import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * TradeWarningPopup -- Anti-scalping / Minimum Hold Time Warning Modal
 * Equivalent to Trading App's src/components/TradeWarningPopup.js
 */
export default function TradeWarningPopup({ visible, title, message, onConfirm }) {
    if (!visible) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.iconCircle}>
                    <AlertTriangle size={48} color="#FF9800" strokeWidth={2.5} />
                </div>
                <div style={styles.textContainer}>
                    <p style={styles.title}>{title || 'Action Restricted'}</p>
                    <p style={styles.message}>
                        {message || 'You cannot perform this action at the moment.'}
                    </p>
                </div>
                <button style={styles.confirmBtn} onClick={onConfirm}>
                    ACKNOWLEDGE
                </button>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    card: {
        backgroundColor: '#1a1a2e',
        border: '1px solid rgba(255,152,0,0.4)',
        borderRadius: '16px',
        padding: '32px 28px',
        maxWidth: '380px',
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    },
    iconCircle: {
        width: '80px', height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,152,0,0.12)',
        border: '2px solid rgba(255,152,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    textContainer: { textAlign: 'center' },
    title: {
        color: '#FF9800', fontSize: '18px', fontWeight: 'bold',
        margin: '0 0 8px 0', letterSpacing: '0.5px',
    },
    message: {
        color: '#cccccc', fontSize: '14px', lineHeight: '1.6', margin: 0,
    },
    confirmBtn: {
        backgroundColor: '#FF9800', color: '#000', border: 'none',
        borderRadius: '8px', padding: '12px 32px', fontSize: '14px',
        fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px',
        marginTop: '4px', width: '100%',
    },
};
