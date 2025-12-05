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
import { ChevronLeft, Calendar, Save, Syringe, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const api = axios.create({
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
});

export default function AddVaccinationScreen() {
    const router = useRouter();
    const [species, setSpecies] = useState<'poultry' | 'pig'>('poultry');
    const [vaccineName, setVaccineName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');
    const [method, setMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

    // Check authentication on mount
    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                setIsAuthenticated(true);
                console.log('✅ Authentication check passed');
            } else {
                console.log('❌ No token found');
                Alert.alert(
                    "Authentication Required",
                    "Please login to continue.",
                    [
                        {
                            text: "Login",
                            onPress: () => router.replace('/auth')
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    };

    // Debug function to check environment
    const debugEnvironment = async () => {
        console.log('=== ENVIRONMENT DEBUG ===');
        console.log('API_URL:', API_URL);
        try {
            const token = await AsyncStorage.getItem('userToken');
            console.log('Token exists:', !!token);
            console.log('Token length:', token?.length || 0);
        } catch (error) {
            console.log('Error getting token:', error);
        }
        console.log('=== END DEBUG ===');
    };

    const handleSubmit = async () => {
        console.log("Submit button pressed"); // Debug log

        // 1. Check Auth
        if (!isAuthenticated) {
            Alert.alert("Debug", "IsAuthenticated is FALSE. Please login.");
            return;
        }

        // 2. Validation
        if (!vaccineName.trim()) {
            Alert.alert("Missing Fields", "Vaccine name is required.");
            return;
        }
        if (!date.trim()) {
            Alert.alert("Missing Fields", "Scheduled date is required.");
            return;
        }

        setIsLoading(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert("Error", "No token found in storage.");
                setIsLoading(false);
                return;
            }

            const scheduledDateTime = `${date}T${time}:00.000Z`;
            const requestData = {
                species,
                vaccine_name: vaccineName,
                scheduled_date: scheduledDateTime,
                administration_method: method,
                notes
            };

            const targetUrl = `${API_URL}/vaccinations/add`;
            // Alert.alert("Debug", `Sending to: ${targetUrl}`); // Uncomment if needed

            const response = await api.post(
                targetUrl,
                requestData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200 || response.status === 201) {
                Alert.alert("Success", "Vaccination scheduled!");
                router.back();
            } else {
                Alert.alert("Error", `Server returned status: ${response.status}`);
            }

        } catch (error: any) {
            console.error('API Error:', error);
            Alert.alert("Submission Error", error.message || "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Test API connection
    const testAPIConnection = async () => {
        try {
            Alert.alert(
                "Testing API Connection",
                "This will test if the API endpoint is reachable.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Test",
                        onPress: async () => {
                            try {
                                console.log('Testing connection to:', API_URL);
                                const response = await axios.get(`${API_URL}/health`, {
                                    timeout: 5000
                                });
                                Alert.alert("✅ Connection Successful", `Server responded: ${response.status}`);
                            } catch (err: any) {
                                Alert.alert("❌ Connection Failed", err.message || "Cannot reach server");
                            }
                        }
                    }
                ]
            );
        } catch (err) {
            console.error('Test error:', err);
        }
    };

    // Format today's date as YYYY-MM-DD
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Set today's date
    const setToday = () => {
        setDate(getTodayDate());
    };

    // Set current time
    const setCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
    };

    // Manual token input for debugging
    const manualTokenInput = () => {
        Alert.prompt(
            "Manual Token Input",
            "Enter your JWT token for debugging:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save",
                    onPress: async (token: any) => {
                        if (token) {
                            try {
                                await AsyncStorage.setItem('userToken', token);
                                setIsAuthenticated(true);
                                Alert.alert("Success", "Token saved successfully!");
                            } catch (error) {
                                Alert.alert("Error", "Failed to save token.");
                            }
                        }
                    }
                }
            ]
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
                <Text style={styles.headerTitle}>Schedule Vaccination</Text>
                <TouchableOpacity
                    onPress={testAPIConnection}
                    style={styles.debugButton}
                >
                    <Text style={styles.debugButtonText}>🔧</Text>
                </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Authentication Status */}
                    {!isAuthenticated && (
                        <View style={styles.authWarning}>
                            <Text style={styles.authWarningText}>⚠️ Please login to schedule vaccinations</Text>
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => router.replace('/auth')}
                            >
                                <Text style={styles.loginButtonText}>Go to Login</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Species Selection */}
                    <Text style={styles.label}>Select Species</Text>
                    <View style={styles.speciesContainer}>
                        <TouchableOpacity
                            style={[styles.speciesCard, species === 'poultry' && styles.activeSpecies]}
                            onPress={() => setSpecies('poultry')}
                            disabled={isLoading || !isAuthenticated}
                        >
                            <Text style={styles.speciesEmoji}>🐔</Text>
                            <Text style={[styles.speciesText, species === 'poultry' && styles.activeSpeciesText]}>Poultry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.speciesCard, species === 'pig' && styles.activeSpecies]}
                            onPress={() => setSpecies('pig')}
                            disabled={isLoading || !isAuthenticated}
                        >
                            <Text style={styles.speciesEmoji}>🐷</Text>
                            <Text style={[styles.speciesText, species === 'pig' && styles.activeSpeciesText]}>Pig</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Vaccine Name *</Text>
                        <View style={styles.inputContainer}>
                            <Syringe size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Newcastle Disease"
                                value={vaccineName}
                                onChangeText={setVaccineName}
                                editable={!isLoading && isAuthenticated}
                            />
                        </View>
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <View style={styles.dateTimeHeader}>
                                <Text style={styles.label}>Scheduled Date *</Text>
                                <TouchableOpacity onPress={setToday} disabled={isLoading || !isAuthenticated}>
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
                                    editable={!isLoading && isAuthenticated}
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                            <View style={styles.dateTimeHeader}>
                                <Text style={styles.label}>Time *</Text>
                                <TouchableOpacity onPress={setCurrentTime} disabled={isLoading || !isAuthenticated}>
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
                                    editable={!isLoading && isAuthenticated}
                                    keyboardType="numbers-and-punctuation"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Administration Method</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Drinking Water, Injection"
                            value={method}
                            onChangeText={setMethod}
                            editable={!isLoading && isAuthenticated}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Batch number, dosage, instructions, etc."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={4}
                            editable={!isLoading && isAuthenticated}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (isLoading || !isAuthenticated) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={isLoading || !isAuthenticated}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={styles.loadingText}>Scheduling...</Text>
                            </View>
                        ) : !isAuthenticated ? (
                            <Text style={styles.submitButtonText}>Login Required</Text>
                        ) : (
                            <>
                                <Save size={20} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>Schedule Vaccination</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Debug buttons - remove in production */}
                    <View style={styles.debugContainer}>
                        <TouchableOpacity
                            style={styles.debugActionButton}
                            onPress={manualTokenInput}
                        >
                            <Text style={styles.debugActionText}>Manual Token Input</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.debugActionButton, { marginLeft: 12 }]}
                            onPress={() => {
                                AsyncStorage.removeItem('userToken');
                                setIsAuthenticated(false);
                                Alert.alert("Token Cleared", "Authentication token removed.");
                            }}
                        >
                            <Text style={styles.debugActionText}>Clear Token</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>💡 Information</Text>
                        <Text style={styles.infoText}>
                            • Date format: YYYY-MM-DD (e.g., 2024-01-15){'\n'}
                            • Time format: 24-hour HH:MM (e.g., 14:30){'\n'}
                            • Click "Today" and "Now" for quick setup{'\n'}
                            • Required fields are marked with *
                        </Text>
                    </View>

                    <Text style={styles.requiredNote}>* Required fields</Text>

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
        fontFamily: 'Inter-Bold',
    },
    debugButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    debugButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    authWarning: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    authWarningText: {
        fontSize: 16,
        color: '#92400E',
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    loginButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        fontFamily: 'Inter-SemiBold',
    },
    speciesContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 28,
    },
    speciesCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    activeSpecies: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    speciesEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    speciesText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        fontFamily: 'Inter-SemiBold',
    },
    activeSpeciesText: {
        color: '#3B82F6',
    },
    formGroup: {
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dateTimeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickSetButton: {
        fontSize: 14,
        color: '#3B82F6',
        fontFamily: 'Inter-Medium',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 20,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#93C5FD',
        shadowColor: '#93C5FD',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
        fontFamily: 'Inter-Bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    debugContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 16,
    },
    debugActionButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    debugActionText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'Inter-Medium',
    },
    infoBox: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#BAE6FD',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0369A1',
        marginBottom: 10,
        fontFamily: 'Inter-Bold',
    },
    infoText: {
        fontSize: 14,
        color: '#0C4A6E',
        lineHeight: 22,
        fontFamily: 'Inter-Regular',
    },
    requiredNote: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
});