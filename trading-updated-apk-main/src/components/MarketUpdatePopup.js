import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Info, X } from 'lucide-react-native';

const MarketUpdatePopup = ({ visible, onClose, onAcknowledge, title, message }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header with X */}
                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <X size={20} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    <View style={styles.contentRow}>
                        {/* Info Icon */}
                        <View style={styles.iconCircle}>
                            <Info size={24} color="#63B3ED" />
                        </View>

                        {/* Text Content */}
                        <View style={styles.textColumn}>
                            <Text style={styles.title}>{title || 'MARKET UPDATE'}</Text>
                            <Text style={styles.message}>
                                {message || 'Trading is now active. Please review updated margin requirements.'}
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
                            <Text style={styles.dismissText}>DISMISS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ackBtn} onPress={onAcknowledge}>
                            <Text style={styles.ackText}>ACKNOWLEDGE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#0a1421',
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(99,179,237,0.3)',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    closeIcon: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(99,179,237,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textColumn: {
        flex: 1,
    },
    title: {
        color: '#63B3ED',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    message: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    dismissBtn: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 6,
        backgroundColor: '#1c2635',
    },
    dismissText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: 'bold',
    },
    ackBtn: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 6,
        backgroundColor: '#00a65a', // Green like photo
    },
    ackText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default MarketUpdatePopup;
