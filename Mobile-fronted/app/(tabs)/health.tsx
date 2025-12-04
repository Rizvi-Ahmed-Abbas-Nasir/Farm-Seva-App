import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Syringe, Thermometer, Heart, AlertCircle, Calendar, ChevronRight, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';

export default function HealthScreen() {
  const router = useRouter();
  const upcomingVaccinations = [
    { animal: 'Pigs - Pen 3', vaccine: 'FMD Booster', date: 'Today', urgent: true, icon: '🐷' },
    { animal: 'Broilers - House 2', vaccine: 'Newcastle Disease', date: 'Tomorrow', urgent: true, icon: '🐔' },
    { animal: 'Layers - Cage 5', vaccine: 'Infectious Bronchitis', date: 'Dec 28', urgent: false, icon: '🐓' },
  ];

  const healthAlerts: HealthAlert[] = [
    { type: 'High Temperature', location: 'Pig Pen 2', severity: 'high', time: '2 hours ago', icon: '🌡️' },
    { type: 'Respiratory Symptoms', location: 'Broiler House 1', severity: 'medium', time: '5 hours ago', icon: '😷' },
    { type: 'Egg Drop', location: 'Layer Cage 3', severity: 'low', time: '1 day ago', icon: '🥚' },
  ];

  type Severity = 'high' | 'medium' | 'low';


  type HealthAlert = {
    icon: string;
    type: string;
    location: string;
    time: string;
    severity: Severity;
  };



  const getSeverityColors = (severity: Severity) => {
    switch (severity) {
      case 'high': return { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' };
      case 'medium': return { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' };
      case 'low': return { bg: '#D1FAE5', border: '#6EE7B7', text: '#059669' };
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' };
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.title}>Animal Health Center</Text>
        <Text style={styles.subtitle}>Real-time health monitoring & care</Text>
      </LinearGradient>

      {/* Health Overview Cards */}
      <View style={styles.overviewSection}>
        <View style={styles.overviewRow}>
          <TouchableOpacity style={styles.overviewCard}>
            <LinearGradient
              colors={['#D1FAE5', '#A7F3D0']}
              style={styles.cardGradient}
            >
              <View style={styles.iconCircle}>
                <Heart size={20} color="#059669" fill="#059669" />
              </View>
              <Text style={styles.overviewValue}>98.9%</Text>
              <Text style={styles.overviewLabel}>Healthy</Text>
              <View style={styles.trendBadge}>
                <TrendingUp size={10} color="#059669" />
                <Text style={styles.trendText}>+2.1%</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.overviewCard}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.cardGradient}
            >
              <View style={styles.iconCircle}>
                <Thermometer size={20} color="#D97706" />
              </View>
              <Text style={styles.overviewValue}>37.2°C</Text>
              <Text style={styles.overviewLabel}>Avg Temp</Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>Normal</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.overviewCard}>
            <LinearGradient
              colors={['#DBEAFE', '#BFDBFE']}
              style={styles.cardGradient}
            >
              <View style={styles.iconCircle}>
                <Syringe size={20} color="#2563EB" />
              </View>
              <Text style={styles.overviewValue}>85%</Text>
              <Text style={styles.overviewLabel}>Vaccinated</Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>On Track</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Vaccinations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBg}>
              <Calendar size={18} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>Vaccination Schedule</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/vaccination')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingVaccinations.map((vaccination, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.vaccinationItem,
              index === upcomingVaccinations.length - 1 && styles.lastItem
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.vaccinationLeft}>
              <View style={styles.animalEmoji}>
                <Text style={styles.emojiText}>{vaccination.icon}</Text>
              </View>
              <View style={styles.vaccinationContent}>
                <Text style={styles.vaccinationAnimal}>{vaccination.animal}</Text>
                <Text style={styles.vaccinationVaccine}>{vaccination.vaccine}</Text>
                <View style={styles.dateRow}>
                  <Calendar size={12} color="#6B7280" />
                  <Text style={[
                    styles.vaccinationDate,
                    vaccination.urgent && styles.urgentDate
                  ]}>
                    {vaccination.date}
                  </Text>
                </View>
              </View>
            </View>
            {vaccination.urgent && (
              <LinearGradient
                colors={['#FEE2E2', '#FECACA']}
                style={styles.urgentBadge}
              >
                <Text style={styles.urgentText}>⚡ Urgent</Text>
              </LinearGradient>
            )}
            <ChevronRight size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#FEE2E2' }]}>
              <AlertCircle size={18} color="#EF4444" />
            </View>
            <Text style={styles.sectionTitle}>Health Alerts</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{healthAlerts.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {healthAlerts.map((alert, index) => {
          const colors = getSeverityColors(alert.severity);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.alertItem,
                index === healthAlerts.length - 1 && styles.lastItem
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.alertLeft}>
                <View style={[styles.alertIconCircle, { backgroundColor: colors.bg }]}>
                  <Text style={styles.alertEmoji}>{alert.icon}</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertType}>{alert.type}</Text>
                  <Text style={styles.alertLocation}>📍 {alert.location}</Text>
                  <Text style={styles.alertTime}>🕐 {alert.time}</Text>
                </View>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.severityText, { color: colors.text }]}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/addVaccination')}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.actionGradient}
          >
            <Syringe size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Add Vaccination</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/riskForm')}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.actionGradient}
          >
            <Heart size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Health Check</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#D1FAE5',
  },
  overviewSection: {
    marginTop: -20,
    paddingHorizontal: 20,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  alertCount: {
    backgroundColor: '#FEE2E2',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  vaccinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  vaccinationLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  animalEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  vaccinationContent: {
    flex: 1,
  },
  vaccinationAnimal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  vaccinationVaccine: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vaccinationDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  urgentDate: {
    color: '#DC2626',
    fontWeight: '700',
  },
  urgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertEmoji: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  alertLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 30,
  },
});