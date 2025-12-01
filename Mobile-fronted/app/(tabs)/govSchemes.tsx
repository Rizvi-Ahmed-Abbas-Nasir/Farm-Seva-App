import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Animated,
  ScrollView,
  Modal,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Papa from "papaparse";
import { ChevronDown, ChevronUp, ExternalLink, HelpCircle, Search, Filter, X } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Scheme = {
  "Govt Scheme Name": string;
  "Scheme Description": string;
  "Scheme Category": string;
  "Website Link"?: string;
};

export default function GovtScheme() {
  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/11oh6nVyIGXoy9oTfA_UWgAD3JxCvVeO0K4n9ncqVeyw/export?format=csv";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAnimalFilter, setSelectedAnimalFilter] = useState("All");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const animatedValues = useRef<Animated.Value[]>([]).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const data: Scheme[] = result.data.slice(2) as Scheme[];
        setSchemes(data);
        setFilteredSchemes(data);
        data.forEach((_, i) => {
          animatedValues[i] = new Animated.Value(50);
        });
        setLoading(false);
        animateCards();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      },
    });
  }, []);

  const animateCards = () => {
    const animations = filteredSchemes.map((_, i) =>
      Animated.spring(animatedValues[i], {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    );
    Animated.stagger(60, animations).start();
  };

  useEffect(() => {
    let filtered = schemes;

    if (searchTerm) {
      filtered = filtered.filter(
        (scheme) =>
          scheme["Govt Scheme Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scheme["Scheme Description"]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((scheme) => scheme["Scheme Category"] === selectedCategory);
    }

    if (selectedAnimalFilter !== "All") {
      filtered = filtered.filter((scheme) => {
        const name = scheme["Govt Scheme Name"]?.toLowerCase() || "";
        const desc = scheme["Scheme Description"]?.toLowerCase() || "";

        if (selectedAnimalFilter === "Pig") {
          return name.includes("pig") || name.includes("swine") || desc.includes("pig") || desc.includes("swine");
        }
        if (selectedAnimalFilter === "Poultry") {
          return (
            name.includes("poultry") ||
            name.includes("chicken") ||
            name.includes("hen") ||
            desc.includes("poultry") ||
            desc.includes("chicken") ||
            desc.includes("hen")
          );
        }
        return true;
      });
    }

    setFilteredSchemes(filtered);
    animateCards();
  }, [searchTerm, selectedCategory, selectedAnimalFilter, schemes]);

  const categories = ["All", ...Array.from(new Set(schemes.map((s) => s["Scheme Category"]).filter(Boolean)))];
  const animalFilters = ["All", "Pig", "Poultry"];
  const hasActiveFilters = selectedCategory !== "All" || selectedAnimalFilter !== "All";

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedAnimalFilter("All");
    setSearchTerm("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerEmoji}>🌾</Text>
          <Text style={styles.header}>Farmer Schemes</Text>
          <Text style={styles.subHeader}>Discover government schemes for farmers</Text>
        </View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <Search size={22} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            placeholder="Search schemes..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsContainer}
          contentContainerStyle={styles.filterChipsContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory !== "All" && styles.filterChipActive]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Filter size={16} color={selectedCategory !== "All" ? "#fff" : "#059669"} />
            <Text style={[styles.filterChipText, selectedCategory !== "All" && styles.filterChipTextActive]}>
              {selectedCategory === "All" ? "Category" : selectedCategory}
            </Text>
            <ChevronDown size={16} color={selectedCategory !== "All" ? "#fff" : "#059669"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedAnimalFilter !== "All" && styles.filterChipActiveBlue]}
            onPress={() => setShowAnimalModal(true)}
          >
            <Filter size={16} color={selectedAnimalFilter !== "All" ? "#fff" : "#3B82F6"} />
            <Text style={[styles.filterChipText, selectedAnimalFilter !== "All" && styles.filterChipTextActive]}>
              {selectedAnimalFilter === "All" ? "Animal Type" : selectedAnimalFilter}
            </Text>
            <ChevronDown size={16} color={selectedAnimalFilter !== "All" ? "#fff" : "#3B82F6"} />
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersChip} onPress={clearAllFilters}>
              <X size={16} color="#EF4444" />
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Results Count */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultCount}>
            {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? "s" : ""} found
          </Text>
        </View>

        {/* Scheme Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schemes...</Text>
          </View>
        ) : filteredSchemes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No schemes found</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSchemes}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => <SchemeCard scheme={item} animatedValue={animatedValues[index]} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Modals */}
        <FilterModal
          visible={showCategoryModal}
          title="Select Category"
          options={categories}
          selectedValue={selectedCategory}
          onSelect={(value) => {
            setSelectedCategory(value);
            setShowCategoryModal(false);
          }}
          onClose={() => setShowCategoryModal(false)}
        />

        <FilterModal
          visible={showAnimalModal}
          title="Select Animal Type"
          options={animalFilters}
          selectedValue={selectedAnimalFilter}
          onSelect={(value) => {
            setSelectedAnimalFilter(value);
            setShowAnimalModal(false);
          }}
          onClose={() => setShowAnimalModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}

function SchemeCard({ scheme, animatedValue }: { scheme: Scheme; animatedValue: Animated.Value }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY: animatedValue }],
          opacity: animatedValue.interpolate({
            inputRange: [0, 50],
            outputRange: [1, 0],
          }),
          width: SCREEN_WIDTH - 40,
          alignSelf: "center",
        },
      ]}
    >
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{scheme["Scheme Category"] || "Farmer Support"}</Text>
          </View>
          {expanded ? <ChevronUp size={24} color="#059669" /> : <ChevronDown size={24} color="#059669" />}
        </View>

