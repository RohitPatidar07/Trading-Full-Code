import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Clipboard,
    ToastAndroid,
    Platform
} from 'react-native';
import { Landmark, Copy, CheckCircle2, ChevronLeft } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import * as api from '../../services/api';

const BankDetailsScreen = ({ navigation }) => {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBanks = async () => {
        try {
            const user = api.getSessionUser();
            const data = await api.getBanks();
            
            // For TRADERS, show only Active. For ADMINS, show all.
            if (user?.role === 'TRADER') {
                setBanks(data.filter(b => b.status === 'Active'));
            } else {
                setBanks(data);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBanks();
    };

    const copyToClipboard = (text, label) => {
        Clipboard.setString(text);
        ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    };

    const BankRow = ({ bank }) => (
        <View style={styles.bankRow}>
            <View style={styles.bankMain}>
                <View style={styles.bankHeader}>
                    <Text style={styles.bankName}>{bank.bank_name}</Text>
                    <View style={[styles.miniBadge, { backgroundColor: bank.status === 'Active' ? '#4CAF5022' : '#F4433622' }]}>
                        <Text style={[styles.miniBadgeText, { color: bank.status === 'Active' ? '#4CAF50' : '#F44336' }]}>
                            {bank.status === 'Active' ? 'Verified' : 'Inactive'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.acHolder}>{bank.account_holder}</Text>
            </View>

            <View style={styles.bankDetails}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>A/C NO</Text>
                    <View style={styles.rowBetween}>
                        <Text style={styles.detailValue}>{bank.account_number}</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(bank.account_number, 'A/C No')}>
                            <Copy size={14} color="#546E7A" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.detailItem, { marginTop: 8 }]}>
                    <View style={styles.row}>
                        <View style={{ flex: 1.2 }}>
                            <Text style={styles.detailLabel}>IFSC</Text>
                            <View style={styles.rowAlignCenter}>
                                <Text style={styles.detailValue}>{bank.ifsc}</Text>
                                <TouchableOpacity onPress={() => copyToClipboard(bank.ifsc, 'IFSC')} style={{ marginLeft: 5 }}>
                                    <Copy size={12} color="#546E7A" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>BRANCH</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{bank.branch}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <ScreenWrapper>
            <ScreenHeader title="Bank Details" showBackButton />

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#01B4EA" />
                </View>
            ) : (
                <FlatList
                    data={banks}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <BankRow bank={item} />}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#01B4EA" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Landmark size={40} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>No banks found.</Text>
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
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    listContainer: {
        padding: 10,
        paddingBottom: 40,
    },
    bankRow: {
        backgroundColor: '#CFD1C4',
        borderRadius: 6,
        marginBottom: 8,
        padding: 10,
        elevation: 2,
    },
    bankMain: {
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 6,
    },
    bankHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    bankName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#263238',
    },
    acHolder: {
        fontSize: 13,
        color: '#546E7A',
        fontWeight: '600',
    },
    miniBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 10.5,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bankDetails: {
        marginTop: 2,
    },
    detailItem: {
        // Condensed
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 10,
        color: '#78909C',
        fontWeight: '800',
        marginBottom: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#37474F',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    row: {
        flexDirection: 'row',
    },
    rowAlignCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
        opacity: 0.5,
    }
});


export default BankDetailsScreen;
