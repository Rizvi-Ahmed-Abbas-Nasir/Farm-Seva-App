import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

type AnimalType = 'pig' | 'poultry';

export default function AnalyticsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AnimalType>('pig');

    const getThemeColor = () => activeTab === 'pig' ? '#3B82F6' : '#F59E0B';
    const getLightColor = () => activeTab === 'pig' ? '#EFF6FF' : '#FFFBEB';

    // Mock Data Generators based on Animal Type
    const getHealthData = () => ({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
            {
                data: activeTab === 'pig'
                    ? [2, 4, 3, 1, 5, 2]
                    : [5, 8, 4, 10, 6, 8],
                color: (opacity = 1) => activeTab === 'pig'
                    ? `rgba(59, 130, 246, ${opacity})`
                    : `rgba(245, 158, 11, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Checkups"]
    });

    const getVaccinationData = () => {
        const data = activeTab === 'pig'
            ? [0.8, 0.6, 0.4]
            : [0.9, 0.75, 0.5];
        return {
            labels: ["FMD", "CSF", "Swine Flu"], // Labels for Pig, need dynamic for Poultry really but simplifing for demo
            data: data
        };
    };

    // Poultry specific labels for vac
    const vaccinationLabels = activeTab === 'pig'
        ? ["FMD", "CSF", "Swine Flu"]
        : ["Newcastle", "Fowl Pox", "IBD"];

    const getRationData = () => ({
        labels: ["W1", "W2", "W3", "W4"],
        datasets: [
            {
                data: activeTab === 'pig'
                    ? [100, 120, 115, 130]
                    : [50, 60, 55, 65]
            }
        ]
    });

    const animalStats = activeTab === 'pig'
        ? [
            { name: "Sows", population: 15, color: "#3B82F6", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Boars", population: 2, color: "#60A5FA", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Piglets", population: 45, color: "#93C5FD", legendFontColor: "#7F7F7F", legendFontSize: 12 },
        ]
        : [
            { name: "Layers", population: 200, color: "#F59E0B", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Broilers", population: 150, color: "#FBBF24", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Chicks", population: 100, color: "#FDE68A", legendFontColor: "#7F7F7F", legendFontSize: 12 },
        ];

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => getThemeColor(),
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Feather name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Farm Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pig' && styles.activeTabPig]}
                    onPress={() => setActiveTab('pig')}
                >
                    <MaterialCommunityIcons
                        name="pig"
                        size={24}
                        color={activeTab === 'pig' ? "white" : "#6B7280"}
                    />
                    <Text style={[styles.tabText, activeTab === 'pig' && styles.activeTabText]}>
                        Pig Farm
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'poultry' && styles.activeTabPoultry]}
                    onPress={() => setActiveTab('poultry')}
                >
                    <MaterialCommunityIcons
                        name="egg-easter"
                        size={24}
                        color={activeTab === 'poultry' ? "white" : "#6B7280"}
                    />
                    <Text style={[styles.tabText, activeTab === 'poultry' && styles.activeTabText]}>
                        Poultry Farm
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Total Animals Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Livestock Distribution</Text>
                    <PieChart
                        data={animalStats}
                        width={CHART_WIDTH}
                        height={200}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 0]}
                        absolute
                    />
                </View>

                {/* Health Checkups */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Health Checkup Trends</Text>
                    <LineChart
                        data={getHealthData()}
                        width={CHART_WIDTH - 40}
                        height={220}
                        chartConfig={{
                            ...chartConfig,
                            strokeWidth: 3,
                        }}
                        bezier
                        style={styles.chart}
                        withDots={true}
                        withInnerLines={true}
                    />
                </View>

                {/* Vaccinations */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Vaccination Coverage</Text>
                    <ProgressChart
                        data={getVaccinationData()}
                        width={CHART_WIDTH - 40}
                        height={180}
                        strokeWidth={16}
                        radius={32}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => activeTab === 'pig'
                                ? `rgba(59, 130, 246, ${opacity})`
                                : `rgba(245, 158, 11, ${opacity})`,
                        }}
                        hideLegend={false}
                        style={styles.chart}
                    />
                    <View style={styles.legendContainer}>
                        {vaccinationLabels.map((label, index) => (
                            <View key={index} style={styles.legendItem}>
                                <View style={[
                                    styles.legendDot,
                                    { backgroundColor: getThemeColor(), opacity: 1 - (index * 0.2) }
                                ]} />
                                <Text style={styles.legendText}>{label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Rations */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Feed Consumption (Last 4 Weeks)</Text>
                    <Text style={styles.unitText}>in kg</Text>
                    <BarChart
                        data={getRationData()}
                        width={CHART_WIDTH - 40}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            ...chartConfig,
                            barPercentage: 0.7,
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                    />
                </View>

                {/* Gov Schemes */}
                <LinearGradient
                    colors={activeTab === 'pig' ? ['#EFF6FF', '#DBEAFE'] : ['#FFFBEB', '#FEF3C7']}
                    style={styles.schemeCard}
                >
                    <View style={styles.schemeHeader}>
                        <Feather name="file-text" size={24} color={getThemeColor()} />
                        <Text style={[styles.schemeTitle, { color: getThemeColor() }]}>Government Schemes</Text>
                    </View>
                    <View style={styles.schemeStats}>
                        <View style={styles.schemeStatItem}>
                            <Text style={[styles.schemeValue, { color: getThemeColor() }]}>3</Text>
                            <Text style={styles.schemeLabel}>Applied</Text>
                        </View>
                        <View style={styles.schemeDivider} />
                        <View style={styles.schemeStatItem}>
                            <Text style={[styles.schemeValue, { color: '#10B981' }]}>1</Text>
                            <Text style={styles.schemeLabel}>Approved</Text>
                        </View>
                        <View style={styles.schemeDivider} />
                        <View style={styles.schemeStatItem}>
                            <Text style={[styles.schemeValue, { color: '#6B7280' }]}>2</Text>
                            <Text style={styles.schemeLabel}>Pending</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeTabPig: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    activeTabPoultry: {
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: 'white',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        alignSelf: 'flex-start',
        width: '100%',
    },
    unitText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    schemeCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
    },
    schemeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    schemeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    schemeStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    schemeStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    schemeValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    schemeLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    schemeDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});
