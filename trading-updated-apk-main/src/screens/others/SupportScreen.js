import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, FlatList, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import {
    ChevronLeft, Headset, Plus, Ticket, Clock,
    ChevronRight, CheckCircle2, Send, AlertCircle, X
} from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import { getSupportTickets, createSupportTicket, deleteTicket } from '../../services/api';

const CATEGORIES = [
    'Order Not Executed',
    'Wrong P&L',
    'Margin / Balance',
    'Withdrawal Issue',
    'Position Not Closed',
    'Login / Access',
];

const PRIORITY_MAP = {
    'Order Not Executed': 'HIGH',
    'Wrong P&L': 'HIGH',
    'Margin / Balance': 'HIGH',
    'Withdrawal Issue': 'HIGH',
    'Position Not Closed': 'HIGH',
    'Login / Access': 'NORMAL',
};

const SupportScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('tickets');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Create ticket form
    const [showForm, setShowForm] = useState(false);
    const [category, setCategory] = useState('Order Not Executed');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTickets = useCallback(async () => {
        try {
            const data = await getSupportTickets();
            setTickets(data || []);
        } catch (err) {
            console.error('Failed to load tickets:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();

        // Register global callback for socket-driven ticket refresh
        global.onRefreshSupportTickets = fetchTickets;

        return () => {
            if (global.onRefreshSupportTickets === fetchTickets) {
                global.onRefreshSupportTickets = null;
            }
        };
    }, [fetchTickets]);

    // Refresh when coming back from chat
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTickets();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const handleCreateTicket = async () => {
        if (!subject.trim()) {
            Alert.alert('Error', 'Subject is required');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Description is required');
            return;
        }

        setSubmitting(true);
        try {
            await createSupportTicket({
                subject: subject.trim(),
                message: description.trim(),
                priority: PRIORITY_MAP[category] || 'NORMAL',
            });
            Alert.alert('Success', 'Ticket submitted successfully!');
            setSubject('');
            setDescription('');
            setShowForm(false);
            setActiveTab('tickets');
            fetchTickets();
        } catch (err) {
            console.log('❌ Ticket submit error:', err.message || err);
            Alert.alert('Error', err.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTicket = (ticketId) => {
        Alert.alert('Delete Ticket', 'Are you sure? All messages will be deleted.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteTicket(ticketId);
                        setTickets(prev => prev.filter(t => t.id !== ticketId));
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete ticket');
                    }
                }
            },
        ]);
    };

    const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

    const filteredTickets = tickets.filter(t =>
        statusFilter === 'ALL' ? true : t.status === statusFilter
    );

    const StatusBadge = ({ status }) => {
        const isPending = status === 'PENDING';
        return (
            <View style={[styles.statusBadge, { backgroundColor: isPending ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                <View style={[styles.statusDot, { backgroundColor: isPending ? '#F59E0B' : '#10B981' }]} />
                <Text style={[styles.statusBadgeText, { color: isPending ? '#F59E0B' : '#10B981' }]}>
                    {status}
                </Text>
            </View>
        );
    };

    const TicketItem = ({ item }) => (
        <TouchableOpacity
            style={styles.ticketItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TicketChat', { ticket: item })}
            onLongPress={() => handleDeleteTicket(item.id)}
        >
            <View style={styles.ticketRow}>
                <View style={styles.ticketIcon}>
                    <Ticket size={18} color="#10B981" />
                </View>
                <View style={styles.ticketContent}>
                    <View style={styles.ticketTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.ticketId}>#{item.id}</Text>
                            {item.unread_count > 0 && (
                                <View style={styles.ticketBadge}>
                                    <Text style={styles.ticketBadgeText}>{item.unread_count}</Text>
                                </View>
                            )}
                        </View>
                        <StatusBadge status={item.status} />
                    </View>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
                    <View style={styles.ticketMeta}>
                        <Clock size={11} color="#666" />
                        <Text style={styles.ticketDate}>
                            {new Date(item.created_at).toLocaleString()}
                        </Text>
                    </View>
                </View>
                <ChevronRight size={18} color="#555" />
            </View>
        </TouchableOpacity>
    );

    // NewTicketForm rendered inline below (not as a component) to prevent keyboard dismiss on re-render

    // ── My Tickets View ──
    const MyTicketsView = () => (
        <View>
            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{tickets.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#10B981' }]}>{resolvedCount}</Text>
                    <Text style={styles.statLabel}>Resolved</Text>
                </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
                {[
                    { key: 'ALL', label: 'All', count: tickets.length },
                    { key: 'PENDING', label: 'Pending', count: pendingCount },
                    { key: 'RESOLVED', label: 'Resolved', count: resolvedCount },
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.filterChip, statusFilter === tab.key && styles.filterChipActive]}
                        onPress={() => setStatusFilter(tab.key)}
                    >
                        <Text style={[styles.filterChipText, statusFilter === tab.key && styles.filterChipTextActive]}>
                            {tab.label} ({tab.count})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Ticket list */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : filteredTickets.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ticket size={36} color="#333" />
                    <Text style={styles.emptyTitle}>No Tickets</Text>
                    <Text style={styles.emptySubText}>
                        {statusFilter === 'ALL' ? 'You haven\'t raised any tickets yet' : `No ${statusFilter.toLowerCase()} tickets`}
                    </Text>
                </View>
            ) : (
                filteredTickets.map(item => <TicketItem key={item.id} item={item} />)
            )}

            {/* Raise New Ticket button */}
            <TouchableOpacity style={styles.raiseBtn} onPress={() => { setShowForm(true); setActiveTab('new'); }}>
                <Plus size={18} color="white" />
                <Text style={styles.raiseBtnText}>Raise a New Ticket</Text>
            </TouchableOpacity>

            <Text style={styles.hintText}>Long press a ticket to delete it</Text>
        </View>
    );

    // ── Client Support View ──
    const ClientSupportView = () => (
        <View style={styles.clientSupportContainer}>
            <View style={styles.dedicatedCard}>
                <Headset size={40} color="white" style={{ marginBottom: 10 }} />
                <Text style={styles.dedicatedTitle}>Dedicated Support Team</Text>
                <Text style={styles.dedicatedSub}>
                    Our team is available 24/7 to assist you with your trading needs.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => { setShowForm(true); setActiveTab('new'); }}
            >
                <View style={styles.actionIconContainer}>
                    <Send size={20} color="white" />
                </View>
                <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Raise a Ticket</Text>
                    <Text style={styles.actionSub}>Get help from your broker/admin</Text>
                </View>
                <ChevronRight size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => setActiveTab('tickets')}
            >
                <View style={styles.actionIconContainer}>
                    <Ticket size={20} color="white" />
                </View>
                <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>My Tickets</Text>
                    <Text style={styles.actionSub}>{pendingCount} pending, {resolvedCount} resolved</Text>
                </View>
                <ChevronRight size={18} color="#666" />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper>
            <ScreenHeader title="Support Center" showBackButton />

            {/* Tabs */}
            {!showForm && (
                <View style={styles.tabBarContainer}>
                    <View style={styles.tabBar}>
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === 'tickets' && styles.activeTabItem]}
                            onPress={() => setActiveTab('tickets')}
                        >
                            <Ticket size={18} color={activeTab === 'tickets' ? 'white' : '#757575'} style={{ marginRight: 6 }} />
                            <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>My Tickets</Text>
                            {pendingCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{pendingCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === 'support' && styles.activeTabItem]}
                            onPress={() => setActiveTab('support')}
                        >
                            <Headset size={18} color={activeTab === 'support' ? 'white' : '#757575'} style={{ marginRight: 6 }} />
                            <Text style={[styles.tabText, activeTab === 'support' && styles.activeTabText]}>Support</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
            >
                {showForm ? (
                    <View style={styles.formContainer}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>Raise New Ticket</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <X size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Issue Category</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Subject</Text>
                        <TextInput
                            style={styles.textInput}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder="Brief title of your issue"
                            placeholderTextColor="#666"
                            maxLength={200}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Explain your issue in detail..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            maxLength={1000}
                        />

                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={styles.resetBtn}
                                onPress={() => { setSubject(''); setDescription(''); setCategory('Order Not Executed'); }}
                            >
                                <Text style={styles.resetBtnText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                                onPress={handleCreateTicket}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Send size={14} color="white" />
                                        <Text style={styles.submitBtnText}>Submit Ticket</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : activeTab === 'tickets' ? (
                    <MyTicketsView />
                ) : (
                    <ClientSupportView />
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 10,
    },
    backBtn: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    tabBarContainer: { paddingHorizontal: 15, marginVertical: 10 },
    tabBar: {
        flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8, padding: 4,
    },
    tabItem: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 6,
    },
    activeTabItem: { backgroundColor: '#2D3748' },
    tabText: { color: '#757575', fontSize: 15.5, fontWeight: '600' },
    activeTabText: { color: 'white' },
    badge: {
        backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16,
        justifyContent: 'center', alignItems: 'center', marginLeft: 5, paddingHorizontal: 4,
    },
    badgeText: { color: 'white', fontSize: 10.5, fontWeight: '900' },
    container: { paddingHorizontal: 15, paddingBottom: 30 },

    // Stats
    statsRow: {
        flexDirection: 'row', gap: 10, marginBottom: 15,
    },
    statBox: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
        padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    statNumber: { color: 'white', fontSize: 22, fontWeight: '900' },
    statLabel: { color: '#888', fontSize: 11.5, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },

    // Filter
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    filterChipActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' },
    filterChipText: { color: '#888', fontSize: 12.5, fontWeight: '700' },
    filterChipTextActive: { color: '#10B981' },

    // Ticket Item
    ticketItem: {
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
        padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    ticketRow: { flexDirection: 'row', alignItems: 'center' },
    ticketIcon: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    ticketContent: { flex: 1 },
    ticketTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ticketId: { color: '#10B981', fontSize: 12.5, fontWeight: '900' },
    ticketSubject: { color: 'white', fontSize: 15.5, fontWeight: 'bold', marginTop: 2 },
    ticketMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    ticketDate: { color: '#666', fontSize: 12.5 },

    // Status Badge
    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
    statusBadgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.5 },

    // Raise button
    raiseBtn: {
        flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 14,
        borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        marginTop: 15, gap: 8,
    },
    raiseBtnText: { color: 'white', fontSize: 16.5, fontWeight: 'bold' },
    hintText: { color: '#555', fontSize: 11.5, textAlign: 'center', marginTop: 8 },

    // Form
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
        padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    formHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18,
    },
    formTitle: { color: 'white', fontSize: 17.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    label: {
        color: '#888', fontSize: 11.5, fontWeight: '900', textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6, marginTop: 14,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)',
    },
    categoryChipActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.4)' },
    categoryChipText: { color: '#888', fontSize: 12.5, fontWeight: '700' },
    categoryChipTextActive: { color: '#10B981' },
    textInput: {
        backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
        color: 'white', fontSize: 15.5,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
    resetBtn: {
        paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    resetBtnText: { color: 'white', fontSize: 13.5, fontWeight: '700' },
    submitBtn: {
        flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', gap: 6,
    },
    submitBtnText: { color: 'white', fontSize: 13.5, fontWeight: '900' },

    // Empty & Loading
    loadingBox: { paddingVertical: 40, alignItems: 'center' },
    emptyBox: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
        padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    emptyTitle: { color: 'white', fontSize: 17.5, fontWeight: '900', marginTop: 12, textTransform: 'uppercase' },
    emptySubText: { color: '#666', fontSize: 12.5, marginTop: 4 },

    // Client Support
    clientSupportContainer: { gap: 15 },
    dedicatedCard: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15,
        padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    dedicatedTitle: { color: 'white', fontSize: 19.5, fontWeight: 'bold', marginBottom: 8 },
    dedicatedSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15.5, textAlign: 'center', lineHeight: 20 },
    actionCard: {
        backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row',
        padding: 15, borderRadius: 12, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    actionIconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#2D3748', justifyContent: 'center', alignItems: 'center', marginRight: 15,
    },
    actionTextContainer: { flex: 1 },
    actionTitle: { color: 'white', fontSize: 16.5, fontWeight: 'bold' },
    actionSub: { color: '#888', fontSize: 13.5, marginTop: 2 },
    ticketBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    ticketBadgeText: {
        color: 'white',
        fontSize: 10.5,
        fontWeight: '900',
    },
});

export default SupportScreen;
