import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
} from 'react-native';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Zap,
  Eye,
  AlertTriangle,
  Bell,
  MapPin,
  Calendar,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudLightning,
  CloudDrizzle,
  Settings,
  ExternalLink
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useLanguage } from '@/contexts/LanguageContext';
import Constants from 'expo-constants';

// Conditionally import notifications (not supported in Expo Go SDK 53+)
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not available in this environment');
}

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Types
interface EnvironmentMetric {
  id: string;
  label: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
  trend: string;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  currentValue: number;
}

interface SensorLocation {
  location: string;
  temperature: number;
  humidity: number;
  airQuality: number;
  lastUpdated: string;
  type: 'pig' | 'poultry' | 'general';
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
  alerts: string[];
}

interface NotificationSetting {
  id: string;
  label: string;
  enabled: boolean;
  threshold: number;
}

// Environment thresholds for different animals
const THRESHOLDS = {
  pig: {
    temperature: { min: 18, max: 24, ideal: 21 },
    humidity: { min: 60, max: 70, ideal: 65 },
    ammonia: { min: 0, max: 20, ideal: 10 },
  },
  poultry: {
    temperature: { min: 20, max: 25, ideal: 22.5 },
    humidity: { min: 50, max: 65, ideal: 60 },
    ammonia: { min: 0, max: 15, ideal: 8 },
  }
};

// Weather API Configuration
const WEATHER_API_KEY = "333c397bca044d41a41203942250412";
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';
const LOCATION = 'Bhopal, MP';

// Only set notification handler if available and not in Expo Go
if (Notifications && !isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}



