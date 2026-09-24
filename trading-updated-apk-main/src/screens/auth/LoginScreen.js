import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Alert,
    Dimensions,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Image,
    useWindowDimensions,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Leaf, Eye, EyeOff } from 'lucide-react-native';

import ScreenWrapper from '../../components/ScreenWrapper';
import LoginSuccessPopup from '../../components/LoginSuccessPopup';
import * as api from '../../services/api';
import { useTrades } from '../../context/TradeContext';

const LoginScreen = ({ navigation }) => {
    const { height: screenHeight } = useWindowDimensions();
    const { fetchInitialData } = useTrades();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoginSuccessVisible, setIsLoginSuccessVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const isSmallDevice = screenHeight < 700;
    const isLargeDevice = screenHeight > 880;

    const logoSize = isSmallDevice ? 110 : isLargeDevice ? 135 : 125;
    const logoMarginBottom = isSmallDevice ? 0 : 2;
    const titleFontSize = isSmallDevice ? 32 : isLargeDevice ? 38 : 35;
    const logoContainerMarginBottom = isSmallDevice ? 25 : 35;

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Required", "Please enter both Username and Password.");
            return;
        }

        setLoading(true);
        try {
            const deviceType = Platform.OS === 'android' ? 'Android' : 'iOS';

            const loginData = await api.login(username.trim(), password.trim(), {
                deviceInfo: `${deviceType} Mobile App`,
                os: deviceType,
                device: `${deviceType} Device`,
                riskScore: Math.floor(Math.random() * 20)
            });

            if (loginData.user.role !== 'TRADER') {
                throw new Error('Only traders are allowed to login here.');
            }

            api.setSession(loginData.token, loginData.user);

            const scheduleTask = typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout;
            scheduleTask(async () => {
                try {
                    await fetchInitialData();
                } catch (dataErr) {
                    console.warn('⚠️ Initial data fetch error:', dataErr.message);
                }
            });

            setIsLoginSuccessVisible(true);

        } catch (err) {
            console.log('❌ Login error:', err.message || err);
            const errorMsg = err?.response?.data?.message || err.message || 'Invalid credentials or server not accessible';
            Alert.alert("Login Failed", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleModalConfirm = () => {
        setIsLoginSuccessVisible(false);
        navigation.replace('Main');
    };

    return (
        <ScreenWrapper>
            <View style={styles.outerContainer}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.centerContent}>
                            {/* Logo Section */}
                            <View style={[styles.logoContainer, { marginBottom: logoContainerMarginBottom }]}>
                                <Image
                                    source={require('../../assets/finallogo.png')}
                                    style={[styles.logoImageInside, { width: logoSize, height: logoSize, marginBottom: logoMarginBottom }]}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.appTitle, { fontSize: titleFontSize }]}>VTRKM</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formContainer}>
                                {/* User Name Field */}
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            style={styles.textInput}
                                            value={username}
                                            onChangeText={setUsername}
                                            placeholder="User Name"
                                            placeholderTextColor="rgba(255, 255, 255, 0.55)"
                                            cursorColor="#7ba6a9"
                                            underlineColorAndroid="transparent"
                                            autoCapitalize="none"
                                            maxLength={12}
                                        />
                                    </View>
                                    <View style={styles.underline} />
                                    <View style={styles.counterRow}>
                                        <Text style={styles.counterText}>{(username || '').length}/12</Text>
                                    </View>
                                </View>

                                {/* Password Field */}
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            style={[styles.textInput, { flex: 1 }]}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Password"
                                            placeholderTextColor="rgba(255, 255, 255, 0.55)"
                                            secureTextEntry={!showPassword}
                                            cursorColor="#7ba6a9"
                                            underlineColorAndroid="transparent"
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeIconBtn}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} color="rgba(255, 255, 255, 0.5)" />
                                            ) : (
                                                <Eye size={18} color="rgba(255, 255, 255, 0.5)" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.underline} />
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={[styles.loginButton, loading && { opacity: 0.7 }]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#B0C4DE" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Login</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Disclaimer Section */}
                            <View style={styles.disclaimerSection}>
                                <Text style={styles.disclaimerText}>
                                    <Text style={{ fontWeight: 'bold' }}>No real money involved.</Text>This is a Virtual Trading Application which has all the features to trade.
                                </Text>
                                <Text style={styles.disclaimerTextTight}>
                                    This application is used for exchanging views on markets for individual students for training purpose only.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Dark Bar for Contact Us */}
                {!isKeyboardVisible && (
                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            style={styles.contactContainer}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('ContactUs')}
                        >
                            <Text style={styles.contactText}>
                                Got any questions? <Text style={styles.contactUsText}>Contact us</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <LoginSuccessPopup
                visible={isLoginSuccessVisible}
                onConfirm={handleModalConfirm}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 55 : 40,
        paddingBottom: 20,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 35,
    },
    logoImageInside: {
        width: 125,
        height: 125,
        marginBottom: 2,
    },
    appTitle: {
        fontSize: 35,
        fontWeight: '600',
        color: '#8FA3B2',
        letterSpacing: 0.5,
        textAlign: 'center',
        includeFontPadding: false,
    },
    formContainer: {
        width: '100%',
        marginBottom: 10,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 4,
    },
    textInput: {
        flex: 1,
        height: 38,
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 17,
        padding: 0,
    },
    underline: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        width: '100%',
    },
    counterRow: {
        alignItems: 'flex-end',
        marginTop: 4,
    },
    counterText: {
        color: 'rgba(255, 255, 255, 0.55)',
        fontSize: 13,
        fontWeight: '400',
    },
    eyeIconBtn: {
        padding: 4,
        marginLeft: 8,
    },
    loginButton: {
        backgroundColor: '#6082A1',
        height: 50,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 26,
    },
    loginButtonText: {
        color: '#B0C4DE',
        fontWeight: '700',
        fontSize: 18,
        letterSpacing: 0.3,
    },
    disclaimerSection: {
        marginTop: 22,
        paddingHorizontal: 2,
    },
    disclaimerText: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 13.5,
        lineHeight: 18.5,
        marginBottom: 10,
    },
    disclaimerTextTight: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 13.5,
        lineHeight: 18.5,
    },
    bottomBar: {
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    contactContainer: {
        alignItems: 'center',
    },
    contactText: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 15,
    },
    contactUsText: {
        color: '#ffffff',
        fontWeight: 'bold',
    }
});

export default LoginScreen;
