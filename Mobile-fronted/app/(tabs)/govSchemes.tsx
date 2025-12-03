import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

// Expo Icons
import { 
  MaterialIcons,
  FontAwesome5,
  Ionicons
} from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Types
interface Scheme {
  [key: string]: string;
}

interface AppliedScheme {
  schemeName: string;
  status: 'applied' | 'not-applied' | 'pending';
  appliedAt: string;
  updatedAt: string;
}

interface SchemeCardProps {
  scheme: Scheme;
  onViewDetails: () => void;
  isSaved: boolean;
  onSaveToggle: () => void;
  appliedStatus: string | null;
}

interface SchemeDetailPageProps {
  scheme: Scheme;
  onBack: () => void;
  isSaved: boolean;
  onSaveToggle: () => void;
  appliedStatus: string | null;
  onApplyStatusChange: (status: 'applied' | 'not-applied' | 'pending') => void;
}

// Icon Components with proper typing
const HomeIcon = (props: any) => <MaterialIcons name="home" {...props} />;
const SearchIcon = (props: any) => <MaterialIcons name="search" {...props} />;
const BookmarkIcon = (props: any) => <MaterialIcons name="bookmark" {...props} />;
const BookmarkBorderIcon = (props: any) => <MaterialIcons name="bookmark-border" {...props} />;
const BookmarkCheckIcon = (props: any) => <MaterialIcons name="bookmark-check" {...props} />;
const ArrowBackIcon = (props: any) => <MaterialIcons name="arrow-back" {...props} />;
const DownloadIcon = (props: any) => <MaterialIcons name="download" {...props} />;
const InfoIcon = (props: any) => <MaterialIcons name="info" {...props} />;
const CalendarIcon = (props: any) => <MaterialIcons name="calendar-today" {...props} />;
const PeopleIcon = (props: any) => <MaterialIcons name="people" {...props} />;
const ListIcon = (props: any) => <MaterialIcons name="list" {...props} />;
const DescriptionIcon = (props: any) => <MaterialIcons name="description" {...props} />;
const ShieldIcon = (props: any) => <MaterialIcons name="security" {...props} />;
const ClockIcon = (props: any) => <MaterialIcons name="access-time" {...props} />;
const CheckIcon = (props: any) => <MaterialIcons name="check" {...props} />;
const CloseIcon = (props: any) => <MaterialIcons name="close" {...props} />;
const StarIcon = (props: any) => <MaterialIcons name="star" {...props} />;
const HistoryIcon = (props: any) => <MaterialIcons name="history" {...props} />;
const CheckCircleIcon = (props: any) => <MaterialIcons name="check-circle" {...props} />;
const CancelIcon = (props: any) => <MaterialIcons name="cancel" {...props} />;
const PendingIcon = (props: any) => <MaterialIcons name="pending" {...props} />;
const OpenInNewIcon = (props: any) => <MaterialIcons name="open-in-new" {...props} />;
const PhoneIcon = (props: any) => <MaterialIcons name="phone" {...props} />;
const EmailIcon = (props: any) => <MaterialIcons name="email" {...props} />;
const LocationIcon = (props: any) => <MaterialIcons name="location-on" {...props} />;
const ChevronRightIcon = (props: any) => <MaterialIcons name="chevron-right" {...props} />;
const FilterIcon = (props: any) => <MaterialIcons name="filter-list" {...props} />;
const GlobeIcon = (props: any) => <FontAwesome5 name="globe" {...props} />;
const PigIcon = (props: any) => <FontAwesome5 name="piggy-bank" {...props} />;
const ChickenIcon = (props: any) => <FontAwesome5 name="egg" {...props} />;
const BuildingIcon = (props: any) => <FontAwesome5 name="building" {...props} />;
const RupeeIcon = (props: any) => <FontAwesome5 name="rupee-sign" {...props} />;
const AwardIcon = (props: any) => <FontAwesome5 name="award" {...props} />;
const TargetIcon = (props: any) => <Ionicons name="target" {...props} />;

