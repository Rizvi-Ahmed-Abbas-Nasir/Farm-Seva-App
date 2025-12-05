import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Save, Stethoscope, Clock, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

export default function AddCheckupScreen() {
    const router = useRouter();
    const [species, setSpecies] = useState<'poultry' | 'pig'>('poultry');
    const [animalName, setAnimalName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');
    const [administration, setAdministration] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) setIsAuthenticated(true);
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            Alert.alert("Error", "Please login.");
            return;
        }
        if (!animalName.trim() || !date.trim()) {
            Alert.alert("Missing Fields", "Animal Name and Date are required.");
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const scheduledDateTime = `${date}T${time}:00.000Z`;

            const requestData = {
                species,
                animal_name: animalName,
                scheduled_date: scheduledDateTime,
                administration,
                notes
            };

            const response = await api.post(
                `${API_URL}/checkups/add`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200 || response.status === 201) {
                Alert.alert("Success", "Checkup scheduled!");
                router.back();
            }
        } catch (error: any) {
            console.error('API Error:', error);
            Alert.alert("Error", error.message || "Failed to schedule checkup");
        } finally {
            setIsLoading(false);
        }
    };

    const setToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
    };

    const setCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Schedule Checkup</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={styles.label}>Select Species</Text>
                    <View style={styles.speciesContainer}>
                        <TouchableOpacity
                            style={[styles.speciesCard, species === 'poultry' && styles.activeSpecies]}
                            onPress={() => setSpecies('poultry')}
                        >
                            <Text style={styles.speciesEmoji}>🐔</Text>
                            <Text style={[styles.speciesText, species === 'poultry' && styles.activeSpeciesText]}>Poultry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.speciesCard, species === 'pig' && styles.activeSpecies]}
                            onPress={() => setSpecies('pig')}
                        >
                            <Text style={styles.speciesEmoji}>🐷</Text>
                            <Text style={[styles.speciesText, species === 'pig' && styles.activeSpeciesText]}>Pig</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Animal Name / ID *</Text>
                        <View style={styles.inputContainer}>
                            <Stethoscope size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Pig-04 or Batch A"
                                value={animalName}
                                onChangeText={setAnimalName}
                            />
                        </View>
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <View style={styles.dateTimeHeader}>
                                <Text style={styles.label}>Date *</Text>
                                <TouchableOpacity onPress={setToday}>
                                    <Text style={styles.quickSetButton}>Today</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputContainer}>
                                <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    value={date}
                                    onChangeText={setDate}
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                            <View style={styles.dateTimeHeader}>
                                <Text style={styles.label}>Time *</Text>
                                <TouchableOpacity onPress={setCurrentTime}>
                                    <Text style={styles.quickSetButton}>Now</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputContainer}>
                                <Clock size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="HH:MM"
                                    value={time}
                                    onChangeText={setTime}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Administration</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Routine Check, Emergency"
                            value={administration}
                            onChangeText={setAdministration}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Symptoms, observations, etc."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Save size={20} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>Schedule Checkup</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Inter-Bold' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, fontFamily: 'Inter-SemiBold' },
    speciesContainer: { flexDirection: 'row', gap: 16, marginBottom: 28 },
    speciesCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6', elevation: 3 },
    activeSpecies: { borderColor: '#10B981', backgroundColor: '#ECFDF5', elevation: 6 },
    speciesEmoji: { fontSize: 48, marginBottom: 8 },
    speciesText: { fontSize: 16, fontWeight: '600', color: '#6B7280', fontFamily: 'Inter-SemiBold' },
    activeSpeciesText: { color: '#10B981' },
    formGroup: { marginBottom: 20 },
    formRow: { flexDirection: 'row', marginBottom: 20 },
    dateTimeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    quickSetButton: { fontSize: 14, color: '#10B981', fontFamily: 'Inter-Medium', paddingHorizontal: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, elevation: 2 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937', fontFamily: 'Inter-Regular' },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    submitButton: { backgroundColor: '#10B981', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, elevation: 8 },
    submitButtonDisabled: { backgroundColor: '#A7F3D0' },
    submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginLeft: 12, fontFamily: 'Inter-Bold' },
});
