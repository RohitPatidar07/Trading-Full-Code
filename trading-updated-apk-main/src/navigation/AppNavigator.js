import React, { useState, useEffect } from 'react';
import { Text, Platform, Keyboard, Dimensions, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { IndianRupee, Briefcase, FileText, User, Wallet, BookText } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ContactUsScreen from '../screens/auth/ContactUsScreen';
import DashboardScreen from '../screens/tabs/DashboardScreen';
import PortfolioScreen from '../screens/tabs/PortfolioScreen';
import TradesScreen from '../screens/tabs/TradesScreen';
import AccountScreen from '../screens/tabs/AccountScreen';
import OrderDetailScreen from '../screens/others/OrderDetailScreen';
import ProfileDetailsScreen from '../screens/others/ProfileDetailsScreen';
import FundsScreen from '../screens/others/FundsScreen';
import DepositRequestScreen from '../screens/others/DepositRequestScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import NotificationsScreen from '../screens/others/NotificationsScreen';
import EconomicCalendarScreen from '../screens/others/EconomicCalendarScreen';
import SearchScreen from '../screens/others/SearchScreen';
import ExitTradeScreen from '../screens/others/ExitTradeScreen';
import WithdrawalRequestScreen from '../screens/others/WithdrawalRequestScreen';
import LearningScreen from '../screens/others/LearningScreen';
import AlertsScreen from '../screens/others/AlertsScreen';
import SupportScreen from '../screens/others/SupportScreen';
import TicketChatScreen from '../screens/others/TicketChatScreen';
import AiAssistantScreen from '../screens/others/AiAssistantScreen';
import BankDetailsScreen from '../screens/others/BankDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const WatchlistStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WatchlistHome" component={DashboardScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="Funds" component={FundsScreen} />
    </Stack.Navigator>
);

const TradesStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TradesHome" component={TradesScreen} />
        <Stack.Screen name="ExitTrade" component={ExitTradeScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
);

const PortfolioStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PortfolioHome" component={PortfolioScreen} />
        <Stack.Screen name="ExitTrade" component={ExitTradeScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
);

const AccountStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AccountHome" component={AccountScreen} />
        <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
        <Stack.Screen name="Funds" component={FundsScreen} />
        <Stack.Screen name="DepositRequest" component={DepositRequestScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="EconomicCalendar" component={EconomicCalendarScreen} />
        <Stack.Screen name="WithdrawalRequest" component={WithdrawalRequestScreen} />
        <Stack.Screen name="Learning" component={LearningScreen} />
        <Stack.Screen name="Alerts" component={AlertsScreen} />
        <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
    </Stack.Navigator>
);

import { useSearchKeyboardActive } from '../utils/searchKeyboardState';

const CustomTabBar = (props) => {
    const focusedRoute = props.state.routes[props.state.index];
    const activeChildRoute = getFocusedRouteNameFromRoute(focusedRoute);
    const isSearchScreen = activeChildRoute === 'Search';

    const searchKeyboardOpen = useSearchKeyboardActive();

    // Instant zero-delay: on Search screen, hide navbar whenever search keyboard is open
    if (isSearchScreen && searchKeyboardOpen) {
        return null;
    }

    return <BottomTabBar {...props} />;
};

const MainTabs = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={({ route }) => ({
                tabBarHideOnKeyboard: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let icon;
                    const iconProps = {
                        size: 24,
                        color: color,
                    };

                    if (route.name === 'Watchlist') {
                        return <Text style={{ color, fontSize: 22, fontWeight: 'bold' }}>₹</Text>;
                    } else if (route.name === 'Trades') {
                        icon = <BookText {...iconProps} />;
                    } else if (route.name === 'Portfolio') {
                        icon = <Briefcase {...iconProps} />;
                    } else if (route.name === 'Account') {
                        icon = <User {...iconProps} />;
                    }
                    return icon;
                },
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#597895',
                tabBarStyle: {
                    backgroundColor: 'black',
                    borderTopWidth: 0,
                    height: 100,
                    paddingBottom: 0,
                    paddingTop: 0,
                    paddingHorizontal: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 15,
                    fontWeight: '600',
                    marginTop: 2,
                    marginBottom: 4,
                },
                tabBarItemStyle: {
                    paddingVertical: 0,
                    paddingBottom: 0,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen 
                name="Watchlist" 
                component={WatchlistStack} 
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('Watchlist', { screen: 'WatchlistHome' });
                    },
                })}
            />
            <Tab.Screen 
                name="Trades" 
                component={TradesStack} 
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('Trades', { screen: 'TradesHome' });
                    },
                })}
            />
            <Tab.Screen 
                name="Portfolio" 
                component={PortfolioStack} 
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('Portfolio', { screen: 'PortfolioHome' });
                    },
                })}
            />
            <Tab.Screen 
                name="Account" 
                component={AccountStack} 
                options={{ unmountOnBlur: true }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('Account', { screen: 'AccountHome' });
                    },
                })}
            />
        </Tab.Navigator>
    );
};

import { navigationRef } from './RootNavigation';

const AppNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="ContactUs" component={ContactUsScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
                <Stack.Screen name="Support" component={SupportScreen} />
                <Stack.Screen name="TicketChat" component={TicketChatScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
