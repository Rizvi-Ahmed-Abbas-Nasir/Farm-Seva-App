import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const VACCINATION_SCHEDULES = {
    poultry: [
        { day: 'Day 1', vaccine: 'Marek\'s Disease', method: 'Subcutaneous', status: 'completed' },
        { day: 'Day 7', vaccine: 'Newcastle Disease (B1)', method: 'Eye Drop / Water', status: 'completed' },
        { day: 'Day 14', vaccine: 'Gumboro (IBD)', method: 'Drinking Water', status: 'pending' },
        { day: 'Day 21', vaccine: 'Newcastle (LaSota)', method: 'Drinking Water', status: 'upcoming' },
        { day: 'Day 28', vaccine: 'Gumboro Booster', method: 'Drinking Water', status: 'upcoming' },
        { day: 'Week 6-8', vaccine: 'Fowl Pox', method: 'Wing Web Stab', status: 'upcoming' },
    ],
    pigs: [
        { day: 'Day 1-3', vaccine: 'Iron Injection', method: 'Intramuscular', status: 'completed' },
        { day: 'Week 3-4', vaccine: 'Mycoplasma', method: 'Intramuscular', status: 'pending' },
        { day: 'Week 6', vaccine: 'Classical Swine Fever', method: 'Intramuscular', status: 'upcoming' },
        { day: 'Week 8', vaccine: 'FMD (Foot & Mouth)', method: 'Deep IM', status: 'upcoming' },
        { day: 'Week 12', vaccine: 'Pasteurellosis', method: 'Subcutaneous', status: 'upcoming' },
    ]
};

export default function VaccinationScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'poultry' | 'pigs'>('poultry');

    const renderScheduleItem = (item: any, index: number) => {
        let statusColor = '#9CA3AF';
        let statusIcon = <Clock size={16} color="#9CA3AF" />;
        let statusBg = '#F3F4F6';

        if (item.status === 'completed') {
            statusColor = '#10B981';
            statusIcon = <CheckCircle size={16} color="#10B981" />;
            statusBg = '#D1FAE5';
        } else if (item.status === 'pending') {
            statusColor = '#F59E0B';
            statusIcon = <AlertCircle size={16} color="#F59E0B" />;
            statusBg = '#FEF3C7';
        }

        return (
            <View key={index} style={styles.scheduleItem}>
                <View style={styles.timelineContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: statusColor }]} />
                    {index !== VACCINATION_SCHEDULES[activeTab].length - 1 && (
                        <View style={styles.timelineLine} />
                    )}
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.dayText}>{item.day}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            {statusIcon}
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.vaccineName}>{item.vaccine}</Text>
                    <Text style={styles.methodText}>Method: {item.method}</Text>
                </View>
            </View>
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
                <View style={{ width: 24 }} />
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.scheduleContainer}>
                    {VACCINATION_SCHEDULES[activeTab].map(renderScheduleItem)}
                </View>
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
});
