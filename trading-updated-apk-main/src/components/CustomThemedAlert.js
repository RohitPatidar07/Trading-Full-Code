import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Alert
} from 'react-native';
import { CheckCircle, AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

let alertHandler = null;
let pendingAlert = null;

export const registerAlertHandler = (handler) => {
    alertHandler = handler;
    if (pendingAlert && handler) {
        handler(pendingAlert);
        pendingAlert = null;
    }
};

// Global interceptor for native Alert.alert
const originalAlert = Alert.alert;

Alert.alert = (title, message, buttons, options) => {
    if (alertHandler) {
        alertHandler({ title, message, buttons, options });
    } else {
        pendingAlert = { title, message, buttons, options };
    }
};

const CustomThemedAlert = () => {
    const [alertData, setAlertData] = useState(null);

    useEffect(() => {
        registerAlertHandler((data) => {
            setAlertData(data);
        });
        return () => {
            registerAlertHandler(null);
        };
    }, []);

    if (!alertData) return null;

    const { title, message, buttons = [], options } = alertData;

    const closeAlert = () => {
        setAlertData(null);
    };

    // Determine type: success, destructive, or warning
    const tLower = (title || '').toLowerCase();
    const mLower = (message || '').toLowerCase();

    const isSuccess = tLower.includes('success') ||
                      tLower.includes('placed') ||
                      tLower.includes('executed') ||
                      tLower.includes('created') ||
                      tLower.includes('updated') ||
                      tLower.includes('hit');

    const hasDestructiveBtn = buttons && buttons.some(
        b => b && (b.style === 'destructive' || 
             (b.text && (b.text.toLowerCase().includes('delete') || b.text.toLowerCase().includes('logout'))))
    );

    const isDestructive = hasDestructiveBtn || tLower.includes('delete') || tLower.includes('logout');

    const accentColor = isSuccess ? '#10B981' : (isDestructive ? '#EF4444' : '#FF9800');
    const borderColor = isSuccess ? 'rgba(16, 185, 129, 0.3)' : (isDestructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 152, 0, 0.3)');
    const iconBgColor = isSuccess ? 'rgba(16, 185, 129, 0.1)' : (isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 152, 0, 0.1)');

    const effectiveButtons = (!buttons || buttons.length === 0) 
        ? [{ text: 'OK' }] 
        : buttons;

    return (
        <Modal
            transparent
            visible={!!alertData}
            animationType="fade"
            onRequestClose={() => {
                if (options?.cancelable) {
                    if (options.onDismiss) options.onDismiss();
                    closeAlert();
                }
            }}
        >
            <View style={styles.overlay}>
                <View style={[styles.card, { borderColor, shadowColor: accentColor }]}>
                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                        {isSuccess ? (
                            <CheckCircle size={50} color={accentColor} strokeWidth={2.5} />
                        ) : (
                            <AlertTriangle size={50} color={accentColor} strokeWidth={2.5} />
                        )}
                    </View>

                    {/* Text Content */}
                    <View style={styles.textContainer}>
                        {!!title && <Text style={styles.title}>{title}</Text>}
                        {!!message && <Text style={styles.message}>{message}</Text>}
                    </View>

                    {/* Buttons */}
                    {effectiveButtons.length === 1 ? (
                        <TouchableOpacity
                            style={[styles.singleBtn, { backgroundColor: accentColor }]}
                            onPress={() => {
                                closeAlert();
                                if (effectiveButtons[0].onPress) {
                                    effectiveButtons[0].onPress();
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.singleBtnText, isDestructive && { color: '#FFFFFF' }]}>
                                {effectiveButtons[0].text || 'OK'}
                            </Text>
                        </TouchableOpacity>
                    ) : effectiveButtons.length === 2 ? (
                        <View style={styles.buttonRow}>
                            {effectiveButtons.map((btn, idx) => {
                                const isCancel = btn.style === 'cancel' || (btn.text && btn.text.toLowerCase() === 'cancel');
                                const isBtnDestructive = btn.style === 'destructive' || 
                                    (btn.text && (btn.text.toLowerCase().includes('delete') || btn.text.toLowerCase().includes('logout')));
                                
                                const btnBg = isCancel 
                                    ? 'rgba(255,255,255,0.08)' 
                                    : (isBtnDestructive ? '#EF4444' : accentColor);
                                
                                const btnTextColor = isCancel 
                                    ? '#E0E0E0' 
                                    : (isBtnDestructive ? '#FFFFFF' : '#0a1421');

                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.rowBtn,
                                            { backgroundColor: btnBg },
                                            isCancel && styles.cancelBorder
                                        ]}
                                        onPress={() => {
                                            closeAlert();
                                            if (btn.onPress) {
                                                btn.onPress();
                                            }
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.rowBtnText, { color: btnTextColor }]}>
                                            {btn.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.buttonStack}>
                            {effectiveButtons.map((btn, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.stackBtn, { backgroundColor: accentColor }]}
                                    onPress={() => {
                                        closeAlert();
                                        if (btn.onPress) btn.onPress();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.singleBtnText}>{btn.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
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
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 25,
        width: '100%',
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
    singleBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    singleBtnText: {
        color: '#0a1421',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    rowBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowBtnText: {
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cancelBorder: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    buttonStack: {
        width: '100%',
        gap: 10,
    },
    stackBtn: {
        width: '100%',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
    },
});

export default CustomThemedAlert;
