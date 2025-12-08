import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../translations/en.json';
import hi from '../translations/hi.json';
import mr from '../translations/mr.json';

type Language = 'en' | 'hi' | 'mr';

type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string) => string;
    translations: Translations;
}

const translations: Record<Language, Translations> = {
    en,
    hi,
    mr,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@farm_seva_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language preference on mount
    useEffect(() => {
        loadLanguagePreference();
    }, []);

    const loadLanguagePreference = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi' || savedLanguage === 'mr')) {
                setLanguageState(savedLanguage as Language);
            }
        } catch (error) {
            console.error('Error loading language preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    // Translation function with nested key support (e.g., "dashboard.greeting")
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found
                value = translations.en;
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Return key itself if not found
                    }
                }
                break;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    if (isLoading) {
        return null; // Or a loading screen
    }

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                t,
                translations: translations[language],
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
