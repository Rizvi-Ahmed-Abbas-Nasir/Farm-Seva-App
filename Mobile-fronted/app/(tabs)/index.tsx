import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Link } from 'expo-router';
import { QuickActions } from '@/components/QuickActions';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { notificationService } from '@/app/lib/notificationService';

const { width } = Dimensions.get('window');

// Weather Config
const WEATHER_API_KEY = "333c397bca044d41a41203942250412";
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';
const LOCATION = 'Bhopal, MP';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: keyof typeof Feather.glyphMap;
}

const ProductivityTip = () => {
  const { t } = useLanguage();
  const PRODUCTIVITY_TIPS = [
    t('dashboard.tip1'),
    t('dashboard.tip2'),
    t('dashboard.tip3'),
    t('dashboard.tip4'),
    t('dashboard.tip5')
  ];

  const [index, setIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PRODUCTIVITY_TIPS.length);
      }, 400);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={[styles.tipCard, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tipGradient}
      >
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Feather name="zap" size={22} color="#D97706" />
          </View>
          <Text style={styles.tipTitle}>{t('dashboard.dailyTip')}</Text>
        </View>
        <Animated.Text style={[styles.tipText, { opacity: fadeAnim }]}>
          {PRODUCTIVITY_TIPS[index]}
        </Animated.Text>
        <View style={styles.tipIndicator}>
          {PRODUCTIVITY_TIPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.tipDot,
                i === index && styles.tipDotActive
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const NewsSection = () => {
  const { t } = useLanguage();
  const NEWS_ITEMS = [
    { id: 1, title: t('dashboard.news1'), date: t('dashboard.news1Date') },
    { id: 2, title: t('dashboard.news2'), date: t('dashboard.news2Date') },
    { id: 3, title: t('dashboard.news3'), date: t('dashboard.news3Date') },
    { id: 4, title: t('dashboard.news4'), date: t('dashboard.news4Date') }
  ];

  const [index, setIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]),
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -10,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ])
      ]).start();

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={[styles.newsCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.newsHeader}>
        <View style={styles.newsIconContainer}>
          <Feather name="trending-up" size={22} color="#3B82F6" />
        </View>
        <Text style={styles.newsTitle}>{t('dashboard.latestUpdates')}</Text>
      </View>
      <View style={styles.newsContent}>
        <Animated.View 
          style={[
            styles.newsItem,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.newsBadge}>
            <Text style={styles.newsBadgeText}>NEW</Text>
          </View>
          <View style={styles.newsTextContainer}>
            <Text style={styles.newsHeadline} numberOfLines={2}>
              {NEWS_ITEMS[index].title}
            </Text>
            <View style={styles.newsDateContainer}>
              <Feather name="clock" size={12} color="#9CA3AF" />
              <Text style={styles.newsDate}>{NEWS_ITEMS[index].date}</Text>
            </View>
          </View>
        </Animated.View>
        <View style={styles.newsPagination}>
          {NEWS_ITEMS.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.newsDot,
                i === index && styles.newsDotActive
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const weatherAnim = useRef(new Animated.Value(0)).current;
  
  // IoT Control States
  const [temperature, setTemperature] = useState(25);
  const [waterLevel, setWaterLevel] = useState(75);
  const [humidity, setHumidity] = useState(60);
  const [ammoniaLevel, setAmmoniaLevel] = useState(15);
  const [ventilation, setVentilation] = useState(false);
  const [airQuality, setAirQuality] = useState(85);
  
  // Track last notification time to avoid spam
  const lastNotificationTime = useRef<{ [key: string]: number }>({});

  // Monitor IoT values and send notifications for critical values
  useEffect(() => {
    const checkIoTAlerts = async () => {
      const now = Date.now();
      const cooldown = 5 * 60 * 1000; // 5 minutes cooldown between notifications

      // Temperature alerts (critical: >30°C or <18°C)
      if (temperature > 30 || temperature < 18) {
        const key = 'temperature';
        if (!lastNotificationTime.current[key] || now - lastNotificationTime.current[key] > cooldown) {
          await notificationService.scheduleIoTAlert(
            'Temperature',
            temperature,
            temperature > 30 ? 30 : 18,
            temperature > 32 || temperature < 16 ? 'critical' : 'high'
          );
          lastNotificationTime.current[key] = now;
        }
      }

      // Water level alerts (critical: <20%)
      if (waterLevel < 20) {
        const key = 'waterLevel';
        if (!lastNotificationTime.current[key] || now - lastNotificationTime.current[key] > cooldown) {
          await notificationService.scheduleIoTAlert(
            'Water Level',
            waterLevel,
            20,
            waterLevel < 10 ? 'critical' : 'low'
          );
          lastNotificationTime.current[key] = now;
        }
      }

      // Humidity alerts (critical: >80% or <40%)
      if (humidity > 80 || humidity < 40) {
        const key = 'humidity';
        if (!lastNotificationTime.current[key] || now - lastNotificationTime.current[key] > cooldown) {
          await notificationService.scheduleIoTAlert(
            'Humidity',
            humidity,
            humidity > 80 ? 80 : 40,
            humidity > 85 || humidity < 35 ? 'critical' : 'high'
          );
          lastNotificationTime.current[key] = now;
        }
      }

      // Ammonia level alerts (critical: >25 ppm)
      if (ammoniaLevel > 25) {
        const key = 'ammoniaLevel';
        if (!lastNotificationTime.current[key] || now - lastNotificationTime.current[key] > cooldown) {
          await notificationService.scheduleIoTAlert(
            'Ammonia Level',
            ammoniaLevel,
            25,
            ammoniaLevel > 30 ? 'critical' : 'high'
          );
          lastNotificationTime.current[key] = now;
        }
      }

      // Air quality alerts (critical: <50 AQI)
      if (airQuality < 50) {
        const key = 'airQuality';
        if (!lastNotificationTime.current[key] || now - lastNotificationTime.current[key] > cooldown) {
          await notificationService.scheduleIoTAlert(
            'Air Quality',
            airQuality,
            50,
            airQuality < 30 ? 'critical' : 'low'
          );
          lastNotificationTime.current[key] = now;
        }
      }
    };

    checkIoTAlerts();
  }, [temperature, waterLevel, humidity, ammoniaLevel, airQuality]);

  useEffect(() => {
    fetchWeatherData();
    
    // Stagger animations
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(statusAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(weatherAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(
        `${WEATHER_API_URL}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(LOCATION)}&aqi=no`
      );
      const data = await response.json();

      setWeather({
        temp: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_kph),
        icon: getWeatherIcon(data.current.condition.code)
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Fallback data
      setWeather({
        temp: 28,
        condition: 'Partly Cloudy',
        humidity: 60,
        windSpeed: 12,
        icon: 'sun'
      });
    }
  };

  const getWeatherIcon = (code: number): keyof typeof Feather.glyphMap => {
    if (code === 1000) return 'sun'; // Clear/Sunny
    if ([1003, 1006, 1009].includes(code)) return 'cloud'; // Cloudy/Overcast
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) return 'cloud-rain'; // Rain
    if ([1087, 1273, 1276].includes(code)) return 'cloud-lightning'; // Thunder
    if ([1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return 'cloud-snow'; // Snow
    if ([1030, 1135, 1147].includes(code)) return 'cloud-drizzle'; // Mist/Fog
    return 'sun'; // Default to sun
  };

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const statusScale = statusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const weatherOpacity = weatherAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <View style={styles.headerGradient}>
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{t('dashboard.greeting')}, Rizvi! 🙏</Text>
            <View style={styles.greetingBadgeContainer}>
              <View style={styles.greetingBadge}>
                <Feather name="sun" size={14} color="#F59E0B" />
                <Text style={styles.greetingBadgeText}>Good Day</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{t('dashboard.welcome')}</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </Animated.View>

      {/* Enhanced Status Card */}
      <Animated.View 
        style={[
          styles.statusContainer,
          { transform: [{ scale: statusScale }] }
        ]}
      >
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusContent}>
            <View style={styles.statusTextContainer}>
              <View style={styles.statusLabelContainer}>
                <Feather name="activity" size={14} color="#D1FAE5" />
                <Text style={styles.statusLabel}>{t('dashboard.healthStatus')}</Text>
              </View>
              <Text style={styles.statusMain}>Everything Looks Good</Text>
              <Text style={styles.statusSub}>No critical alerts today</Text>
            </View>
            <View style={styles.statusIcon}>
              <View style={styles.statusIconInner}>
                <Feather name="check-circle" size={36} color="#10B981" />
              </View>
            </View>
          </View>
          <View style={styles.statusGlow} />
        </LinearGradient>
      </Animated.View>

      {/* Quick Actions Grid */}
      <QuickActions />

      {/* Enhanced Analytics Entry Card */}
      <View style={styles.section}>
        <Link href="/analytics" asChild>
          <TouchableOpacity 
            style={styles.analyticsCard}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
              style={styles.analyticsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.analyticsContent}>
                <View style={styles.analyticsTextContent}>
                  <View style={styles.analyticsHeader}>
                    <Text style={styles.analyticsTitle}>Farm Analytics</Text>
                    <View style={styles.analyticsBadge}>
                      <Feather name="arrow-right" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.analyticsSubtitle}>
                    View detailed reports on health, rations, and more
                  </Text>
                </View>
                <View style={styles.analyticsIcon}>
                  <View style={styles.analyticsIconInner}>
                    <Feather name="bar-chart-2" size={28} color="#8B5CF6" />
                  </View>
                </View>
              </View>
              <View style={styles.analyticsPattern} />
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Enhanced Weather Section */}
      <Animated.View 
        style={[
          styles.section,
          { opacity: weatherOpacity }
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Feather name="map-pin" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Weather in {LOCATION}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton}>
            <Feather name="refresh-cw" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.weatherCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.weatherMain}>
            <View style={styles.weatherIconContainer}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.weatherIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name={weather?.icon || 'sun'} size={36} color="#F59E0B" />
              </LinearGradient>
            </View>
            <View style={styles.weatherTextContainer}>
              <Text style={styles.weatherTemp}>{weather?.temp ?? '--'}°C</Text>
              <Text style={styles.weatherDesc}>{weather?.condition ?? t('common.loading')}</Text>
            </View>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherExtra}>
            <View style={styles.weatherItem}>
              <View style={styles.weatherItemIcon}>
                <Feather name="droplet" size={18} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.weatherValue}>{weather?.humidity ?? '--'}%</Text>
                <Text style={styles.weatherLabel}>Humidity</Text>
              </View>
            </View>
            <View style={styles.weatherItemDivider} />
            <View style={styles.weatherItem}>
              <View style={styles.weatherItemIcon}>
                <Feather name="wind" size={18} color="#6B7280" />
              </View>
              <View>
                <Text style={styles.weatherValue}>{weather?.windSpeed ?? '--'} km/h</Text>
                <Text style={styles.weatherLabel}>Wind Speed</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Productivity Tip */}
      <View style={styles.section}>
        <ProductivityTip />
      </View>

      {/* News Section */}
      <View style={styles.section}>
        <NewsSection />
      </View>

      <View style={styles.footer} />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowControlPanel(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="sliders" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* IoT Control Panel Modal */}
      <Modal
        visible={showControlPanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowControlPanel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.controlPanel}>
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.panelGradient}
            >
              {/* Panel Header */}
              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderLeft}>
                  <View style={styles.panelIconContainer}>
                    <Feather name="cpu" size={24} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.panelTitle}>IoT Control Panel</Text>
                    <Text style={styles.panelSubtitle}>Farm Environment Control</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowControlPanel(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.panelContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Temperature Control */}
                <View style={styles.controlCard}>
                  <View style={styles.controlHeader}>
                    <View style={[styles.controlIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Feather name="thermometer" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.controlInfo}>
                      <Text style={styles.controlLabel}>Temperature</Text>
                      <Text style={styles.controlUnit}>°C</Text>
                    </View>
                  </View>
                  <View style={styles.controlValueContainer}>
                    <Text style={styles.controlValue}>{temperature}°C</Text>
                    <View style={styles.controlButtons}>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonMinus]}
                        onPress={() => setTemperature(Math.max(15, temperature - 1))}
                      >
                        <Feather name="minus" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonPlus]}
                        onPress={() => setTemperature(Math.min(35, temperature + 1))}
                      >
                        <Feather name="plus" size={18} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Water Level Control */}
                <View style={styles.controlCard}>
                  <View style={styles.controlHeader}>
                    <View style={[styles.controlIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Feather name="droplet" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.controlInfo}>
                      <Text style={styles.controlLabel}>Water Level</Text>
                      <Text style={styles.controlUnit}>%</Text>
                    </View>
                  </View>
                  <View style={styles.controlValueContainer}>
                    <Text style={styles.controlValue}>{waterLevel}%</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${waterLevel}%`, backgroundColor: '#3B82F6' }]} />
                    </View>
                    <View style={styles.controlButtons}>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonMinus]}
                        onPress={() => setWaterLevel(Math.max(0, waterLevel - 5))}
                      >
                        <Feather name="minus" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonPlus]}
                        onPress={() => setWaterLevel(Math.min(100, waterLevel + 5))}
                      >
                        <Feather name="plus" size={18} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Humidity Control */}
                <View style={styles.controlCard}>
                  <View style={styles.controlHeader}>
                    <View style={[styles.controlIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Feather name="cloud" size={20} color="#10B981" />
                    </View>
                    <View style={styles.controlInfo}>
                      <Text style={styles.controlLabel}>Humidity</Text>
                      <Text style={styles.controlUnit}>%</Text>
                    </View>
                  </View>
                  <View style={styles.controlValueContainer}>
                    <Text style={styles.controlValue}>{humidity}%</Text>
                    <View style={styles.controlButtons}>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonMinus]}
                        onPress={() => setHumidity(Math.max(30, humidity - 5))}
                      >
                        <Feather name="minus" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonPlus]}
                        onPress={() => setHumidity(Math.min(90, humidity + 5))}
                      >
                        <Feather name="plus" size={18} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Ammonia Level Control */}
                <View style={styles.controlCard}>
                  <View style={styles.controlHeader}>
                    <View style={[styles.controlIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Feather name="alert-circle" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.controlInfo}>
                      <Text style={styles.controlLabel}>Ammonia Level</Text>
                      <Text style={styles.controlUnit}>ppm</Text>
                    </View>
                  </View>
                  <View style={styles.controlValueContainer}>
                    <Text style={[styles.controlValue, { color: ammoniaLevel > 20 ? '#EF4444' : '#10B981' }]}>
                      {ammoniaLevel} ppm
                    </Text>
                    <View style={styles.controlButtons}>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonMinus]}
                        onPress={() => setAmmoniaLevel(Math.max(0, ammoniaLevel - 2))}
                      >
                        <Feather name="minus" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.controlButtonPlus]}
                        onPress={() => setAmmoniaLevel(Math.min(50, ammoniaLevel + 2))}
                      >
                        <Feather name="plus" size={18} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Ventilation Control */}
                <View style={styles.controlCard}>
                  <View style={styles.controlHeader}>
                    <View style={[styles.controlIcon, { backgroundColor: '#E0E7FF' }]}>
                      <Feather name="wind" size={20} color="#6366F1" />
                    </View>
                    <View style={styles.controlInfo}>
                      <Text style={styles.controlLabel}>Ventilation</Text>
                      <Text style={styles.controlStatus}>
                        {ventilation ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleButton, ventilation && styles.toggleButtonActive]}
                    onPress={() => setVentilation(!ventilation)}
                  >
                    <LinearGradient
                      colors={ventilation ? ['#10B981', '#059669'] : ['#E5E7EB', '#D1D5DB']}
                      style={styles.toggleGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.toggleCircle, ventilation && styles.toggleCircleActive]}>
                        <Feather 
                          name={ventilation ? "check" : "x"} 
                          size={16} 
                          color={ventilation ? "#FFFFFF" : "#9CA3AF"} 
                        />
                      </View>
                      <Text style={[styles.toggleText, ventilation && styles.toggleTextActive]}>
                        {ventilation ? 'ON' : 'OFF'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Air Quality Display */}
                <View style={styles.controlCard}>
                  <View style={styles.controlHeader}>
                    <View style={[styles.controlIcon, { backgroundColor: '#F3E8FF' }]}>
                      <Feather name="airplay" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.controlInfo}>
                      <Text style={styles.controlLabel}>Air Quality</Text>
                      <Text style={styles.controlUnit}>AQI</Text>
                    </View>
                  </View>
                  <View style={styles.airQualityContainer}>
                    <View style={styles.airQualityCircle}>
                      <LinearGradient
                        colors={airQuality >= 80 ? ['#10B981', '#059669'] : airQuality >= 50 ? ['#F59E0B', '#D97706'] : ['#EF4444', '#DC2626']}
                        style={styles.airQualityGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.airQualityValue}>{airQuality}</Text>
                        <Text style={styles.airQualityLabel}>AQI</Text>
                      </LinearGradient>
                    </View>
                    <Text style={[styles.airQualityStatus, { 
                      color: airQuality >= 80 ? '#10B981' : airQuality >= 50 ? '#F59E0B' : '#EF4444' 
                    }]}>
                      {airQuality >= 80 ? 'Excellent' : airQuality >= 50 ? 'Moderate' : 'Poor'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  headerGradient: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingRight: 140,
    zIndex: 1,
    marginTop: 8,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  greetingBadgeContainer: {
    marginBottom: 8,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  greetingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0FDF4',
    opacity: 0.4,
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statusCard: {
    borderRadius: 28,
    padding: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusLabel: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statusMain: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statusSub: {
    color: '#ECFDF5',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  weatherCard: {
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  weatherIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  weatherIconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTextContainer: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -1,
  },
  weatherDesc: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  weatherDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  weatherExtra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  weatherItemDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  weatherItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    height: 40,
  },
  analyticsCard: {
    borderRadius: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  analyticsGradient: {
    borderRadius: 28,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  analyticsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  analyticsTextContent: {
    flex: 1,
    paddingRight: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  analyticsTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  analyticsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsSubtitle: {
    color: '#E9D5FF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  analyticsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsPattern: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tipCard: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  tipGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 16,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },
  tipIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
  },
  tipDotActive: {
    backgroundColor: '#D97706',
    width: 20,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  newsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  newsContent: {
    gap: 16,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  newsBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  newsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  newsTextContainer: {
    flex: 1,
  },
  newsHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
  },
  newsDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newsDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  newsPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  newsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  newsDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  controlPanel: {
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  panelGradient: {
    flex: 1,
    paddingTop: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  panelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Control Card Styles
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  controlIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlInfo: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  controlUnit: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  controlStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  controlValueContainer: {
    alignItems: 'center',
    gap: 12,
  },
  controlValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  controlButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonMinus: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  controlButtonPlus: {
    backgroundColor: '#F0FDF4',
    borderColor: '#D1FAE5',
  },
  // Toggle Button Styles
  toggleButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  toggleButtonActive: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  toggleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  // Air Quality Styles
  airQualityContainer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  airQualityCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  airQualityGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airQualityValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  airQualityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  airQualityStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
});