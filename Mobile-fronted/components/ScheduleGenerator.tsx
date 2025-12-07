import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Calendar, X, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ScheduleGeneratorProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: 'vaccination' | 'checkup';
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
    visible,
    onClose,
    onSuccess,
    type
}) => {
    const [animalType, setAnimalType] = useState<'pig' | 'poultry' | ''>('');
    const [breed, setBreed] = useState<'broiler' | 'layer' | ''>('');
    const [birthDate, setBirthDate] = useState('');
    const [animalName, setAnimalName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        // Validation
        if (!animalType) {
            Alert.alert('Error', 'Please select an animal type');
            return;
        }

        if (type === 'vaccination' && !birthDate) {
            Alert.alert('Error', 'Please enter birth date');
            return;
        }

        if (animalType === 'poultry' && !breed) {
            Alert.alert('Error', 'Please select poultry breed (Broiler or Layer)');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'Not authenticated');
                return;
            }

            const endpoint = type === 'vaccination'
                ? `${API_URL}/schedules/vaccination/generate`
                : `${API_URL}/schedules/checkup/generate`;

            const body = type === 'vaccination'
                ? {
                    animalType,
                    birthDate: birthDate || new Date().toISOString().split('T')[0],
                    breed: breed || 'standard'
                }
                : {
                    animalType,
                    startDate: new Date().toISOString().split('T')[0],
                    animalName: animalName || `${animalType} Health Check`
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Alert.alert(
                    'Success!',
                    `Generated ${result.count} ${type} schedules`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                onSuccess();
                                handleClose();
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to generate schedule');
            }
        } catch (error) {
            console.error('Error generating schedule:', error);
            Alert.alert('Error', 'Failed to generate schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAnimalType('');
        setBreed('');
        setBirthDate('');
        setAnimalName('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <LinearGradient
                        colors={type === 'vaccination' ? ['#3B82F6', '#2563EB'] : ['#10B981', '#059669']}
                        style={styles.header}
                    >
                        <View style={styles.headerContent}>
                            <Sparkles size={24} color="#FFFFFF" />
                            <Text style={styles.headerTitle}>
                                Auto-Generate {type === 'vaccination' ? 'Vaccinations' : 'Checkups'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Animal Type Selection */}
                        <Text style={styles.label}>Animal Type *</Text>
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[
                                    styles.optionButton,
                                    animalType === 'pig' && styles.optionButtonActive
                                ]}
                                onPress={() => setAnimalType('pig')}
                            >
                                <Text style={[
                                    styles.optionText,
                                    animalType === 'pig' && styles.optionTextActive
                                ]}>
                                    🐷 Pig
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.optionButton,
                                    animalType === 'poultry' && styles.optionButtonActive
                                ]}
                                onPress={() => setAnimalType('poultry')}
                            >
                                <Text style={[
                                    styles.optionText,
                                    animalType === 'poultry' && styles.optionTextActive
                                ]}>
                                    🐔 Poultry
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Breed Selection (for poultry) */}
                        {animalType === 'poultry' && (
                            <>
                                <Text style={styles.label}>Poultry Breed *</Text>
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            breed === 'broiler' && styles.optionButtonActive
                                        ]}
                                        onPress={() => setBreed('broiler')}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            breed === 'broiler' && styles.optionTextActive
                                        ]}>
                                            Broiler
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            breed === 'layer' && styles.optionButtonActive
                                        ]}
                                        onPress={() => setBreed('layer')}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            breed === 'layer' && styles.optionTextActive
                                        ]}>
                                            Layer
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* Birth Date (for vaccination) */}
                        {type === 'vaccination' && (
                            <>
                                <Text style={styles.label}>Birth Date *</Text>
                                <View style={styles.inputContainer}>
                                    <Calendar size={20} color="#6B7280" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD (e.g., 2025-01-01)"
                                        value={birthDate}
                                        onChangeText={setBirthDate}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                                <Text style={styles.hint}>
                                    Enter the animal's birth date to calculate vaccination schedule
                                </Text>
                            </>
                        )}

                        {/* Animal Name (for checkup) */}
                        {type === 'checkup' && (
                            <>
                                <Text style={styles.label}>Animal/Group Name (Optional)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., Pig Pen 1, Broiler House A"
                                    value={animalName}
                                    onChangeText={setAnimalName}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </>
                        )}

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>📋 What will be generated?</Text>
                            {type === 'vaccination' ? (
                                <>
                                    {animalType === 'pig' && (
                                        <>
                                            <Text style={styles.infoText}>✅ 7 automatic vaccinations will be scheduled:</Text>
                                            <Text style={styles.infoDetailText}>• Day 3: Iron Injection</Text>
                                            <Text style={styles.infoDetailText}>• Day 5: Vitamin & Mineral Supplement</Text>
                                            <Text style={styles.infoDetailText}>• Day 14: Mycoplasma (pneumonia)</Text>
                                            <Text style={styles.infoDetailText}>• Day 21: Circovirus (PCV2)</Text>
                                            <Text style={styles.infoDetailText}>• Day 28: E.coli, Clostridium</Text>
                                            <Text style={styles.infoDetailText}>• Day 42: PRRS</Text>
                                            <Text style={styles.infoDetailText}>• Day 56: Swine Fever</Text>
                                        </>
                                    )}
                                    {animalType === 'poultry' && breed === 'broiler' && (
                                        <>
                                            <Text style={styles.infoText}>✅ 6 automatic vaccinations will be scheduled:</Text>
                                            <Text style={styles.infoDetailText}>• Day 1: Marek's Disease</Text>
                                            <Text style={styles.infoDetailText}>• Day 5: Vitamin Supplement</Text>
                                            <Text style={styles.infoDetailText}>• Day 6: Newcastle + IB</Text>
                                            <Text style={styles.infoDetailText}>• Day 12: Gumboro (IBD)</Text>
                                            <Text style={styles.infoDetailText}>• Day 15: Coccidiosis</Text>
                                            <Text style={styles.infoDetailText}>• Day 20: Booster - Newcastle/IB</Text>
                                        </>
                                    )}
                                    {animalType === 'poultry' && breed === 'layer' && (
                                        <>
                                            <Text style={styles.infoText}>✅ 10 automatic vaccinations will be scheduled:</Text>
                                            <Text style={styles.infoDetailText}>• Day 1: Marek's Disease</Text>
                                            <Text style={styles.infoDetailText}>• Day 5: Vitamin Supplement</Text>
                                            <Text style={styles.infoDetailText}>• Day 6: Newcastle + IB</Text>
                                            <Text style={styles.infoDetailText}>• Day 12: Gumboro (IBD)</Text>
                                            <Text style={styles.infoDetailText}>• Day 28: Fowl Pox</Text>
                                            <Text style={styles.infoDetailText}>• Day 42: AE (Avian Encephalomyelitis)</Text>
                                            <Text style={styles.infoDetailText}>• Day 48: ND + IB booster</Text>
                                            <Text style={styles.infoDetailText}>• Day 84: Fowl Pox booster</Text>
                                            <Text style={styles.infoDetailText}>• Day 105: Inactivated ND + IB</Text>
                                            <Text style={styles.infoDetailText}>• Day 119: Deworming</Text>
                                        </>
                                    )}
                                    {!animalType && <Text style={styles.infoText}>Select an animal type to see vaccination schedule</Text>}
                                </>
                            ) : (
                                <>
                                    {animalType === 'pig' && (
                                        <>
                                            <Text style={styles.infoText}>✅ Recurring checkups for next 3 months:</Text>
                                            <Text style={styles.infoDetailText}>• Daily: Quick health observation</Text>
                                            <Text style={styles.infoDetailText}>• Weekly: Body condition & skin check</Text>
                                            <Text style={styles.infoDetailText}>• Monthly: Full health assessment</Text>
                                            <Text style={styles.infoHighlight}>📅 Weekly checkups every 7 days</Text>
                                        </>
                                    )}
                                    {animalType === 'poultry' && (
                                        <>
                                            <Text style={styles.infoText}>✅ Recurring checkups for next 3 months:</Text>
                                            <Text style={styles.infoDetailText}>• Daily: Eating, drinking, droppings</Text>
                                            <Text style={styles.infoDetailText}>• Weekly: Weight & litter quality</Text>
                                            <Text style={styles.infoDetailText}>• Monthly: Parasite & environment check</Text>
                                            <Text style={styles.infoHighlight}>📅 Weekly checkups every 7 days</Text>
                                        </>
                                    )}
                                    {!animalType && <Text style={styles.infoText}>Select an animal type to see checkup schedule</Text>}
                                </>
                            )}
                        </View>
                    </ScrollView>

                    {/* Generate Button */}
                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleGenerate}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={type === 'vaccination' ? ['#3B82F6', '#2563EB'] : ['#10B981', '#059669']}
                            style={styles.generateGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Sparkles size={20} color="#FFFFFF" />
                                    <Text style={styles.generateText}>Generate Schedule</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        marginTop: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    optionButtonActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    optionTextActive: {
        color: '#2563EB',
        fontWeight: '700',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    hint: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 8,
        fontStyle: 'italic',
    },
    infoBox: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#1E3A8A',
        lineHeight: 22,
        fontWeight: '600',
        marginBottom: 6,
    },
    infoDetailText: {
        fontSize: 13,
        color: '#1E3A8A',
        lineHeight: 20,
        fontWeight: '500',
        marginLeft: 8,
        marginBottom: 3,
    },
    infoHighlight: {
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 22,
        fontWeight: '700',
        marginTop: 8,
        backgroundColor: '#DBEAFE',
        padding: 8,
        borderRadius: 8,
    },
    generateButton: {
        margin: 24,
        marginTop: 0,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    generateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
    },
    generateText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
