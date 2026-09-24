import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { ChevronLeft, Bell, CheckCheck, Check, Trash2 } from 'lucide-react-native';
import { useTrades } from '../../context/TradeContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

const NotificationsScreen = ({ navigation }) => {
    const {
        adminNotifications,
        acknowledgeNotification,
        notifications,
        clearNotifications,
        removeNotification,
    } = useTrades();

    const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'system'

    // ── Admin Notification Card ──────────────────────────────────
    const renderAdminItem = ({ item }) => (
        <View style={[styles.card, item.acknowledged && styles.cardAck]}>
            {/* Header Row */}
            <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, item.acknowledged && styles.iconCircleAck]}>
                    <Bell size={16} color={item.acknowledged ? '#597895' : '#63B3ED'} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, item.acknowledged && styles.cardTitleAck]}>
                        {item.title}
                    </Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                </View>

                {/* WhatsApp-style tick status */}
                <View style={styles.tickBox}>
                    {item.acknowledged ? (
                        // Double tick (blue) = acknowledged
                        <CheckCheck size={20} color="#63B3ED" />
                    ) : (
                        // Single tick (grey) = sent, not acknowledged
                        <Check size={20} color="rgba(255,255,255,0.35)" />
                    )}
                </View>
            </View>

            {/* Message */}
            <Text style={[styles.cardMsg, item.acknowledged && styles.cardMsgAck]}>
                {item.message}
            </Text>

            {/* Acknowledge Button or Already-Acknowledged Label */}
            {!item.acknowledged ? (
                <TouchableOpacity
                    style={styles.ackBtn}
                    onPress={() => acknowledgeNotification(item.id)}
                    activeOpacity={0.75}
                >
                    <CheckCheck size={15} color="#1a1a2e" />
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.ackDone}>
                    <CheckCheck size={14} color="#63B3ED" />
                    <Text style={styles.ackDoneText}>Acknowledged</Text>
                </View>
            )}
        </View>
    );

    // ── System Notification Card ─────────────────────────────────
    const renderSystemItem = ({ item }) => (
        <View style={styles.sysCard}>
            <View style={styles.sysLeft}>
                <View style={styles.sysIcon}>
                    <Bell size={18} color="#63B3ED" />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.sysHeaderRow}>
                        <Text style={styles.sysTitle}>{item.title}</Text>
                        <Text style={styles.sysTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.sysMsg}>{item.message}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeNotification(item.id)}>
                <Trash2 size={16} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper>
            <ScreenHeader 
                title="Notifications" 
                showBackButton 
                rightComponent={
                    activeTab === 'system' && notifications.length > 0 ? (
                        <TouchableOpacity onPress={clearNotifications} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>Clear All</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'admin' && styles.tabActive]}
                    onPress={() => setActiveTab('admin')}
                >
                    <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>
                        Admin Messages
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'system' && styles.tabActive]}
                    onPress={() => setActiveTab('system')}
                >
                    <Text style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>
                        System Alerts
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'admin' ? (
                <FlatList
                    data={adminNotifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAdminItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Bell size={55} color="rgba(255,255,255,0.15)" />
                            <Text style={styles.emptyText}>No admin messages</Text>
                        </View>
                    }
                />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSystemItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Bell size={55} color="rgba(255,255,255,0.15)" />
                            <Text style={styles.emptyText}>No system alerts</Text>
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backBtn: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    clearBtn: { paddingHorizontal: 10, paddingVertical: 5 },
    clearBtnText: { color: '#63B3ED', fontSize: 15.5, fontWeight: 'bold' },

    // Tabs
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginHorizontal: 15,
        borderRadius: 12,
        marginBottom: 12,
        padding: 4,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: 9,
    },
    tabActive: {
        backgroundColor: '#CFD1C4',
    },
    tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 15.5, fontWeight: '600' },
    tabTextActive: { color: '#1a1a2e', fontWeight: '700' },

    listContent: { paddingHorizontal: 15, paddingBottom: 30 },

    // Admin Card
    card: {
        backgroundColor: 'rgba(207, 209, 196, 0.08)',
        borderRadius: 14,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 179, 237, 0.25)',
    },
    cardAck: {
        backgroundColor: 'rgba(207, 209, 196, 0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(99,179,237,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    iconCircleAck: { backgroundColor: 'rgba(255,255,255,0.05)' },
    cardTitle: {
        color: 'white',
        fontSize: 16.5,
        fontWeight: '700',
    },
    cardTitleAck: { color: 'rgba(255,255,255,0.5)' },
    cardTime: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5, marginTop: 1 },
    tickBox: { paddingLeft: 6 },
    cardMsg: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 15.5,
        lineHeight: 22,
        marginBottom: 12,
    },
    cardMsgAck: { color: 'rgba(255,255,255,0.38)' },

    // Acknowledge Button
    ackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CFD1C4',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        gap: 6,
    },
    ackBtnText: { color: '#1a1a2e', fontSize: 14.5, fontWeight: '700' },

    // Acknowledged Done State
    ackDone: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ackDoneText: { color: '#63B3ED', fontSize: 13.5, fontWeight: '600' },

    // System Cards
    sysCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    sysLeft: { flexDirection: 'row', flex: 1, alignItems: 'flex-start' },
    sysIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(99,179,237,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sysHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    sysTitle: { color: 'white', fontSize: 16.5, fontWeight: '600', flex: 1 },
    sysTime: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5 },
    sysMsg: { color: 'rgba(255,255,255,0.7)', fontSize: 14.5, lineHeight: 20 },
    deleteBtn: { padding: 10 },

    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 16.5, marginTop: 14 },
});

export default NotificationsScreen;
