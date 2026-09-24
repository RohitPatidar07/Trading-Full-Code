import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ImageBackground,
    Alert,
    ScrollView,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    IndianRupee,
    User,
    Key,
    FileText,
    LogOut,
    ChevronRight,
    Briefcase,
    BookText,
    BookOpen,
    Bell,
    LifeBuoy,
    Landmark
} from 'lucide-react-native';

import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import * as api from '../../services/api';
import { useTrades } from '../../context/TradeContext';

const MenuItem = ({ title, icon: Icon, onPress, isLast, labelRight, badgeCount }) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.menuItemText}>{title}</Text>
        <View style={styles.rightContent}>
            {badgeCount > 0 ? (
                <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{badgeCount}</Text>
                </View>
            ) : null}
            {labelRight ? <Text style={styles.rightLabel}>{labelRight}</Text> : null}
            {Icon && <Icon size={20} color="#1E293B" strokeWidth={2.5} />}
        </View>
    </TouchableOpacity>
);

const AccountScreen = ({ navigation }) => {
    const user = api.getSessionUser();
    const { unreadSupportCount, refreshSupportCount } = useTrades();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshSupportCount();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await api.getMe();
            console.log('✅ Account data refreshed from server');
        } catch (err) {
            console.error('❌ Failed to refresh profile:', err.message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    onPress: () => {
                        api.clearSession(true);
                        navigation.navigate('Login');
                    }, 
                    style: 'destructive' 
                }
            ]
        );
    };


    return (
        <ScreenWrapper>
            <ScreenHeader title="My Account" />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="white"
                        colors={['#CFD1C4']}
                    />
                }
            >

                {/* User Info */}
                <Text style={styles.userName}>
                    {user?.full_name || 'User'} ({user?.username || 'Guest'})
                </Text>

                {/* Menu Items */}
                <View style={styles.menuList}>
                    <MenuItem
                        title="Funds"
                        icon={IndianRupee}
                        onPress={() => navigation.navigate('Funds')}
                    />
                    <MenuItem
                        title="Profile"
                        icon={User}
                        onPress={() => navigation.navigate('ProfileDetails')}
                    />
                    <MenuItem
                        title="Bank Details"
                        icon={Landmark}
                        onPress={() => navigation.navigate('BankDetails')}
                    />
                    <MenuItem
                        title="Support"
                        icon={LifeBuoy}
                        onPress={() => navigation.navigate('Support')}
                        badgeCount={unreadSupportCount}
                    />
                    <MenuItem
                        title="Deposit Request"
                        icon={Key} // Icon looked like a key or tool
                        onPress={() => navigation.navigate('DepositRequest')}
                    />
                    <MenuItem
                        title="Withdrawal Request"
                        icon={IndianRupee}
                        onPress={() => navigation.navigate('WithdrawalRequest')}
                    />
                    <MenuItem
                        title="Change Password"
                        icon={Key}
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                    <MenuItem
                        title="Economic Calendar"
                        icon={FileText}
                        onPress={() => navigation.navigate('EconomicCalendar')}
                    />
                    <MenuItem
                        title="Price Alerts"
                        icon={Bell}
                        onPress={() => navigation.navigate('Alerts')}
                    />
                    <MenuItem
                        title="Learning Module"
                        icon={BookOpen}
                        onPress={() => navigation.navigate('Learning')}
                    />
                    <MenuItem
                        title="Log Out"
                        icon={LogOut}
                        onPress={handleLogout}
                    />
                    <MenuItem
                        title="App Version"
                        labelRight="1.9.0"
                        isLast
                        onPress={() => { }}
                    />
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
        alignItems: 'center',
        paddingVertical: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 15,
        paddingBottom: 45,
    },
    userName: {
        color: 'white',
        fontSize: 19,
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 4,
    },
    menuList: {
        gap: 6,
    },
    menuItem: {
        backgroundColor: '#CFD1C4',
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    menuItemText: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: '700',
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightLabel: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '700',
        marginRight: 8,
    },
    menuBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginRight: 8,
    },
    menuBadgeText: {
        color: 'white',
        fontSize: 11.5,
        fontWeight: '800',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 15,
        fontSize: 17.5,
        fontWeight: '500',
        opacity: 0.8,
    }
});


export default AccountScreen;
