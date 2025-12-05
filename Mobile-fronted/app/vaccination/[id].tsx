import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Syringe, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VaccinationDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [vaccination, setVaccination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [markingDone, setMarkingDone] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (id) {
            fetchVaccinationDetails();
        }
    }, [id]);

    const fetchVaccinationDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert("Authentication Required", "Please login to continue.");
                router.replace('/auth');
                return;
            }

            const response = await axios.get(`${API_URL}/vaccinations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setVaccination(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            Alert.alert("Error", "Failed to load vaccination details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDone = async () => {
        Alert.alert(
            "Confirm Vaccination",
            "Are you sure you want to mark this vaccination as completed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, I'm sure",
                    onPress: async () => {
                        setMarkingDone(true);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.patch(
                                `${API_URL}/vaccinations/${id}/status`,
                                { status: 'done' },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            Alert.alert("Success", "Vaccination marked as done!");
                            router.back();
                        } catch (error) {
                            console.error('Error updating status:', error);
                            Alert.alert("Error", "Failed to update status.");
                        } finally {
                            setMarkingDone(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!vaccination) {
        return (
            <View style={styles.centerContainer}>
                <Text>Vaccination not found.</Text>
            </View>
        );
    }

    const scheduledDate = new Date(vaccination.scheduled_date);
    const dateStr = scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Determine colors based on urgency/status (simple logic for now)
    const isOverdue = new Date() > scheduledDate && vaccination.status !== 'completed';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vaccination Details</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.statusBadgeContainer}>
                        {isOverdue ? (
                            <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                                <AlertTriangle size={14} color="#DC2626" />
                                <Text style={[styles.statusText, { color: '#DC2626' }]}>Overdue</Text>
                            </View>
                        ) : (
                            <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
                                <Clock size={14} color="#2563EB" />
                                <Text style={[styles.statusText, { color: '#2563EB' }]}>Scheduled</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.vaccineName}>{vaccination.vaccine_name}</Text>
                    <Text style={styles.species}>{vaccination.species.toUpperCase()}</Text>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Calendar size={20} color="#6B7280" />
                        <View style={styles.rowContent}>
                            <Text style={styles.label}>Scheduled Date</Text>
                            <Text style={styles.value}>{dateStr}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Clock size={20} color="#6B7280" />
                        <View style={styles.rowContent}>
                            <Text style={styles.label}>Time</Text>
                            <Text style={styles.value}>{timeStr}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Syringe size={20} color="#6B7280" />
                        <View style={styles.rowContent}>
                            <Text style={styles.label}>Administration Method</Text>
                            <Text style={styles.value}>{vaccination.administration_method || 'Not specified'}</Text>
                        </View>
                    </View>

                    {vaccination.notes && (
                        <View style={styles.noteBox}>
                            <View style={styles.noteHeader}>
                                <FileText size={16} color="#4B5563" />
                                <Text style={styles.noteLabel}>Notes</Text>
                            </View>
                            <Text style={styles.noteText}>{vaccination.notes}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.completeButton, markingDone && styles.disabledButton]}
                    onPress={handleMarkAsDone}
                    disabled={markingDone}
                >
                    {markingDone ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <CheckCircle size={20} color="#FFFFFF" />
                            <Text style={styles.completeButtonText}>Mark as Done</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.infoText}>
                    Marking this as done will move it to your vaccination history and remove it from upcoming tasks.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Inter-Bold' },
    content: { flex: 1, padding: 20 },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
        marginBottom: 24,
    },
    statusBadgeContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6 },
    statusText: { fontSize: 12, fontWeight: '600' },
    vaccineName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    species: { fontSize: 14, fontWeight: '600', color: '#6B7280', letterSpacing: 1 },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
    row: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
    rowContent: { marginLeft: 16, flex: 1 },
    label: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
    value: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
    noteBox: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginTop: 8 },
    noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    noteLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
    noteText: { fontSize: 15, color: '#374151', lineHeight: 22 },
    completeButton: {
        backgroundColor: '#059669', borderRadius: 16, padding: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    disabledButton: { backgroundColor: '#A7F3D0' },
    completeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    infoText: { textAlign: 'center', marginTop: 16, color: '#9CA3AF', fontSize: 13 },
});
