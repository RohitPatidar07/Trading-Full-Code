import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import * as api from '../../services/api';

import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

const ChangePasswordScreen = ({ navigation }) => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }
        if (passwords.new.length < 8) {
            Alert.alert("Error", "New password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            await api.changePassword(passwords.current, passwords.new);
            Alert.alert("Success", "Password updated successfully");
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('AccountHome');
            }
        } catch (err) {
            Alert.alert("Error", err.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScreenHeader title="CHANGE PASSWORD" showBackButton />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.formContainer}>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Current Password"
                                placeholderTextColor="#B0BEC5"
                                secureTextEntry={!showCurrent}
                                value={passwords.current}
                                onChangeText={(val) => setPasswords(prev => ({ ...prev, current: val }))}
                                cursorColor="white"
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                                {showCurrent ? <EyeOff size={20} color="#B0BEC5" /> : <Eye size={20} color="#B0BEC5" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter New Password"
                                placeholderTextColor="#B0BEC5"
                                secureTextEntry={!showNew}
                                value={passwords.new}
                                onChangeText={(val) => setPasswords(prev => ({ ...prev, new: val }))}
                                cursorColor="white"
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                                {showNew ? <EyeOff size={20} color="#B0BEC5" /> : <Eye size={20} color="#B0BEC5" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Confirm New Password"
                                placeholderTextColor="#B0BEC5"
                                secureTextEntry={!showConfirm}
                                value={passwords.confirm}
                                onChangeText={(val) => setPasswords(prev => ({ ...prev, confirm: val }))}
                                cursorColor="white"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                                {showConfirm ? <EyeOff size={20} color="#B0BEC5" /> : <Eye size={20} color="#B0BEC5" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitBtn, loading && styles.disabledBtn]} 
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitText}>CHANGE PASSWORD</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: 'black',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    content: {
        padding: 15,
    },
    formContainer: {
        marginTop: 5,
    },
    inputGroup: {
        marginBottom: 10,
    },
    label: {
        color: '#B0BEC5',
        fontSize: 17.5,
        marginBottom: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#597794', // Precise color provided by the user
        borderRadius: 2,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 17.5,
        height: '100%',
    },
    eyeBtn: {
        padding: 5,
    },
    submitBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: 15,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 20,
    },
    submitText: {
        color: 'white',
        fontSize: 19.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    disabledBtn: {
        opacity: 0.6,
    }
});

export default ChangePasswordScreen;
