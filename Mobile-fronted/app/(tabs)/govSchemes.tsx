import React, { useEffect, useState } from "react";
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
  Share
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import Papa from 'papaparse';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isLargeDevice = width > 414;

interface Scheme {
  "Govt Scheme Name": string;
  "Scheme Description": string;
  "Ministry / Department Name": string;
  "Benefits Provided": string;
  "Eligibility Requirements": string;
  "How To Apply": string;
  "Required Documents": string;
  "Website Link": string;
  "PDF Link": string;
  "Document Link": string;
  "AI Overview": string;
  [key: string]: string;
}

interface AppliedScheme {
  schemeName: string;
  status: 'applied' | 'pending' | 'not-applied';
  appliedAt: string;
  updatedAt: string;
}

export default function GovtScheme() {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/11oh6nVyIGXoy9oTfA_UWgAD3JxCvVeO0K4n9ncqVeyw/export?format=csv";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [currentView, setCurrentView] = useState<"list" | "detail">("list");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedSchemes, setSavedSchemes] = useState<string[]>([]);
  const [appliedSchemes, setAppliedSchemes] = useState<AppliedScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCSVData();
    loadSavedData();
  }, []);

  const fetchCSVData = async () => {
    try {
      setLoading(true);
      const response = await fetch(SHEET_URL);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        complete: (result: any) => {
          const rawData = result.data.slice(2) as Scheme[];

          // Strict Filtering Logic
          const allowedData = rawData.filter(scheme => {
            const text = (scheme["Govt Scheme Name"] + " " + scheme["Scheme Description"]).toLowerCase();

            // Allow if Pig or Poultry
            if (text.includes("pig") || text.includes("swine") || text.includes("poultry") || text.includes("chicken") || text.includes("hen") || text.includes("duck")) {
              return true;
            }

            // Exclude other specific animals
            if (text.includes("dairy") || text.includes("cattle") || text.includes("cow") || text.includes("buffalo") ||
              text.includes("fish") || text.includes("fishery") || text.includes("aquaculture") ||
              text.includes("sheep") || text.includes("goat") || text.includes("silk") || text.includes("bee")) {
              return false;
            }

            // Allow General (neither explicitly allowed animals nor explicitly excluded ones)
            return true;
          });

          setSchemes(allowedData);
          setFilteredSchemes(allowedData);

          // Analyze data to find categories for allowed schemes
          const foundCategories = new Set<string>();
          allowedData.forEach(scheme => {
            const text = (scheme["Govt Scheme Name"] + " " + scheme["Scheme Description"]).toLowerCase();
            if (text.includes("pig") || text.includes("swine")) foundCategories.add("Pig Farming");
            if (text.includes("poultry") || text.includes("chicken") || text.includes("hen")) foundCategories.add("Poultry Farming");
          });
          // Always add General if not empty
          foundCategories.add("General Agriculture");

          setCategories(Array.from(foundCategories));
          setLoading(false);
        },
        error: (error: any) => {
          console.error('CSV Parse Error:', error);
          Alert.alert('Error', 'Failed to load schemes data');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Error', 'Failed to fetch data');
      setLoading(false);
    }
  };

  const loadSavedData = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedSchemes');
      const applied = await AsyncStorage.getItem('appliedSchemes');

      if (saved) setSavedSchemes(JSON.parse(saved));
      if (applied) setAppliedSchemes(JSON.parse(applied));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveAppliedSchemes = async (data: AppliedScheme[]) => {
    try {
      await AsyncStorage.setItem('appliedSchemes', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving applied schemes:', error);
    }
  };

  useEffect(() => {
    let filtered = schemes;

    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(scheme => {
        const searchLower = searchQuery.toLowerCase();
        return (
          scheme["Govt Scheme Name"]?.toLowerCase().includes(searchLower) ||
          scheme["Scheme Description"]?.toLowerCase().includes(searchLower) ||
          scheme["Ministry / Department Name"]?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Category Filters
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(scheme => {
        const text = (scheme["Govt Scheme Name"] + " " + scheme["Scheme Description"] || "").toLowerCase();
        return selectedCategories.some(cat => {
          if (cat === "Pig Farming") return text.includes("pig") || text.includes("swine");
          if (cat === "Poultry Farming") return text.includes("poultry") || text.includes("chicken") || text.includes("hen");
          if (cat === "General Agriculture") {
            // General logic: Not Pig and Not Poultry
            const isPig = text.includes("pig") || text.includes("swine");
            const isPoultry = text.includes("poultry") || text.includes("chicken") || text.includes("hen");
            return !isPig && !isPoultry;
          }
          return false;
        });
      });
    }

    setFilteredSchemes(filtered);
  }, [schemes, searchQuery, selectedCategories]);

  const handleViewDetails = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedScheme(null);
  };

  const handleSaveScheme = async (schemeId: string) => {
    let updatedSaved: string[];
    if (savedSchemes.includes(schemeId)) {
      updatedSaved = savedSchemes.filter(id => id !== schemeId);
    } else {
      updatedSaved = [...savedSchemes, schemeId];
    }
    setSavedSchemes(updatedSaved);

    try {
      await AsyncStorage.setItem('savedSchemes', JSON.stringify(updatedSaved));
    } catch (error) {
      console.error('Error saving scheme:', error);
    }
  };

  const handleApplyStatus = async (schemeName: string, status: 'applied' | 'pending' | 'not-applied') => {
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
    await saveAppliedSchemes(updatedApplied);
  };

  const getAppliedStatus = (schemeName: string): 'applied' | 'pending' | 'not-applied' | null => {
    const applied = appliedSchemes.find(app => app.schemeName === schemeName);
    return applied ? applied.status : null;
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCSVData();
    setRefreshing(false);
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading schemes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { }}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Government Schemes</Text>
          <Text style={styles.subtitle}>Farmer Personalized Schemes</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for schemes, subsidies, or farming types..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.searchHint}>
            <Ionicons name="information-circle" size={16} color="#666" /> Try searching for specific terms like "Tractor Subsidy" or "Kisan Credit Card"
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter By</Text>
            {selectedCategories.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedCategories([])}>
                <Text style={styles.resetButton}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>Scheme Category</Text>
            <View style={styles.categoryChips}>
              {categories.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(cat) && styles.categoryChipSelected
                  ]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategories.includes(cat) && styles.categoryChipTextSelected
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsCount}>
              We found <Text style={styles.resultsCountBold}>{filteredSchemes.length}</Text> farmer personalized schemes
            </Text>
            <View style={styles.resultsActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="people" size={14} color="#3b82f6" />
                <Text style={styles.actionText}> Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort :</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortText}>Relevance</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scheme List */}
        <View style={styles.schemeList}>
          {filteredSchemes.map((scheme, i) => (
            <SchemeCard
              key={i}
              scheme={scheme}
              onPress={() => handleViewDetails(scheme)}
            />
          ))}

          {filteredSchemes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#ccc" style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateText}>No schemes found matching your criteria.</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SchemeCard({ scheme, onPress }: { scheme: Scheme; onPress: () => void }) {
  const getTags = () => {
    const tags: string[] = [];
    const name = scheme["Govt Scheme Name"]?.toLowerCase() || "";
    const desc = scheme["Scheme Description"]?.toLowerCase() || "";

    // Auto-generate some tags based on content
    if (name.includes("sc") || name.includes("st")) tags.push("Scheduled Caste");
    if (name.includes("tribe")) tags.push("Scheduled Tribe");
    if (name.includes("woman") || name.includes("women") || name.includes("female")) tags.push("Women Farmers");

    // Farmer centric tags
    if (name.includes("pig") || desc.includes("pig")) tags.push("Pig Farming");
    if (name.includes("poultry") || desc.includes("poultry")) tags.push("Poultry Farming");
    if (name.includes("fish") || desc.includes("fish")) tags.push("Fisheries");
    if (name.includes("dairy") || desc.includes("dairy")) tags.push("Dairy Farming");

    // Always have some default tags if none matched
    if (tags.length === 0) tags.push("General Agriculture");
    if (scheme["Ministry / Department Name"]) tags.push(scheme["Ministry / Department Name"]);

    return tags.slice(0, 4);
  };

  return (
    <TouchableOpacity style={styles.schemeCard} onPress={onPress}>
      <Text style={styles.schemeCardTitle}>{scheme["Govt Scheme Name"]}</Text>
      <Text style={styles.schemeCardDepartment}>
        {scheme["Ministry / Department Name"] || "Government of India"}
      </Text>

      <Text style={styles.schemeCardDescription} numberOfLines={2}>
        {scheme["Scheme Description"]}
      </Text>

      <View style={styles.schemeCardTags}>
        {getTags().map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const DUMMY_NEWS = [
  {
    id: 1,
    title: "PM-KISAN 16th Installment Released",
    date: "Feb 28, 2024",
    link: "#"
  },
  {
    id: 2,
    title: "New Subsidy Rates for Fertilizers Announced",
    date: "Mar 05, 2024",
    link: "#"
  },
  {
    id: 3,
    title: "Agri-Infrastructure Fund reaches new milestone",
    date: "Mar 10, 2024",
    link: "#"
  }
];

function SchemeDetailPage({
  scheme,
  onBack,
  isSaved,
  onSaveToggle,
  appliedStatus,
  onApplyStatusChange
}: {
  scheme: Scheme;
  onBack: () => void;
  isSaved: boolean;
  onSaveToggle: () => void;
  appliedStatus: 'applied' | 'pending' | 'not-applied' | null;
  onApplyStatusChange: (status: 'applied' | 'pending' | 'not-applied') => void;
}) {
  const [activeSection, setActiveSection] = useState("details");

  const sections = [
    { id: "details", label: "Details", icon: "document-text" },
    { id: "benefits", label: "Benefits", icon: "gift" },
    { id: "eligibility", label: "Eligibility", icon: "checkmark-circle" },
    { id: "application", label: "Application Process", icon: "clipboard" },
    { id: "documents", label: "Documents Required", icon: "folder" },
    { id: "faq", label: "Frequently Asked Questions", icon: "help-circle" },
    { id: "sources", label: "Sources And References", icon: "link" },
    { id: "feedback", label: "Feedback", icon: "chatbubble" }
  ];

  const handleOpenLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the link');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this government scheme: ${scheme["Govt Scheme Name"]} - ${scheme["Scheme Description"]}`,
        url: scheme["Website Link"],
        title: scheme["Govt Scheme Name"]
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share scheme');
    }
  };

  const parseBenefits = (benefitsText: string) => {
    if (!benefitsText) return [];
    const items = benefitsText.split(/(?:\d+\.\s)/).filter(item => item.trim());
    if (items.length <= 1) {
      return benefitsText.split(/\.\s+/).filter(item => item.trim()).map(item => item + '.');
    }
    return items;
  };

  const ministry = scheme["Ministry / Department Name"] || "Government of India";
  const benefitsList = parseBenefits(scheme["Benefits Provided"]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "details":
        return (
          <View>
            <Text style={styles.detailContentText}>{scheme["Scheme Description"]}</Text>
            {scheme["AI Overview"] && (
              <View style={styles.overviewBox}>
                <View style={styles.overviewHeader}>
                  <Ionicons name="information-circle" size={24} color="#1e40af" />
                  <Text style={styles.overviewTitle}>Overview</Text>
                </View>
                <Text style={styles.overviewText}>{scheme["AI Overview"]}</Text>
              </View>
            )}
          </View>
        );

      case "benefits":
        return (
          <View>
            {benefitsList.length > 0 ? (
              <View style={styles.benefitsList}>
                {benefitsList.map((benefit, i) => (
                  <View key={i} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.detailContentText}>{scheme["Benefits Provided"] || "Contact authorities for details."}</Text>
            )}
          </View>
        );

      case "eligibility":
        return (
          <Text style={styles.detailContentText}>
            {scheme["Eligibility Requirements"] || "See official guidelines."}
          </Text>
        );

      case "application":
        return (
          <View>
            <Text style={styles.detailContentText}>
              {scheme["How To Apply"] || "Visit the official website."}
            </Text>
            <TouchableOpacity
              style={styles.officialButton}
              onPress={() => handleOpenLink(scheme["Website Link"])}
            >
              <Text style={styles.officialButtonText}>Visit Official Website</Text>
              <Ionicons name="open-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        );

      case "documents":
        return (
          <View>
            <Text style={styles.detailContentText}>
              {scheme["Required Documents"] || "Check the official brochure."}
            </Text>
            {(scheme["PDF Link"] || scheme["Document Link"]) && (
              <TouchableOpacity
                style={styles.pdfLink}
                onPress={() => handleOpenLink(scheme["PDF Link"] || scheme["Document Link"] || "")}
              >
                <Ionicons name="document-text" size={22} color="#007AFF" />
                <Text style={styles.pdfLinkText}>Download Application Form / Guidelines (PDF)</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case "faq":
        return (
          <Text style={styles.detailContentText}>No FAQs available regarding this scheme.</Text>
        );

      case "sources":
        return (
          <Text style={styles.detailContentText}>Data provided by Ministry of Agriculture.</Text>
        );

      case "feedback":
        return (
          <View>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Was this information helpful?"
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.detailContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={styles.detailBackButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.detailBackText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Scheme Header */}
        <View style={styles.schemeHeader}>
          <Text style={styles.schemeMinistry}>{ministry}</Text>
          <View style={styles.schemeTitleRow}>
            <Text style={styles.schemeTitle}>{scheme["Govt Scheme Name"]}</Text>
            <TouchableOpacity onPress={onSaveToggle} style={styles.saveButton}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={32}
                color={isSaved ? "#007AFF" : "#666"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.schemeTags}>
            {scheme["Govt Scheme Name"].includes("Coaching") && (
              <View style={styles.schemeTag}>
                <Text style={styles.schemeTagText}>Coaching</Text>
              </View>
            )}
            <View style={styles.schemeTag}>
              <Text style={styles.schemeTagText}>Farmers</Text>
            </View>
            {scheme["Govt Scheme Name"].toLowerCase().includes("sc") && (
              <View style={styles.schemeTag}>
                <Text style={styles.schemeTagText}>Scheduled Caste</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleOpenLink(scheme["Website Link"])}
          >
            <Text style={styles.applyButtonText}>Apply on Official Portal</Text>
            <Ionicons name="open-outline" size={20} color="white" />
          </TouchableOpacity>

          {(scheme["PDF Link"] || scheme["Document Link"]) && (
            <TouchableOpacity
              style={styles.pdfLink}
              onPress={() => handleOpenLink(scheme["PDF Link"] || scheme["Document Link"] || "")}
            >
              <Ionicons name="document-text" size={22} color="#007AFF" />
              <Text style={styles.pdfLinkText}>Download Application Form / Guidelines (PDF)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Section */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Application Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                appliedStatus === 'applied' && styles.statusApplied
              ]}
              onPress={() => onApplyStatusChange('applied')}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={appliedStatus === 'applied' ? "white" : "#666"}
              />
              <Text style={[
                styles.statusButtonText,
                appliedStatus === 'applied' && styles.statusButtonTextActive
              ]}>
                Applied
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                appliedStatus === 'pending' && styles.statusPending
              ]}
              onPress={() => onApplyStatusChange('pending')}
            >
              <Ionicons
                name="time"
                size={20}
                color={appliedStatus === 'pending' ? "white" : "#666"}
              />
              <Text style={[
                styles.statusButtonText,
                appliedStatus === 'pending' && styles.statusButtonTextActive
              ]}>
                In Progress
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                appliedStatus === 'not-applied' && styles.statusNotApplied
              ]}
              onPress={() => onApplyStatusChange('not-applied')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={appliedStatus === 'not-applied' ? "white" : "#666"}
              />
              <Text style={[
                styles.statusButtonText,
                appliedStatus === 'not-applied' && styles.statusButtonTextActive
              ]}>
                Not Applied
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Navigation */}
        <View style={styles.sectionNavContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sectionNavScroll}
            contentContainerStyle={styles.sectionNavContent}
          >
            {sections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.sectionNavButton,
                  activeSection === section.id && styles.sectionNavButtonActive
                ]}
                onPress={() => setActiveSection(section.id)}
              >
                <Ionicons
                  name={section.icon as any}
                  size={20}
                  color={activeSection === section.id ? "#3b82f6" : "#666"}
                  style={styles.sectionNavIcon}
                />
                <Text style={[
                  styles.sectionNavText,
                  activeSection === section.id && styles.sectionNavTextActive
                ]}>
                  {section.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section Content */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {sections.find(s => s.id === activeSection)?.label}
          </Text>
          {renderSectionContent()}
        </View>

        {/* News Section */}
        <View style={styles.newsContainer}>
          <Text style={styles.newsTitle}>News and Updates</Text>
          <View style={styles.newsList}>
            {DUMMY_NEWS.map(news => (
              <TouchableOpacity key={news.id} style={styles.newsItem}>
                <Text style={styles.newsItemTitle}>{news.title}</Text>
                <Text style={styles.newsItemDate}>{news.date}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {DUMMY_NEWS.length === 0 && (
            <Text style={styles.noNewsText}>No new news and updates available</Text>
          )}
        </View>

        {/* Share Section */}
        <View style={styles.shareContainer}>
          <Text style={styles.shareTitle}>Share</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="logo-linkedin" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Loading States
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

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
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
    backgroundColor: '#15803d',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchHint: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#64748b',
  },

  // Filters
  filterContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  resetButton: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#10b981',
    fontWeight: '500',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: isSmallDevice ? 16 : 17,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  categoryChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },

  // Results Header
  resultsHeader: {
    padding: 16,
    backgroundColor: 'white',
  },
  resultsCount: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#64748b',
    marginBottom: 8,
  },
  resultsCountBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  resultsActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  sortLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#0f172a',
    fontWeight: '500',
    marginRight: 4,
  },

  // Scheme Cards
  schemeList: {
    padding: 16,
  },
  schemeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  schemeCardTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: isSmallDevice ? 24 : 28,
  },
  schemeCardDepartment: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 12,
  },
  schemeCardDescription: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#64748b',
    lineHeight: isSmallDevice ? 20 : 22,
    marginBottom: 16,
  },
  schemeCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: isSmallDevice ? 10 : 12,
    paddingVertical: isSmallDevice ? 4 : 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tagText: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#0369a1',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: isSmallDevice ? 16 : 18,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 22 : 24,
  },

  // Detail Page
  detailHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  detailBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailBackText: {
    fontSize: isSmallDevice ? 16 : 17,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 8,
  },

  // Scheme Header in Detail
  schemeHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  schemeMinistry: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  schemeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  schemeTitle: {
    fontSize: isSmallDevice ? 22 : 24,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 16,
    lineHeight: isSmallDevice ? 28 : 32,
  },
  saveButton: {
    padding: 4,
  },

  // Tags in Detail
  schemeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  schemeTag: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 16,
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
  },
  schemeTagText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#10b981',
    fontWeight: '500',
  },

  // Apply Button
  applyButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  applyButtonText: {
    color: 'white',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginRight: 8,
  },

  // PDF Link
  pdfLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pdfLinkText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 8,
  },

  // Status Section
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  statusApplied: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  statusNotApplied: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  statusButtonText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },

  // Section Navigation
  sectionNavContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionNavScroll: {
    flexGrow: 0,
  },
  sectionNavContent: {
    paddingRight: 16,
  },
  sectionNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 14 : 16,
    paddingVertical: isSmallDevice ? 10 : 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  sectionNavButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
  sectionNavIcon: {
    marginRight: 8,
  },
  sectionNavText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionNavTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Section Content
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 20 : 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  detailContentText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#475569',
    lineHeight: isSmallDevice ? 22 : 24,
  },

  // Overview Box
  overviewBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: isSmallDevice ? 16 : 20,
    marginTop: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#1e40af',
    marginLeft: 8,
  },
  overviewText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#1e40af',
    lineHeight: isSmallDevice ? 20 : 22,
  },

  // Benefits List
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#475569',
    marginLeft: 12,
    flex: 1,
    lineHeight: isSmallDevice ? 20 : 22,
  },

  // Official Button
  officialButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    marginTop: 16,
  },
  officialButtonText: {
    color: 'white',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    marginRight: 8,
  },

  // News Section
  newsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  newsTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  newsList: {
    gap: 16,
  },
  newsItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  newsItemTitle: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: isSmallDevice ? 20 : 22,
  },
  newsItemDate: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#64748b',
  },
  noNewsText: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#64748b',
    fontWeight: '500',
  },

  // Share Section
  shareContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isSmallDevice ? 16 : 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  shareTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    width: isSmallDevice ? 44 : 48,
    height: isSmallDevice ? 44 : 48,
    borderRadius: isSmallDevice ? 22 : 24,
    backgroundColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Feedback
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    fontSize: isSmallDevice ? 14 : 15,
    color: '#0f172a',
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0f172a',
    paddingVertical: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
  },

  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
});