import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const LoginSuccessPopup = ({ visible, onConfirm }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Success Icon */}
                    <View style={styles.iconCircle}>
                        <CheckCircle2 size={50} color="#4ADE80" strokeWidth={2.5} />
                    </View>

                    {/* Text Content */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Login Successful!</Text>
                        <Text style={styles.message}>
                            Welcome back to VTRKM. Your trading session has been initialized.
                        </Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
                        <Text style={styles.confirmText}>GET STARTED</Text>
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
        borderColor: 'rgba(74, 222, 128, 0.3)',
        alignItems: 'center',
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
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
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    confirmBtn: {
        backgroundColor: '#4ADE80',
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

export default LoginSuccessPopup;
