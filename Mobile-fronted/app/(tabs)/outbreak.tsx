import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import Papa from 'papaparse';
import { offlineService } from '@/app/lib/offlineService';
import OfflineIndicator from '@/components/OfflineIndicator';
import { notificationService } from '@/app/lib/notificationService';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isLargeDevice = width > 414;

interface DiseaseAlert {
  id: string;
  type: string;
  diseaseName: string;
  monthYear: string;
  locationsEffected: string[];
  updatedDate: string;
  updatedOn: string;
  overview: string;
  preventiveMeasure: string;
}

interface UserLocation {
  state: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
}

const DiseaseAlertsDashboard = () => {
  const [alerts, setAlerts] = useState<DiseaseAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<DiseaseAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User State & Location
  const [userLocation, setUserLocation] = useState<UserLocation>({
    state: null,
    city: null,
    lat: null,
    lon: null
  });
  const [locationStatus, setLocationStatus] = useState('Detecting location...');
  const [isLocationDataLoaded, setIsLocationDataLoaded] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All']);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<DiseaseAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Google Sheets CSV
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1GYaSR_EL4c-oKNyiTyx1XOv2aI-ON8WmGJ0G491j35E/export?format=csv";

  useEffect(() => {
    getUserLocation();
    fetchSheetData();
    
    // Subscribe to network status
    const unsubscribe = offlineService.subscribe((online) => {
      setIsOnline(online);
      if (online) {
        fetchSheetData();
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userLocation.city) {
      setCustomLocation(userLocation.city);
    } else if (userLocation.state) {
      setCustomLocation(userLocation.state);
    }
  }, [userLocation]);

  useEffect(() => {
    if (alerts.length > 0) {
      applyFilters();
    }
  }, [alerts, searchTerm, selectedTypes, isLocalOnly, customLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationStatus('Permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding using OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      const city = data.address.city || data.address.town || data.address.village || '';
      const state = data.address.state || '';

      setUserLocation({
        state,
        city,
        lat: latitude,
        lon: longitude
      });

      if (city) setCustomLocation(city);
      setLocationStatus('Detected');
      setIsLocationDataLoaded(true);
    } catch (err) {
      console.error('Location error:', err);
      setLocationStatus('Location failed');
    }
  };

  const fetchSheetData = async () => {
    setLoading(true);
    
    // Check if offline - use cached data
    if (!offlineService.isConnected()) {
      console.log('📴 Offline - loading cached outbreak alerts');
      const cached = await offlineService.getCachedOutbreakAlerts();
      if (cached && cached.length > 0) {
        setAlerts(cached);
        setFilteredAlerts(cached);
        setLoading(false);
        return;
      } else {
        Alert.alert('Offline', 'No cached data available. Please connect to the internet to fetch outbreak alerts.');
        setLoading(false);
        return;
      }
    }
    
    try {
      const response = await fetch(SHEET_URL);
      
      if (!response.ok) {
        // Try cached data on error
        const cached = await offlineService.getCachedOutbreakAlerts();
        if (cached && cached.length > 0) {
          console.log('📦 Using cached outbreak alerts due to error');
          setAlerts(cached);
          setFilteredAlerts(cached);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          (async () => {
            try {
              const validRows = result.data.filter((row: any) => row['DiseaseName'] && row['Type']);
              const parsedData: DiseaseAlert[] = validRows.map((row: any, index: number) => ({
                id: row['OBTID'] || `alert-${index}`,
                type: row['Type']?.trim() || '',
                diseaseName: row['DiseaseName'] || '',
                monthYear: row['MonthYear'] || '',
                locationsEffected: row['Locations Effected'] ?
                  row['Locations Effected'].split(',').map((l: string) => l.trim()) : [],
                updatedDate: row['UpdatedDate'] || '',
                updatedOn: row['UpdatedOn'] || '',
                overview: row['Disease Overview'] || '',
                preventiveMeasure: row['Possible Preventive Measure'] || '',
              }));
              setAlerts(parsedData);
              setFilteredAlerts(parsedData);
              
              // Cache the data for offline use
              await offlineService.cacheOutbreakAlerts(parsedData);
              
              // Schedule notifications for nearby outbreaks
              if (userLocation.city || userLocation.state) {
                const nearbyAlerts = parsedData.filter(alert => {
                  const locations = Array.isArray(alert.locationsEffected) 
                    ? alert.locationsEffected 
                    : [alert.locationsEffected];
                  return locations.some(loc => 
                    loc.toLowerCase().includes(userLocation.city?.toLowerCase() || '') ||
                    loc.toLowerCase().includes(userLocation.state?.toLowerCase() || '')
                  );
                });
                
                for (const alert of nearbyAlerts.slice(0, 3)) { // Limit to 3 notifications
                  try {
                    await notificationService.scheduleOutbreakAlert(
                      alert.diseaseName,
                      alert.locationsEffected.join(', '),
                      alert.type || 'medium'
                    );
                  } catch (error) {
                    console.error('Error scheduling outbreak notification:', error);
                  }
                }
              }
            } catch (err) {
              console.error('Parse Error:', err);
              
              // Try cached data on parse error
              const cached = await offlineService.getCachedOutbreakAlerts();
              if (cached && cached.length > 0) {
                console.log('📦 Using cached outbreak alerts due to parse error');
                setAlerts(cached);
                setFilteredAlerts(cached);
              } else {
                setError('Failed to parse data.');
              }
            } finally {
              setLoading(false);
            }
          })();
        },
        error: (err: any) => {
          console.error('CSV Fetch Error:', err);
          
          // Try cached data on error
          offlineService.getCachedOutbreakAlerts().then(cached => {
            if (cached && cached.length > 0) {
              console.log('📦 Using cached outbreak alerts due to CSV error');
              setAlerts(cached);
              setFilteredAlerts(cached);
            } else {
              setError('Failed to load outbreak data.');
            }
            setLoading(false);
          });
        }
      });
    } catch (err) {
      console.error('Fetch Error:', err);
      
      // Try cached data on error
      const cached = await offlineService.getCachedOutbreakAlerts();
      if (cached && cached.length > 0) {
        console.log('📦 Using cached outbreak alerts due to fetch error');
        setAlerts(cached);
        setFilteredAlerts(cached);
        setLoading(false);
        return;
      }
      
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = alerts;

    // 1. Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.diseaseName?.toLowerCase().includes(lowerSearch) ||
        item.overview?.toLowerCase().includes(lowerSearch) ||
        item.locationsEffected.some(loc => loc.toLowerCase().includes(lowerSearch))
      );
    }

    // 2. Type Filter
    if (!selectedTypes.includes('All')) {
      result = result.filter(item =>
        selectedTypes.some(type => item.type?.toLowerCase() === type.toLowerCase())
      );
    }

    // 3. Location Filter
    if (isLocalOnly && customLocation) {
      const filterLoc = customLocation.toLowerCase().trim();
      result = result.filter(item => {
        return item.locationsEffected.some(loc =>
          loc.toLowerCase().includes(filterLoc)
        );
      });
    }

    setFilteredAlerts(result);
  };

  const isUserAffected = (alert: DiseaseAlert) => {
    const checkLoc = customLocation || userLocation.state || '';
    if (!checkLoc) return false;

    return alert.locationsEffected.some(loc =>
      loc.toLowerCase().includes(checkLoc.toLowerCase())
    );
  };

  const toggleTypeFilter = (type: string) => {
    if (type === 'All') {
      setSelectedTypes(['All']);
    } else {
      let newTypes = selectedTypes.filter(t => t !== 'All');
      if (newTypes.includes(type)) {
        newTypes = newTypes.filter(t => t !== type);
      } else {
        newTypes.push(type);
      }
      if (newTypes.length === 0) newTypes = ['All'];
      setSelectedTypes(newTypes);
    }
  };

  const getSeverityStyle = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('outbreak') || t.includes('critical')) {
      return {
        gradient: ['#ef4444', '#dc2626'],
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#991b1b',
        iconColor: '#dc2626',
        badgeBg: '#fee2e2',
        label: 'Severe Outbreak'
      };
    }
    if (t.includes('warning') || t.includes('high')) {
      return {
        gradient: ['#fbbf24', '#f59e0b'],
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#92400e',
        iconColor: '#d97706',
        badgeBg: '#fef3c7',
        label: 'Warning'
      };
    }
    return {
      gradient: ['#3b82f6', '#2563eb'],
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      iconColor: '#2563eb',
      badgeBg: '#dbeafe',
      label: 'Advisory'
    };
  };

  const openModal = (alert: DiseaseAlert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getUserLocation(), fetchSheetData()]);
    setRefreshing(false);
  };

  const clearAllFilters = () => {
    setIsLocalOnly(false);
    setCustomLocation(userLocation.city || userLocation.state || '');
    setSelectedTypes(['All']);
    setSearchTerm('');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Fetching latest outbreak data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <OfflineIndicator />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { }}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Disease Alerts</Text>
          <Text style={styles.subtitle}>Real-time Outbreak Monitoring</Text>
        </View>

        {/* Warning Banner */}
        {isLocationDataLoaded && filteredAlerts.some(a => isUserAffected(a)) && !isLocalOnly && (
          <View style={styles.warningBanner}>
            <View style={styles.warningIcon}>
              <Ionicons name="warning" size={32} color="#dc2626" />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Warning: Disease detected in {customLocation || userLocation.state}
              </Text>
              <Text style={styles.warningDescription}>
                Outbreaks have been reported in this vicinity. Review alerts immediately.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => setIsLocalOnly(true)}
            >
              <Text style={styles.warningButtonText}>View Near Me</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search diseases, symptoms, or locations..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.searchHint}>
            <Ionicons name="information-circle" size={16} color="#666" />
            Try "Swine Flu" or city names
          </Text>
        </View>

        <View style={styles.contentContainer}>
          {/* Filters Section */}
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.resetButton}>Reset All</Text>
              </TouchableOpacity>
            </View>

            {/* Location Toggle */}
            <View style={styles.locationFilter}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationTitle}>Location Filter</Text>
                <Ionicons name="location" size={20} color="#10b981" />
              </View>

              <View style={styles.toggleContainer}>
                <View style={styles.toggleLabel}>
                  <Text style={styles.toggleText}>Show Near Me</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      isLocalOnly && styles.toggleSwitchActive
                    ]}
                    onPress={() => setIsLocalOnly(!isLocalOnly)}
                  >
                    <View style={[
                      styles.toggleThumb,
                      isLocalOnly && styles.toggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>

                {isLocalOnly && (
                  <View style={styles.locationInputContainer}>
                    <Text style={styles.locationInputLabel}>Filter by City/State</Text>
                    <View style={styles.locationInputWrapper}>
                      <Ionicons name="location" size={16} color="#666" style={styles.locationInputIcon} />
                      <TextInput
                        style={styles.locationInput}
                        value={customLocation}
                        onChangeText={setCustomLocation}
                        placeholder="e.g. Mumbai"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Animal Type Filter */}
            <View style={styles.typeFilter}>
              <View style={styles.typeHeader}>
                <Text style={styles.typeTitle}>Animal Type</Text>
                <Ionicons name="chevron-down" size={20} color="#10b981" />
              </View>

              <View style={styles.typeOptions}>
                {['All', 'Pig', 'Poultry'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      selectedTypes.includes(type) && styles.typeOptionSelected
                    ]}
                    onPress={() => toggleTypeFilter(type)}
                  >
                    <View style={[
                      styles.typeCheckbox,
                      selectedTypes.includes(type) && styles.typeCheckboxSelected
                    ]}>
                      {selectedTypes.includes(type) && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text style={[
                      styles.typeText,
                      selectedTypes.includes(type) && styles.typeTextSelected
                    ]}>
                      {type} Farming
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Status */}
            <View style={styles.locationStatus}>
              <View style={styles.statusHeader}>
                <Ionicons name="location" size={14} color="#3b82f6" />
                <Text style={styles.statusTitle}>Detected Location</Text>
              </View>
              {userLocation.state ? (
                <Text style={styles.locationText}>
                  {userLocation.city}, {userLocation.state}
                </Text>
              ) : (
                <Text style={styles.locationStatusText}>{locationStatus}</Text>
              )}
            </View>
          </View>

          {/* Results Section */}
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsCount}>
                  Found <Text style={styles.resultsCountBold}>{filteredAlerts.length}</Text> active alerts
                </Text>
                {isLocalOnly && (
                  <View style={styles.locationBadge}>
                    <Ionicons name="location" size={12} color="#10b981" />
                    <Text style={styles.locationBadgeText}>{customLocation}</Text>
                  </View>
                )}
              </View>

              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort By</Text>
                <TouchableOpacity style={styles.sortButton}>
                  <Text style={styles.sortText}>Relevance</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Alerts List */}
            {filteredAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="search" size={48} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>No alerts found</Text>
                <Text style={styles.emptyDescription}>
                  {isLocalOnly
                    ? `Great news! No disease outbreaks reported in "${customLocation}".`
                    : "No disease alerts matching your search criteria."}
                </Text>
                <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
                  <Text style={styles.clearButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.alertsGrid}>
                {filteredAlerts.map((alert, index) => {
                  const isRisk = isUserAffected(alert);
                  const stylesObj = getSeverityStyle(alert.type);

                  return (
                    <TouchableOpacity
                      key={alert.id}
                      style={[
                        styles.alertCard,
                        isRisk && styles.alertCardRisk
                      ]}
                      onPress={() => openModal(alert)}
                    >
                      {/* Alert Header */}
                      <View style={styles.alertHeader}>
                        {isRisk ? (
                          <View style={styles.riskBadge}>
                            <Ionicons name="warning" size={12} color="#dc2626" />
                            <Text style={styles.riskBadgeText}>Critical Risk</Text>
                          </View>
                        ) : (
                          <View style={[styles.severityBadge, { backgroundColor: stylesObj.badgeBg }]}>
                            <Ionicons
                              name={stylesObj.label === 'Warning' ? "alert-circle" : "information-circle"}
                              size={12}
                              color={stylesObj.text}
                            />
                            <Text style={[styles.severityText, { color: stylesObj.text }]}>
                              {stylesObj.label}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Alert Content */}
                      <Text style={styles.alertTitle}>{alert.diseaseName}</Text>

                      <View style={styles.alertMeta}>
                        <Text style={styles.alertType}>{alert.type}</Text>
                        <Text style={styles.alertDot}>•</Text>
                        <Text style={styles.alertDate}>{alert.monthYear}</Text>
                      </View>

                      <View style={styles.alertOverview}>
                        <Text style={styles.alertOverviewText} numberOfLines={3}>
                          {alert.overview || "No overview available."}
                        </Text>
                      </View>

                      {/* Locations */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.locationsScroll}
                      >
                        <View style={styles.locationsContainer}>
                          {alert.locationsEffected.slice(0, 3).map((loc, i) => (
                            <View key={i} style={styles.locationTag}>
                              <Text style={styles.locationTagText}>{loc}</Text>
                            </View>
                          ))}
                          {alert.locationsEffected.length > 3 && (
                            <View style={styles.moreTag}>
                              <Text style={styles.moreTagText}>
                                +{alert.locationsEffected.length - 3}
                              </Text>
                            </View>
                          )}
                        </View>
                      </ScrollView>

                      {/* Footer */}
                      <View style={styles.alertFooter}>
                        <Text style={styles.alertId}>ID: {alert.id}</Text>
                        <View style={styles.alertArrow}>
                          <Ionicons name="chevron-forward" size={16} color="white" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        {selectedAlert && (
          <AlertDetailModal
            alert={selectedAlert}
            isRisk={isUserAffected(selectedAlert)}
            customLocation={customLocation}
            userLocation={userLocation}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

function AlertDetailModal({
  alert,
  isRisk,
  customLocation,
  userLocation,
  onClose
}: {
  alert: DiseaseAlert;
  isRisk: boolean;
  customLocation: string;
  userLocation: UserLocation;
  onClose: () => void;
}) {
  // Define getSeverityStyle function first
  const getSeverityStyle = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('outbreak') || t.includes('critical')) {
      return {
        gradient: ['#ef4444', '#dc2626'],
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#991b1b',
        iconColor: '#dc2626',
        badgeBg: '#fee2e2',
        label: 'Severe Outbreak'
      };
    }
    if (t.includes('warning') || t.includes('high')) {
      return {
        gradient: ['#fbbf24', '#f59e0b'],
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#92400e',
        iconColor: '#d97706',
        badgeBg: '#fef3c7',
        label: 'Warning'
      };
    }
    return {
      gradient: ['#3b82f6', '#2563eb'],
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      iconColor: '#2563eb',
      badgeBg: '#dbeafe',
      label: 'Advisory'
    };
  };

  const stylesObj = getSeverityStyle(alert.type);

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      width: '100%',
      maxHeight: '90%',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      backgroundColor: stylesObj.gradient[0],
      padding: 24,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      padding: 8,
    },
    headerBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    severityBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    severityBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    riskBadge: {
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    riskBadgeText: {
      color: '#dc2626',
      fontSize: 12,
      fontWeight: 'bold',
    },
    alertTitle: {
      fontSize: isSmallDevice ? 22 : 24,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 8,
    },
    headerMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    metaText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    modalBody: {
      padding: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitleText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1f2937',
    },
    overviewText: {
      fontSize: 16,
      lineHeight: 24,
      color: '#374151',
      backgroundColor: stylesObj.bg,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: stylesObj.border,
    },
    locationsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    locationTag: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    locationTagText: {
      fontSize: 14,
      fontWeight: '600',
    },
    matchedLocation: {
      backgroundColor: '#dc2626',
      borderColor: '#dc2626',
    },
    matchedLocationText: {
      color: 'white',
    },
    normalLocation: {
      backgroundColor: '#f3f4f6',
      borderColor: '#e5e7eb',
    },
    normalLocationText: {
      color: '#4b5563',
    },
    preventiveContainer: {
      backgroundColor: '#d1fae5',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },
    preventiveText: {
      fontSize: 16,
      lineHeight: 24,
      color: '#065f46',
    },
  });

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={[styles.modalHeader, {
          backgroundColor: stylesObj.gradient[0]
        }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.headerBadges}>
            <View style={styles.severityBadge}>
              <Text style={styles.severityBadgeText}>{stylesObj.label}</Text>
            </View>
            {isRisk && (
              <View style={styles.riskBadge}>
                <Ionicons name="warning" size={14} color="#dc2626" />
                <Text style={styles.riskBadgeText}>Near You</Text>
              </View>
            )}
          </View>

          <Text style={styles.alertTitle}>{alert.diseaseName}</Text>

          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color="white" />
              <Text style={styles.metaText}>{alert.monthYear}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color="white" />
              <Text style={styles.metaText}>{alert.locationsEffected.length} Locations</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <ScrollView style={styles.modalBody}>
          {/* Overview */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <Text style={styles.sectionTitleText}>Disease Overview</Text>
            </View>
            <Text style={styles.overviewText}>
              {alert.overview || "No detailed overview available."}
            </Text>
          </View>

          {/* Locations */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="location" size={24} color="#ef4444" />
              <Text style={styles.sectionTitleText}>Affected Locations</Text>
            </View>
            <View style={styles.locationsContainer}>
              {alert.locationsEffected.map((loc, i) => {
                const checkLoc = customLocation || userLocation.state || '';
                const isMatch = checkLoc && loc.toLowerCase().includes(checkLoc.toLowerCase());
                return (
                  <View
                    key={i}
                    style={[
                      styles.locationTag,
                      isMatch ? styles.matchedLocation : styles.normalLocation
                    ]}
                  >
                    <Text style={[
                      styles.locationTagText,
                      isMatch ? styles.matchedLocationText : styles.normalLocationText
                    ]}>
                      {loc}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Preventive Measures */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.sectionTitleText}>Preventive Measures</Text>
            </View>
            <View style={styles.preventiveContainer}>
              <Text style={styles.preventiveText}>
                {alert.preventiveMeasure || "Consult a veterinarian for tailored advice."}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: isSmallDevice ? 16 : 17,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 8,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#64748b',
  },

  // Warning Banner
  warningBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#dc2626',
    opacity: 0.8,
  },
  warningButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  warningButtonText: {
    color: 'white',
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: isSmallDevice ? 10 : 12,
    paddingHorizontal: 8,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#0f172a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
  },
  searchHint: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#64748b',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Content Layout
  contentContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTitle: {
    fontSize: isSmallDevice ? 20 : 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  resetButton: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#10b981',
    fontWeight: '600',
  },

  // Location Filter
  locationFilter: {
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  toggleContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleText: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: '#374151',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#10b981',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  locationInputContainer: {
    marginTop: 12,
  },
  locationInputLabel: {
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  locationInputIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: isSmallDevice ? 14 : 15,
    color: '#1f2937',
    fontWeight: '600',
  },

  // Type Filter
  typeFilter: {
    marginBottom: 20,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  typeOptionSelected: {
    backgroundColor: '#f0fdf4',
  },
  typeCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCheckboxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: '#4b5563',
  },
  typeTextSelected: {
    color: '#0f172a',
    fontWeight: '600',
  },

  // Location Status
  locationStatus: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#1e40af',
  },
  locationStatusText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#60a5fa',
    fontStyle: 'italic',
  },

  // Results Container
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6b7280',
  },
  resultsCountBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  locationBadgeText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#10b981',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1f2937',
    fontWeight: '600',
  },

  // Alerts Grid
  alertsGrid: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  alertCardRisk: {
    borderColor: '#fca5a5',
    shadowColor: '#ef4444',
    shadowOpacity: 0.1,
  },
  alertHeader: {
    marginBottom: 12,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#dc2626',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  alertTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertType: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertDot: {
    fontSize: 12,
    color: '#9ca3af',
  },
  alertDate: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  alertOverview: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alertOverviewText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#4b5563',
    lineHeight: 20,
  },
  locationsScroll: {
    marginBottom: 12,
  },
  locationsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  locationTag: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationTagText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  moreTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  moreTagText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  alertId: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#d1d5db',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  alertArrow: {
    backgroundColor: '#0f172a',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    backgroundColor: '#f9fafb',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  clearButton: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  clearButtonText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#10b981',
    fontWeight: '600',
  },

  bottomPadding: {
    height: 20,
  },
});

export default DiseaseAlertsDashboard;