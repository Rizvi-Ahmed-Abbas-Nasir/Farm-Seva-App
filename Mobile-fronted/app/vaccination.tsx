import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Define the structure of a vaccination record
interface Vaccination {
    id: string; // Or number, depending on DB
    species: 'poultry' | 'pig' | 'poultry' | 'pigs';
    vaccine_name: string;
    scheduled_date: string;
    administration_method: string;
    status?: string; // Add if your DB has status, otherwise calculate it
    notes?: string;
}

export default function VaccinationScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'poultry' | 'pigs'>('poultry');
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

    // Fetch vaccinations
    const fetchVaccinations = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                // Handle no token
                setLoading(false);
                return;
            }

            console.log('Fetching vaccinations from:', `${API_URL}/vaccinations`);

            const response = await axios.get(`${API_URL}/vaccinations`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.success) {
                setVaccinations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching vaccinations:', error);
            // Optional: Alert user, but maybe not on every focus?
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVaccinations();
    }, []);

    // Filter vaccinations based on active tab and sort by date
    const getFilteredVaccinations = () => {
        return vaccinations
            .filter(v => {
                // Normalizing species names. DB might store 'pig', tab is 'pigs'. DB 'poultry', tab 'poultry'.
                const vSpecies = v.species ? v.species.toLowerCase() : '';
                if (activeTab === 'pigs') return vSpecies === 'pig' || vSpecies === 'pigs';
                return vSpecies === 'poultry';
            })
            .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
    };

    const getStatus = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        // Reset time for simple date comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (target < today) return 'done'; // Assuming past dates are done? Or maybe 'overdue'?
        if (target.getTime() === today.getTime()) return 'pending'; // Today
        return 'upcoming';
    };

    const renderScheduleItem = (item: Vaccination, index: number) => {
        const status = getStatus(item.scheduled_date);

        let statusColor = '#9CA3AF';
        let statusIcon = <Clock size={16} color="#9CA3AF" />;
        let statusBg = '#F3F4F6';
        let statusText = 'Upcoming';

        if (status === 'done') {
            statusColor = '#10B981';
            statusIcon = <CheckCircle size={16} color="#10B981" />;
            statusBg = '#D1FAE5';
            statusText = 'Done'; // Or 'Past'
        } else if (status === 'pending') {
            statusColor = '#F59E0B';
            statusIcon = <AlertCircle size={16} color="#F59E0B" />;
            statusBg = '#FEF3C7';
            statusText = 'Due Today';
        }

        const dateObj = new Date(item.scheduled_date);
        const dateDisplay = dateObj.toLocaleDateString();

        return (
            <TouchableOpacity
                key={index}
                style={styles.scheduleItem}
                activeOpacity={0.7}
                onPress={() => router.push(`/vaccination/${item.id}` as any)}
            >
                <View style={styles.timelineContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: statusColor }]} />
                    {index !== getFilteredVaccinations().length - 1 && (
                        <View style={styles.timelineLine} />
                    )}
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.dayText}>{dateDisplay}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            {statusIcon}
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {statusText}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.vaccineName}>{item.vaccine_name}</Text>
                    <Text style={styles.methodText}>Method: {item.administration_method}</Text>
                    {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

                    {/* Visual indicator for drill-down */}
                    <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
                        <ChevronLeft size={20} color="#D1D5DB" style={{ transform: [{ rotate: '180deg' }] }} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vaccination Schedule</Text>

                <TouchableOpacity onPress={() => router.push('/addVaccination')} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'poultry' && styles.activeTab]}
                    onPress={() => setActiveTab('poultry')}
                >
                    <Text style={styles.tabIcon}>🐔</Text>
                    <Text style={[styles.tabText, activeTab === 'poultry' && styles.activeTabText]}>Poultry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pigs' && styles.activeTab]}
                    onPress={() => setActiveTab('pigs')}
                >
                    <Text style={styles.tabIcon}>🐷</Text>
                    <Text style={[styles.tabText, activeTab === 'pigs' && styles.activeTabText]}>Pigs</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
                ) : (
                    <View style={styles.scheduleContainer}>
                        {getFilteredVaccinations().length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No vaccinations scheduled.</Text>
                                <Text style={styles.emptyStateSubText}>Tap + to add one.</Text>
                            </View>
                        ) : (
                            getFilteredVaccinations().map(renderScheduleItem)
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: -2,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        borderWidth: 2,
    },
    tabIcon: {
        fontSize: 20,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#2563EB',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scheduleContainer: {
        paddingBottom: 40,
    },
    scheduleItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timelineContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 20,
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        zIndex: 1,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    cardContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3B82F6',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    vaccineName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    methodText: {
        fontSize: 14,
        color: '#6B7280',
    },
    notesText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
});
