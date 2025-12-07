import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated } from 'react-native';
import { Link } from 'expo-router';
import { QuickActions } from '@/components/QuickActions';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PRODUCTIVITY_TIPS = [
  "Did you know? Regular water quality checks can increase milk yield by up to 15%.",
  "Tip: Isolate sick animals immediately to prevent disease spread.",
  "Reminder: Vaccinate your poultry against Newcastle disease every 3 months.",
  "Fact: Proper ventilation reduces respiratory issues in pigs significantly.",
  "Tip: Maintain a record of feed consumption to track profitability."
];

const NEWS_ITEMS = [
  { id: 1, title: "Govt announces new subsidy for fodder transport.", date: "2h ago" },
  { id: 2, title: "Local market rates for broiler chicken up by ₹5/kg.", date: "4h ago" },
  { id: 3, title: "Upcoming vaccination camp in your district this Saturday.", date: "1d ago" },
  { id: 4, title: "New insurance scheme launched for livestock protection.", date: "2d ago" }
];

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
  const [index, setIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PRODUCTIVITY_TIPS.length);
      }, 500); // Change text halfway through fade
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <Feather name="search" size={20} color="#F59E0B" />
        <Text style={styles.tipTitle}>Daily Tip</Text>
      </View>
      <Animated.Text style={[styles.tipText, { opacity: fadeAnim }]}>
        {PRODUCTIVITY_TIPS[index]}
      </Animated.Text>
    </View>
  );
};

const NewsSection = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.newsCard}>
      <View style={styles.newsHeader}>
        <Feather name="trending-up" size={20} color="#3B82F6" />
        <Text style={styles.newsTitle}>Latest Updates</Text>
      </View>
      <View style={styles.newsContent}>
        <View style={styles.newsItem}>
          <Text style={styles.newsHeadline} numberOfLines={2}>
            {NEWS_ITEMS[index].title}
          </Text>
          <Text style={styles.newsDate}>{NEWS_ITEMS[index].date}</Text>
        </View>
        <View style={styles.newsPagination}>
          {NEWS_ITEMS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.newsDot,
                i === index && styles.newsDotActive
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchWeatherData();
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Simplified Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Namaste, Rizvi! 🙏</Text>
          <Text style={styles.subtitle}>Welcome to your farm</Text>
        </View>
        <View style={styles.headerDecoration} />
      </View>

      {/* Simple Status Card */}
      <View style={styles.statusContainer}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View>
            <Text style={styles.statusLabel}>Overall Status</Text>
            <Text style={styles.statusMain}>Everything Looks Good</Text>
            <Text style={styles.statusSub}>No critical alerts today</Text>
          </View>
          <View style={styles.statusIcon}>
            <Feather name="check-circle" size={40} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions Grid */}
      <QuickActions />

      {/* Analytics Entry Card */}
      <View style={styles.section}>
        <Link href="/analytics" asChild>
          <TouchableOpacity style={styles.analyticsCard}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.analyticsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.analyticsContent}>
                <View style={styles.analyticsTextContent}>
                  <Text style={styles.analyticsTitle}>Farm Analytics</Text>
                  <Text style={styles.analyticsSubtitle}>
                    View detailed reports on health, rations, and more
                  </Text>
                </View>
                <View style={styles.analyticsIcon}>
                  <Feather name="bar-chart-2" size={32} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Weather Section (High Value) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather in {LOCATION}</Text>
        <View style={styles.weatherCard}>
          <View style={styles.weatherMain}>
            <Feather name={weather?.icon || 'sun'} size={40} color="#F59E0B" />
            <View>
              <Text style={styles.weatherTemp}>{weather?.temp ?? '--'}°C</Text>
              <Text style={styles.weatherDesc}>{weather?.condition ?? 'Loading...'}</Text>
            </View>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherExtra}>
            <View style={styles.weatherItem}>
              <Feather name="droplet" size={16} color="#3B82F6" />
              <Text style={styles.weatherText}>{weather?.humidity ?? '--'}% Humidity</Text>
            </View>
            <View style={styles.weatherItem}>
              <Feather name="wind" size={16} color="#6B7280" />
              <Text style={styles.weatherText}>{weather?.windSpeed ?? '--'} km/h Wind</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Productivity Tip */}
      <View style={styles.section}>
        <ProductivityTip />
      </View>

      {/* News Section */}
      <View style={styles.section}>
        <NewsSection />
      </View>

      <View style={styles.footer} />
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
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 24,
    zIndex: 1,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ECFDF5',
    opacity: 0.6,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  statusLabel: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusMain: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusSub: {
    color: '#ECFDF5',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  weatherDesc: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  weatherDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  weatherExtra: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  footer: {
    height: 40,
  },
  analyticsCard: {
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  analyticsGradient: {
    borderRadius: 24,
    padding: 20,
  },
  analyticsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsTextContent: {
    flex: 1,
    paddingRight: 16,
  },
  analyticsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  analyticsSubtitle: {
    color: '#E9D5FF',
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: 16,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 24,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  newsContent: {
    gap: 12,
  },
  newsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  newsHeadline: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
    lineHeight: 22,
  },
  newsDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
  },
  newsPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  newsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  newsDotActive: {
    backgroundColor: '#3B82F6',
    width: 18,
  },
});