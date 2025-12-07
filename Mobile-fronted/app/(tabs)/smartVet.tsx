import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  FlatList,
  StatusBar,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  Platform,
  Clipboard,
  RefreshControl,
} from "react-native";
import {
  FontAwesome,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnnoyedIcon } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

interface VetContact {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  Type?: string;
  Active?: string;
  rating?: string | number;
  link?: string;
  animal_types?: string[];
  additional_info?: string;
  contactedAt?: string;
}

interface VetListProps {
  city?: string;
}

export default function VetList({ city = "mumbai" }: VetListProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<VetContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [animalType, setAnimalType] = useState("pig");
  const [customAnimal, setCustomAnimal] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [savedContacts, setSavedContacts] = useState<VetContact[]>([]);
  const [contactedContacts, setContactedContacts] = useState<VetContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<VetContact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    emergency: false,
    openNow: false,
    highRating: false,
  });

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedVetContacts');
      const contacted = await AsyncStorage.getItem('contactedVetContacts');
      if (saved) setSavedContacts(JSON.parse(saved) as VetContact[]);
      if (contacted) setContactedContacts(JSON.parse(contacted) as VetContact[]);
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  };

  const handleAnimalTypeChange = (type: string) => {
    setAnimalType(type);
    if (type === "custom") {
      setCustomAnimal("");
    }
  };

  const handleCustomAnimalChange = (text: string) => {
    setCustomAnimal(text);
  };

  const fetchVetData = async () => {
    const currentAnimalType = animalType === "custom" ? customAnimal : animalType;

    if (!city || !currentAnimalType) {
      setError("Please provide both city and animal type");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const payload = {
        city: city,
        animalType: currentAnimalType
      };

      const response = await fetch(
        "https://abbas-rizvi313.app.n8n.cloud/webhook/159fa3fa-d577-4aea-8d78-225bc00b915b",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.output) {
        throw new Error("Invalid response format from server");
      }

      let jsonString = result.output
        .replace(/```json\s*/, "")
        .replace(/\s*```$/, "")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '')
        .trim();

      const parsedData = JSON.parse(jsonString);

      if (!Array.isArray(parsedData)) {
        throw new Error("Invalid data format received");
      }

      setData(parsedData as VetContact[]);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(
        err.message.includes("JSON")
          ? "Failed to process veterinary data. Please try again."
          : "Failed to fetch data. Please check your connection and try again."
      );
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVetData();
  };

  const handleSaveContact = async (contact: VetContact) => {
    try {
      const updatedSaved = [...savedContacts];
      const index = updatedSaved.findIndex(c => c.name === contact.name);

      if (index > -1) {
        updatedSaved.splice(index, 1);
      } else {
        updatedSaved.push(contact);
      }

      setSavedContacts(updatedSaved);
      await AsyncStorage.setItem('savedVetContacts', JSON.stringify(updatedSaved));

      Alert.alert(
        index > -1 ? "Removed from Saved" : "Saved Successfully",
        `${contact.name} ${index > -1 ? 'removed from' : 'added to'} your saved contacts`
      );
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact");
    }
  };

  const handleContactCheckbox = async (contact: VetContact) => {
    try {
      const updatedContacted = [...contactedContacts];
      const index = updatedContacted.findIndex(c => c.name === contact.name);

      if (index > -1) {
        updatedContacted.splice(index, 1);
      } else {
        updatedContacted.push({
          ...contact,
          contactedAt: new Date().toISOString()
        });
      }

      setContactedContacts(updatedContacted);
      await AsyncStorage.setItem('contactedVetContacts', JSON.stringify(updatedContacted));

      Alert.alert(
        index > -1 ? "Removed from History" : "Marked as Contacted",
        `${contact.name} ${index > -1 ? 'removed from' : 'added to'} your contact history`
      );
    } catch (error) {
      console.error("Error updating contacted contacts:", error);
      Alert.alert("Error", "Failed to update contact status");
    }
  };

  const handleViewDetails = (contact: VetContact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleFilterChange = (filterName: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const filteredData = data.filter(item => {
    if (activeTab === "saved") {
      return savedContacts.some(c => c.name === item.name);
    }
    if (activeTab === "contacted") {
      return contactedContacts.some(c => c.name === item.name);
    }
    if (activeTab === "government") {
      return item.Type === "Govt" || item.Type === "Non-Govt/NGO";
    }
    if (activeTab === "local") {
      return item.Type === "Local";
    }

    // Apply filters
    if (activeFilters.emergency && item.Active !== "24/7") return false;
    if (activeFilters.openNow && !item.Active?.toLowerCase().includes("now")) return false;
    if (activeFilters.highRating && (!item.rating || parseFloat(String(item.rating)) < 4.0)) return false;

    return true;
  });

  const govtContacts = filteredData.filter(item => item.Type === "Govt" || item.Type === "Non-Govt/NGO");
  const localContacts = filteredData.filter(item => item.Type === "Local");

  const handleCall = (phone?: string) => {
    if (!phone || phone === "Not provided") {
      Alert.alert("No Phone Number", "Phone number is not available for this contact");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email?: string) => {
    if (!email) {
      Alert.alert("No Email", "Email address is not available for this contact");
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const handleOpenLink = (url?: string) => {
    if (!url) {
      Alert.alert("No Website", "Website link is not available for this contact");
      return;
    }
    Linking.openURL(url);
  };

  const handleGetDirections = (address?: string) => {
    if (!address || address === "Not specified") {
      Alert.alert("No Address", "Address is not available for this contact");
      return;
    }
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      web: `https://maps.google.com/?q=${encodedAddress}`,
    });
    Linking.openURL(url as string).catch(() => {
      Alert.alert("Error", "Could not open maps application");
    });
  };

  const handleCopyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied!", "Contact information copied to clipboard");
  };

  const renderContactCard = ({ item, index }: { item: VetContact; index: number }) => {
    const isSaved = savedContacts.some(c => c.name === item.name);
    const isContacted = contactedContacts.some(c => c.name === item.name);
    const isGovt = item.Type === "Govt" || item.Type === "Non-Govt/NGO";
    const isEmergency = item.Active === "24/7";
    const rating = parseFloat(String(item.rating)) || 0;
    const isOpenNow = item.Active?.toLowerCase().includes("now") || item.Active?.toLowerCase().includes("24/7");

    return (
      <View style={styles.contactCard} key={index}>
        {/* Status Indicators */}
        <View style={styles.cardStatusContainer}>
          {isEmergency && (
            <View style={styles.emergencyBadge}>
              <MaterialIcons name="emergency" size={16} color="white" />
              <Text style={styles.emergencyText}>24/7</Text>
            </View>
          )}
          {isOpenNow && !isEmergency && (
            <View style={styles.openNowBadge}>
              <FontAwesome name="clock-o" size={12} color="white" />
              <Text style={styles.openNowText}>Open Now</Text>
            </View>
          )}
        </View>

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, isGovt ? styles.govtIcon : styles.localIcon]}>
            {isGovt ? (
              <FontAwesome name="shield" size={24} color="white" />
            ) : (
              <FontAwesome name="home" size={24} color="white" />)}
          </View>
          <View style={styles.cardTitleContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.cardName} numberOfLines={2}>
                {item.name || "Unknown"}
              </Text>
              {item.rating && item.rating !== "Not applicable" && (
                <View style={styles.ratingBadge}>
                  <FontAwesome name="star" size={12} color="white" />
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <View style={styles.typeContainer}>
              <View
                style={[
                  styles.typeBadge,
                  isGovt ? styles.govtBadge : styles.localBadge,
                ]}
              >
                <Text style={isGovt ? styles.govtBadgeText : styles.localBadgeText}>
                  {isGovt ? (item.Type === "Non-Govt/NGO" ? "NGO" : "GOVERNMENT") : "LOCAL"}
                </Text>
              </View>
              {item.link && item.link !== "" && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => handleOpenLink(item.link)}
                >
                  <FontAwesome name="external-link" size={12} color="#3B82F6" />
                  <Text style={styles.linkText}>Official Link</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.cardInfoContainer}>
          {item.phone && item.phone !== "Not provided" && (
            <TouchableOpacity
              style={styles.phoneContainer}
              onPress={() => handleCall(item.phone)}
              activeOpacity={0.7}
            >
              <View style={styles.phoneIcon}>
                <FontAwesome name="phone" size={20} color="white" />
              </View>
              <View style={styles.phoneInfo}>
                <Text style={styles.phoneNumber}>{item.phone}</Text>
                <Text style={styles.phoneLabel}>Tap to call</Text>
              </View>
            </TouchableOpacity>
          )}

          {item.address && item.address !== "Not specified" && (
            <View style={styles.addressContainer}>
              <View style={styles.addressIcon}>
                <FontAwesome name="map-marker" size={20} color="white" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.address}
                </Text>
                <TouchableOpacity
                  onPress={() => handleGetDirections(item.address)}
                  style={styles.directionsButton}
                >
                  <FontAwesome name="location-arrow" size={12} color="#3B82F6" />
                  <Text style={styles.directionsText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {item.Active && (
            <View style={styles.availabilityContainer}>
              <FontAwesome name="clock-o" size={20} color="#10B981" />
              <View style={styles.availabilityInfo}>
                <Text style={styles.availabilityText}>{item.Active}</Text>
                <Text style={styles.availabilityLabel}>Availability Status</Text>
              </View>
            </View>
          )}
        </View>

        {/* Animal Types */}
        {item.animal_types && item.animal_types.length > 0 && (
          <View style={styles.animalTypesContainer}>
            <View style={styles.animalTypesHeader}>
              <FontAwesome name="paw" size={16} color="#4B5563" />
              <Text style={styles.animalTypesTitle}>Specializes In:</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.animalTypesScroll}
            >
              {item.animal_types.map((type, idx) => (
                <View key={idx} style={styles.animalTypeChip}>
                  <Text style={styles.animalTypeText}>{type}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              style={[styles.saveButton, isSaved && styles.savedButton]}
              onPress={() => handleSaveContact(item)}
            >
              <FontAwesome
                name="heart"
                size={20}
                color={isSaved ? "white" : "#6B7280"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactedButton, isContacted && styles.contactedActive]}
              onPress={() => handleContactCheckbox(item)}
            >
              {isContacted ? (
                <FontAwesome name="check-square" size={20} color="white" />
              ) : (
                <FontAwesome name="square" size={20} color="#6B7280" />
              )}
              <Text
                style={[
                  styles.contactedButtonText,
                  isContacted && styles.contactedButtonTextActive,
                ]}
              >
                {isContacted ? "Contacted" : "Mark Contacted"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <FontAwesome name="chevron-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const DetailModal = ({ contact, onClose }: { contact: VetContact; onClose: () => void }) => {
    const isSaved = savedContacts.some(c => c.name === contact.name);
    const isContacted = contactedContacts.some(c => c.name === contact.name);
    const isGovt = contact.Type === "Govt" || contact.Type === "Non-Govt/NGO";

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  isGovt ? styles.govtGradient : styles.localGradient,
                ]}
              >
                <View style={styles.modalHeaderContent}>
                  <View style={styles.modalIconContainer}>
                    <View style={styles.modalIconWrapper}>
                      {isGovt ? (
                        <FontAwesome name="shield" size={32} color="white" />
                      ) : (
                        <FontAwesome name={"store" as any} size={32} color="white" />
                      )}
                    </View>
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>{contact.name || "Unknown"}</Text>
                      <View style={styles.modalBadges}>
                        <View style={styles.modalTypeBadge}>
                          <Text style={styles.modalTypeText}>
                            {isGovt
                              ? contact.Type === "Non-Govt/NGO"
                                ? "NGO"
                                : "GOVERNMENT"
                              : "LOCAL BUSINESS"}
                          </Text>
                        </View>
                        {contact.rating && contact.rating !== "Not applicable" && (
                          <View style={styles.modalRatingBadge}>
                            <FontAwesome name="star" size={14} color="#FBBF24" />
                            <Text style={styles.modalRatingText}>{contact.rating}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <FontAwesome name="times" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Modal Content */}
              <View style={styles.modalContent}>
                {/* Contact Information */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <FontAwesome name="phone" size={24} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                  </View>

                  {contact.phone && contact.phone !== "Not provided" && (
                    <TouchableOpacity
                      style={styles.modalPhoneContainer}
                      onPress={() => handleCall(contact.phone)}
                    >
                      <View style={styles.modalPhoneIcon}>
                        <FontAwesome name="phone" size={24} color="white" />
                      </View>
                      <View style={styles.modalPhoneInfo}>
                        <Text style={styles.modalPhoneNumber}>{contact.phone}</Text>
                        <Text style={styles.modalPhoneLabel}>Available for calls</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {contact.email && contact.email !== "" && (
                    <TouchableOpacity
                      style={styles.modalEmailContainer}
                      onPress={() => handleEmail(contact.email)}
                    >
                      <View style={styles.modalEmailIcon}>
                        <FontAwesome name="envelope" size={24} color="white" />
                      </View>
                      <View style={styles.modalEmailInfo}>
                        <Text style={styles.modalEmailText}>{contact.email}</Text>
                        <Text style={styles.modalEmailLabel}>Send email</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Location */}
                {contact.address && contact.address !== "Not specified" && (
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="map-marker" size={24} color="#EF4444" />
                      <Text style={styles.sectionTitle}>Location</Text>
                    </View>
                    <View style={styles.modalAddressContainer}>
                      <Text style={styles.modalAddressText}>{contact.address}</Text>
                      <TouchableOpacity
                        style={styles.modalDirectionsButton}
                        onPress={() => handleGetDirections(contact.address)}
                      >
                        <FontAwesome name="location-arrow" size={16} color="white" />
                        <Text style={styles.modalDirectionsText}>
                          Get Directions on Maps
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Availability */}
                {contact.Active && (
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="clock-o" size={24} color="#10B981" />
                      <Text style={styles.sectionTitle}>Availability</Text>
                    </View>
                    <View style={styles.modalAvailabilityContainer}>
                      <View
                        style={[
                          styles.modalAvailabilityIcon,
                          contact.Active === "24/7"
                            ? styles.emergencyIcon
                            : styles.normalIcon,
                        ]}
                      >
                        {contact.Active === "24/7" ? (
                          <MaterialIcons name="emergency" size={28} color="white" />
                        ) : (
                          <FontAwesome name="clock-o" size={28} color="white" />
                        )}
                      </View>
                      <View style={styles.modalAvailabilityInfo}>
                        <Text style={styles.modalAvailabilityText}>{contact.Active}</Text>
                        <Text style={styles.modalAvailabilityLabel}>Current status</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Specializations */}
                {contact.animal_types && contact.animal_types.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="paw" size={24} color="#8B5CF6" />
                      <Text style={styles.sectionTitle}>Specializations</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.modalAnimalTypesScroll}
                    >
                      {contact.animal_types.map((type, idx) => (
                        <View key={idx} style={styles.modalAnimalTypeChip}>
                          <Text style={styles.modalAnimalTypeText}>{type}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Additional Information */}
                {contact.additional_info && (
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="info-circle" size={24} color="#F59E0B" />
                      <Text style={styles.sectionTitle}>Additional Information</Text>
                    </View>
                    <View style={styles.modalAdditionalInfo}>
                      <Text style={styles.modalAdditionalText}>
                        {contact.additional_info}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Official Links */}
                {contact.link && (
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="external-link" size={24} color="#3B82F6" />
                      <Text style={styles.sectionTitle}>Official Links</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.modalLinkButton}
                      onPress={() => handleOpenLink(contact.link)}
                    >
                      <FontAwesome name="external-link" size={20} color="#3B82F6" />
                      <Text style={styles.modalLinkText}>Visit Official Website</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalSaveButton,
                      isSaved && styles.modalSaveButtonActive,
                    ]}
                    onPress={() => handleSaveContact(contact)}
                  >
                    <FontAwesome
                      name="heart"
                      size={20}
                      color={isSaved ? "white" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.modalSaveButtonText,
                        isSaved && styles.modalSaveButtonTextActive,
                      ]}
                    >
                      {isSaved ? "Saved" : "Save Contact"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalContactedButton,
                      isContacted && styles.modalContactedButtonActive,
                    ]}
                    onPress={() => handleContactCheckbox(contact)}
                  >
                    {isContacted ? (
                      <FontAwesome name="check-square" size={20} color="white" />
                    ) : (
                      <FontAwesome name="square" size={20} color="#3B82F6" />
                    )}
                    <Text
                      style={[
                        styles.modalContactedButtonText,
                        isContacted && styles.modalContactedButtonTextActive,
                      ]}
                    >
                      {isContacted ? "Contacted ✓" : "Mark as Contacted"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <View style={styles.modalFooterContent}>
                  <View style={styles.verifiedContainer}>
                    <MaterialIcons name="verified" size={20} color="#10B981" />
                    <Text style={styles.verifiedText}>Information Verified</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() =>
                      handleCopyToClipboard(
                        `${contact.name} - ${contact.phone || ""} - ${contact.address || ""}`
                      )
                    }
                  >
                    <FontAwesome name="share-alt" size={18} color="#3B82F6" />
                    <Text style={styles.shareText}>Share Contact</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.animalIconContainer}>
        {animalType === "pig" ? (
          <MaterialCommunityIcons name="pig" size={80} color="#60A5FA" />
        ) : animalType === "poultry" ? (
          <MaterialCommunityIcons name="egg-easter" size={80} color="#F59E0B" />
        ) : (
          <FontAwesome name="paw" size={80} color="#8B5CF6" />
        )}
      </View>
      <Text style={styles.emptyStateTitle}>Discover Trusted Veterinary Services</Text>
      <Text style={styles.emptyStateText}>
        Select an animal type above to find specialized care in {city}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Searching for veterinary services...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchVetData}>
        <FontAwesome name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoResults = () => (
    <View style={styles.noResultsContainer}>
      <View style={styles.noResultsIcon}>
        {animalType === "pig" ? (
          <MaterialCommunityIcons name="pig" size={80} color="#60A5FA" />
        ) : animalType === "poultry" ? (
          <MaterialCommunityIcons name="egg-easter" size={80} color="#F59E0B" />
        ) : (
          <FontAwesome name="paw" size={80} color="#8B5CF6" />
        )}
      </View>
      <Text style={styles.noResultsTitle}>No Services Found</Text>
      <Text style={styles.noResultsText}>
        We couldn't find any {animalType === "custom" ? customAnimal : animalType}{" "}
        veterinary services in {city}.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchVetData}>
        <FontAwesome name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const tabs: { id: string; label: string; icon: any; count: number }[] = [
    { id: "all", label: "All", icon: "paw", count: filteredData.length },
    {
      id: "government",
      label: "Government",
      icon: "shield",
      count: govtContacts.length,
    },
    { id: "local", label: "Local", icon: "store", count: localContacts.length },
    { id: "saved", label: "Saved", icon: "heart", count: savedContacts.length },
    {
      id: "contacted",
      label: "History",
      icon: "history",
      count: contactedContacts.length,
    },
  ];

  const filters: { key: keyof typeof activeFilters; label: string; icon: any }[] = [
    { key: "emergency", label: "24/7 Emergency", icon: "emergency" },
    { key: "openNow", label: "Open Now", icon: "clock-o" },
    { key: "highRating", label: "High Rating", icon: "star" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Modernized Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative Elements */}
            <View style={styles.headerDecoration1} />
            <View style={styles.headerDecoration2} />

            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <FontAwesome name="paw" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Veterinary Connect</Text>
                <Text style={styles.headerSubtitle}>
                  Your trusted network for animal healthcare in {city}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Animal Type Selection */}
        <View style={styles.selectionCard}>
          <View style={styles.selectionHeader}>
            <FontAwesome name="paw" size={24} color="#3B82F6" />
            <Text style={styles.selectionTitle}>Select Animal Type</Text>
          </View>

          <View style={styles.animalTypeGrid}>
            <TouchableOpacity
              style={[
                styles.animalTypeButton,
                animalType === "pig" && styles.animalTypeButtonActive,
              ]}
              onPress={() => handleAnimalTypeChange("pig")}
            >
              <MaterialCommunityIcons
                name="pig"
                size={32}
                color={animalType === "pig" ? "#3B82F6" : "#6B7280"}
              />
              <Text
                style={[
                  styles.animalTypeButtonText,
                  animalType === "pig" && styles.animalTypeButtonTextActive,
                ]}
              >
                Pig
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.animalTypeButton,
                animalType === "poultry" && styles.animalTypeButtonActive,
              ]}
              onPress={() => handleAnimalTypeChange("poultry")}
            >
              <MaterialCommunityIcons
                name="egg-easter"
                size={32}
                color={animalType === "poultry" ? "#F59E0B" : "#6B7280"}
              />
              <Text
                style={[
                  styles.animalTypeButtonText,
                  animalType === "poultry" && styles.animalTypeButtonTextActive,
                ]}
              >
                Poultry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.animalTypeButton,
                animalType === "custom" && styles.animalTypeButtonActive,
              ]}
              onPress={() => handleAnimalTypeChange("custom")}
            >
              <FontAwesome
                name="paw"
                size={32}
                color={animalType === "custom" ? "#8B5CF6" : "#6B7280"}
              />
              <Text
                style={[
                  styles.animalTypeButtonText,
                  animalType === "custom" && styles.animalTypeButtonTextActive,
                ]}
              >
                Other Animal
              </Text>
            </TouchableOpacity>
          </View>

          {animalType === "custom" && (
            <View style={styles.customInputContainer}>
              <Text style={styles.customInputLabel}>Enter Animal Type</Text>
              <TextInput
                style={styles.customInput}
                value={customAnimal}
                onChangeText={handleCustomAnimalChange}
                placeholder="e.g., cow, goat, sheep, buffalo..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.searchButton,
              (loading || !city || !animalType || (animalType === "custom" && !customAnimal)) && styles.searchButtonDisabled,
            ]}
            onPress={fetchVetData}
            disabled={loading || !city || !animalType || (animalType === "custom" && !customAnimal)}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.searchButtonText}>Searching...</Text>
              </>
            ) : (
              <>
                <FontAwesome name="search" size={20} color="white" />
                <Text style={styles.searchButtonText}>Find Veterinary Services</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs and Filters */}
        {hasSearched && data.length > 0 && (
          <View style={styles.tabsContainer}>
            <View style={styles.tabsHeader}>
              <Text style={styles.tabsTitle}>Browse Contacts</Text>
              <View style={styles.filtersHeader}>
                <FontAwesome name="filter" size={20} color="#6B7280" />
                <Text style={styles.filtersTitle}>Filters</Text>
              </View>
            </View>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
            >
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    activeFilters[filter.key] && styles.filterButtonActive,
                    filter.key === 'emergency' && activeFilters[filter.key] && styles.filterEmergency,
                    filter.key === 'openNow' && activeFilters[filter.key] && styles.filterOpenNow,
                    filter.key === 'highRating' && activeFilters[filter.key] && styles.filterHighRating,
                  ]}
                  onPress={() => handleFilterChange(filter.key as keyof typeof activeFilters)}
                >
                  <FontAwesome
                    name={filter.icon}
                    size={16}
                    color={activeFilters[filter.key] ? "white" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      activeFilters[filter.key] && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <FontAwesome
                    name={tab.icon}
                    size={20}
                    color={activeTab === tab.id ? "white" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab.id && styles.tabButtonTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabCount,
                      activeTab === tab.id ? styles.tabCountActive : styles.tabCountInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        activeTab === tab.id && styles.tabCountTextActive,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {error && renderError()}

        {!hasSearched && !loading && renderEmptyState()}

        {loading && renderLoading()}

        {!loading && hasSearched && filteredData.length > 0 && (
          <View style={styles.resultsContainer}>
            {/* Results Summary */}
            <View style={styles.resultsSummary}>
              <View style={styles.summaryLeft}>
                <Text style={styles.resultsTitle}>
                  {activeTab === "all"
                    ? "All Veterinary Services"
                    : activeTab === "government"
                      ? "Government & NGO Services"
                      : activeTab === "local"
                        ? "Local Veterinary Clinics"
                        : activeTab === "saved"
                          ? "Saved Contacts"
                          : "Contact History"}
                </Text>
                <Text style={styles.resultsSubtitle}>
                  Showing {filteredData.length} services in {city}
                </Text>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Saved</Text>
                  <Text style={styles.statValue}>{savedContacts.length}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Contacted</Text>
                  <Text style={[styles.statValue, styles.statValueContacted]}>
                    {contactedContacts.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contacts List */}
            <FlatList
              data={filteredData}
              renderItem={renderContactCard}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.contactsList}
            />
          </View>
        )}

        {!loading && hasSearched && filteredData.length === 0 && !error && renderNoResults()}
      </ScrollView>

      {/* Detail Modal */}
      {showDetailModal && selectedContact && (
        <DetailModal
          contact={selectedContact}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    padding: 24,
    paddingVertical: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoration1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerDecoration2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    fontWeight: '500',
    lineHeight: 20,
  },
  selectionCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 12,
  },
  animalTypeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  animalTypeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginHorizontal: 5,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  animalTypeButtonActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  animalTypeButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
  },
  animalTypeButtonTextActive: {
    color: "#3B82F6",
  },
  customInputContainer: {
    marginBottom: 20,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  customInput: {
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  searchButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  tabsContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  filtersTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
  },
  filterEmergency: {
    backgroundColor: "#EF4444",
  },
  filterOpenNow: {
    backgroundColor: "#10B981",
  },
  filterHighRating: {
    backgroundColor: "#F59E0B",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: "white",
  },
  tabsScroll: {
    flexDirection: "row",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#F3F4F6",
  },
  tabButtonActive: {
    backgroundColor: "#3B82F6",
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  tabButtonTextActive: {
    color: "white",
  },
  tabCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#D1D5DB",
  },
  tabCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  tabCountInactive: {
    backgroundColor: "#E5E7EB",
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  tabCountTextActive: {
    color: "white",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  animalIconContainer: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 20,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 16,
    color: "#991B1B",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsIcon: {
    marginBottom: 24,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  noResultsText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsSummary: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLeft: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryStats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    alignItems: "flex-end",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  statValueContacted: {
    color: "#10B981",
  },
  contactsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  contactCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardStatusContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
    alignItems: "flex-end",
  },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  emergencyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  openNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  openNowText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 20,
    marginRight: 80,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  govtIcon: {
    backgroundColor: "#3B82F6",
  },
  localIcon: {
    backgroundColor: "#10B981",
  },
  cardTitleContainer: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  govtBadge: {
    backgroundColor: "#DBEAFE",
  },
  localBadge: {
    backgroundColor: "#D1FAE5",
  },
  govtBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "bold",
  },
  localBadgeText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "bold",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    color: "#3B82F6",
    fontSize: 12,
  },
  cardInfoContainer: {
    gap: 12,
    marginBottom: 20,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  phoneIcon: {
    backgroundColor: "#3B82F6",
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D4ED8",
  },
  phoneLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressIcon: {
    backgroundColor: "#8B5CF6",
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
    lineHeight: 22,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  directionsText: {
    color: "#3B82F6",
    fontSize: 12,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#A7F3D0",
    gap: 12,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065F46",
  },
  availabilityLabel: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
  },
  animalTypesContainer: {
    marginBottom: 20,
  },
  animalTypesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  animalTypesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  animalTypesScroll: {
    flexDirection: "row",
  },
  animalTypeChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  animalTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  savedButton: {
    backgroundColor: "#EF4444",
  },
  contactedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  contactedActive: {
    backgroundColor: "#10B981",
  },
  contactedButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  contactedButtonTextActive: {
    color: "white",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewDetailsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  govtGradient: {
    backgroundColor: "#3B82F6",
  },
  localGradient: {
    backgroundColor: "#10B981",
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalIconWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  modalBadges: {
    flexDirection: "row",
    gap: 8,
  },
  modalTypeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalTypeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  modalRatingText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 12,
  },
  modalContent: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalPhoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginBottom: 12,
  },
  modalPhoneIcon: {
    backgroundColor: "#3B82F6",
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPhoneInfo: {
    flex: 1,
  },
  modalPhoneNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1D4ED8",
  },
  modalPhoneLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  modalEmailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  modalEmailIcon: {
    backgroundColor: "#8B5CF6",
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmailInfo: {
    flex: 1,
  },
  modalEmailText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7C3AED",
  },
  modalEmailLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  modalAddressContainer: {
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 16,
  },
  modalAddressText: {
    fontSize: 18,
    color: "#1F2937",
    fontWeight: "500",
    lineHeight: 26,
    marginBottom: 16,
  },
  modalDirectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    alignSelf: "flex-start",
  },
  modalDirectionsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalAvailabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#10B981",
    gap: 16,
  },
  modalAvailabilityIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyIcon: {
    backgroundColor: "#EF4444",
  },
  normalIcon: {
    backgroundColor: "#10B981",
  },
  modalAvailabilityInfo: {
    flex: 1,
  },
  modalAvailabilityText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065F46",
  },
  modalAvailabilityLabel: {
    fontSize: 14,
    color: "#10B981",
    marginTop: 4,
  },
  modalAnimalTypesScroll: {
    flexDirection: "row",
  },
  modalAnimalTypeChip: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 8,
  },
  modalAnimalTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  modalAdditionalInfo: {
    backgroundColor: "#FFFBEB",
    padding: 20,
    borderRadius: 16,
  },
  modalAdditionalText: {
    fontSize: 16,
    color: "#78350F",
    lineHeight: 24,
  },
  modalLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  modalLinkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  modalActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalSaveButtonActive: {
    backgroundColor: "#EF4444",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalSaveButtonTextActive: {
    color: "white",
  },
  modalContactedButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalContactedButtonActive: {
    backgroundColor: "#10B981",
  },
  modalContactedButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  modalContactedButtonTextActive: {
    color: "white",
  },
  modalFooter: {
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalFooterContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
});