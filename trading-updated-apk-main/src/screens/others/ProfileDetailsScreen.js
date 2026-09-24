import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { ChevronLeft, ShieldAlert } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import * as api from '../../services/api';

const ProfileDetailsScreen = ({ navigation }) => {
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const user = api.getSessionUser();

    const fetchSegments = async () => {
        try {
            if (user?.id) {
                const data = await api.getUserSegments(user.id);
                setSegments(data);
            }
        } catch (error) {
            console.error('Error fetching segments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await api.getMe(); // Refresh basic user info
            await fetchSegments(); // Refresh segment specifics
        } catch (err) {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSegments();
    }, [user?.id]);

    const renderCard = (title, children) => (
        <View style={styles.cardWrapper}>
            <Text style={styles.cardHeader}>{title.toUpperCase()}</Text>
            <View style={styles.card}>
                {children}
            </View>
        </View>
    );

    const renderDetailRow = (label, value, isLast = false) => (
        <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#01B4EA" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <StatusBar barStyle="light-content" />

            <ScreenHeader title="Profile Details" showBackButton />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60, paddingTop: 15 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="white"
                    />
                }
            >
                {segments.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <ShieldAlert size={40} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>No trading segments assigned to your profile yet.</Text>
                    </View>
                ) : (
                    segments.map((seg, index) => (
                        <View key={seg.segment + index}>
                            {renderCard(`${seg.segment}: ${seg.is_enabled ? 'Enabled' : 'Disabled'}`, (
                                <>
                                    {renderDetailRow('Brokerage', `${seg.brokerage_value} / ${seg.brokerage_type.toLowerCase()}`)}
                                    {renderDetailRow('Exposure Multiplier', `${seg.exposure_multiplier}x`)}
                                    {renderDetailRow('Max Lot Per Scrip', `${seg.max_lot_per_scrip}`)}
                                    {renderDetailRow('Auto Square Off', seg.auto_square_off ? `Yes (${seg.square_off_time || 'N/A'})` : 'No', true)}
                                </>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    backBtn: {
        marginRight: 8,
        marginLeft: -8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        color: 'white',
        fontSize: 17.5,
        textAlign: 'center',
        marginTop: 20,
        opacity: 0.5,
    },
    cardWrapper: {
        marginBottom: 25,
        paddingHorizontal: 16,
    },
    cardHeader: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14.5,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: 'rgba(28, 28, 30, 0.85)', // Semi-transparent for premium look
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#38383a',
    },
    label: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 17.5,
    },
    value: {
        color: '#FFFFFF',
        fontSize: 17.5,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 20,
    },
    commoditiesText: {
        color: '#FFFFFF',
        fontSize: 15.5,
        textAlign: 'right',
        flex: 1,
        marginLeft: 20,
        lineHeight: 18,
    }
});

export default ProfileDetailsScreen;
