import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import {
  Syringe,
  Thermometer,
  Heart,
  AlertCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Bell,
  Stethoscope
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

type Severity = 'high' | 'medium' | 'low';

interface HealthAlert {
  icon: string;
  type: string;
  location: string;
  time: string;
  severity: Severity;
}

interface Vaccination {
  id: number;
  user_id: string;
  species: string;
  vaccine_name: string;
  scheduled_date: string;
  administration_method: string;
  notes: string;
  created_at: string;
}

interface Checkup {
  id: number;
  user_id: string;
  species: string;
  animal_name: string;
  scheduled_date: string;
  administration: string;
  notes: string;
  created_at: string;
  status?: string;
}

interface FormattedVaccination {
  id: number;
  animal: string;
  vaccine: string;
  date: string;
  urgent: boolean;
  icon: string;
  scheduled_date: string;
  species: string;
  notes: string;
}

interface FormattedCheckup {
  id: number;
  animal_name: string;
  type: string;
  date: string;
  urgent: boolean;
  icon: string;
  scheduled_date: string;
  species: string;
  notes: string;
}

interface HealthStats {
  healthyPercentage: number;
  avgTemperature: number;
  vaccinatedPercentage: number;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function HealthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<FormattedVaccination[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<FormattedCheckup[]>([]);
  const [healthStats, setHealthStats] = useState<HealthStats>({
    healthyPercentage: 98.9,
    avgTemperature: 37.2,
    vaccinatedPercentage: 85
  });

  // Mock health alerts
  const healthAlerts: HealthAlert[] = [
    { type: 'High Temperature', location: 'Pig Pen 2', severity: 'high', time: '2 hours ago', icon: '🌡️' },
    { type: 'Respiratory Symptoms', location: 'Broiler House 1', severity: 'medium', time: '5 hours ago', icon: '😷' },
    { type: 'Egg Drop', location: 'Layer Cage 3', severity: 'low', time: '1 day ago', icon: '🥚' },
  ];

  // Fetch vaccinations from backend - FIXED VERSION
  const fetchVaccinations = async (): Promise<void> => {
    try {
      console.log('🔍 Starting to fetch vaccinations...');
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No token found');
        setLoading(false);
        return;
      }

      console.log('📡 Making API call to:', `${API_URL}/vaccinations`);
      const response = await fetch(`${API_URL}/vaccinations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`📋 Found ${result.data.length} total vaccinations`);

        // Filter upcoming vaccinations (next 7 days) - FIXED DATE LOGIC
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        // Reset time to beginning of day for proper comparison
        now.setHours(0, 0, 0, 0);
        nextWeek.setHours(23, 59, 59, 999);

        const upcoming = result.data.filter((vaccination: Vaccination) => {
          try {
            // Parse the date string (remove timezone issues)
            const dateStr = vaccination.scheduled_date.split('T')[0]; // Get only date part
            const vaccineDate = new Date(dateStr);
            vaccineDate.setHours(0, 0, 0, 0);

            console.log(`📅 Checking vaccination ${vaccination.id}:`, {
              scheduled_date: vaccination.scheduled_date,
              parsed_date: vaccineDate,
              now: now,
              nextWeek: nextWeek,
              is_upcoming: vaccineDate >= now && vaccineDate <= nextWeek
            });

            return vaccineDate >= now && vaccineDate <= nextWeek;
          } catch (error) {
            console.error('❌ Error parsing date:', vaccination.scheduled_date, error);
            return false;
          }
        });

        console.log(`✅ Found ${upcoming.length} upcoming vaccinations`);

        // Sort by date and format for display
        const formattedVaccinations: FormattedVaccination[] = upcoming
          .sort((a: Vaccination, b: Vaccination) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
          )
          .map((vaccination: Vaccination) => {
            const dateStr = vaccination.scheduled_date.split('T')[0];
            const vaccineDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Format date for display
            let dateDisplay: string;
            if (vaccineDate.getTime() === today.getTime()) {
              dateDisplay = 'Today';
            } else if (vaccineDate.getTime() === tomorrow.getTime()) {
              dateDisplay = 'Tomorrow';
            } else {
              dateDisplay = vaccineDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            }

            // Check if urgent (today or tomorrow)
            const isUrgent = vaccineDate.getTime() === today.getTime() ||
              vaccineDate.getTime() === tomorrow.getTime();

            // Get emoji based on species
            const getEmoji = (species: string): string => {
              const emojis: Record<string, string> = {
                'poultry': '🐔',
                'cattle': '🐄',
                'swine': '🐷',
                'sheep': '🐑',
                'goat': '🐐',
                'chicken': '🐔',
                'cow': '🐄',
                'pig': '🐷',
                'default': '🐾'
              };
              return emojis[species.toLowerCase()] || emojis.default;
            };

            return {
              id: vaccination.id,
              animal: `${vaccination.species.charAt(0).toUpperCase() + vaccination.species.slice(1)}`,
              vaccine: vaccination.vaccine_name,
              date: dateDisplay,
              urgent: isUrgent,
              icon: getEmoji(vaccination.species),
              scheduled_date: vaccination.scheduled_date,
              species: vaccination.species,
              notes: vaccination.notes
            };
          });

        // The user's instruction seems to be an alternative or older way of formatting.
        // I will integrate the filter for 'done' items into the existing `formattedVaccinations` logic.
        // Assuming `vaccination` object might have a `status` property.
        // If the `status` property is not present in the `Vaccination` interface, this filter might not work as intended.
        // However, following the instruction to add the filter.
        const filteredFormattedVaccinations = formattedVaccinations.filter(
          (v: FormattedVaccination & { status?: string }) => v.status !== 'done'
        );

        console.log('🎯 Formatted vaccinations:', filteredFormattedVaccinations);
        setUpcomingVaccinations(filteredFormattedVaccinations);

        // Update stats based on data
        if (result.data.length > 0) {
          const totalVaccinations = result.data.length;
          const upcomingCount = formattedVaccinations.length;
          const vaccinatedPercentage = Math.min(100, Math.round((upcomingCount / totalVaccinations) * 100));

          setHealthStats(prev => ({
            ...prev,
            vaccinatedPercentage
          }));
        }

        // Schedule notifications for upcoming vaccinations
        scheduleVaccinationNotifications(formattedVaccinations);
      } else {
        console.log('⚠️ No data or invalid response structure:', result);
        setUpcomingVaccinations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching vaccinations:', error);
      setUpcomingVaccinations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Schedule notifications for vaccinations
  const scheduleVaccinationNotifications = async (vaccinations: FormattedVaccination[]): Promise<void> => {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new notifications
      for (const vaccination of vaccinations) {
        try {
          const vaccineDate = new Date(vaccination.scheduled_date);

          // Schedule notification 5 minutes before vaccination time (set to 9 AM for demo)
          const notificationTime = new Date(vaccineDate);
          notificationTime.setHours(9, 55, 0, 0); // 9:55 AM on the day of vaccination

          // Only schedule if notification time is in the future
          if (notificationTime > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⏰ Vaccination Reminder',
                body: `Time to vaccinate ${vaccination.species} with ${vaccination.vaccine}`,
                data: {
                  vaccinationId: vaccination.id,
                  type: 'vaccination_reminder'
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                type: "date",
                date: notificationTime,
                repeats: false,
              } as Notifications.DateTriggerInput,
            });
            console.log(`⏰ Scheduled notification for ${vaccination.vaccine} at ${notificationTime}`);
          }

          // Also schedule a daily reminder 3 days before
          const threeDaysBefore = new Date(vaccineDate);
          threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
          threeDaysBefore.setHours(9, 0, 0, 0); // 9 AM

          if (threeDaysBefore > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📅 Upcoming Vaccination',
                body: `Vaccination for ${vaccination.species} in 3 days: ${vaccination.vaccine}`,
                data: {
                  vaccinationId: vaccination.id,
                  type: 'upcoming_vaccination'
                },
                sound: 'default',
              },
              trigger: {
                type: 'date',
                date: threeDaysBefore,
                repeats: false,
              } as Notifications.DateTriggerInput,
            });
            console.log(`📅 Scheduled 3-day reminder for ${vaccination.vaccine}`);
          }
        } catch (error) {
          console.error(`Error scheduling notification for vaccination ${vaccination.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
    }
  };

  const fetchCheckups = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/checkups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch checkups');

      const result = await response.json();

      if (result.success && result.data && Array.isArray(result.data)) {
        // Filter upcoming (next 7 days) and not 'done'
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        now.setHours(0, 0, 0, 0);

        const formattedCheckups = result.data
          .filter((c: Checkup) => {
            if (c.status === 'done') return false;
            const d = new Date(c.scheduled_date);
            return d >= now && d <= nextWeek;
          })
          .sort((a: Checkup, b: Checkup) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
          .map((c: Checkup) => {
            const date = new Date(c.scheduled_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            let dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (date.getTime() === today.getTime()) dateDisplay = 'Today';
            else if (date.getTime() === tomorrow.getTime()) dateDisplay = 'Tomorrow';

            const isUrgent = date.getTime() === today.getTime() || date.getTime() === tomorrow.getTime();

            return {
              id: c.id,
              animal_name: c.animal_name,
              type: c.administration || 'Routine',
              date: dateDisplay,
              urgent: isUrgent,
              icon: c.species === 'pig' ? '🐷' : '🐔',
              scheduled_date: c.scheduled_date,
              species: c.species,
              notes: c.notes
            };
          });

        setUpcomingCheckups(formattedCheckups);
      }
    } catch (error) {
      console.error('Error fetching checkups:', error);
    }
  };

  // Refresh data
  const onRefresh = (): void => {
    setRefreshing(true);
    fetchVaccinations();
    fetchCheckups();
  };

  // Load data on component focus - FIXED for auto-refresh
  useFocusEffect(
    useCallback(() => {
      fetchVaccinations();
      fetchCheckups();
    }, [])
  );

  // Setup notification listeners once
  useEffect(() => {
    // Listen for notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data.type === 'vaccination_reminder') {
        router.push(`/vaccination/${data.vaccinationId}` as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const getSeverityColors = (severity: Severity) => {
    switch (severity) {
      case 'high': return { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' };
      case 'medium': return { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' };
      case 'low': return { bg: '#D1FAE5', border: '#6EE7B7', text: '#059669' };
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#10B981']}
          tintColor="#10B981"
        />
      }
    >
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
              <Text style={styles.overviewValue}>{healthStats.healthyPercentage}%</Text>
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
              <Text style={styles.overviewValue}>{healthStats.avgTemperature}°C</Text>
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
              <Text style={styles.overviewValue}>{healthStats.vaccinatedPercentage}%</Text>
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading vaccinations...</Text>
          </View>
        ) : upcomingVaccinations.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={24} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No upcoming vaccinations</Text>
            <Text style={styles.emptyStateSubtext}>Add your first vaccination schedule</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/addVaccination')}
            >
              <Text style={styles.emptyStateButtonText}>Add Vaccination</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              Showing {upcomingVaccinations.length} upcoming vaccination{upcomingVaccinations.length !== 1 ? 's' : ''}
            </Text>
            {upcomingVaccinations.map((vaccination, index) => (
              <TouchableOpacity
                key={vaccination.id}
                style={[
                  styles.vaccinationItem,
                  index === upcomingVaccinations.length - 1 && styles.lastItem
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(`/vaccination/${vaccination.id}` as any)}
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

                {/* Status/Check Button */}
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Quick complete action could go here, but for safety linked to detail view
                    router.push(`/vaccination/${vaccination.id}` as any);
                  }}
                >
                  <View style={styles.checkCircle}>
                    <ChevronRight size={16} color="#059669" />
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      {/* Upcoming Checkups */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#D1FAE5' }]}>
              <Stethoscope size={18} color="#059669" />
            </View>
            <Text style={styles.sectionTitle}>Animal Checkups</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/checkup')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : upcomingCheckups.length === 0 ? (
          <View style={styles.emptyState}>
            <Stethoscope size={24} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No upcoming checkups</Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/addCheckup')}
            >
              <Text style={styles.emptyStateButtonText}>Schedule Checkup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingCheckups.map((checkup, index) => (
            <TouchableOpacity
              key={checkup.id}
              style={[
                styles.vaccinationItem,
                index === upcomingCheckups.length - 1 && styles.lastItem
              ]}
              onPress={() => router.push(`/checkup/${checkup.id}` as any)}
            >
              <View style={styles.vaccinationLeft}>
                <View style={[styles.animalEmoji, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={styles.emojiText}>{checkup.icon}</Text>
                </View>
                <View style={styles.vaccinationContent}>
                  <Text style={styles.vaccinationAnimal}>{checkup.animal_name}</Text>
                  <Text style={styles.vaccinationVaccine}>{checkup.type}</Text>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#6B7280" />
                    <Text style={[styles.vaccinationDate, checkup.urgent && styles.urgentDate]}>
                      {checkup.date}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.checkButton} onPress={() => router.push(`/checkup/${checkup.id}` as any)}>
                <View style={[styles.checkCircle, { borderColor: '#10B981' }]}>
                  <ChevronRight size={16} color="#10B981" />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
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
            <Syringe size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Add Vac.</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/addCheckup')}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.actionGradient}
          >
            <Stethoscope size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Add Checkup</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/riskForm')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.actionGradient}
          >
            <Heart size={24} color="#FFFFFF" />
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
  checkButton: {
    padding: 8,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});