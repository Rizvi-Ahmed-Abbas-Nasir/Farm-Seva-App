import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Save, Syringe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddVaccinationScreen() {
    const router = useRouter();
    const [species, setSpecies] = useState<'poultry' | 'pig'>('poultry');
    const [vaccineName, setVaccineName] = useState('');
    const [date, setDate] = useState('');
    const [method, setMethod] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (!vaccineName || !date) {
            Alert.alert('Missing Information', 'Please fill in the vaccine name and date.');
            return;
        }

        // Here you would typically save to backend/supabase
        Alert.alert('Success', 'Vaccination scheduled successfully!', [
            { text: 'OK', onPress: () => router.back() }
        ]);
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
                <Text style={styles.headerTitle}>Schedule Vaccination</Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                    {/* Species Selection */}
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

                    {/* Form Fields */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Vaccine Name</Text>
                        <View style={styles.inputContainer}>
                            <Syringe size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Newcastle Disease"
                                value={vaccineName}
                                onChangeText={setVaccineName}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Scheduled Date</Text>
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

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Administration Method</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Drinking Water, Injection"
                            value={method}
                            onChangeText={setMethod}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Batch number, dosage, etc."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Save size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Save Schedule</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    speciesContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    speciesCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeSpecies: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    speciesEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    speciesText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeSpeciesText: {
        color: '#3B82F6',
    },
    formGroup: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
