import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MetricCard } from '@/components/MetricCard';
import { QuickStats } from '@/components/QuickStats';
import { ChartBar as BarChart3, TrendingUp, Users, Activity } from 'lucide-react-native';

export default function DashboardScreen() {

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Farm Dashboard</Text>
        <Text style={styles.subtitle}>Good morning, Rizvi! Here's your farm overview</Text>
      </View>

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

      <QuickStats />

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Mortality Trends (7 Days)</Text>
        <View style={styles.chartPlaceholder}>
          <TrendingUp size={48} color="#10B981" />
          <Text style={styles.placeholderText}>Chart will load here</Text>
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Feed Distribution</Text>
        <View style={styles.chartPlaceholder}>
          <BarChart3 size={48} color="#3B82F6" />
          <Text style={styles.placeholderText}>Chart will load here</Text>
        </View>
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
    fontWeight: 'normal',
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
  chartPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});