import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, BackHandler, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { TradeProvider } from './src/context/TradeContext';
import { navigationRef } from './src/navigation/RootNavigation';
import CustomThemedAlert from './src/components/CustomThemedAlert';
import useInactivityLogout from './src/hooks/useInactivityLogout';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const { panHandlers } = useInactivityLogout(10 * 60 * 1000);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    if (Platform.OS === 'android') {
      try {
        if (typeof NavigationBar.setStyle === 'function') {
          NavigationBar.setStyle('light');
        } else if (typeof NavigationBar.setButtonStyleAsync === 'function') {
          NavigationBar.setButtonStyleAsync('light').catch(() => {});
        }
        if (typeof NavigationBar.setBackgroundColorAsync === 'function') {
          NavigationBar.setBackgroundColorAsync('#000000').catch(() => {});
        }
      } catch (e) {
        // Silently ignore if navigation bar styling is unsupported on current platform/runtime
      }
    }

    // Gracefully handle hardware back button on Android
    const onBackPress = () => {
      if (navigationRef.isReady()) {
        if (navigationRef.canGoBack()) {
          navigationRef.goBack();
          return true; // Handled
        } else {
          // If inside a tab other than Watchlist or Login, switch to Watchlist
          const currentRoute = navigationRef.getCurrentRoute();
          if (currentRoute && currentRoute.name !== 'WatchlistHome' && currentRoute.name !== 'Login') {
            navigationRef.navigate('Main', { screen: 'Watchlist', params: { screen: 'WatchlistHome' } });
            return true; // Handled
          }
          // At root screen: let system minimize/exit cleanly
          return false;
        }
      }
      return false;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} {...panHandlers}>
        <TradeProvider>
          <StatusBar style="dark" />
          <AppNavigator />
          <CustomThemedAlert />
        </TradeProvider>
      </View>
    </SafeAreaProvider>
  );
}
