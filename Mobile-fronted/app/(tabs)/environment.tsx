import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Thermometer, Droplets, Wind, Sun, Zap, Eye } from 'lucide-react-native';

export default function EnvironmentScreen() {
  const environmentData = [
    { 
      id: 'temperature', 
      label: 'Temperature', 
      value: '24.5°C', 
      status: 'normal',
      icon: 'thermometer',
      trend: '+0.3°C from yesterday'
    },
    { 
      id: 'humidity', 
      label: 'Humidity', 
      value: '65%', 
      status: 'normal',
      icon: 'droplets',
      trend: '-2% from yesterday'
    },
    { 
      id: 'airQuality', 
      label: 'Air Quality', 
      value: 'Good', 
      status: 'normal',
      icon: 'wind',
      trend: 'Stable'
    },
    { 
      id: 'lighting', 
      label: 'Light Level', 
      value: '320 lux', 
      status: 'normal',
      icon: 'sun',
      trend: 'Adequate'
    },
    { 
      id: 'ammonia', 
      label: 'Ammonia', 
      value: '12 ppm', 
      status: 'warning',
      icon: 'zap',
      trend: '+3 ppm from yesterday'
    },
    { 
      id: 'visibility', 
      label: 'Visibility', 
      value: '95%', 
      status: 'normal',
      icon: 'eye',
      trend: 'Clear conditions'
    },
  ];

  const sensorLocations = [
    { location: 'Pig Pen 1', temp: '23.8°C', humidity: '68%', airQuality: 'Good' },
    { location: 'Pig Pen 2', temp: '25.1°C', humidity: '62%', airQuality: 'Fair' },
    { location: 'Broiler House 1', temp: '24.2°C', humidity: '70%', airQuality: 'Good' },
    { location: 'Layer Cage Area', temp: '24.8°C', humidity: '63%', airQuality: 'Good' },
  ];

  const getIcon = (iconName: string, color: string) => {
    const iconProps = { size: 24, color };
    switch (iconName) {
      case 'thermometer': return <Thermometer {...iconProps} />;
      case 'droplets': return <Droplets {...iconProps} />;
      case 'wind': return <Wind {...iconProps} />;
      case 'sun': return <Sun {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'eye': return <Eye {...iconProps} />;
      default: return <Thermometer {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Environment Monitor</Text>
        <Text style={styles.subtitle}>Real-time environmental conditions</Text>
      </View>

      {/* Environment Overview */}
      <View style={styles.gridContainer}>
        {environmentData.map((data, index) => (
          <View key={data.id} style={styles.environmentCard}>
            <View style={styles.cardHeader}>
              {getIcon(data.icon, getStatusColor(data.status))}
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(data.status) }]} />
            </View>
            <Text style={styles.cardValue}>{data.value}</Text>
            <Text style={styles.cardLabel}>{data.label}</Text>
            <Text style={styles.cardTrend}>{data.trend}</Text>
          </View>
        ))}
      </View>

      {/* Location Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sensor Locations</Text>
        {sensorLocations.map((location, index) => (
          <View key={index} style={styles.locationItem}>
            <Text style={styles.locationName}>{location.location}</Text>
            <View style={styles.locationReadings}>
              <View style={styles.reading}>
                <Thermometer size={16} color="#EF4444" />
                <Text style={styles.readingValue}>{location.temp}</Text>
              </View>
              <View style={styles.reading}>
                <Droplets size={16} color="#3B82F6" />
                <Text style={styles.readingValue}>{location.humidity}</Text>
              </View>
              <View style={styles.reading}>
                <Wind size={16} color="#10B981" />
                <Text style={styles.readingValue}>{location.airQuality}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Environmental Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.recommendationItem}>
          <View style={styles.recommendationIcon}>
            <Zap size={20} color="#F59E0B" />
          </View>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Ammonia Level Alert</Text>
            <Text style={styles.recommendationDescription}>
              Consider increasing ventilation in affected areas to reduce ammonia concentration.
            </Text>
          </View>
        </View>
        <View style={styles.recommendationItem}>
          <View style={styles.recommendationIcon}>
            <Wind size={20} color="#10B981" />
          </View>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Air Quality Good</Text>
            <Text style={styles.recommendationDescription}>
              Current ventilation settings are optimal. Maintain current airflow levels.
            </Text>
          </View>
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
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  environmentCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  cardTrend: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
  locationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  locationReadings: {
    flexDirection: 'row',
    gap: 16,
  },
  reading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readingValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});