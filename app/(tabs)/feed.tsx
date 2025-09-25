import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Wheat, Package, TrendingUp, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { ProgressBar } from '@/components/ProgressBar';

export default function FeedScreen() {
  const feedStock = [
    { type: 'Pig Feed (Starter)', current: 2400, total: 5000, unit: 'kg', alertLevel: 'normal' },
    { type: 'Pig Feed (Grower)', current: 800, total: 4000, unit: 'kg', alertLevel: 'low' },
    { type: 'Broiler Feed', current: 3200, total: 6000, unit: 'kg', alertLevel: 'normal' },
    { type: 'Layer Feed', current: 450, total: 3000, unit: 'kg', alertLevel: 'critical' },
  ];

  const dailyConsumption = [
    { animal: 'Pigs', consumed: 450, planned: 500, efficiency: 90 },
    { animal: 'Broilers', consumed: 280, planned: 300, efficiency: 93 },
    { animal: 'Layers', consumed: 320, planned: 310, efficiency: 97 },
  ];

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return '#EF4444';
      case 'low': return '#F59E0B';
      case 'normal': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed Management</Text>
        <Text style={styles.subtitle}>Monitor stock levels and consumption patterns</Text>
      </View>

      {/* Feed Overview */}
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Package size={24} color="#3B82F6" />
          <Text style={styles.overviewValue}>6,850 kg</Text>
          <Text style={styles.overviewLabel}>Total Stock</Text>
        </View>
        <View style={styles.overviewCard}>
          <Wheat size={24} color="#F59E0B" />
          <Text style={styles.overviewValue}>1,050 kg</Text>
          <Text style={styles.overviewLabel}>Daily Usage</Text>
        </View>
        <View style={styles.overviewCard}>
          <TrendingUp size={24} color="#10B981" />
          <Text style={styles.overviewValue}>93%</Text>
          <Text style={styles.overviewLabel}>Efficiency</Text>
        </View>
      </View>

      {/* Stock Levels */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Current Stock Levels</Text>
        </View>
        {feedStock.map((stock, index) => (
          <View key={index} style={styles.stockItem}>
            <View style={styles.stockHeader}>
              <Text style={styles.stockType}>{stock.type}</Text>
              <View style={[styles.alertBadge, { backgroundColor: getAlertColor(stock.alertLevel) }]}>
                <Text style={styles.alertText}>
                  {stock.alertLevel === 'critical' ? 'Critical' : 
                   stock.alertLevel === 'low' ? 'Low' : 'Normal'}
                </Text>
              </View>
            </View>
            <View style={styles.stockDetails}>
              <Text style={styles.stockAmount}>
                {stock.current.toLocaleString()} / {stock.total.toLocaleString()} {stock.unit}
              </Text>
              <ProgressBar 
                progress={(stock.current / stock.total) * 100} 
                color={getAlertColor(stock.alertLevel)}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Daily Consumption */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Daily Consumption</Text>
        </View>
        {dailyConsumption.map((consumption, index) => (
          <View key={index} style={styles.consumptionItem}>
            <View style={styles.consumptionHeader}>
              <Text style={styles.consumptionAnimal}>{consumption.animal}</Text>
              <Text style={styles.efficiencyText}>
                {consumption.efficiency}% efficiency
              </Text>
            </View>
            <View style={styles.consumptionDetails}>
              <Text style={styles.consumptionAmount}>
                {consumption.consumed}kg consumed / {consumption.planned}kg planned
              </Text>
              <ProgressBar 
                progress={consumption.efficiency} 
                color={consumption.efficiency >= 95 ? '#10B981' : consumption.efficiency >= 90 ? '#F59E0B' : '#EF4444'}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Package size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Order Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <AlertTriangle size={20} color="#3B82F6" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Report Issue</Text>
          </TouchableOpacity>
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
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  stockItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  stockDetails: {
    gap: 8,
  },
  stockAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  consumptionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  consumptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consumptionAnimal: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  efficiencyText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  consumptionDetails: {
    gap: 8,
  },
  consumptionAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
});