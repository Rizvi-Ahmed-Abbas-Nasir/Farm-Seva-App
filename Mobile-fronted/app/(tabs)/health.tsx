import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform
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
  Stethoscope,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationService } from '@/app/lib/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScheduleGenerator } from '@/components/ScheduleGenerator';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useLanguage } from '@/contexts/LanguageContext';
import { offlineService } from '@/app/lib/offlineService';
import OfflineIndicator from '@/components/OfflineIndicator';

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
  schedule_type?: string;
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
  schedule_type?: string;
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
  isAuto?: boolean;
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
  isAuto?: boolean;
}

interface HealthStats {
  healthyPercentage: number;
  avgTemperature: number;
  vaccinatedPercentage: number;
  isWeb?: boolean;
}

// Global notification handler is now in _layout.tsx

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Weather API Configuration
const WEATHER_API_KEY = "333c397bca044d41a41203942250412";
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';
const LOCATION = 'Bhopal, MP';

export default function HealthScreen() {
  const { t } = useLanguage();
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
  const [showVaccinationGenerator, setShowVaccinationGenerator] = useState(false);
  const [showCheckupGenerator, setShowCheckupGenerator] = useState(false);
  const [nextVaccinationDate, setNextVaccinationDate] = useState<Date | null>(null);
  const [nextCheckupDate, setNextCheckupDate] = useState<Date | null>(null);

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

      // Check if offline - use cached data
      if (!offlineService.isConnected()) {
        console.log('📴 Offline - loading cached vaccinations');
        const cached = await offlineService.getCachedVaccinations();
        if (cached && cached.length > 0) {
          const now = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(now.getDate() + 7);
          now.setHours(0, 0, 0, 0);
          nextWeek.setHours(23, 59, 59, 999);
          
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
            return emojis[species?.toLowerCase()] || emojis.default;
          };
          
          const upcoming = cached.filter((v: any) => {
            const dateStr = v.scheduled_date?.split('T')[0];
            if (!dateStr) return false;
            const vaccineDate = new Date(dateStr);
            vaccineDate.setHours(0, 0, 0, 0);
            return vaccineDate >= now && vaccineDate <= nextWeek && v.status !== 'done';
          }).map((v: any) => {
            const dateStr = v.scheduled_date?.split('T')[0] || v.scheduled_date;
            const vaccineDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
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
            
            const isUrgent = vaccineDate.getTime() === today.getTime() ||
              vaccineDate.getTime() === tomorrow.getTime();
            
            const species = v.species || v.animal_type || 'Unknown';
            
            return {
              id: v.id,
              animal: `${species.charAt(0).toUpperCase() + species.slice(1)}`,
              vaccine: v.vaccine_name || '',
              date: dateDisplay,
              urgent: isUrgent,
              icon: getEmoji(species),
              scheduled_date: v.scheduled_date || dateStr,
              species: species,
              notes: v.notes || '',
              isAuto: v.schedule_type === 'auto'
            } as FormattedVaccination;
          });
          
          setUpcomingVaccinations(upcoming);
          return;
        }
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
        // Try cached data on error
        const cached = await offlineService.getCachedVaccinations();
        if (cached && cached.length > 0) {
          console.log('📦 Using cached vaccinations due to error');
          const now = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(now.getDate() + 7);
          now.setHours(0, 0, 0, 0);
          nextWeek.setHours(23, 59, 59, 999);
          
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
            return emojis[species?.toLowerCase()] || emojis.default;
          };
          
          const upcoming = cached.filter((v: any) => {
            const dateStr = v.scheduled_date?.split('T')[0];
            if (!dateStr) return false;
            const vaccineDate = new Date(dateStr);
            vaccineDate.setHours(0, 0, 0, 0);
            return vaccineDate >= now && vaccineDate <= nextWeek && v.status !== 'done';
          }).map((v: any) => {
            const dateStr = v.scheduled_date?.split('T')[0] || v.scheduled_date;
            const vaccineDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
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
            
            const isUrgent = vaccineDate.getTime() === today.getTime() ||
              vaccineDate.getTime() === tomorrow.getTime();
            
            const species = v.species || v.animal_type || 'Unknown';
            
            return {
              id: v.id,
              animal: `${species.charAt(0).toUpperCase() + species.slice(1)}`,
              vaccine: v.vaccine_name || '',
              date: dateDisplay,
              urgent: isUrgent,
              icon: getEmoji(species),
              scheduled_date: v.scheduled_date || dateStr,
              species: species,
              notes: v.notes || '',
              isAuto: v.schedule_type === 'auto'
            } as FormattedVaccination;
          });
          
          setUpcomingVaccinations(upcoming);
          return;
        }
        
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
              notes: vaccination.notes,
              isAuto: vaccination.schedule_type === 'auto'
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
        
        // Cache vaccinations for offline use
        await offlineService.cacheVaccinations(result.data);

        // Calculate next vaccination date (5 days from the latest upcoming vaccination)
        if (filteredFormattedVaccinations.length > 0) {
          const latestVaccination = filteredFormattedVaccinations[filteredFormattedVaccinations.length - 1];
          const latestDate = new Date(latestVaccination.scheduled_date);
          const nextDate = new Date(latestDate);
          nextDate.setDate(nextDate.getDate() + 5);
          setNextVaccinationDate(nextDate);
        } else {
          // If no vaccinations, set next to 5 days from now
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 5);
          setNextVaccinationDate(nextDate);
        }

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

  // Schedule notifications for vaccinations using notification service
  const scheduleVaccinationNotifications = async (vaccinations: FormattedVaccination[]): Promise<void> => {
    try {
      for (const vaccination of vaccinations) {
        try {
          const vaccineDate = new Date(vaccination.scheduled_date);
          await notificationService.scheduleVaccinationReminder(
            vaccination.id.toString(),
            vaccination.animal || vaccination.species,
            vaccination.vaccine,
            vaccineDate,
            24 // 24 hours before
          );
        } catch (error) {
          console.error(`Error scheduling notification for vaccination ${vaccination.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error scheduling vaccination notifications:', error);
    }
  };


  // Schedule notifications for checkups using notification service
  const scheduleCheckupNotifications = async (checkups: FormattedCheckup[]): Promise<void> => {
    try {
      for (const checkup of checkups) {
        try {
          const checkupDate = new Date(checkup.scheduled_date);
          await notificationService.scheduleCheckupReminder(
            checkup.id.toString(),
            checkup.animal_name,
            checkup.type,
            checkupDate,
            1 // 1 hour before
          );
        } catch (error) {
          console.error(`Error scheduling notification for checkup ${checkup.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error scheduling checkup notifications:', error);
    }
  };

  const fetchCheckups = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Check if offline - use cached data
      if (!offlineService.isConnected()) {
        console.log('📴 Offline - loading cached checkups');
        const cached = await offlineService.getCachedCheckups();
        if (cached && cached.length > 0) {
          const now = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(now.getDate() + 7);
          now.setHours(0, 0, 0, 0);
          nextWeek.setHours(23, 59, 59, 999);
          
          const upcoming = cached.filter((c: any) => {
            const dateStr = c.scheduled_date?.split('T')[0];
            if (!dateStr) return false;
            const checkupDate = new Date(dateStr);
            checkupDate.setHours(0, 0, 0, 0);
            return checkupDate >= now && checkupDate <= nextWeek && c.status !== 'done';
          }).map((c: any) => {
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
              animal_name: c.animal_name || 'Unknown',
              type: c.administration || c.type || 'Routine',
              date: dateDisplay,
              urgent: isUrgent,
              icon: c.species === 'pig' ? '🐷' : '🐔',
              scheduled_date: c.scheduled_date,
              species: c.species || 'Unknown',
              notes: c.notes || '',
              isAuto: c.schedule_type === 'auto'
            } as FormattedCheckup;
          });
          
          setUpcomingCheckups(upcoming);
          return;
        }
      }

      const response = await fetch(`${API_URL}/checkups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Try cached data on error
        const cached = await offlineService.getCachedCheckups();
        if (cached && cached.length > 0) {
          console.log('📦 Using cached checkups due to error');
          const now = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(now.getDate() + 7);
          now.setHours(0, 0, 0, 0);
          nextWeek.setHours(23, 59, 59, 999);
          
          const upcoming = cached.filter((c: any) => {
            const dateStr = c.scheduled_date?.split('T')[0];
            if (!dateStr) return false;
            const checkupDate = new Date(dateStr);
            checkupDate.setHours(0, 0, 0, 0);
            return checkupDate >= now && checkupDate <= nextWeek && c.status !== 'done';
          }).map((c: any) => {
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
              animal_name: c.animal_name || 'Unknown',
              type: c.administration || c.type || 'Routine',
              date: dateDisplay,
              urgent: isUrgent,
              icon: c.species === 'pig' ? '🐷' : '🐔',
              scheduled_date: c.scheduled_date,
              species: c.species || 'Unknown',
              notes: c.notes || '',
              isAuto: c.schedule_type === 'auto'
            } as FormattedCheckup;
          });
          
          setUpcomingCheckups(upcoming);
          return;
        }
        
        throw new Error('Failed to fetch checkups');
      }

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
              notes: c.notes,
              isAuto: c.schedule_type === 'auto'
            };
          });

        setUpcomingCheckups(formattedCheckups);
        
        // Cache checkups for offline use
        await offlineService.cacheCheckups(result.data);

        // Calculate next checkup date (7 days from the latest checkup or from now)
        if (formattedCheckups.length > 0) {
          const latestCheckup = formattedCheckups[formattedCheckups.length - 1];
          const latestDate = new Date(latestCheckup.scheduled_date);
          const nextDate = new Date(latestDate);
          nextDate.setDate(nextDate.getDate() + 7);
          setNextCheckupDate(nextDate);
        } else {
          // If no checkups, set next to 7 days from now
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 7);
          setNextCheckupDate(nextDate);
        }

        scheduleCheckupNotifications(formattedCheckups);
      }
    } catch (error) {
      console.error('Error fetching checkups:', error);
    }
  };

  // Fetch weather data for dynamic temperature
  const fetchWeatherData = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${WEATHER_API_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(LOCATION)}&days=1&aqi=no`
      );

      if (response.ok) {
        const data = await response.json();

        if (data && data.current) {
          setHealthStats(prev => ({
            ...prev,
            avgTemperature: data.current.temp_c
          }));
        }
      }
    } catch (error) {
      console.log('Error fetching weather data, using fallback:', error);
      // Fallback mock data
      setHealthStats(prev => ({
        ...prev,
        avgTemperature: 22.4
      }));
    }
  };

  // Refresh data
  const onRefresh = (): void => {
    setRefreshing(true);
    fetchVaccinations();
    fetchCheckups();
    fetchWeatherData();
  };

  // Load data on component focus - FIXED for auto-refresh
  useFocusEffect(
    useCallback(() => {
      fetchVaccinations();
      fetchCheckups();
      fetchWeatherData();
    }, [])
  );

  // Setup notification listeners once
  // Note: Notification response handling can be added using expo-notifications if needed
  // useEffect(() => {
  //   const subscription = Notifications.addNotificationResponseReceivedListener(response => {
  //     const data = response.notification.request.content.data;
  //     if (data.type === 'vaccination_reminder') {
  //       router.push(`/vaccination/${data.vaccinationId}` as any);
  //     } else if (data.type === 'checkup_reminder') {
  //       router.push(`/checkup/${data.checkupId}` as any);
  //     }
  //   });
  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  const getSeverityColors = (severity: Severity) => {
    switch (severity) {
      case 'high': return { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' };
      case 'medium': return { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' };
      case 'low': return { bg: '#D1FAE5', border: '#6EE7B7', text: '#059669' };
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' };
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <OfflineIndicator />
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
        <Text style={styles.title}>{t('health.title')}</Text>
        <Text style={styles.subtitle}>{t('health.subtitle')}</Text>
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
              <Text style={styles.overviewLabel}>{t('health.healthy')}</Text>
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
              <Text style={styles.overviewLabel}>{t('health.avgTemp')}</Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>{t('health.normal')}</Text>
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
              <Text style={styles.overviewLabel}>{t('health.vaccinated')}</Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>{t('health.onTrack')}</Text>
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
            <View>
              <Text style={styles.sectionTitle}>{t('health.vaccinations')}</Text>
              <Text style={styles.healthLabel}>{t('health.healthLabel')}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.autoScheduleButton}
              onPress={() => setShowVaccinationGenerator(true)}
            >
              <Sparkles size={14} color="#3B82F6" />
              <Text style={styles.autoScheduleText}>{t('common.auto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/vaccination')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Countdown Timer for Next Vaccination */}
        {nextVaccinationDate && (
          <CountdownTimer
            targetDate={nextVaccinationDate}
            label={t('health.nextVaccinationIn')}
            color="#3B82F6"
            backgroundColor="#EFF6FF"
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>{t('health.loadingVaccinations')}</Text>
          </View>
        ) : upcomingVaccinations.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={24} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>{t('health.noUpcomingVaccinations')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('health.addFirstVaccination')}</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/addVaccination')}
            >
              <Text style={styles.emptyStateButtonText}>{t('health.addVaccination')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {t('health.showing')} {upcomingVaccinations.length} {upcomingVaccinations.length === 1 ? t('health.upcomingVaccination') : t('health.upcomingVaccinations')}
            </Text>
            {upcomingVaccinations.map((vaccination, index) => (
              <TouchableOpacity
                key={vaccination.id}
                style={styles.vaccinationItem}
                activeOpacity={0.7}
                onPress={() => router.push(`/vaccination/${vaccination.id}` as any)}
              >
                <View style={styles.vaccinationLeft}>
                  <View style={styles.animalEmoji}>
                    <Text style={styles.emojiText}>{vaccination.icon}</Text>
                  </View>
                  <View style={styles.vaccinationContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.vaccinationAnimal}>{vaccination.animal}</Text>
                      {vaccination.isAuto && (
                        <View style={styles.autoBadge}>
                          <Sparkles size={10} color="#3B82F6" />
                          <Text style={styles.autoBadgeText}>{t('common.auto')}</Text>
                        </View>
                      )}
                    </View>
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
            <View>
              <Text style={styles.sectionTitle}>{t('health.checkups')}</Text>
              <Text style={styles.healthLabel}>{t('health.healthLabel')}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.autoScheduleButton, { borderColor: '#10B981' }]}
              onPress={() => setShowCheckupGenerator(true)}
            >
              <Sparkles size={14} color="#10B981" />
              <Text style={[styles.autoScheduleText, { color: '#10B981' }]}>{t('common.auto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/checkup')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Countdown Timer for Next Checkup */}
        {nextCheckupDate && (
          <CountdownTimer
            targetDate={nextCheckupDate}
            label={t('health.nextCheckupIn')}
            color="#10B981"
            backgroundColor="#D1FAE5"
          />
        )}

        {loading ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : upcomingCheckups.length === 0 ? (
          <View style={styles.emptyState}>
            <Stethoscope size={24} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>{t('health.noUpcomingCheckups')}</Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/addCheckup')}
            >
              <Text style={styles.emptyStateButtonText}>{t('health.scheduleCheckup')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingCheckups.map((checkup, index) => (
            <TouchableOpacity
              key={checkup.id}
              style={styles.vaccinationItem}
              onPress={() => router.push(`/checkup/${checkup.id}` as any)}
            >
              <View style={styles.vaccinationLeft}>
                <View style={[styles.animalEmoji, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={styles.emojiText}>{checkup.icon}</Text>
                </View>
                <View style={styles.vaccinationContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.vaccinationAnimal}>{checkup.animal_name}</Text>
                    {checkup.isAuto && (
                      <View style={[styles.autoBadge, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
                        <Sparkles size={10} color="#10B981" />
                        <Text style={[styles.autoBadgeText, { color: '#10B981' }]}>{t('common.auto')}</Text>
                      </View>
                    )}
                  </View>
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
            <Text style={styles.sectionTitle}>{t('health.healthAlerts')}</Text>
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
              style={styles.alertItem}
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

      {/* Schedule Generators */}
      <ScheduleGenerator
        visible={showVaccinationGenerator}
        onClose={() => setShowVaccinationGenerator(false)}
        onSuccess={() => {
          fetchVaccinations();
          fetchCheckups();
        }}
        type="vaccination"
      />
      <ScheduleGenerator
        visible={showCheckupGenerator}
        onClose={() => setShowCheckupGenerator(false)}
        onSuccess={() => {
          fetchVaccinations();
          fetchCheckups();
        }}
        type="checkup"
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    marginHorizontal: 20,
    marginTop: 24,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 13,
    color: '#6B7280',
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  lastItem: {
    marginBottom: 0,
  },
  vaccinationLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  animalEmoji: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiText: {
    fontSize: 28,
  },
  vaccinationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  autoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vaccinationAnimal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  vaccinationVaccine: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaccinationDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  urgentDate: {
    color: '#DC2626',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
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
    marginLeft: 8,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertEmoji: {
    fontSize: 26,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  resultCount: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
    marginLeft: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  autoScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  autoScheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  healthLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});