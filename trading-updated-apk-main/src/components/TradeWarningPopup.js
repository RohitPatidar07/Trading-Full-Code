import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TradeWarningPopup = ({ visible, title, message, onConfirm, buttonText }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Warning Icon */}
                    <View style={styles.iconCircle}>
                        <AlertTriangle size={50} color="#FF9800" strokeWidth={2.5} />
                    </View>

                    {/* Text Content */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{title || 'Action Restricted'}</Text>
                        <Text style={styles.message}>
                            {message || 'You cannot perform this action at the moment.'}
                        </Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
                        <Text style={styles.confirmText}>{buttonText || 'ACKNOWLEDGE'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#0a1421',
        width: width * 0.85,
        maxWidth: 350,
        borderRadius: 20,
        padding: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.3)',
        alignItems: 'center',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    confirmBtn: {
        backgroundColor: '#FF9800',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmText: {
        color: '#0a1421',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    }
});

export default TradeWarningPopup;
