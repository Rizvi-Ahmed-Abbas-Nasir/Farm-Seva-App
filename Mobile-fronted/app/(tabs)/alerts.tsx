import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, Shield, Bell, Clock, MapPin, TrendingUp } from 'lucide-react-native';

export default function AlertsScreen() {
  const criticalAlerts = [
    {
      id: 1,
      type: 'Disease Outbreak Risk',
      message: 'High mortality rate detected in Pig Pen 2',
      location: 'Pig Pen 2',
      time: '2 hours ago',
      severity: 'critical',
      status: 'active'
    },
    {
      id: 2,
      type: 'Feed Stock Critical',
      message: 'Layer feed stock below 15% threshold',
      location: 'Storage Area',
      time: '3 hours ago',
      severity: 'critical',
      status: 'active'
    }
  ];

  const warningAlerts = [
    {
      id: 3,
      type: 'Environmental Alert',
      message: 'Ammonia levels elevated in Broiler House 1',
      location: 'Broiler House 1',
      time: '5 hours ago',
      severity: 'warning',
      status: 'investigating'
    },
    {
      id: 4,
      type: 'Vaccination Due',
      message: 'FMD booster vaccination overdue',
      location: 'Pig Pen 3',
      time: '1 day ago',
      severity: 'warning',
      status: 'scheduled'
    }
  ];

  const recentAlerts = [
    {
      id: 5,
      type: 'Feed Consumption',
      message: 'Feed efficiency below target in Broiler House 2',
      location: 'Broiler House 2',
      time: '2 days ago',
      severity: 'info',
      status: 'resolved'
    },
    {
      id: 6,
      type: 'Temperature Alert',
      message: 'Temperature spike detected and corrected',
      location: 'Layer Cage Area',
      time: '3 days ago',
      severity: 'info',
      status: 'resolved'
    }
  ];

  const riskFactors = [
    { factor: 'Disease Outbreak Risk', level: 'High', trend: 'up' },
    { factor: 'Feed Security', level: 'Critical', trend: 'up' },
    { factor: 'Environmental Stability', level: 'Medium', trend: 'stable' },
    { factor: 'Biosecurity Compliance', level: 'Good', trend: 'down' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#EF4444';
      case 'investigating': return '#F59E0B';
      case 'scheduled': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#F59E0B';
      case 'good': return '#10B981';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} color="#EF4444" />;
      case 'down': return <TrendingUp size={16} color="#10B981" style={{ transform: [{ rotate: '180deg' }] }} />;
      case 'stable': return <View style={styles.stableTrend} />;
      default: return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Risk & Alerts</Text>
        <Text style={styles.subtitle}>Monitor farm risks and active alerts</Text>
      </View>

      {/* Alert Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={styles.summaryValue}>2</Text>
          <Text style={styles.summaryLabel}>Critical</Text>
        </View>
        <View style={styles.summaryCard}>
          <Shield size={24} color="#F59E0B" />
          <Text style={styles.summaryValue}>2</Text>
          <Text style={styles.summaryLabel}>Warnings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Bell size={24} color="#10B981" />
          <Text style={styles.summaryValue}>6</Text>
          <Text style={styles.summaryLabel}>Total Today</Text>
        </View>
      </View>

      {/* Risk Assessment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Assessment</Text>
        {riskFactors.map((risk, index) => (
          <View key={index} style={styles.riskItem}>
            <View style={styles.riskContent}>
              <Text style={styles.riskFactor}>{risk.factor}</Text>
              <View style={styles.riskDetails}>
                <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(risk.level) + '20' }]}>
                  <Text style={[styles.riskLevel, { color: getRiskLevelColor(risk.level) }]}>
                    {risk.level}
                  </Text>
                </View>
                <View style={styles.trendContainer}>
                  {getTrendIcon(risk.trend)}
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Critical Alerts</Text>
          {criticalAlerts.map((alert) => (
            <TouchableOpacity key={alert.id} style={[styles.alertItem, styles.criticalAlert]}>
              <View style={styles.alertIcon}>
                <AlertTriangle size={20} color="#EF4444" />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>{alert.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(alert.status) }]}>
                      {alert.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <View style={styles.alertFooter}>
                  <Text style={styles.alertLocation}>
                    <MapPin size={12} color="#6B7280" /> {alert.location}
                  </Text>
                  <Text style={styles.alertTime}>
                    <Clock size={12} color="#6B7280" /> {alert.time}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>Warnings</Text>
          {warningAlerts.map((alert) => (
            <TouchableOpacity key={alert.id} style={[styles.alertItem, styles.warningAlert]}>
              <View style={styles.alertIcon}>
                <Shield size={20} color="#F59E0B" />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>{alert.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(alert.status) }]}>
                      {alert.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <View style={styles.alertFooter}>
                  <Text style={styles.alertLocation}>
                    <MapPin size={12} color="#6B7280" /> {alert.location}
                  </Text>
                  <Text style={styles.alertTime}>
                    <Clock size={12} color="#6B7280" /> {alert.time}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {recentAlerts.map((alert) => (
          <TouchableOpacity key={alert.id} style={styles.alertItem}>
            <View style={styles.alertIcon}>
              <Bell size={20} color="#6B7280" />
            </View>
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertType}>{alert.type}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(alert.status) }]}>
                    {alert.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <View style={styles.alertFooter}>
                <Text style={styles.alertLocation}>
                  <MapPin size={12} color="#6B7280" /> {alert.location}
                </Text>
                <Text style={styles.alertTime}>
                  <Clock size={12} color="#6B7280" /> {alert.time}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
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
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  riskItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  riskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskFactor: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  riskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskLevel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  trendContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stableTrend: {
    width: 12,
    height: 2,
    backgroundColor: '#6B7280',
    borderRadius: 1,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    paddingLeft: 16,
  },
  criticalAlert: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  warningAlert: {
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLocation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
  },
});