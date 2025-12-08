import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { ChevronDown, Globe } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
    const { language, setLanguage, t } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);

    const languages = [
        { code: 'en' as const, name: 'English', nativeName: 'English' },
        { code: 'hi' as const, name: 'Hindi', nativeName: 'हिंदी' },
        { code: 'mr' as const, name: 'Marathi', nativeName: 'मराठी' },
    ];

    const currentLanguage = languages.find(lang => lang.code === language);

    const handleLanguageChange = async (langCode: 'en' | 'hi' | 'mr') => {
        await setLanguage(langCode);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Globe size={18} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.selectedText}>{currentLanguage?.nativeName}</Text>
                <ChevronDown size={16} color="#10B981" strokeWidth={2.5} />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Globe size={24} color="#10B981" strokeWidth={2.5} />
                            <Text style={styles.modalTitle}>{t('language.select')}</Text>
                        </View>

                        <ScrollView style={styles.languageList}>
                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.languageOption,
                                        language === lang.code && styles.languageOptionActive,
                                    ]}
                                    onPress={() => handleLanguageChange(lang.code)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.languageInfo}>
                                        <Text style={[
                                            styles.languageName,
                                            language === lang.code && styles.languageNameActive
                                        ]}>
                                            {lang.nativeName}
                                        </Text>
                                        <Text style={styles.languageSubtext}>{lang.name}</Text>
                                    </View>
                                    {language === lang.code && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1.5,
        borderColor: '#10B981',
    },
    selectedText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    languageList: {
        padding: 12,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
    },
    languageOptionActive: {
        backgroundColor: '#ECFDF5',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    languageNameActive: {
        color: '#10B981',
    },
    languageSubtext: {
        fontSize: 13,
        color: '#6B7280',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});
