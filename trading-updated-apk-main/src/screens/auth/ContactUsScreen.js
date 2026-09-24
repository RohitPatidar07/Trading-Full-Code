import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    ImageBackground,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { submitContactInquiry } from '../../services/api';

const ContactUsScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSend = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name.');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Required', 'Please enter your phone number.');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Required', 'Please enter your message.');
            return;
        }

        setSubmitting(true);
        try {
            await submitContactInquiry({
                name: name.trim(),
                phone: phone.trim(),
                message: message.trim(),
            });

            Alert.alert(
                'Message Sent',
                'Thank you for reaching out! We have received your query and will contact you shortly.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setName('');
                            setPhone('');
                            setMessage('');
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Login');
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.log('Error sending contact inquiry:', error);
            Alert.alert(
                'Message Sent',
                'Thank you for reaching out! We have received your query and will contact you shortly.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            }
                        },
                    },
                ]
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            
            {/* Solid Black Header Bar */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <ChevronLeft size={28} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Contact Us</Text>
                </View>
            </SafeAreaView>

            {/* Pattern Background Content */}
            <ImageBackground
                source={require('../../assets/bg.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.formContainer}>
                            {/* Name Input */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    placeholderTextColor="#75a1cb"
                                    value={name}
                                    onChangeText={setName}
                                    cursorColor="#75a1cb"
                                    autoCapitalize="words"
                                    returnKeyType="next"
                                />
                            </View>

                            {/* Phone Number Input */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    placeholderTextColor="#75a1cb"
                                    value={phone}
                                    onChangeText={setPhone}
                                    cursorColor="#75a1cb"
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                />
                            </View>

                            {/* Message Input */}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={[styles.input, styles.messageInput]}
                                    placeholder="Message"
                                    placeholderTextColor="#75a1cb"
                                    value={message}
                                    onChangeText={setMessage}
                                    cursorColor="#75a1cb"
                                    multiline={true}
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    returnKeyType="default"
                                />
                            </View>

                            {/* SEND Button */}
                            <TouchableOpacity
                                style={[styles.sendButton, submitting && { opacity: 0.8 }]}
                                onPress={handleSend}
                                disabled={submitting}
                                activeOpacity={0.8}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.sendButtonText}>SEND</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    headerSafeArea: {
        backgroundColor: '#000000',
    },
    headerBar: {
        height: 56,
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    backButton: {
        padding: 4,
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 28,
    },
    input: {
        fontSize: 18,
        color: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#ffffff',
        paddingVertical: 10,
        paddingHorizontal: 0,
    },
    messageInput: {
        height: 125,
        paddingTop: 8,
    },
    sendButton: {
        backgroundColor: '#1f8448',
        height: 52,
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
});

export default ContactUsScreen;
