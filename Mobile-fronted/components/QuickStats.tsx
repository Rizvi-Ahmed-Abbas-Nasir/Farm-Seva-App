import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Leaf, Egg, Drumstick } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function QuickStats() {
 type StatItem = {
  label: string;
  count: number;
  colors: [string, string]; 
  icon: any;
  percentage: number;
};

const stats: StatItem[] = [
  {
    label: 'Pigs',
    count: 1547,
    colors: ['#34D399', '#10B981'],
    icon: Leaf,
    percentage: 54,
  },
  {
    label: 'Broilers',
    count: 890,
    colors: ['#60A5FA', '#3B82F6'],
    icon: Drumstick,
    percentage: 31,
  },
  {
    label: 'Layers',
    count: 410,
    colors: ['#FBBF24', '#F59E0B'],
    icon: Egg,
    percentage: 15,
  },
];


  const total = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <ScrollView style={styles.container}>
     

      {/* Visual Bar Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.barChart}>
          {stats.map((stat, index) => (
            <LinearGradient
              key={index}
              colors={stat.colors}
              style={[styles.barSegment, { flex: stat.percentage }]}
            >
              <Text style={styles.barText}>{stat.percentage}%</Text>
            </LinearGradient>
          ))}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <View key={index} style={styles.statCard}>
              <LinearGradient
                colors={['#F9FAFB', '#FFFFFF']}
                style={styles.cardGradient}
              >
                {/* Icon Badge */}
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={stat.colors}
                    style={styles.iconBadge}
                  >
                    <Icon size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statCount}>
                    {stat.count.toLocaleString()}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={stat.colors}
                        style={[styles.progressBarFill, { width: `${stat.percentage}%` }]}
                      />
                    </View>
                  </View>
                  <Text style={styles.percentageText}>
                    {stat.percentage}% of total
                  </Text>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </View>

      {/* Footer Tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 <Text style={styles.tipBold}>Tip:</Text> Monitor your animal counts regularly to optimize feeding and housing resources
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerBold: {
    fontWeight: '600',
    color: '#111827',
  },
  chartContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  barChart: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  statsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  statCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  iconContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    paddingRight: 60,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  tipContainer: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  tipText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: '700',
  },
});