<Text
  style={styles.schemeName}
  numberOfLines={2}      // Show up to 2 lines
  ellipsizeMode="tail"   // Show "..." if too long
>
  {scheme["Govt Scheme Name"]}
</Text>
        <Text style={styles.schemeDesc} numberOfLines={expanded ? undefined : 2}>
          {scheme["Scheme Description"]}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          {scheme["Website Link"] && (
            <TouchableOpacity
              style={styles.applyButton}
onPress={() => {
  const url = scheme["Website Link"];
  if (url) {
    Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
  } else {
    alert("No website link available for this scheme.");
  }
}}
              activeOpacity={0.8}
            >
              <ExternalLink size={18} color="#fff" />
              <Text style={styles.buttonText}>Apply Now</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
            <HelpCircle size={18} color="#fff" />
            <Text style={styles.buttonText}>Get Help</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

function FilterModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalDivider} />
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalItem, selectedValue === option && styles.modalItemActive]}
                onPress={() => onSelect(option)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalItemText, selectedValue === option && styles.modalItemTextActive]}>
                  {option}
                </Text>
                {selectedValue === option && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#059669" },
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerContainer: {
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  header: { fontSize: 32, fontWeight: "800", color: "#fff", marginBottom: 6, letterSpacing: 0.5 },
  subHeader: { fontSize: 15, color: "#D1FAE5", fontWeight: "500" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 16, color: "#111", fontWeight: "500" },
  clearButton: { padding: 8 },
  filterChipsContainer: { marginTop: 20, paddingHorizontal: 20 },
  filterChipsContent: { paddingRight: 20 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: { backgroundColor: "#059669", borderColor: "#059669" },
  filterChipActiveBlue: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  filterChipText: { fontSize: 14, fontWeight: "700", color: "#374151", marginHorizontal: 6 },
  filterChipTextActive: { color: "#fff" },
  clearFiltersChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  clearFiltersText: { fontSize: 14, fontWeight: "700", color: "#EF4444", marginLeft: 6 },
  resultsBar: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  resultCount: { fontSize: 15, fontWeight: "700", color: "#6B7280", letterSpacing: 0.3 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
 card: {
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 20,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 16,
  elevation: 5,
  borderWidth: 1,
  borderColor: "#F3F4F6",
  flex: 1,              // Allow content to expand
  minWidth: 0,          // Needed for ellipsizeMode to work
},

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoryBadge: { backgroundColor: "#D1FAE5", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: "800", color: "#059669", textTransform: "uppercase", letterSpacing: 1 },
schemeName: {
  fontSize: 18,      
  fontWeight: "800",
  color: "#111",
  marginBottom: 8,
  lineHeight: 24,     // Adjust line height to fit 2 lines nicely
},
  schemeDesc: { fontSize: 15, color: "#6B7280", lineHeight: 22, fontWeight: "500" },
  expandedSection: { flexDirection: "row", gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  applyButton: {
    flex: 1,
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#059669",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  helpButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  loadingText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: "700", color: "#374151", marginBottom: 8 },
  emptySubText: { fontSize: 15, color: "#9CA3AF", fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#111", letterSpacing: 0.3 },
  modalCloseButton: { padding: 4 },
  modalDivider: { height: 1, backgroundColor: "#E5E7EB" },
  modalList: { paddingHorizontal: 20 },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalItemActive: { backgroundColor: "#F0FDF4" },
  modalItemText: { fontSize: 17, color: "#374151", fontWeight: "600" },
  modalItemTextActive: { color: "#059669", fontWeight: "800" },
  checkmark: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#059669", alignItems: "center", justifyContent: "center" },
  checkmarkText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
