import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MetricCard } from '@/components/MetricCard';
import { QuickStats } from '@/components/QuickStats';
import { LineChart, BarChart } from "react-native-gifted-charts";
import { Feather } from '@expo/vector-icons';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Farm Dashboard</Text>
          <Text style={styles.subtitle}>Good morning, Rizvi! Here's your farm overview</Text>
        </View>
        <View style={styles.headerDecoration} />
      </View>

      {/* Main Metrics */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total Animals"
          value="2,847"
          change="+12 this week"
          changeType="positive"
          icon="users"
          bgColor="#EEF2FF"
          iconColor="#6366F1"
        />
        <MetricCard
          title="Mortality Rate"
          value="1.1%"
          change="-0.2% vs last week"
          changeType="positive"
          icon="trending-down"
          bgColor="#ECFDF5"
          iconColor="#10B981"
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          title="Feed Consumed"
          value="1,050 kg"
          change="Today"
          changeType="neutral"
          icon="wheat"
          bgColor="#FEF3C7"
          iconColor="#F59E0B"
          textColor="#78350F"
        />
        <MetricCard
          title="Disease Cases"
          value="3 Active"
          change="2 resolved today"
          changeType="positive"
          icon="shield-alert"
          bgColor="#FEE2E2"
          iconColor="#EF4444"
          textColor="#7F1D1D"
        />
      </View>

      {/* Additional Metrics */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total Schemes"
          value="8 Active"
          change="2 pending approval"
          changeType="neutral"
          icon="file-text"
          bgColor="#E0E7FF"
          iconColor="#4F46E5"
        />
        <MetricCard
          title="Today's Weather"
          value="28°C"
          change="Partly Cloudy"
          changeType="neutral"
          icon="cloud"
          bgColor="#DBEAFE"
          iconColor="#3B82F6"
        />
      </View>

      <QuickStats />

      {/* Premium Weather Alerts Section */}
      <View style={styles.weatherSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Feather name="cloud-rain" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.sectionTitle}>Weather Alerts</Text>
        </View>
        
        <View style={styles.weatherCard}>
          <View style={styles.weatherDay}>
            <Text style={styles.weatherDayLabel}>TODAY</Text>
            <View style={styles.weatherInfo}>
              <View style={styles.weatherIconCircle}>
                <Feather name="sun" size={36} color="#F59E0B" />
              </View>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherTemp}>28°C / 22°C</Text>
                <Text style={styles.weatherDesc}>Partly Cloudy</Text>
              </View>
            </View>
            <View style={styles.alertBadge}>
              <Feather name="droplet" size={14} color="#3B82F6" />
              <Text style={styles.alertText}>60% Humidity</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.weatherDay}>
            <Text style={styles.weatherDayLabel}>TOMORROW</Text>
            <View style={styles.weatherInfo}>
              <View style={[styles.weatherIconCircle, { backgroundColor: '#F3F4F6' }]}>
                <Feather name="cloud-rain" size={36} color="#6B7280" />
              </View>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherTemp}>26°C / 20°C</Text>
                <Text style={styles.weatherDesc}>Light Rain Expected</Text>
              </View>
            </View>
            <View style={[styles.alertBadge, styles.alertWarning]}>
              <Feather name="alert-triangle" size={14} color="#F59E0B" />
              <Text style={[styles.alertText, { color: '#92400E' }]}>Cover feed storage</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Premium Productivity Tips Section */}
      <View style={styles.tipsSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: '#ECFDF5' }]}>
<Feather name="zap" size={22} color="#10B981" />
          </View>
          <Text style={styles.sectionTitle}>Productivity Tips</Text>
        </View>
        
        <View style={styles.tipCard}>
          <View style={[styles.tipIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <View style={styles.tipIconBackdrop} />
            <Feather name="check-circle" size={24} color="#10B981" strokeWidth={2.5} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Morning Feed Optimization</Text>
            <Text style={styles.tipDescription}>
              Increase morning feed by 5% to improve milk production during peak lactation period.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIconContainer, { backgroundColor: '#EFF6FF' }]}>
            <View style={[styles.tipIconBackdrop, { backgroundColor: '#DBEAFE' }]} />
            <Feather name="check-circle" size={24} color="#3B82F6" strokeWidth={2.5} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Health Monitoring</Text>
            <Text style={styles.tipDescription}>
              Schedule vaccination for 45 animals this week. Early prevention reduces disease cases by 30%.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIconContainer, { backgroundColor: '#F5F3FF' }]}>
            <View style={[styles.tipIconBackdrop, { backgroundColor: '#EDE9FE' }]} />
            <Feather name="check-circle" size={24} color="#8B5CF6" strokeWidth={2.5} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Weather Preparation</Text>
            <Text style={styles.tipDescription}>
              Rain expected tomorrow. Ensure proper drainage and shelter for all livestock areas.
            </Text>
          </View>
        </View>
      </View>

      {/* Premium Charts Section */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View style={styles.chartIconBadge}>
            <Feather name="trending-down" size={18} color="#10B981" />
          </View>
          <Text style={styles.chartTitle}>Mortality Trends (7 Days)</Text>
        </View>
        <View style={styles.chartContainer}>
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
            yAxisTextStyle={{ color: "#6B7280", fontSize: 12, fontWeight: '600' }}
            hideRules={false}
            showVerticalLines={false}
            spacing={50}
            initialSpacing={30}
            dataPointsColor="#065F46"
            dataPointsRadius={6}
            startFillColor="#10B981"
            endFillColor="#10B98105"
            startOpacity={0.3}
            endOpacity={0.01}
            areaChart
            xAxisColor="#E5E7EB"
            xAxisThickness={2}
            xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 12, fontWeight: '600' }}
          />
        </View>
      </View>

      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartIconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="bar-chart-2" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.chartTitle}>Feed Distribution</Text>
        </View>
        <View style={styles.chartContainer}>
          <BarChart
            barWidth={45}
            barBorderRadius={12}
            data={[
              { value: 40, label: "Morning", frontColor: "#F59E0B" },
              { value: 30, label: "Noon", frontColor: "#3B82F6" },
              { value: 50, label: "Evening", frontColor: "#8B5CF6" },
            ]}
            yAxisTextStyle={{ color: "#6B7280", fontSize: 12, fontWeight: '600' }}
            xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 12, fontWeight: '600' }}
            isAnimated
            animationDuration={800}
          />
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
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
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 1,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EEF2FF',
    opacity: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  weatherSection: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  weatherDay: {
    gap: 14,
  },
  weatherDayLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.5,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  weatherIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  weatherDetails: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  weatherDesc: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
    shadowColor: '#F59E0B',
  },
  alertText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
    borderRadius: 1,
  },
  tipsSection: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  tipIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  tipIconBackdrop: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  tipDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    fontWeight: '500',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  chartIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  chartContainer: {
    paddingVertical: 12,
  },
  footer: {
    height: 32,
  },
});