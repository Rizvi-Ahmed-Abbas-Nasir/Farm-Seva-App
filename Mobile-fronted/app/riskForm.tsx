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
import axios from 'axios';

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
            // Send data to backend to process with Gemini
            const response = await axios.post(`${API_URL}/risk/assess`, formData);

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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Risk Assessment Form</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                    {/* Farm Details Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Farm Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Farm Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.farmName}
                                onChangeText={(text) => handleChange('farmName', text)}
                                placeholder="Enter farm name"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Species</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.species}
                                    onChangeText={(text) => handleChange('species', text)}
                                    placeholder="e.g. Poultry, Cattle"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Herd/Flock Size</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.herdSize}
                                    onChangeText={(text) => handleChange('herdSize', text)}
                                    placeholder="Number of animals"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>State</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.state}
                                    onChangeText={(text) => handleChange('state', text)}
                                    placeholder="State"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>District</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.district}
                                    onChangeText={(text) => handleChange('district', text)}
                                    placeholder="District"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Biosecurity Infrastructure */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Biosecurity Infrastructure</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Housing Type</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.housingType}
                                onChangeText={(text) => handleChange('housingType', text)}
                                placeholder="e.g. Open, Closed, Cage"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Visitor Control</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.visitorControl}
                                onChangeText={(text) => handleChange('visitorControl', text)}
                                placeholder="Describe visitor restrictions"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Dead Animal Disposal</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.deadAnimalDisposal}
                                onChangeText={(text) => handleChange('deadAnimalDisposal', text)}
                                placeholder="Method of disposal"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Perimeter Fencing</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.perimeterFencing}
                                onChangeText={(text) => handleChange('perimeterFencing', text)}
                                placeholder="Yes/No, Condition"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vehicle & Equipment Hygiene</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.vehicleHygiene}
                                onChangeText={(text) => handleChange('vehicleHygiene', text)}
                                placeholder="Cleaning protocols"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Wild Bird / Stray Contact</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.wildBirdContact}
                                onChangeText={(text) => handleChange('wildBirdContact', text)}
                                placeholder="Risk level or prevention"
                            />
                        </View>
                    </View>

                    {/* Operations & Environment */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Operations & Environment</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ventilation Quality</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.ventilationQuality}
                                onChangeText={(text) => handleChange('ventilationQuality', text)}
                                placeholder="Good, Poor, etc."
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Temperature Control</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.temperatureControl}
                                onChangeText={(text) => handleChange('temperatureControl', text)}
                                placeholder="Methods used"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Feed Storage</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.feedStorage}
                                onChangeText={(text) => handleChange('feedStorage', text)}
                                placeholder="Storage conditions"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Water Source</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.waterSource}
                                onChangeText={(text) => handleChange('waterSource', text)}
                                placeholder="Source and quality"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Cleaning Frequency</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cleaningFrequency}
                                onChangeText={(text) => handleChange('cleaningFrequency', text)}
                                placeholder="Daily, Weekly, etc."
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Record Keeping</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.recordKeeping}
                                onChangeText={(text) => handleChange('recordKeeping', text)}
                                placeholder="Digital, Manual, None"
                            />
                        </View>
                    </View>

                    {/* Current Health Status */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Current Health Status</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Current Health Status</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.currentHealthStatus}
                                onChangeText={(text) => handleChange('currentHealthStatus', text)}
                                placeholder="General overview"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vaccination Schedule</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.vaccinationSchedule}
                                onChangeText={(text) => handleChange('vaccinationSchedule', text)}
                                placeholder="Up to date?"
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
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <CheckCircle size={20} color="#FFFFFF" />
                                    <Text style={styles.submitButtonText}>Calculate Risk Score</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                        >
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    footer: {
        gap: 12,
        marginTop: 20,
    },
    submitButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
});
