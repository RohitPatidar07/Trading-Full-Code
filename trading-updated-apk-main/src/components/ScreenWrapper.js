import React from 'react';
import { StyleSheet, View, ImageBackground, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScreenWrapper = ({ children, style, edges }) => {
    return (
        <ImageBackground
            source={require('../assets/bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.darkOverlay}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <SafeAreaView edges={edges || ['top', 'left', 'right']} style={[styles.safeArea, style]}>
                    {children}
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    darkOverlay: {
        flex: 1,
        // backgroundColor: 'rgba(6, 26, 55, 0.43)', // Commented out to keep raw bg.jpg background
    },
    safeArea: {
        flex: 1,
    },
});

export default ScreenWrapper;
