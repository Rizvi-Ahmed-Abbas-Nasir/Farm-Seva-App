import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 16;
const CONTAINER_PADDING = 20;
// Calculate card width: (Screen Width - (2 * Padding) - (Gap * (Columns - 1))) / Columns
const ITEM_WIDTH = (width - (CONTAINER_PADDING * 2) - GAP) / COLUMN_COUNT;

type ActionItem = {
    id: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
    route: string;
    colors: [string, string];
    height?: number; // Optional height for specialized cards
};

const actions: ActionItem[] = [
    {
        id: 'checkup',
        label: 'Add Checkup',
        icon: 'plus-circle',
        route: '/addCheckup',
        colors: ['#3B82F6', '#2563EB'], // Blue
    },
    {
        id: 'vaccine',
        label: 'Vaccination',
        icon: 'shield',
        route: '/addVaccination',
        colors: ['#10B981', '#059669'], // Emerald
    },
    {
        id: 'schemes',
        label: 'Gov Schemes',
        icon: 'file-text',
        route: '/(tabs)/govSchemes',
        colors: ['#F59E0B', '#D97706'], // Amber
    },
    {
        id: 'vet',
        label: 'Smart Vet',
        icon: 'activity',
        route: '/(tabs)/smartVet',
        colors: ['#8B5CF6', '#7C3AED'], // Violet
    },
    {
        id: 'alerts',
        label: 'Alerts',
        icon: 'bell',
        route: '/(tabs)/alerts',
        colors: ['#EF4444', '#DC2626'], // Red
    },
    {
        id: 'env',
        label: 'Environment',
        icon: 'cloud',
        route: '/(tabs)/environment',
        colors: ['#06B6D4', '#0891B2'], // Cyan
    },
];

export function QuickActions() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.grid}>
                {actions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        activeOpacity={0.9}
                        style={[styles.card, { width: ITEM_WIDTH }]}
                        onPress={() => router.push(action.route as any)}
                    >
                        <LinearGradient
                            colors={action.colors}
                            style={styles.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.iconCircle}>
                                <Feather name={action.icon} size={28} color={action.colors[1]} />
                            </View>
                            <Text style={styles.label}>{action.label}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: CONTAINER_PADDING,
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
    },
    card: {
        height: 110,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
});
