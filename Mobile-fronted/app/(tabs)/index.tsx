import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MetricCard } from '@/components/MetricCard';
import { QuickStats } from '@/components/QuickStats';
import { LineChart, BarChart } from "react-native-gifted-charts";

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Farm Dashboard</Text>
        <Text style={styles.subtitle}>Good morning, Rizvi! Here's your farm overview</Text>
      </View>

      {/* Metric Cards Row 1 */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total Animals"
          value="2,847"
          change="+12 this week"
          changeType="positive"
          icon="users"
        />
        <MetricCard
          title="Mortality Rate"
          value="1.1%"
          change="-0.2% vs last week"
          changeType="positive"
          icon="trending-down"
        />
      </View>

      {/* Metric Cards Row 2 */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="Feed Consumed"
          value="1,050 kg"
          change="Today"
          changeType="neutral"
          icon="wheat"
        />
        <MetricCard
          title="Disease Cases"
          value="3 Active"
          change="2 resolved today"
          changeType="positive"
          icon="shield-alert"
        />
      </View>

      {/* Quick Stats */}
      <QuickStats />

      {/* Line Chart */}
      <View style={[styles.chartSection, { alignItems: "center" }]}>
        <Text style={styles.sectionTitle}>Mortality Trends (7 Days)</Text>

       <LineChart
  data={[
    { value: 2, label: "Mon" },
    { value: 3, label: "Tue" },
    { value: 1, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 2, label: "Fri" },
    { value: 3, label: "Sat" },
    { value: 2, label: "Sun" },
  ]}
  curved
  thickness={4}
  color="#10B981"
  
  /* 👇 ENABLE Y-AXIS TEXT */
  yAxisTextStyle={{ color: "#6B7280", fontSize: 12 }}
  
  hideRules={false}
  showVerticalLines={false}
  spacing={50}
  initialSpacing={30}
  dataPointsColor="#065F46"
  dataPointsRadius={5}
  startFillColor="#10B981"
  endFillColor="#10B98105"
  startOpacity={0.25}
  endOpacity={0.01}
  areaChart
  xAxisColor="#E5E7EB"
  xAxisThickness={1}
  xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 12 }}
/>

      </View>

      {/* Bar Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Feed Distribution</Text>

        <BarChart
          barWidth={40}
          barBorderRadius={8}
          frontColor="#3B82F6"
          data={[
            { value: 40, label: "Morning" },
            { value: 30, label: "Noon" },
            { value: 50, label: "Evening" },
          ]}
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
});
