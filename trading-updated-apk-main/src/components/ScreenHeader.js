import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { navigationRef } from '../navigation/RootNavigation';

const ScreenHeader = ({ 
    title, 
    subtitle, 
    leftComponent, 
    rightComponent,
    containerStyle,
    titleStyle,
    showBackButton = false,
    onBackPress
}) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
            navigation.goBack();
        } else if (navigationRef && navigationRef.isReady && navigationRef.isReady() && navigationRef.canGoBack()) {
            navigationRef.goBack();
        } else {
            // Safe fallback if navigation stack has no previous screens
            if (navigation && navigation.navigate) {
                navigation.navigate('Main', { screen: 'Watchlist', params: { screen: 'WatchlistHome' } });
            } else if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
                navigationRef.navigate('Main', { screen: 'Watchlist', params: { screen: 'WatchlistHome' } });
            }
        }
    };

    return (
        <View style={[styles.headerContainer, containerStyle]}>
            {/* Left Slot */}
            <View style={styles.leftSlot}>
                {showBackButton ? (
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={handleBack}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                ) : leftComponent}
            </View>
            
            {/* Center Slot (Title) */}
            <View style={styles.centerSlot}>
                <Text 
                    style={[styles.headerTitle, titleStyle]} 
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            
            {/* Right Slot */}
            <View style={styles.rightSlot}>
                {rightComponent}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56, // Standardized header height
        backgroundColor: 'transparent',
        // Standardize spacing across all devices
        marginTop: Platform.OS === 'ios' ? 0 : 4,
    },
    leftSlot: {
        minWidth: 60,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10, // Adjust for horizontal alignment
    },
    centerSlot: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSlot: {
        minWidth: 60,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
        textTransform: 'uppercase', // Professional trading look
    },
    headerSubtitle: {
        color: '#2196F3', // The primary blue color used in Dashboard
        fontSize: 11,
        fontWeight: '800',
        marginTop: 1,
        letterSpacing: 1,
        textTransform: 'uppercase',
        opacity: 0.9,
    }
});

export default ScreenHeader;
