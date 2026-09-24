import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { ChevronLeft, Send } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import { getTicketMessages, sendTicketMessage } from '../../services/api';
import { getSessionUser } from '../../services/api';
import { useTrades } from '../../context/TradeContext';

const TicketChatScreen = ({ navigation, route }) => {
    const { ticket } = route.params;
    const currentUser = getSessionUser();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    const { refreshSupportCount } = useTrades();

    const fetchMessages = async () => {
        try {
            const data = await getTicketMessages(ticket.id);
            setMessages(data || []);
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll every 5 seconds for new messages as a fallback
        const interval = setInterval(fetchMessages, 5000);

        // Real-time socket message handler
        const handleNewMessage = (payload) => {
            if (payload.ticketId === ticket.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === payload.message.id)) return prev;
                    return [...prev, payload.message];
                });
                
                // Mark message as read on the backend (sends a read receipt)
                getTicketMessages(ticket.id).catch(() => {});
            }
        };

        global.onSupportMessageReceived = handleNewMessage;

        return () => {
            clearInterval(interval);
            if (global.onSupportMessageReceived === handleNewMessage) {
                global.onSupportMessageReceived = null;
            }
            // Trigger badge count refresh on unmount
            try {
                refreshSupportCount();
            } catch (e) {}
        };
    }, [ticket.id]);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await sendTicketMessage(ticket.id, text.trim());
            setText('');
            await fetchMessages();
        } catch (err) {
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const isMine = (msg) => msg.sender_id === currentUser?.id;

    const renderMessage = ({ item }) => {
        const mine = isMine(item);
        return (
            <View style={[styles.bubbleRow, mine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                {!mine && (
                    <Text style={styles.senderLabel}>
                        {item.username || item.full_name} ({item.sender_role})
                    </Text>
                )}
                {mine && <Text style={styles.senderLabelRight}>You</Text>}
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                        {item.message}
                    </Text>
                </View>
                <Text style={[styles.timeText, mine && { textAlign: 'right' }]}>
                    {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        );
    };

    const statusColor = ticket.status === 'RESOLVED' ? '#10B981' : '#F59E0B';

    return (
        <ScreenWrapper>
            <ScreenHeader
                title={ticket.subject}
                subtitle={`#${ticket.id} • ${ticket.status}`}
                showBackButton
            />

            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Messages */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No messages yet</Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                {ticket.status === 'RESOLVED' ? (
                    <View style={styles.resolvedBar}>
                        <Text style={styles.resolvedText}>Ticket Resolved</Text>
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={text}
                            onChangeText={setText}
                            placeholder="Type your message..."
                            placeholderTextColor="#666"
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!text.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Send size={20} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    flex1: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backBtn: { padding: 5, marginRight: 8 },
    headerInfo: { flex: 1 },
    headerTitle: { color: 'white', fontSize: 17.5, fontWeight: 'bold' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        marginTop: 4,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    statusText: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messagesList: { padding: 15, paddingBottom: 10 },
    bubbleRow: { marginBottom: 12 },
    bubbleRowLeft: { alignItems: 'flex-start' },
    bubbleRowRight: { alignItems: 'flex-end' },
    senderLabel: {
        fontSize: 11.5,
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    senderLabelRight: {
        fontSize: 11.5,
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'right',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    bubbleMine: {
        backgroundColor: '#10B981',
        borderTopRightRadius: 4,
    },
    bubbleTheirs: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bubbleText: { fontSize: 15.5, lineHeight: 22 },
    bubbleTextMine: { color: 'white' },
    bubbleTextTheirs: { color: '#E2E8F0' },
    timeText: { fontSize: 10.5, color: '#555', marginTop: 3 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#555', fontSize: 14.5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: 'white',
        fontSize: 15.5,
        maxHeight: 100,
        marginRight: 8,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    resolvedBar: {
        padding: 12,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(16,185,129,0.3)',
        alignItems: 'center',
    },
    resolvedText: {
        color: '#10B981',
        fontSize: 12.5,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});

export default TicketChatScreen;
