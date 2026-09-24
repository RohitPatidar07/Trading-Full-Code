import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { ChevronLeft, Check, Clock, XCircle, CheckCircle, AlertCircle, CreditCard, Smartphone } from 'lucide-react-native';
import { useTrades } from '../../context/TradeContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

// ── Status badge helper ───────────────────────────────────────────
const STATUS_CONFIG = {
    Pending: { color: '#F6AD55', bg: 'rgba(246,173,85,0.12)', icon: Clock, label: 'Pending' },
    Processing: { color: '#63B3ED', bg: 'rgba(99,179,237,0.12)', icon: AlertCircle, label: 'Processing' },
    Completed: { color: '#68D391', bg: 'rgba(104,211,145,0.12)', icon: CheckCircle, label: 'Completed' },
    Rejected: { color: '#FC8181', bg: 'rgba(252,129,129,0.12)', icon: XCircle, label: 'Rejected' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    const Icon = cfg.icon;
    return (
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Icon size={12} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};

const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        + '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ── Main Screen ───────────────────────────────────────────────────
const WithdrawalRequestScreen = ({ navigation }) => {
    const { addWithdrawalRequest, withdrawalRequests, ledgerBalance } = useTrades();

    const [activeTab, setActiveTab] = useState('new');   // 'new' | 'history'
    const [payMethod, setPayMethod] = useState('Bank');  // 'Bank' | 'UPI'
    const [submitting, setSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    // Form fields
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [upiId, setUpiId] = useState('');
    const [accountHolder, setAccountHolder] = useState('');

    const isValid = () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return false;
        if (parseFloat(amount) < 500) return false;
        if (payMethod === 'Bank') {
            return bankName.trim() && accountNumber.trim() && ifsc.trim() && accountHolder.trim();
        }
        return upiId.trim().length > 4;
    };

    const resetForm = () => {
        setAmount(''); setBankName(''); setAccountNumber('');
        setIfsc(''); setUpiId(''); setAccountHolder('');
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await addWithdrawalRequest({
                amount,
                method: payMethod === 'Bank' ? 'Bank Transfer' : 'UPI',
                bankName: payMethod === 'Bank' ? bankName : '',
                accountNumber: payMethod === 'Bank' ? accountNumber : '',
                ifsc: payMethod === 'Bank' ? ifsc : '',
                accountHolder: payMethod === 'Bank' ? accountHolder : '',
                upiId: payMethod === 'UPI' ? upiId : '',
            });
            setSuccessModal(true);
            resetForm();
        } catch (err) {
            Alert.alert(
                'Withdrawal Failed',
                err.message || 'Unable to process your request. Please check your balance or try again later.',
                [{ text: 'OK' }]
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ── NEW REQUEST FORM ─────────────────────────────────────────
    const renderForm = () => (
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>

            {/* Available Balance Chip */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>
                    ₹{Number(ledgerBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
            </View>

            {/* Amount */}
            <View style={styles.section}>
                <Text style={styles.fieldLabel}>Withdrawal Amount (₹)</Text>
                <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    cursorColor="white"
                />
                <View style={styles.divider} />
                <Text style={styles.minNote}>Minimum: ₹500</Text>
            </View>

            {/* Method Toggle */}
            <View style={styles.section}>
                <Text style={styles.fieldLabel}>Payment Method</Text>
                <View style={styles.methodRow}>
                    <TouchableOpacity
                        style={[styles.methodBtn, payMethod === 'Bank' && styles.methodBtnActive]}
                        onPress={() => setPayMethod('Bank')}
                    >
                        <CreditCard size={18} color={payMethod === 'Bank' ? '#1a1a2e' : '#CFD1C4'} />
                        <Text style={[styles.methodBtnText, payMethod === 'Bank' && styles.methodBtnTextActive]}>
                            Bank Transfer
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.methodBtn, payMethod === 'UPI' && styles.methodBtnActive]}
                        onPress={() => setPayMethod('UPI')}
                    >
                        <Smartphone size={18} color={payMethod === 'UPI' ? '#1a1a2e' : '#CFD1C4'} />
                        <Text style={[styles.methodBtnText, payMethod === 'UPI' && styles.methodBtnTextActive]}>
                            UPI
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bank Fields */}
            {payMethod === 'Bank' ? (
                <View style={styles.section}>
                    <Text style={styles.fieldLabel}>Bank Details</Text>
                    {[
                        { label: 'Account Holder Name', value: accountHolder, set: setAccountHolder, kb: 'default' },
                        { label: 'Bank Name', value: bankName, set: setBankName, kb: 'default' },
                        { label: 'Account Number', value: accountNumber, set: setAccountNumber, kb: 'numeric' },
                        { label: 'IFSC Code', value: ifsc, set: setIfsc, kb: 'default', upper: true },
                    ].map((f) => (
                        <View key={f.label} style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>{f.label}</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder={`Enter ${f.label}`}
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                keyboardType={f.kb}
                                value={f.value}
                                onChangeText={f.set}
                                autoCapitalize={f.upper ? 'characters' : 'words'}
                                cursorColor="white"
                            />
                            <View style={styles.inputLine} />
                        </View>
                    ))}
                </View>
            ) : (
                /* UPI Field */
                <View style={styles.section}>
                    <Text style={styles.fieldLabel}>UPI Details</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>UPI ID</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="yourname@upi"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            keyboardType="email-address"
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                            cursorColor="white"
                        />
                        <View style={styles.inputLine} />
                    </View>
                </View>
            )}

            {/* Submit */}
            <TouchableOpacity
                style={[styles.submitBtn, (!isValid() || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!isValid() || submitting}
                activeOpacity={0.8}
            >
                {submitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
                Requests are processed within 24 business hours. Ensure your details are correct before submitting.
            </Text>
        </ScrollView>
    );

    // ── HISTORY LIST ─────────────────────────────────────────────
    const renderHistory = () => (
        <ScrollView contentContainerStyle={styles.historyScroll} showsVerticalScrollIndicator={false}>
            {withdrawalRequests.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Clock size={50} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyText}>No withdrawal requests yet</Text>
                </View>
            ) : (
                withdrawalRequests.map((req) => {
                    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                    return (
                        <View key={req.id} style={[styles.historyCard, { borderLeftColor: cfg.color }]}>
                            <View style={styles.historyTop}>
                                <View>
                                    <Text style={styles.historyAmount}>₹{Number(req.amount).toLocaleString('en-IN')}</Text>
                                    <Text style={styles.historyMethod}>{req.payment_method || req.method}</Text>
                                </View>
                                <StatusBadge status={req.status} />
                            </View>

                            {/* Details */}
                            {(req.payment_method || req.method) === 'Bank Transfer' ? (
                                <View style={styles.historyDetails}>
                                    <Text style={styles.historyDetailText}>Bank: {req.bank_name || req.bankName}</Text>
                                    <Text style={styles.historyDetailText}>A/C: {req.account_number || req.accountNumber}</Text>
                                    <Text style={styles.historyDetailText}>IFSC: {req.ifsc_code || req.ifsc}</Text>
                                </View>
                            ) : (
                                <View style={styles.historyDetails}>
                                    <Text style={styles.historyDetailText}>UPI: {req.upi_id || req.upiId}</Text>
                                </View>
                            )}

                            <View style={styles.historyFooter}>
                                <Text style={styles.historyDate}>
                                    Submitted: {formatDate(req.created_at || req.submittedAt)}
                                </Text>
                                {(req.updated_at || req.statusUpdatedAt) && (
                                    <Text style={styles.historyDate}>
                                        Updated: {formatDate(req.updated_at || req.statusUpdatedAt)}
                                    </Text>
                                )}
                                {req.remark ? (
                                    <Text style={[styles.historyRemark, { color: cfg.color }]}>
                                        {req.remark}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );

    return (
        <ScreenWrapper>
            <ScreenHeader title="WITHDRAWAL REQUEST" showBackButton />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {/* Tab Switch */}
                        <View style={styles.tabBar}>
                            {[['new', 'New Request'], ['history', 'My Requests']].map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.tabItem, activeTab === key && styles.tabActive]}
                                    onPress={() => setActiveTab(key)}
                                >
                                    <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                                        {label}
                                    </Text>
                                    {key === 'history' && withdrawalRequests.length > 0 && (
                                        <View style={styles.countBadge}>
                                            <Text style={styles.countBadgeText}>{withdrawalRequests.length}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {activeTab === 'new' ? renderForm() : renderHistory()}
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <View style={styles.successIconBox}>
                            <Check size={36} color="white" />
                        </View>
                        <Text style={styles.modalTitle}>Request Submitted!</Text>
                        <Text style={styles.modalBody}>
                            Your withdrawal request has been sent to admin for review. You will be notified once it's processed.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => { setSuccessModal(false); setActiveTab('history'); }}
                        >
                            <Text style={styles.modalBtnText}>View My Requests</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({

    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginHorizontal: 15, borderRadius: 12,
        marginBottom: 14, padding: 4,
    },
    tabItem: {
        flex: 1, paddingVertical: 9,
        alignItems: 'center', borderRadius: 9,
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    tabActive: { backgroundColor: '#CFD1C4' },
    tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 15.5, fontWeight: '600' },
    tabTextActive: { color: '#1a1a2e', fontWeight: '700' },
    countBadge: {
        backgroundColor: '#E53E3E', borderRadius: 9,
        paddingHorizontal: 6, paddingVertical: 1,
    },
    countBadgeText: { color: 'white', fontSize: 12.5, fontWeight: '900' },

    // ── Form ──
    formScroll: { paddingHorizontal: 15, paddingBottom: 40 },

    balanceCard: {
        backgroundColor: 'rgba(207,209,196,0.1)',
        borderRadius: 12, padding: 16,
        marginBottom: 20, borderWidth: 1,
        borderColor: 'rgba(207,209,196,0.2)',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 15.5 },
    balanceValue: { color: '#CFD1C4', fontSize: 22, fontWeight: 'bold' },

    section: { marginBottom: 24 },
    fieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14.5, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 },

    amountInput: {
        color: 'white', fontSize: 38, fontWeight: 'bold',
        paddingVertical: 6,
    },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 4 },
    minNote: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5, marginTop: 5 },

    methodRow: { flexDirection: 'row', gap: 12 },
    methodBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12, borderRadius: 10,
        backgroundColor: 'rgba(207,209,196,0.08)',
        borderWidth: 1, borderColor: 'rgba(207,209,196,0.2)',
    },
    methodBtnActive: { backgroundColor: '#CFD1C4', borderColor: '#CFD1C4' },
    methodBtnText: { color: '#CFD1C4', fontSize: 15.5, fontWeight: '600' },
    methodBtnTextActive: { color: '#1a1a2e' },

    inputWrap: { marginBottom: 18 },
    inputLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13.5, marginBottom: 4 },
    textInput: { color: 'white', fontSize: 17.5, fontWeight: '500', paddingVertical: 4 },
    inputLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 4 },

    submitBtn: {
        backgroundColor: '#CFD1C4', borderRadius: 10,
        paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 16,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: { color: '#1a1a2e', fontSize: 17.5, fontWeight: '900', letterSpacing: 0.5 },
    disclaimer: { color: 'rgba(255,255,255,0.35)', fontSize: 13.5, textAlign: 'center', lineHeight: 18 },

    // ── History ──
    historyScroll: { paddingHorizontal: 15, paddingBottom: 40 },
    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 16.5, marginTop: 14 },

    historyCard: {
        backgroundColor: 'rgba(207,209,196,0.07)',
        borderRadius: 12, padding: 15, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderLeftWidth: 3,
    },
    historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    historyAmount: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    historyMethod: { color: 'rgba(255,255,255,0.45)', fontSize: 13.5, marginTop: 2 },

    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 13.5, fontWeight: '700' },

    historyDetails: { marginBottom: 10 },
    historyDetailText: { color: 'rgba(255,255,255,0.55)', fontSize: 14.5, marginBottom: 2 },

    historyFooter: { borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 8 },
    historyDate: { color: 'rgba(255,255,255,0.35)', fontSize: 13.5, marginBottom: 2 },
    historyRemark: { fontSize: 13.5, fontWeight: '600', marginTop: 3 },

    // ── Modal ──
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalCard: { backgroundColor: '#1a1e2e', borderRadius: 16, padding: 28, alignItems: 'center', width: '100%' },
    successIconBox: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#38A169', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    modalTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    modalBody: { color: 'rgba(255,255,255,0.6)', fontSize: 15.5, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalBtn: {
        backgroundColor: '#CFD1C4', borderRadius: 10,
        paddingVertical: 12, paddingHorizontal: 30,
    },
    modalBtnText: { color: '#1a1a2e', fontSize: 16.5, fontWeight: '800' },
});

export default WithdrawalRequestScreen;
