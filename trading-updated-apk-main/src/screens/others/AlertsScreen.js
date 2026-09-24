import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    TextInput, Modal, Switch, ScrollView, Alert, ActivityIndicator,
    Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
    ChevronLeft, Bell, Plus, Trash2, RefreshCw,
    TrendingUp, TrendingDown, Clock, Zap, Target,
    CheckCircle, AlertTriangle
} from 'lucide-react-native';
import { useTrades } from '../../context/TradeContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import * as api from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────
const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ── Settings Configuration ────────────────────────────────────────
const SETTINGS_ITEMS = [
    { id: 'priceAlerts', title: 'Price Level Alerts', subtitle: 'Alert when stock crosses your target price', icon: Target, color: '#63B3ED' },
    { id: 'percentChange', title: '% Change Alerts', subtitle: 'Alert when stock moves significantly from open', icon: TrendingUp, color: '#68D391' },
    { id: 'marketTiming', title: 'Market Timing', subtitle: 'Open (9:15), Soon (3:15), Closed (3:30)', icon: Clock, color: '#F6AD55' },
    { id: 'technical', title: 'Technical Signals', subtitle: 'RSI overbought / oversold signals', icon: Zap, color: '#FC8181' },
    { id: 'tradeAlerts', title: 'Trade Execution', subtitle: 'Buy, Sell, SL, Target hit alerts', icon: Bell, color: '#CFD1C4' },
];

