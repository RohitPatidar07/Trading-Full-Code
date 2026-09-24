import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ImageBackground, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTrades } from '../../context/TradeContext';
import * as api from '../../services/api';

import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

const DepositRequestScreen = ({ navigation }) => {
    const { addNotification } = useTrades();
    const [image, setImage] = useState(null);
    const [amount, setAmount] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            Alert.alert("Error", "Please enter a valid amount.");
            return;
        }
        if (!image) {
            Alert.alert("Error", "Please select a screenshot first.");
            return;
        }

        setIsUploading(true);
        try {
            await api.createDeposit(amount, image);
            
            // Add Notification
            addNotification({
                title: 'Deposit Screenshot Uploaded',
                message: `Your payment screenshot for ₹${amount} has been submitted. Funds will be added after verification.`,
                type: 'info'
            });

            Alert.alert("Success", "Screenshot uploaded successfully! Funds will be added shortly.");
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Funds');
            }
        } catch (err) {
            console.error('Deposit error:', err);
            const errorMsg = err.message || "Failed to submit request";
            Alert.alert(
                "Upload Failed",
                errorMsg,
                [
                    {
                        text: "Retry",
                        onPress: () => {
                            // User can retry
                        }
                    },
                    {
                        text: "Cancel",
                        onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Funds')),
                        style: 'cancel'
                    }
                ]
            );
        } finally {
            setIsUploading(false);
        }
    };


    const handleSelectImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <ScreenWrapper>
            <ScreenHeader title="DEPOSIT REQUEST" showBackButton />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.centerContainer}>
                    <TouchableOpacity
                        style={styles.addFundsBtn}
                        onPress={() => Alert.alert("Redirecting", "Connecting to Payment Gateway...")}
                    >
                        <Text style={styles.addFundsBtnText}>Add funds online</Text>
                    </TouchableOpacity>

                    <Text style={styles.sectionLabel}>OR Upload Deposit Proof</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Amount"
                            placeholderTextColor="#B0BEC5"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            cursorColor="white"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={handleSelectImage}
                    >
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.uploadBoxText}>Attach</Text>
                                <Text style={styles.uploadBoxText}>Screenshot</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.uploadBtn, isUploading && { opacity: 0.7 }]}
                        onPress={handleUpload}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.uploadBtnText}>UPLOAD SCREENSHOT</Text>
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
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    content: {
        flexGrow: 1,
        padding: 15,
    },
    centerContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    addFundsBtn: {
        backgroundColor: '#66bb6a',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 4,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    addFundsBtnText: {
        color: 'black',
        fontSize: 19.5,
        fontWeight: 'bold',
    },
    sectionLabel: {
        color: 'white',
        fontSize: 17.5,
        fontWeight: 'bold',
        marginVertical: 15,
        opacity: 0.8,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        color: '#B0BEC5',
        fontSize: 17.5,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#597794',
        borderRadius: 4,
        paddingHorizontal: 15,
        height: 50,
        color: 'white',
        fontSize: 19.5,
    },
    uploadBox: {
        backgroundColor: '#CFD1C4',
        width: '100%',
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    uploadBoxText: {
        color: 'black',
        fontSize: 17.5,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: 15,
        width: '100%',
        borderRadius: 4,
        alignItems: 'center',
    },
    uploadBtnText: {
        color: 'white',
        fontSize: 19.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

export default DepositRequestScreen;
