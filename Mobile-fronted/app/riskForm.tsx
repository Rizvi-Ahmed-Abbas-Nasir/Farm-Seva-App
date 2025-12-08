import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RiskForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        farmName: '',
        species: '',
        herdSize: '',
        state: '',
        district: '',
        housingType: '',
        visitorControl: '',
        deadAnimalDisposal: '',
        perimeterFencing: '',
        vehicleHygiene: '',
        wildBirdContact: '',
        ventilationQuality: '',
        temperatureControl: '',
        feedStorage: '',
        waterSource: '',
        cleaningFrequency: '',
        recordKeeping: '',
        currentHealthStatus: '',
        vaccinationSchedule: '',
        suddenDeaths: '',
        healthObservations: ''
    });

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Get auth token from AsyncStorage
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert('Error', 'Please log in to submit a risk assessment');
                setLoading(false);
                return;
            }

            // Send data to backend to process with Gemini
            const response = await axios.post(`${API_URL}/risk/assess`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                // Show success message
                Alert.alert(
                    "✅ Risk Assessment Complete",
                    `Score: ${response.data.overallScore}/100 | Level: ${response.data.overallLevel}\n\nNavigating to results...`,
                    [
                        {
                            text: "View Now",
                            onPress: () => {
                                // Navigate to alerts with the result
                                router.push({
                                    pathname: "/(tabs)/alerts",
                                    params: { assessmentResult: JSON.stringify(response.data) }
                                });
                            }
                        }
                    ],
                    { cancelable: false }
                );

                // Auto-navigate after 2 seconds
                setTimeout(() => {
                    router.push({
                        pathname: "/(tabs)/alerts",
                        params: { assessmentResult: JSON.stringify(response.data) }
                    });
                }, 2000);
            }
        } catch (error) {
            console.error("Risk assessment error:", error);
            Alert.alert("Error", "Failed to generate risk assessment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <View style={styles.backButtonContainer}>
                            <Feather name="arrow-left" size={20} color="#111827" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.headerIconContainer}>
                                <Feather name="shield" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.headerTitle}>Risk Assessment</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Evaluate your farm's biosecurity</Text>
                    </View>
                    <View style={styles.headerDecoration} />
                </LinearGradient>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Farm Details Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Feather name="home" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.sectionTitle}>Farm Details</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Farm Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.farmName}
                                onChangeText={(text) => handleChange('farmName', text)}
                                placeholder="Enter farm name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                                <Text style={styles.label}>Species</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.species}
                                    onChangeText={(text) => handleChange('species', text)}
                                    placeholder="e.g. Poultry, Cattle"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                                <Text style={styles.label}>Herd/Flock Size</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.herdSize}
                                    onChangeText={(text) => handleChange('herdSize', text)}
                                    placeholder="Number of animals"
                                    keyboardType="numeric"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                                <Text style={styles.label}>State</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.state}
                                    onChangeText={(text) => handleChange('state', text)}
                                    placeholder="State"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                                <Text style={styles.label}>District</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.district}
                                    onChangeText={(text) => handleChange('district', text)}
                                    placeholder="District"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Biosecurity Infrastructure */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                                <Feather name="shield" size={20} color="#D97706" />
                            </View>
                            <Text style={styles.sectionTitle}>Biosecurity Infrastructure</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Housing Type</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.housingType}
                                onChangeText={(text) => handleChange('housingType', text)}
                                placeholder="e.g. Open, Closed, Cage"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Visitor Control</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.visitorControl}
                                onChangeText={(text) => handleChange('visitorControl', text)}
                                placeholder="Describe visitor restrictions"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Dead Animal Disposal</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.deadAnimalDisposal}
                                onChangeText={(text) => handleChange('deadAnimalDisposal', text)}
                                placeholder="Method of disposal"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Perimeter Fencing</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.perimeterFencing}
                                onChangeText={(text) => handleChange('perimeterFencing', text)}
                                placeholder="Yes/No, Condition"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vehicle & Equipment Hygiene</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.vehicleHygiene}
                                onChangeText={(text) => handleChange('vehicleHygiene', text)}
                                placeholder="Cleaning protocols"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Wild Bird / Stray Contact</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.wildBirdContact}
                                onChangeText={(text) => handleChange('wildBirdContact', text)}
                                placeholder="Risk level or prevention"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Operations & Environment */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#DCFCE7' }]}>
                                <Feather name="wind" size={20} color="#10B981" />
                            </View>
                            <Text style={styles.sectionTitle}>Operations & Environment</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ventilation Quality</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.ventilationQuality}
                                onChangeText={(text) => handleChange('ventilationQuality', text)}
                                placeholder="Good, Poor, etc."
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Temperature Control</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.temperatureControl}
                                onChangeText={(text) => handleChange('temperatureControl', text)}
                                placeholder="Methods used"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Feed Storage</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.feedStorage}
                                onChangeText={(text) => handleChange('feedStorage', text)}
                                placeholder="Storage conditions"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Water Source</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.waterSource}
                                onChangeText={(text) => handleChange('waterSource', text)}
                                placeholder="Source and quality"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Cleaning Frequency</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cleaningFrequency}
                                onChangeText={(text) => handleChange('cleaningFrequency', text)}
                                placeholder="Daily, Weekly, etc."
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Record Keeping</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.recordKeeping}
                                onChangeText={(text) => handleChange('recordKeeping', text)}
                                placeholder="Digital, Manual, None"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Current Health Status */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                                <Feather name="heart" size={20} color="#EF4444" />
                            </View>
                            <Text style={styles.sectionTitle}>Current Health Status</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Current Health Status</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.currentHealthStatus}
                                onChangeText={(text) => handleChange('currentHealthStatus', text)}
                                placeholder="General overview"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vaccination Schedule</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.vaccinationSchedule}
                                onChangeText={(text) => handleChange('vaccinationSchedule', text)}
                                placeholder="Up to date?"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Sudden Deaths (Last 30 Days)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.suddenDeaths}
                                onChangeText={(text) => handleChange('suddenDeaths', text)}
                                placeholder="Number of deaths"
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Health Observations</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.healthObservations}
                                onChangeText={(text) => handleChange('healthObservations', text)}
                                placeholder="Any specific symptoms or notes"
                                multiline
                                numberOfLines={4}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#EF4444', '#DC2626']}
                                style={styles.submitButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Feather name="shield" size={20} color="#FFFFFF" />
                                        <Text style={styles.submitButtonText}>Calculate Risk Score</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Feather name="arrow-left" size={18} color="#6B7280" />
                            <Text style={styles.cancelButtonText}>Back to Dashboard</Text>
                        </TouchableOpacity>
                    </View>

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
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
        marginBottom: 20,
    },
    headerGradient: {
        flex: 1,
        position: 'relative',
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 20,
        zIndex: 10,
    },
    backButtonContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        marginTop: 8,
        paddingRight: 60,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 6,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginLeft: 60,
    },
    headerDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FEE2E2',
        opacity: 0.4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    sectionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    inputGroup: {
        marginBottom: 20,
        width: '100%',
    },
    inputGroupHalf: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
        width: '100%',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    footer: {
        gap: 12,
        marginTop: 20,
        paddingHorizontal: 0,
        width: '100%',
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        width: '100%',
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
        width: '100%',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
});
