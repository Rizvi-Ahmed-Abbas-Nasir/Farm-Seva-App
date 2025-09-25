import { View, Text, StyleSheet } from 'react-native';
import { Circle } from 'lucide-react-native';

export function QuickStats() {
  const stats = [
    { label: 'Pigs', count: 1547, color: '#10B981' },
    { label: 'Broilers', count: 890, color: '#3B82F6' },
    { label: 'Layers', count: 410, color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Animal Distribution</Text>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Circle size={12} color={stat.color} fill={stat.color} />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statCount}>{stat.count.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
});