export default function GovtScheme() {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/11oh6nVyIGXoy9oTfA_UWgAD3JxCvVeO0K4n9ncqVeyw/export?format=csv";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [selectedAnimalFilter, setSelectedAnimalFilter] = useState("All");
  const [currentView, setCurrentView] = useState<"list" | "detail">("list");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedSchemes, setSavedSchemes] = useState<string[]>([]);
  const [appliedSchemes, setAppliedSchemes] = useState<AppliedScheme[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchSchemes();
      await loadLocalData();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const response = await fetch(SHEET_URL);
      const csvData = await response.text();
      
      // Parse CSV data manually (simple approach)
    // Split full CSV
const lines = csvData.split('\n');

const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

// Data rows
const data = lines.slice(1).map(line => {
  const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
  const obj: Scheme = {};
  headers.forEach((header, index) => {
    obj[header] = values[index] || '';
  });
  return obj;
}).filter(item => item["Govt Scheme Name"]);

     

      setSchemes(data);
      setFilteredSchemes(data);
    } catch (error) {
      console.error("Error fetching schemes:", error);
      Alert.alert("Error", "Failed to load schemes. Please check your connection.");
    }
  };

  const loadLocalData = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedSchemes');
      const applied = await AsyncStorage.getItem('appliedSchemes');
      
      if (saved) setSavedSchemes(JSON.parse(saved));
      if (applied) setAppliedSchemes(JSON.parse(applied));
    } catch (error) {
      console.error("Error loading local data:", error);
    }
  };

  useEffect(() => {
    filterSchemes();
  }, [selectedAnimalFilter, searchQuery, savedSchemes, appliedSchemes, activeTab, schemes]);

  const filterSchemes = () => {
    let filtered = [...schemes];
    
    if (selectedAnimalFilter !== "All") {
      filtered = filtered.filter(scheme => {
        const schemeName = scheme["Govt Scheme Name"]?.toLowerCase() || "";
        const schemeDescription = scheme["Scheme Description"]?.toLowerCase() || "";
        
        if (selectedAnimalFilter === "Pig") {
          return schemeName.includes("pig") || 
                 schemeDescription.includes("pig");
        }
        
        if (selectedAnimalFilter === "Poultry") {
          return schemeName.includes("poultry") || 
                 schemeDescription.includes("poultry") ||
                 schemeDescription.includes("chicken");
        }
        
        return true;
      });
    }
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(scheme => {
        return (
          scheme["Govt Scheme Name"]?.toLowerCase().includes(searchLower) ||
          scheme["Scheme Description"]?.toLowerCase().includes(searchLower) ||
          scheme["Ministry / Department Name"]?.toLowerCase().includes(searchLower)
        );
      });
    }

    if (activeTab === "saved") {
      filtered = filtered.filter(scheme => 
        savedSchemes.includes(scheme["Govt Scheme Name"])
      );
    } else if (activeTab === "applied") {
      const appliedSchemeNames = appliedSchemes.map(app => app.schemeName);
      filtered = filtered.filter(scheme => 
        appliedSchemeNames.includes(scheme["Govt Scheme Name"])
      );
    }
    
    setFilteredSchemes(filtered);
  };

  const handleViewDetails = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedScheme(null);
  };

  const handleSaveScheme = async (schemeId: string) => {
    try {
      let updatedSaved: string[];
      if (savedSchemes.includes(schemeId)) {
        updatedSaved = savedSchemes.filter(id => id !== schemeId);
      } else {
        updatedSaved = [...savedSchemes, schemeId];
      }
      setSavedSchemes(updatedSaved);
      await AsyncStorage.setItem('savedSchemes', JSON.stringify(updatedSaved));
    } catch (error) {
      console.error("Error saving scheme:", error);
    }
  };

  const handleApplyStatus = async (schemeName: string, status: 'applied' | 'not-applied' | 'pending') => {
    try {
      const existingIndex = appliedSchemes.findIndex(app => app.schemeName === schemeName);
      
      let updatedApplied: AppliedScheme[];
      if (existingIndex >= 0) {
        updatedApplied = [...appliedSchemes];
        updatedApplied[existingIndex] = {
          ...updatedApplied[existingIndex],
          status,
          updatedAt: new Date().toISOString()
        };
      } else {
        updatedApplied = [
          ...appliedSchemes,
          {
            schemeName,
            status,
            appliedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      setAppliedSchemes(updatedApplied);
      await AsyncStorage.setItem('appliedSchemes', JSON.stringify(updatedApplied));
    } catch (error) {
      console.error("Error saving application status:", error);
    }
  };

  const getAppliedStatus = (schemeName: string): string | null => {
    const applied = appliedSchemes.find(app => app.schemeName === schemeName);
    return applied ? applied.status : null;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchemes();
    setRefreshing(false);
  };

  const animalFilters = [
    { id: "All", label: "All", icon: "globe" },
    { id: "Pig", label: "Pig", icon: "pig" },
    { id: "Poultry", label: "Poultry", icon: "chicken" }
  ];

  const renderSchemeCard = ({ item }: { item: Scheme }) => (
    <SchemeCard
      scheme={item}
      onViewDetails={() => handleViewDetails(item)}
      isSaved={savedSchemes.includes(item["Govt Scheme Name"])}
      onSaveToggle={() => handleSaveScheme(item["Govt Scheme Name"])}
      appliedStatus={getAppliedStatus(item["Govt Scheme Name"])}
    />
  );

  if (currentView === "detail" && selectedScheme) {
    return (
      <SchemeDetailPage
        scheme={selectedScheme}
        onBack={handleBackToList}
        isSaved={savedSchemes.includes(selectedScheme["Govt Scheme Name"])}
        onSaveToggle={() => handleSaveScheme(selectedScheme["Govt Scheme Name"])}
        appliedStatus={getAppliedStatus(selectedScheme["Govt Scheme Name"])}
        onApplyStatusChange={(status) => handleApplyStatus(selectedScheme["Govt Scheme Name"], status)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Mobile-Optimized Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
           
            <View>
              <Text style={styles.appName}>FarmSeva</Text>
              <Text style={styles.appTagline}>Govt Schemes Portal</Text>
            </View>
          </View>
          <View style={styles.statsBadge}>
            <Text style={styles.statNumber}>{schemes.length}</Text>
            <Text style={styles.statLabel}>Schemes</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schemes..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <CloseIcon size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
     <View style={{ height: 60, paddingVertical: 8, backgroundColor: "#fff" }}>
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    style={styles.tabsContainer}
    contentContainerStyle={styles.tabsContent}
  >
    <TouchableOpacity
      style={[styles.tab, activeTab === "all" && styles.activeTab]}
      onPress={() => setActiveTab("all")}
    >
      <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
        All
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tab, activeTab === "saved" && styles.activeTab]}
      onPress={() => setActiveTab("saved")}
    >
      <BookmarkIcon size={16} color={activeTab === "saved" ? "#ffffff" : "#6b7280"} />
      <Text style={[styles.tabText, activeTab === "saved" && styles.activeTabText]}>
        Saved ({savedSchemes.length})
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tab, activeTab === "applied" && styles.activeTab]}
      onPress={() => setActiveTab("applied")}
    >
      <HistoryIcon size={16} color={activeTab === "applied" ? "#ffffff" : "#6b7280"} />
      <Text style={[styles.tabText, activeTab === "applied" && styles.activeTabText]}>
        Applied ({appliedSchemes.length})
      </Text>
    </TouchableOpacity>
  </ScrollView>
</View>


      {/* Filters */}
      <View style={styles.filtersContainer} >
        <Text style={styles.filtersTitle}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            {animalFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedAnimalFilter === filter.id && styles.activeFilterButton
                ]}
                onPress={() => setSelectedAnimalFilter(filter.id)}
              >
                {filter.icon === "globe" && <GlobeIcon size={16} color={selectedAnimalFilter === filter.id ? "#ffffff" : "#374151"} />}
                {filter.icon === "pig" && <PigIcon size={16} color={selectedAnimalFilter === filter.id ? "#ffffff" : "#374151"} />}
                {filter.icon === "chicken" && <ChickenIcon size={16} color={selectedAnimalFilter === filter.id ? "#ffffff" : "#374151"} />}
                <Text style={[
                  styles.filterButtonText,
                  selectedAnimalFilter === filter.id && styles.activeFilterButtonText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {activeTab === "saved" ? "Saved Schemes" : 
           activeTab === "applied" ? "Applied History" : 
           "Available Schemes"}
        </Text>
        <Text style={styles.resultsCount}>
          {filteredSchemes.length} schemes
        </Text>
      </View>

      {/* Content */}
      <FlatList
        data={filteredSchemes}
        renderItem={renderSchemeCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#111827" />
              <Text style={styles.loadingText}>Loading schemes...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <SearchIcon size={50} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No schemes found</Text>
              <Text style={styles.emptyText}>Try different search or filters</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function SchemeCard({ scheme, onViewDetails, isSaved, onSaveToggle, appliedStatus }: SchemeCardProps) {
  const getAnimalIcon = () => {
    const name = scheme["Govt Scheme Name"]?.toLowerCase() || "";
    const desc = scheme["Scheme Description"]?.toLowerCase() || "";
    
    if (name.includes("pig") || desc.includes("pig")) 
      return <PigIcon size={22} color="#374151" />;
    if (name.includes("poultry") || desc.includes("poultry") || desc.includes("chicken")) 
      return <ChickenIcon size={22} color="#374151" />;
    return <GlobeIcon size={22} color="#374151" />;
  };

  const getStatusBadge = () => {
    switch(appliedStatus) {
      case 'applied':
        return (
          <View style={[styles.cardStatusBadge, { backgroundColor: '#10b981' }]}>
            <CheckCircleIcon size={12} color="#ffffff" />
            <Text style={styles.cardStatusText}>Applied</Text>
          </View>
        );
      case 'not-applied':
        return (
          <View style={[styles.cardStatusBadge, { backgroundColor: '#ef4444' }]}>
            <CancelIcon size={12} color="#ffffff" />
            <Text style={styles.cardStatusText}>Not Applied</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.cardStatusBadge, { backgroundColor: '#f59e0b' }]}>
            <PendingIcon size={12} color="#ffffff" />
            <Text style={styles.cardStatusText}>In Progress</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const amount = scheme["Benefits Provided"]?.match(/₹[\d,]+|Up to [\d,]+|Rs\.[\d,]+/)?.[0] || "Variable";
  const ministry = scheme["Ministry / Department Name"] || "Government of India";

  return (
    <TouchableOpacity style={styles.card} onPress={onViewDetails} activeOpacity={0.9}>
      <View style={styles.cardContent}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            {getAnimalIcon()}
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {scheme["Govt Scheme Name"]}
            </Text>
            <View style={styles.cardSubtitle}>
              <BuildingIcon size={12} color="#6b7280" />
              <Text style={styles.cardSubtitleText} numberOfLines={1}>
                {ministry}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onSaveToggle();
            }} 
            style={styles.cardBookmark}
          >
            {isSaved ? (
              <BookmarkCheckIcon size={22} color="#111827" />
            ) : (
              <BookmarkBorderIcon size={22} color="#9ca3af" />
            )}
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.cardDescription} numberOfLines={2}>
          {scheme["Scheme Description"]}
        </Text>

        {/* Benefits */}
        <View style={styles.cardBenefits}>
          <RupeeIcon size={16} color="#374151" />
          <Text style={styles.cardBenefitsText} numberOfLines={1}>
            {amount}
          </Text>
        </View>

        {/* Status and Action */}
        <View style={styles.cardFooter}>
          <View style={styles.cardBadges}>
            {getStatusBadge()}
            <View style={[styles.cardStatusBadge, { backgroundColor: '#f3f4f6' }]}>
              <ShieldIcon size={12} color="#374151" />
              <Text style={[styles.cardStatusText, { color: '#374151' }]}>Verified</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cardActionButton} onPress={onViewDetails}>
            <Text style={styles.cardActionText}>View</Text>
            <ChevronRightIcon size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SchemeDetailPage({ scheme, onBack, isSaved, onSaveToggle, appliedStatus, onApplyStatusChange }: SchemeDetailPageProps) {
  const [webViewVisible, setWebViewVisible] = useState(false);

  const handleOpenLink = async (url: string | undefined) => {
    try {
      if (!url) {
        Alert.alert("No Link", "Application link is not available");
        return;
      }
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link");
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Error", "Failed to open link");
    }
  };

  const parseBenefits = (benefitsText: string) => {
    if (!benefitsText) return [];
    return benefitsText.split(/\.\s+/).filter(item => item.trim()).map(item => item.trim() + '.');
  };

  const benefitsList = parseBenefits(scheme["Benefits Provided"] || '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Detail Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.detailBackButton} onPress={onBack}>
          <ArrowBackIcon size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle} numberOfLines={1}>
          Scheme Details
        </Text>
        <TouchableOpacity
          style={styles.detailSaveButton}
          onPress={onSaveToggle}
        >
          {isSaved ? (
            <BookmarkCheckIcon size={22} color="#111827" />
          ) : (
            <BookmarkBorderIcon size={22} color="#374151" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
        {/* Scheme Title */}
        <View style={styles.detailHero}>
          <Text style={styles.detailTitle}>
            {scheme["Govt Scheme Name"]}
          </Text>
          <View style={styles.detailCategory}>
            <GlobeIcon size={16} color="#6b7280" />
            <Text style={styles.detailCategoryText}>
              {scheme["Ministry / Department Name"] || "Government Scheme"}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Description</Text>
          <Text style={styles.detailDescription}>
            {scheme["Scheme Description"]}
          </Text>
        </View>

        {/* Benefits */}
        {scheme["Benefits Provided"] && (
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <RupeeIcon size={20} color="#111827" />
              <Text style={styles.detailSectionTitle}>Benefits</Text>
            </View>
            {benefitsList.length > 0 ? (
              benefitsList.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitBullet}>
                    <Text style={styles.benefitBulletText}>•</Text>
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.detailText}>
                {scheme["Benefits Provided"]}
              </Text>
            )}
          </View>
        )}

        {/* Eligibility */}
        {scheme["Eligibility Requirements"] && (
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <PeopleIcon size={20} color="#111827" />
              <Text style={styles.detailSectionTitle}>Eligibility</Text>
            </View>
            <Text style={styles.detailText}>
              {scheme["Eligibility Requirements"]}
            </Text>
          </View>
        )}

        {/* Documents */}
        {scheme["Required Documents"] && (
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <ListIcon size={20} color="#111827" />
              <Text style={styles.detailSectionTitle}>Documents Required</Text>
            </View>
            <Text style={styles.detailText}>
              {scheme["Required Documents"]}
            </Text>
          </View>
        )}

        {/* How to Apply */}
        {scheme["How To Apply"] && (
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <DescriptionIcon size={20} color="#111827" />
              <Text style={styles.detailSectionTitle}>How to Apply</Text>
            </View>
            <Text style={styles.detailText}>
              {scheme["How To Apply"]}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleOpenLink(scheme["Website Link"])}
          >
            <Text style={styles.primaryButtonText}>Apply Online</Text>
            <OpenInNewIcon size={18} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleOpenLink(scheme["PDF Link"])}
          >
            <DownloadIcon size={18} color="#111827" />
            <Text style={styles.secondaryButtonText}>Download Form</Text>
          </TouchableOpacity>
        </View>

        {/* Applied Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Application Status</Text>
          <View style={styles.statusOptions}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                appliedStatus === 'applied' && styles.statusOptionActive
              ]}
              onPress={() => onApplyStatusChange('applied')}
            >
              <View style={[
                styles.statusRadio,
                appliedStatus === 'applied' && styles.statusRadioActive
              ]}>
                {appliedStatus === 'applied' && <CheckIcon size={14} color="#ffffff" />}
              </View>
              <Text style={[
                styles.statusOptionText,
                appliedStatus === 'applied' && styles.statusOptionTextActive
              ]}>Applied</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusOption,
                appliedStatus === 'not-applied' && styles.statusOptionNotApplied
              ]}
              onPress={() => onApplyStatusChange('not-applied')}
            >
              <View style={[
                styles.statusRadio,
                appliedStatus === 'not-applied' && styles.statusRadioNotApplied
              ]}>
                {appliedStatus === 'not-applied' && <CloseIcon size={14} color="#ffffff" />}
              </View>
              <Text style={[
                styles.statusOptionText,
                appliedStatus === 'not-applied' && styles.statusOptionTextActive
              ]}>Not Applied</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusOption,
                appliedStatus === 'pending' && styles.statusOptionPending
              ]}
              onPress={() => onApplyStatusChange('pending')}
            >
              <View style={[
                styles.statusRadio,
                appliedStatus === 'pending' && styles.statusRadioPending
              ]}>
                {appliedStatus === 'pending' && <PendingIcon size={14} color="#ffffff" />}
              </View>
              <Text style={[
                styles.statusOptionText,
                appliedStatus === 'pending' && styles.statusOptionTextActive
              ]}>In Progress</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Info */}
        {scheme["AI Overview"] && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <InfoIcon size={20} color="#111827" />
              <Text style={styles.infoTitle}>Additional Information</Text>
            </View>
            <Text style={styles.infoText}>
              {scheme["AI Overview"]}
            </Text>
          </View>
        )}

        {/* Quick Info */}
        <View style={styles.quickInfoSection}>
          <View style={styles.quickInfoItem}>
            <ShieldIcon size={18} color="#6b7280" />
            <Text style={styles.quickInfoLabel}>Status</Text>
            <Text style={styles.quickInfoValue}>Active & Verified</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <ClockIcon size={18} color="#6b7280" />
            <Text style={styles.quickInfoLabel}>Processing</Text>
            <Text style={styles.quickInfoValue}>15-30 days</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <CheckIcon size={18} color="#6b7280" />
            <Text style={styles.quickInfoLabel}>Success Rate</Text>
            <Text style={styles.quickInfoValue}>92%</Text>
          </View>
        </View>
      </ScrollView>

      {/* WebView Modal */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        onRequestClose={() => setWebViewVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setWebViewVisible(false)}>
              <CloseIcon size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Application Form</Text>
          </View>
          {scheme["PDF Link"] && (
            <WebView
              source={{ uri: scheme["PDF Link"] }}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  // Mobile Header
  mobileHeader: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#111827",
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#111827",
  },
  appTagline: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statsBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: "#111827",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  clearButton: {
    padding: 4,
  },
  // Tabs
  tabsContainer: {
    marginBottom: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
  },
  activeTab: {
    backgroundColor: "#111827",
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: "#6b7280",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#ffffff",
  },
  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: "#374151",
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: "#374151",
    marginLeft: 6,
  },
  activeFilterButtonText: {
    color: "#ffffff",
  },
  // Results
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#111827",
  },
  resultsCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  // List Content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    
  },
  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
  // Empty State
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: 'center',
  },
  // Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitleText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  cardBookmark: {
    padding: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 20,
  },
  cardBenefits: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBenefitsText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#111827",
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: "#ffffff",
    marginLeft: 4,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#111827",
    borderRadius: 8,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: "#ffffff",
    marginRight: 4,
  },
  // Detail Page Styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailBackButton: {
    padding: 4,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: "#111827",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  detailSaveButton: {
    padding: 4,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  detailHero: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: "#111827",
    marginBottom: 8,
  },
  detailCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailCategoryText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 6,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#111827",
    marginLeft: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  detailText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  benefitBullet: {
    width: 24,
    alignItems: 'center',
  },
  benefitBulletText: {
    fontSize: 16,
    color: "#374151",
  },
  benefitText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
    lineHeight: 24,
  },
  actionButtons: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: "#111827",
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#ffffff",
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#111827",
    marginLeft: 8,
  },
  statusSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#111827",
    marginBottom: 12,
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  statusOptionActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  statusOptionNotApplied: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  statusOptionPending: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  statusRadio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusRadioActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  statusRadioNotApplied: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  statusRadioPending: {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b",
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: "#374151",
  },
  statusOptionTextActive: {
    color: "#111827",
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#111827",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  quickInfoSection: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: "#111827",
    marginTop: 2,
  },
  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: "#111827",
    marginLeft: 16,
  },
});