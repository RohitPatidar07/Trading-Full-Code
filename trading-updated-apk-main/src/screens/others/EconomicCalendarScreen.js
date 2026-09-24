import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, ActivityIndicator, ImageBackground } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

const EconomicCalendarScreen = ({ navigation }) => {
    return (
        <ScreenWrapper>
            <ScreenHeader title="ECONOMIC CALENDAR" showBackButton />

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ uri: 'https://www.forexfactory.com/calendar' }}
                    style={{ flex: 1 }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="white" />
                        </View>
                    )}
                />
            </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
    },
    webviewContainer: {
        flex: 1,
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F3D3E',
    }
});

export default EconomicCalendarScreen;