// ── Main Screen ───────────────────────────────────────────────────
const AlertsScreen = ({ navigation }) => {
    const {
        userAlerts, addUserAlert, removeUserAlert, resetUserAlert,
        alertSettings, updateAlertSetting, watchlist, includedPins,
        refreshAlerts // Using refreshAlerts from context
    } = useTrades();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [activeTab, setActiveTab] = useState('alerts');
    const [showModal, setShowModal] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [newType, setNewType] = useState('above');
    const [newPrice, setNewPrice] = useState('');

    const symbolList = [...new Set(
        watchlist
            .filter(w => includedPins.has(w.name))
            .map(w => w.name)
    )];

    // Fetch settings on mount
    useEffect(() => {
        loadSettingsData();
    }, []);

    const loadSettingsData = async () => {
        try {
            // Settings are already loaded by TradeContext's fetchInitialData
            // But we can refresh them here if needed
            await refreshAlerts();
        } catch (error) {
            console.error('Error loading alert settings:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshAlerts();
        } catch (error) {
            console.error('Error refreshing alerts:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleAdd = async () => {
        if (!newSymbol) { Alert.alert('Error', 'Please select a symbol.'); return; }
        if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
            Alert.alert('Error', 'Enter a valid target price.');
            return;
        }

        try {
            setLoading(true);
            await api.createAlert({
                symbol: newSymbol,
                type: newType,
                targetPrice: parseFloat(newPrice)
            });

            // Refresh from context to get the real DB ID
            await refreshAlerts();

            Alert.alert('Success', 'Price alert created successfully!');
            setShowModal(false);
            setNewSymbol(''); setNewPrice('');
        } catch (error) {
            console.error('Error creating alert:', error);
            Alert.alert('Error', error.message || 'Failed to create alert.');
        } finally {
            setLoading(false);
        }
    };

    // ── Alert Card ──────────────────────────────────────────────
    const renderAlert = ({ item }) => {
        const triggered = item.status === 'triggered';
        const TypeIcon = item.type === 'above' ? TrendingUp : TrendingDown;
        const typeColor = item.type === 'above' ? '#68D391' : '#FC8181';

        return (
            <View style={[styles.card, triggered && styles.cardDone]}>
                <View style={styles.cardLeft}>
                    <View style={[styles.cardIconBg, { backgroundColor: typeColor + '18' }]}>
                        <TypeIcon size={18} color={typeColor} />
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.cardSymbol}>{item.symbol}</Text>
                        <Text style={[styles.cardTarget, { color: typeColor }]}>
                            {item.type === 'above' ? 'Above' : 'Below'} ₹{item.targetPrice.toLocaleString('en-IN')}
                        </Text>
                        {triggered ? (
                            <View style={styles.triggeredRow}>
                                <CheckCircle size={12} color="#68D391" />
                                <Text style={styles.triggeredText}>
                                    Triggered at {formatTime(item.triggeredAt)}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.watchingText}>⏳ Watching...</Text>
                        )}
                    </View>
                </View>

                <View style={styles.cardActions}>
                    {triggered && (
                        <TouchableOpacity style={styles.resetBtn} onPress={async () => {
                            try {
                                setLoading(true);
                                await api.updateAlertStatus(item.id, 'active');
                                await refreshAlerts();
                            } catch (error) {
                                console.error('Error resetting alert:', error);
                                resetUserAlert(item.id);
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            <RefreshCw size={15} color="#63B3ED" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.deleteBtn} onPress={async () => {
                        Alert.alert('Delete Alert', 'Are you sure you want to delete this alert?', [
                            { text: 'Cancel', onPress: () => {} },
                            {
                                text: 'Delete',
                                onPress: async () => {
                                    try {
                                        setLoading(true);
                                        await api.deleteAlert(item.id);
                                        await refreshAlerts();
                                        Alert.alert('Deleted', 'Alert deleted successfully');
                                    } catch (error) {
                                        console.error('Error deleting alert:', error);
                                        // If it was a mock ID, just remove it
                                        removeUserAlert(item.id);
                                        Alert.alert('Deleted', 'Alert removed');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }
                        ]);
                    }}>
                        <Trash2 size={16} color="rgba(255,255,255,0.25)" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleToggleSetting = async (id, val) => {
        // 1. Update global context immediately (isolated per ID)
        updateAlertSetting(id, val);

        // 2. Sync with API
        try {
            await api.updateAlertSettings({ [id]: val });
        } catch (error) {
            console.error(`Error updating setting ${id}:`, error);
            // Optionally rollback on error
            // updateAlertSetting(id, !val);
        }
    };

    // Use context alerts as source of truth
    const displayAlerts = userAlerts;
    const activeCount = displayAlerts.filter(a => a.status === 'active' || a.status === 'ACTIVE').length;
    const triggeredCount = displayAlerts.filter(a => a.status === 'triggered' || a.status === 'TRIGGERED').length;

    return (
        <ScreenWrapper>
            <ScreenHeader 
                title="PRICE ALERTS" 
                showBackButton 
                rightComponent={activeTab === 'alerts' ? (
                    <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
                        <Plus size={24} color="#CFD1C4" />
                    </TouchableOpacity>
                ) : null} 
            />

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{activeCount}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: '#68D391' }]}>{triggeredCount}</Text>
                    <Text style={styles.statLabel}>Triggered</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: '#63B3ED' }]}>
                        {Object.values(alertSettings).filter(v => v === true).length}
                    </Text>
                    <Text style={styles.statLabel}>Categories ON</Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {[['alerts', '🔔 My Alerts'], ['settings', '⚙️ Settings']].map(([key, label]) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.tabItem, activeTab === key && styles.tabActive]}
                        onPress={() => setActiveTab(key)}
                    >
                        <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Tab: My Alerts ── */}
            {activeTab === 'alerts' ? (
                <>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#CFD1C4" />
                            <Text style={styles.loadingText}>Loading alerts...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayAlerts}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderAlert}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            onRefresh={handleRefresh}
                            refreshing={refreshing}
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <Bell size={52} color="rgba(255,255,255,0.12)" />
                                    <Text style={styles.emptyTitle}>No Price Alerts Set</Text>
                                    <Text style={styles.emptySub}>Tap + to create your first alert</Text>
                                    <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowModal(true)}>
                                        <Plus size={16} color="#1a1a2e" />
                                        <Text style={styles.emptyCreateBtnText}>Create Alert</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    )}
                </>
            ) : (
                /* ── Tab: Settings ── */
                <ScrollView contentContainerStyle={styles.settingsScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.groupLabel}>ALERT CATEGORIES</Text>

                    {SETTINGS_ITEMS.map((item) => (
                        <View key={item.id} style={styles.settingRow}>
                            <View style={[styles.settingIconBg, { backgroundColor: item.color + '18' }]}>
                                <item.icon size={18} color={item.color} />
                            </View>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>{item.title}</Text>
                                {item.subtitle ? <Text style={styles.settingSubtitle}>{item.subtitle}</Text> : null}
                            </View>
                            <Switch
                                value={!!alertSettings[item.id]}
                                onValueChange={(val) => handleToggleSetting(item.id, val)}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: item.color }}
                                thumbColor="#fff"
                            />
                        </View>
                    ))}

                    {/* % Change Threshold */}
                    <Text style={[styles.groupLabel, { marginTop: 24 }]}>% CHANGE THRESHOLD</Text>
                    <View style={styles.threshCard}>
                        <Text style={styles.threshLabel}>
                            Alert when stock moves this much from open:
                        </Text>
                        <View style={styles.threshBtns}>
                            {[1, 2, 3, 5].map(v => (
                                <TouchableOpacity
                                    key={v}
                                    style={[styles.threshBtn, alertSettings.percentThreshold === v && styles.threshBtnActive]}
                                    onPress={() => updateAlertSetting('percentThreshold', v)}
                                >
                                    <Text style={[styles.threshBtnText, alertSettings.percentThreshold === v && styles.threshBtnTextActive]}>
                                        {v}%
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <AlertTriangle size={16} color="#F6AD55" />
                        <Text style={styles.infoText}>
                            Market Timing alerts fire automatically at 9:15, 15:15, and 15:30 IST based on your device clock.
                        </Text>
                    </View>
                </ScrollView>
            )}

            {/* ── Add Alert Modal ── */}
            <Modal visible={showModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={styles.modalCard}>
                                    <Text style={styles.modalTitle}>Set Price Alert</Text>

                                    {/* Symbol picker */}
                                    <Text style={styles.modalLabel}>Select Symbol</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                        {symbolList.map(sym => (
                                            <TouchableOpacity
                                                key={sym}
                                                style={[styles.chip, newSymbol === sym && styles.chipActive]}
                                                onPress={() => setNewSymbol(sym)}
                                            >
                                                <Text style={[styles.chipText, newSymbol === sym && styles.chipTextActive]}>
                                                    {sym}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    {/* Alert type */}
                                    <Text style={styles.modalLabel}>Alert When Price</Text>
                                    <View style={styles.typeRow}>
                                        {[['above', '📈 Goes Above', '#68D391'], ['below', '📉 Falls Below', '#FC8181']].map(([t, l, c]) => (
                                            <TouchableOpacity
                                                key={t}
                                                style={[styles.typeBtn, newType === t && { borderColor: c, backgroundColor: c + '18' }]}
                                                onPress={() => setNewType(t)}
                                            >
                                                <Text style={[styles.typeBtnText, newType === t && { color: c }]}>{l}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Price input */}
                                    <Text style={styles.modalLabel}>Target Price (₹)</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        placeholder="e.g. 5800"
                                        placeholderTextColor="rgba(255,255,255,0.25)"
                                        keyboardType="numeric"
                                        value={newPrice}
                                        onChangeText={setNewPrice}
                                        cursorColor="white"
                                    />
                                    <View style={styles.inputLine} />

                                    {/* Buttons */}
                                    <View style={styles.modalBtns}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setNewSymbol(''); setNewPrice(''); }}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                                            <Bell size={15} color="#1a1a2e" />
                                            <Text style={styles.saveBtnText}>Set Alert</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
    loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 15.5, marginTop: 12 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12 },
    backBtn: { padding: 4 },
    headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    addBtn: { padding: 4 },

    statsRow: { flexDirection: 'row', marginHorizontal: 15, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, marginBottom: 12, padding: 14 },
    statBox: { flex: 1, alignItems: 'center' },
    statNum: { color: '#CFD1C4', fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

    tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', marginHorizontal: 15, borderRadius: 12, marginBottom: 12, padding: 4 },
    tabItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
    tabActive: { backgroundColor: '#CFD1C4' },
    tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 15.5, fontWeight: '600' },
    tabTextActive: { color: '#1a1a2e', fontWeight: '700' },

    // Alert Card
    list: { paddingHorizontal: 15, paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(207,209,196,0.08)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(99,179,237,0.2)' },
    cardDone: { backgroundColor: 'rgba(104,211,145,0.06)', borderColor: 'rgba(104,211,145,0.2)' },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    cardIconBg: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardBody: { flex: 1 },
    cardSymbol: { color: 'white', fontSize: 17.5, fontWeight: '700' },
    cardTarget: { fontSize: 14.5, fontWeight: '600', marginTop: 2 },
    triggeredRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    triggeredText: { color: '#68D391', fontSize: 12.5 },
    watchingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12.5, marginTop: 3 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    resetBtn: { padding: 8 },
    deleteBtn: { padding: 8 },

    emptyBox: { alignItems: 'center', marginTop: 70 },
    emptyTitle: { color: 'white', fontSize: 19, fontWeight: '700', marginTop: 14 },
    emptySub: { color: 'rgba(255,255,255,0.4)', fontSize: 14.5, marginTop: 6 },
    emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#CFD1C4', paddingVertical: 11, paddingHorizontal: 22, borderRadius: 10, marginTop: 20 },
    emptyCreateBtnText: { color: '#1a1a2e', fontSize: 15.5, fontWeight: '800' },

    // Settings
    settingsScroll: { paddingHorizontal: 15, paddingBottom: 40 },
    groupLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 12.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
    settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(207,209,196,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 },
    settingIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingInfo: { flex: 1 },
    settingTitle: { color: 'white', fontSize: 16.5, fontWeight: '600' },
    settingSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5, marginTop: 2 },

    threshCard: { backgroundColor: 'rgba(207,209,196,0.06)', borderRadius: 12, padding: 14, marginBottom: 14 },
    threshLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 14.5, marginBottom: 12 },
    threshBtns: { flexDirection: 'row', gap: 10 },
    threshBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    threshBtnActive: { backgroundColor: 'rgba(207,209,196,0.15)', borderColor: '#CFD1C4' },
    threshBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 16.5, fontWeight: '700' },
    threshBtnTextActive: { color: '#CFD1C4' },

    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(246,173,85,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(246,173,85,0.2)' },
    infoText: { color: 'rgba(255,255,255,0.55)', fontSize: 13.5, lineHeight: 18, flex: 1 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#151c2b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
    modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    modalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13.5, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
    chipScroll: { marginBottom: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
    chipActive: { backgroundColor: 'rgba(207,209,196,0.2)', borderColor: '#CFD1C4' },
    chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 14.5, fontWeight: '600' },
    chipTextActive: { color: '#CFD1C4' },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
    typeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14.5, fontWeight: '600' },
    priceInput: { color: 'white', fontSize: 30, fontWeight: 'bold', paddingVertical: 6 },
    inputLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 24 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
    cancelBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 16.5, fontWeight: '600' },
    saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10, backgroundColor: '#CFD1C4' },
    saveBtnText: { color: '#1a1a2e', fontSize: 16.5, fontWeight: '800' },
});

export default AlertsScreen;
