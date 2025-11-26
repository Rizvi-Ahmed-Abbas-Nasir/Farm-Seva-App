import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Syringe, Thermometer, Heart, CircleAlert as AlertCircle, Calendar } from 'lucide-react-native';

export default function HealthScreen() {
  const upcomingVaccinations = [
    { animal: 'Pigs - Pen 3', vaccine: 'FMD Booster', date: 'Today', urgent: true },
    { animal: 'Broilers - House 2', vaccine: 'Newcastle Disease', date: 'Tomorrow', urgent: true },
    { animal: 'Layers - Cage 5', vaccine: 'Infectious Bronchitis', date: 'Dec 28', urgent: false },
  ];

  const healthAlerts = [
    { type: 'High Temperature', location: 'Pig Pen 2', severity: 'high', time: '2 hours ago' },
    { type: 'Respiratory Symptoms', location: 'Broiler House 1', severity: 'medium', time: '5 hours ago' },
    { type: 'Egg Drop', location: 'Layer Cage 3', severity: 'low', time: '1 day ago' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Animal Health</Text>
        <Text style={styles.subtitle}>Monitor health status and vaccination schedules</Text>
      </View>

      {/* Health Overview Cards */}
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Heart size={24} color="#10B981" />
          <Text style={styles.overviewValue}>98.9%</Text>
          <Text style={styles.overviewLabel}>Healthy Animals</Text>
        </View>
        <View style={styles.overviewCard}>
          <Thermometer size={24} color="#F59E0B" />
          <Text style={styles.overviewValue}>37.2°C</Text>
          <Text style={styles.overviewLabel}>Avg Temperature</Text>
        </View>
        <View style={styles.overviewCard}>
          <Syringe size={24} color="#3B82F6" />
          <Text style={styles.overviewValue}>85%</Text>
          <Text style={styles.overviewLabel}>Vaccination Rate</Text>
        </View>
      </View>

      {/* Upcoming Vaccinations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Upcoming Vaccinations</Text>
        </View>
        {upcomingVaccinations.map((vaccination, index) => (
          <TouchableOpacity key={index} style={styles.vaccinationItem}>
            <View style={styles.vaccinationContent}>
              <Text style={styles.vaccinationAnimal}>{vaccination.animal}</Text>
              <Text style={styles.vaccinationVaccine}>{vaccination.vaccine}</Text>
              <Text style={[
                styles.vaccinationDate, 
                { color: vaccination.urgent ? '#EF4444' : '#6B7280' }
              ]}>
                {vaccination.date}
              </Text>
            </View>
            {vaccination.urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Health Alerts</Text>
        </View>
        {healthAlerts.map((alert, index) => (
          <TouchableOpacity key={index} style={styles.alertItem}>
            <View style={[styles.alertIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertType}>{alert.type}</Text>
              <Text style={styles.alertLocation}>{alert.location}</Text>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
            <View style={styles.alertArrow}>
              <Text style={styles.arrowText}>→</Text>
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
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  overviewRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  overviewCard: {
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
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  vaccinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vaccinationContent: {
    flex: 1,
  },
  vaccinationAnimal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  vaccinationVaccine: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
    marginTop: 2,
  },
  vaccinationDate: {
    fontSize: 12,
    fontWeight: 'normal',
    marginTop: 4,
  },
  urgentBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertLocation: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
    marginTop: 2,
  },
  alertTime: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#9CA3AF',
    marginTop: 4,
  },
  alertArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});