import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar,
    Alert,
    ScrollView,
    ImageBackground,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CircleDollarSign, ArrowLeft, User, Lock, Mail, Phone, Leaf } from 'lucide-react-native';

import ScreenWrapper from '../../components/ScreenWrapper';

const { width, height } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
        if (!name || !email || !password) {
            Alert.alert("Missing Fields", "Please fill name, email and password.");
            return;
        }
        Alert.alert(
            "Account Created",
            "Your trading account has been created successfully. Please login to continue.",
            [{ text: "Login Now", onPress: () => navigation.navigate('Login') }]
        );
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))} 
                        style={styles.backBtn}
                    >
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Account</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <View style={styles.signUpCard}>
                            <View style={styles.logoRow}>
                                <Image
                                    source={require('../../assets/finallogo.png')}
                                    style={styles.logoImageSmall}
                                    resizeMode="contain"
                                />
                                <Text style={styles.signUpHeader}>Register with VTRKM</Text>
                            </View>

                            <Text style={styles.signUpSub}>Start your investment journey today.</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputWrapper}>
                                    <User size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Full Name"
                                        value={name}
                                        onChangeText={setName}
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        cursorColor="white"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Email Address"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        cursorColor="white"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputWrapper}>
                                    <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Phone Number"
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        cursorColor="white"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Set Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        cursorColor="white"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.signUpBtn}
                                onPress={handleSignUp}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.signUpBtnText}>CREATE TRADING ACCOUNT</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLinkContainer}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.disclaimer}>
                        By signing up, you agree to our Terms of Use and Privacy Policy. KYC verification is mandatory for live trading.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F3D3E',
    },
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    signUpCard: {
        padding: 24,
        borderRadius: 8,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoImageSmall: {
        width: 40,
        height: 40,
    },
    signUpHeader: {
        fontSize: 19.5,
        fontWeight: '900',
        color: 'white',
        marginLeft: 10,
    },
    signUpSub: {
        fontSize: 15.5,
        color: '#B0BEC5',
        marginBottom: 24,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13.5,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 17.5,
        color: 'white',
    },
    signUpBtn: {
        marginTop: 10,
        borderRadius: 4,
        backgroundColor: 'white',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpBtnText: {
        color: 'black',
        fontSize: 17.5,
        fontWeight: '900',
        letterSpacing: 1,
    },
    loginLinkContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    loginLinkText: {
        fontSize: 15.5,
        color: '#B0BEC5',
    },
    loginLinkBold: {
        color: 'white',
        fontWeight: 'bold',
    },
    disclaimer: {
        marginTop: 30,
        fontSize: 13.5,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
    }
});

export default SignUpScreen;