export default function EnvironmentScreen() {
  const { t } = useLanguage();
  const [environmentData, setEnvironmentData] = useState<EnvironmentMetric[]>([]);
  const [sensorLocations, setSensorLocations] = useState<SensorLocation[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    { id: 'temperature', label: 'Temperature Alerts', enabled: true, threshold: 2 },
    { id: 'humidity', label: 'Humidity Alerts', enabled: true, threshold: 5 },
    { id: 'ammonia', label: 'Ammonia Alerts', enabled: true, threshold: 3 },
    { id: 'weather', label: 'Weather Warnings', enabled: true, threshold: 0 },
  ]);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Initialize notifications
  useEffect(() => {
    requestNotificationPermission();
    setupNotificationListeners();
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    if (!Notifications || isExpoGo) {
      console.log('Notifications not available in Expo Go - skipping permission request');
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications for weather alerts.');
      }
    } catch (error) {
      console.warn('Failed to request notification permissions:', error);
    }
  };

  const setupNotificationListeners = () => {
    if (!Notifications || isExpoGo) {
      console.log('Notifications not available in Expo Go - skipping listener setup');
      return;
    }

    try {
      Notifications.addNotificationReceivedListener((notification: any) => {
        console.log('Notification received:', notification);
      });
    } catch (error) {
      console.warn('Failed to set up notification listeners:', error);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load from multiple sources
      const [sensorData, weatherInfo] = await Promise.allSettled([
        fetchSensorData(),
        fetchWeatherData(),
      ]);

      // Process sensor data
      if (sensorData.status === 'fulfilled') {
        setSensorLocations(sensorData.value);
        const metrics = processEnvironmentMetrics(sensorData.value);
        setEnvironmentData(metrics);

        // Check thresholds and send notifications if enabled
        if (notificationsEnabled) {
          checkThresholdsAndNotify(metrics);
        }
      }

      // Process weather data
      if (weatherInfo.status === 'fulfilled') {
        setWeatherData(weatherInfo.value);

        // Check weather alerts
        if (weatherInfo.value.alerts.length > 0 && notificationsEnabled) {
          sendWeatherAlert(weatherInfo.value.alerts[0]);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load environment data. Using cached data.');
      loadCachedData();
    } finally {
      setLoading(false);
    }
  };

  const fetchSensorData = async (): Promise<SensorLocation[]> => {
    try {
      // In production: Replace with actual sensor API
      const response = await fetch('YOUR_SENSOR_API_ENDPOINT');

      if (!response.ok) {
        throw new Error('Sensor API failed');
      }

      const data = await response.json();

      // Mock data for demo (remove in production)
      return [
        {
          location: 'Pig Pen 1',
          temperature: 23.8 + (Math.random() * 2 - 1), // Random variation
          humidity: 68 + (Math.random() * 4 - 2),
          airQuality: 85 + (Math.random() * 10 - 5),
          lastUpdated: new Date().toISOString(),
          type: 'pig'
        },
        {
          location: 'Pig Pen 2',
          temperature: 25.1 + (Math.random() * 2 - 1),
          humidity: 62 + (Math.random() * 4 - 2),
          airQuality: 78 + (Math.random() * 10 - 5),
          lastUpdated: new Date().toISOString(),
          type: 'pig'
        },
        {
          location: 'Broiler House 1',
          temperature: 24.2 + (Math.random() * 2 - 1),
          humidity: 70 + (Math.random() * 4 - 2),
          airQuality: 90 + (Math.random() * 10 - 5),
          lastUpdated: new Date().toISOString(),
          type: 'poultry'
        },
        {
          location: 'Layer Cage Area',
          temperature: 24.8 + (Math.random() * 2 - 1),
          humidity: 63 + (Math.random() * 4 - 2),
          airQuality: 88 + (Math.random() * 10 - 5),
          lastUpdated: new Date().toISOString(),
          type: 'poultry'
        },
      ];
    } catch (error) {
      // console.error('Sensor fetch failed, using mock data');
      // Return mock data for demo
      return getMockSensorData();
    }
  };

  const fetchWeatherData = async (): Promise<WeatherData> => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      const response = await fetch(
        `${WEATHER_API_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(LOCATION)}&days=5&aqi=no`
      );

      if (!response.ok) {
        throw new Error('Weather API failed');
      }

      const data = await response.json();

      return {
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph / 3.6, // Convert km/h to m/s
        condition: data.current.condition.text,
        icon: getWeatherIcon(data.current.condition.code),
        forecast: data.forecast.forecastday.map((day: any, index: number) => ({
          day: index === 0
            ? 'Today'
            : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(day.day.avgtemp_c),
          condition: day.day.condition.text
        })),
        alerts: data.alerts?.alert?.map((alert: any) => alert.headline) || []
      };
    } catch (error) {
      console.error('Weather fetch failed:', error);
      // Return mock weather data
      return getMockWeatherData();
    }
  };

  const processEnvironmentMetrics = (sensors: SensorLocation[]): EnvironmentMetric[] => {
    const avgTemp = sensors.reduce((sum, s) => sum + s.temperature, 0) / sensors.length;
    const avgHumidity = sensors.reduce((sum, s) => sum + s.humidity, 0) / sensors.length;
    const avgAirQuality = sensors.reduce((sum, s) => sum + s.airQuality, 0) / sensors.length;

    const getStatus = (value: number, min: number, max: number): 'normal' | 'warning' | 'critical' => {
      if (value < min || value > max) return 'critical';
      if (value < min + 2 || value > max - 2) return 'warning';
      return 'normal';
    };

    const pigCount = sensors.filter(s => s.type === 'pig').length;
    const poultryCount = sensors.filter(s => s.type === 'poultry').length;
    const thresholds = pigCount >= poultryCount ? THRESHOLDS.pig : THRESHOLDS.poultry;

    return [
      {
        id: 'temperature',
        label: 'Temperature',
        value: `${avgTemp.toFixed(1)}°C`,
        status: getStatus(avgTemp, thresholds.temperature.min, thresholds.temperature.max),
        icon: 'thermometer',
        trend: avgTemp > thresholds.temperature.ideal ? '+1.2°C from ideal' : '-0.8°C from ideal',
        unit: '°C',
        minThreshold: thresholds.temperature.min,
        maxThreshold: thresholds.temperature.max,
        currentValue: avgTemp
      },
      {
        id: 'humidity',
        label: 'Humidity',
        value: `${avgHumidity.toFixed(0)}%`,
        status: getStatus(avgHumidity, thresholds.humidity.min, thresholds.humidity.max),
        icon: 'droplets',
        trend: avgHumidity > thresholds.humidity.ideal ? '+3% from ideal' : '-2% from ideal',
        unit: '%',
        minThreshold: thresholds.humidity.min,
        maxThreshold: thresholds.humidity.max,
        currentValue: avgHumidity
      },
      {
        id: 'airQuality',
        label: 'Air Quality',
        value: `${avgAirQuality.toFixed(0)}%`,
        status: avgAirQuality > 80 ? 'normal' : avgAirQuality > 60 ? 'warning' : 'critical',
        icon: 'wind',
        trend: 'Good ventilation',
        unit: '%',
        minThreshold: 70,
        maxThreshold: 100,
        currentValue: avgAirQuality
      },
      {
        id: 'ammonia',
        label: 'Ammonia',
        value: '12 ppm',
        status: getStatus(12, thresholds.ammonia.min, thresholds.ammonia.max),
        icon: 'zap',
        trend: '+3 ppm from yesterday',
        unit: 'ppm',
        minThreshold: thresholds.ammonia.min,
        maxThreshold: thresholds.ammonia.max,
        currentValue: 12
      },
      {
        id: 'lighting',
        label: 'Light Level',
        value: '320 lux',
        status: 'normal',
        icon: 'sun',
        trend: 'Adequate',
        unit: 'lux',
        minThreshold: 200,
        maxThreshold: 500,
        currentValue: 320
      },
      {
        id: 'visibility',
        label: 'Visibility',
        value: '95%',
        status: 'normal',
        icon: 'eye',
        trend: 'Clear conditions',
        unit: '%',
        minThreshold: 80,
        maxThreshold: 100,
        currentValue: 95
      },
    ];
  };

  const checkThresholdsAndNotify = async (metrics: EnvironmentMetric[]) => {
    for (const metric of metrics) {
      const setting = notificationSettings.find(s => s.id === metric.id);

      if (setting && setting.enabled) {
        if (metric.status === 'critical') {
          await sendNotification(
            `${metric.label} Alert`,
            `${metric.label} is at ${metric.value} (${metric.status.toUpperCase()})`,
            metric.id
          );
        } else if (metric.status === 'warning') {
          await sendNotification(
            `${metric.label} Warning`,
            `${metric.label} is approaching critical levels`,
            metric.id
          );
        }
      }
    }
  };

  const sendWeatherAlert = async (alert: string) => {
    const setting = notificationSettings.find(s => s.id === 'weather');
    if (setting && setting.enabled) {
      await sendNotification(
        'Weather Alert',
        alert,
        'weather'
      );
    }
  };

  const sendNotification = async (title: string, body: string, category: string) => {
    if (!Notifications || isExpoGo) {
      // In Expo Go, just log the notification instead of sending it
      console.log(`[NOTIFICATION] ${title}: ${body} (category: ${category})`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { category },
          sound: true,
        },
        trigger: null,
      });

      console.log(`Notification sent: ${title}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode === 1000) return 'sun'; // Sunny/Clear
    if (weatherCode === 1003 || weatherCode === 1006) return 'cloud-sun'; // Partly cloudy
    if (weatherCode === 1009 || weatherCode === 1030) return 'cloud'; // Cloudy/Overcast
    if (weatherCode >= 1063 && weatherCode <= 1072) return 'cloud-drizzle'; // Drizzle
    if (weatherCode >= 1087 && weatherCode <= 1117) return 'cloud-lightning'; // Thunderstorms
    if (weatherCode >= 1135 && weatherCode <= 1147) return 'wind'; // Fog/Mist
    if (weatherCode >= 1150 && weatherCode <= 1201) return 'cloud-rain'; // Rain
    if (weatherCode >= 1210 && weatherCode <= 1225) return 'cloud-snow'; // Snow
    return 'thermometer'; // Default
  };

  const getIconComponent = (iconName: string, color: string, size: number = 24) => {
    const props = { size, color };
    switch (iconName) {
      case 'thermometer': return <Thermometer {...props} />;
      case 'droplets': return <Droplets {...props} />;
      case 'wind': return <Wind {...props} />;
      case 'sun': return <Sun {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'eye': return <Eye {...props} />;
      case 'cloud': return <Cloud {...props} />;
      case 'cloud-rain': return <CloudRain {...props} />;
      case 'cloud-snow': return <CloudSnow {...props} />;
      case 'cloud-sun': return <CloudSun {...props} />;
      case 'cloud-lightning': return <CloudLightning {...props} />;
      case 'cloud-drizzle': return <CloudDrizzle {...props} />;
      default: return <Thermometer {...props} />;
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

  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem('environmentData');
      if (cached) {
        const data = JSON.parse(cached);
        setEnvironmentData(data.metrics);
        setSensorLocations(data.sensors);
        setWeatherData(data.weather);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const saveCachedData = async () => {
    try {
      const data = {
        metrics: environmentData,
        sensors: sensorLocations,
        weather: weatherData,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem('environmentData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving cached data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const toggleNotificationSetting = (id: string) => {
    setNotificationSettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  // Mock data functions for demo
  const getMockSensorData = (): SensorLocation[] => [
    {
      location: 'Pig Pen 1',
      temperature: 23.8,
      humidity: 68,
      airQuality: 85,
      lastUpdated: new Date().toISOString(),
      type: 'pig'
    },
    {
      location: 'Pig Pen 2',
      temperature: 25.1,
      humidity: 62,
      airQuality: 78,
      lastUpdated: new Date().toISOString(),
      type: 'pig'
    },
    {
      location: 'Broiler House 1',
      temperature: 24.2,
      humidity: 70,
      airQuality: 90,
      lastUpdated: new Date().toISOString(),
      type: 'poultry'
    },
    {
      location: 'Layer Cage Area',
      temperature: 24.8,
      humidity: 63,
      airQuality: 88,
      lastUpdated: new Date().toISOString(),
      type: 'poultry'
    },
  ];

  const getMockWeatherData = (): WeatherData => ({
    temperature: 25.5,
    humidity: 65,
    windSpeed: 5.2,
    condition: 'Partly Cloudy',
    icon: 'cloud-sun',
    forecast: [
      { day: 'Today', temp: 26, condition: 'Partly Cloudy' },
      { day: 'Tue', temp: 27, condition: 'Sunny' },
      { day: 'Wed', temp: 25, condition: 'Rain' },
      { day: 'Thu', temp: 24, condition: 'Cloudy' },
      { day: 'Fri', temp: 26, condition: 'Sunny' },
    ],
    alerts: []
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('environment.loadingData')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Settings */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('environment.title')}</Text>
          <Text style={styles.subtitle}>{t('environment.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Last Updated */}
      <View style={styles.lastUpdatedContainer}>
        <Calendar size={14} color="#6B7280" />
        <Text style={styles.lastUpdatedText}>
          {t('environment.lastUpdated')}: {lastUpdated || t('environment.justNow')}
        </Text>
      </View>

      {/* Weather Card */}
      {weatherData && (
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <View style={styles.weatherLocation}>
              <MapPin size={18} color="#6B7280" />
              <Text style={styles.weatherLocationText}>{LOCATION}</Text>
            </View>
            <View style={styles.weatherCondition}>
              {getIconComponent(weatherData.icon, '#6B7280', 28)}
              <Text style={styles.weatherConditionText}>{weatherData.condition}</Text>
            </View>
          </View>

          <View style={styles.weatherStats}>
            <View style={styles.weatherStat}>
              <Thermometer size={20} color="#EF4444" />
              <Text style={styles.weatherValue}>{weatherData.temperature}°C</Text>
              <Text style={styles.weatherLabel}>{t('environment.temperature')}</Text>
            </View>
            <View style={styles.weatherStat}>
              <Droplets size={20} color="#3B82F6" />
              <Text style={styles.weatherValue}>{weatherData.humidity}%</Text>
              <Text style={styles.weatherLabel}>{t('environment.humidity')}</Text>
            </View>
            <View style={styles.weatherStat}>
              <Wind size={20} color="#10B981" />
              <Text style={styles.weatherValue}>{weatherData.windSpeed.toFixed(1)} m/s</Text>
              <Text style={styles.weatherLabel}>{t('environment.wind')}</Text>
            </View>
          </View>

          {/* Weather Forecast */}
          <View style={styles.forecastContainer}>
            <Text style={styles.forecastTitle}>{t('environment.forecast')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.forecastRow}>
                {weatherData.forecast.map((day, index) => (
                  <View key={index} style={styles.forecastDay}>
                    <Text style={styles.forecastDayText}>{day.day}</Text>
                    <Text style={styles.forecastTemp}>{day.temp}°</Text>
                    <Text style={styles.forecastCondition}>{day.condition}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 10,
        marginLeft: 4,
        paddingHorizontal: 16,

        color: '#374151'
      }}>
        {t('environment.fromSensors')}
      </Text>      <View style={styles.gridContainer}>
        {environmentData.map((data) => (
          <TouchableOpacity
            key={data.id}
            style={styles.environmentCard}
            onPress={() => Alert.alert(
              data.label,
              `Current: ${data.value}\nStatus: ${data.status.toUpperCase()}\nIdeal Range: ${data.minThreshold}-${data.maxThreshold}${data.unit}`
            )}
          >
            <View style={styles.cardHeader}>
              {getIconComponent(data.icon, getStatusColor(data.status))}
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(data.status) }]} />
            </View>
            <Text style={styles.cardValue}>{data.value}</Text>
            <Text style={styles.cardLabel}>{data.label}</Text>
            <Text style={styles.cardTrend}>{data.trend}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sensor Locations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('environment.sensorLocations')}</Text>
          <Text style={styles.sectionCount}>{sensorLocations.length} {t('environment.locations')}</Text>
        </View>
        {sensorLocations.map((location, index) => (
          <View key={index} style={styles.locationItem}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{location.location}</Text>
              <View style={[
                styles.locationTypeBadge,
                { backgroundColor: location.type === 'pig' ? '#FEF3C7' : '#DBEAFE' }
              ]}>
                <Text style={[
                  styles.locationTypeText,
                  { color: location.type === 'pig' ? '#92400E' : '#1E40AF' }
                ]}>
                  {location.type === 'pig' ? '🐖 Pig' : '🐔 Poultry'}
                </Text>
              </View>
            </View>
            <View style={styles.locationReadings}>
              <View style={styles.reading}>
                <Thermometer size={16} color="#EF4444" />
                <Text style={styles.readingValue}>{location.temperature.toFixed(1)}°C</Text>
              </View>
              <View style={styles.reading}>
                <Droplets size={16} color="#3B82F6" />
                <Text style={styles.readingValue}>{location.humidity.toFixed(0)}%</Text>
              </View>
              <View style={styles.reading}>
                <Wind size={16} color="#10B981" />
                <Text style={styles.readingValue}>{location.airQuality.toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('environment.recommendations')}</Text>
        {environmentData
          .filter(metric => metric.status !== 'normal')
          .map((metric, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={[
                styles.recommendationIcon,
                { backgroundColor: getStatusColor(metric.status) + '20' }
              ]}>
                {getIconComponent(metric.icon, getStatusColor(metric.status), 20)}
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>
                  {metric.label} {t(`environment.status.${metric.status}`).toUpperCase()}
                </Text>
                <Text style={styles.recommendationDescription}>
                  {t('environment.current')}: {metric.value} | {t('environment.ideal')}: {metric.minThreshold}-{metric.maxThreshold}{metric.unit}
                </Text>
              </View>
            </View>
          ))}
      </View>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('environment.notificationSettings')}</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationToggle}>
              <View style={styles.notificationToggleContent}>
                <Bell size={20} color="#6B7280" />
                <View>
                  <Text style={styles.notificationToggleTitle}>{t('environment.pushNotifications')}</Text>
                  <Text style={styles.notificationToggleSubtitle}>{t('environment.pushNotificationsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              />
            </View>

            {notificationSettings.map((setting) => (
              <View key={setting.id} style={styles.notificationSetting}>
                <Text style={styles.notificationSettingLabel}>{setting.label}</Text>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleNotificationSetting(setting.id)}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>{t('environment.saveSettings')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#E0E7FF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  lastUpdatedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
    marginLeft: 8,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  weatherLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherLocationText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  weatherCondition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherConditionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  weatherStat: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  weatherValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  weatherLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forecastContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  forecastRow: {
    flexDirection: 'row',
  },
  forecastDay: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 70,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  forecastDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  forecastTemp: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  forecastCondition: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  environmentCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  cardTrend: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationTypeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationTypeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  locationReadings: {
    flexDirection: 'row',
    gap: 24,
  },
  reading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  recommendationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  modalClose: {
    fontSize: 28,
    color: '#64748B',
    padding: 4,
    fontWeight: '700',
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  notificationToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  notificationToggleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  notificationToggleSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  notificationSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  notificationSettingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalButton: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});