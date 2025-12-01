import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Linking, StyleSheet } from "react-native";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";

type Vet = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  animal_types?: string[];
  rating?: number;
  additional_info?: string;
};

export default function VetList({ city = "mumbai" }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Vet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [animalType, setAnimalType] = useState("pig");
  const [customAnimal, setCustomAnimal] = useState("");

  useEffect(() => {
    if (city && animalType) {
      fetchVetData();
    }
  }, [city, animalType]);

  const handleAnimalTypeChange = (type: string) => {
    setAnimalType(type);
    if (type === "custom") setCustomAnimal("");
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
      const payload = { city, animalType: currentAnimalType };
      const response = await fetch(
        "http://localhost:5678/webhook-test/159fa3fa-d577-4aea-8d78-225bc00b915b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (!result.output) throw new Error("Invalid response format from server");

      const jsonString = result.output.replace(/```json\s*/, "").replace(/\s*```$/, "").replace(/\\"/g, '"').replace(/\\n/g, '').trim();
      const parsedData: Vet[] = JSON.parse(jsonString);

      if (!Array.isArray(parsedData)) throw new Error("Invalid data format received");

      setData(parsedData);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message.includes("JSON")
          ? "Failed to process veterinary data. Please try again."
          : "Failed to fetch data. Please check your connection and try again."
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const RetryButton = () => (
    <TouchableOpacity style={styles.retryButton} onPress={fetchVetData}>
      <FontAwesome5 name="sync-alt" size={16} color="#fff" />
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  );

  const VetCard = ({ vet }: { vet: Vet }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{vet.name}</Text>
        {vet.rating && (
          <View style={styles.ratingBadge}>
            <FontAwesome name="star" size={14} color="#fff" />
            <Text style={styles.ratingText}>{vet.rating}</Text>
          </View>
        )}
      </View>

      {vet.phone && (
        <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${vet.phone}`)}>
          <FontAwesome name="phone" size={16} color="#4B5563" />
          <Text style={styles.infoText}>{vet.phone}</Text>
        </TouchableOpacity>
      )}

      {vet.email && (
        <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${vet.email}`)}>
          <FontAwesome name="envelope" size={16} color="#4B5563" />
          <Text style={styles.infoText}>{vet.email}</Text>
        </TouchableOpacity>
      )}

      {vet.address && (
        <View style={styles.infoRow}>
          <FontAwesome name="map-marker" size={16} color="#4B5563" />
          <Text style={styles.infoText}>{vet.address}</Text>
        </View>
      )}

      {vet.animal_types && vet.animal_types.length > 0 && (
        <View style={styles.infoRow}>
          <FontAwesome name="paw" size={16} color="#4B5563" />
          <View style={{ flexWrap: "wrap", flexDirection: "row" }}>
            {vet.animal_types.map((type, idx) => (
              <Text key={idx} style={styles.animalBadge}>{type}</Text>
            ))}
          </View>
        </View>
      )}

      {vet.additional_info && (
        <View style={styles.infoRow}>
          <FontAwesome name="info-circle" size={16} color="#4B5563" />
          <Text style={styles.additionalInfo}>{vet.additional_info}</Text>
        </View>
      )}
    </View>
  );

  const getAnimalIcon = () => {
    const currentAnimal = animalType === "custom" ? customAnimal : animalType;
    if (currentAnimal.toLowerCase().includes("pig")) return <FontAwesome5 name="piggy-bank" size={64} color="#9CA3AF" style={{ alignSelf: "center", marginBottom: 16 }} />;
    if (currentAnimal.toLowerCase().includes("poultry") || currentAnimal.toLowerCase().includes("chicken")) return <FontAwesome5 name="egg" size={64} color="#9CA3AF" style={{ alignSelf: "center", marginBottom: 16 }} />;
    return <FontAwesome5 name="dog" size={64} color="#9CA3AF" style={{ alignSelf: "center", marginBottom: 16 }} />;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Animal Type Selection */}
      <View style={styles.selectionContainer}>
        <Text style={styles.sectionTitle}>Select Animal Type</Text>
        <View style={styles.animalButtons}>
          <TouchableOpacity
            style={[styles.animalButton, animalType === "pig" && styles.selectedButton]}
            onPress={() => handleAnimalTypeChange("pig")}
          >
            <FontAwesome5 name="piggy-bank" size={24} />
            <Text style={styles.buttonText}>Pig</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.animalButton, animalType === "poultry" && styles.selectedButton]}
            onPress={() => handleAnimalTypeChange("poultry")}
          >
            <FontAwesome5 name="egg" size={24} />
            <Text style={styles.buttonText}>Poultry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.animalButton, animalType === "custom" && styles.selectedButton]}
            onPress={() => handleAnimalTypeChange("custom")}
          >
            <FontAwesome5 name="paw" size={24} />
            <Text style={styles.buttonText}>Other</Text>
          </TouchableOpacity>
        </View>

        {animalType === "custom" && (
          <TextInput
            value={customAnimal}
            onChangeText={setCustomAnimal}
            placeholder="Enter animal type"
            style={styles.input}
          />
        )}
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{animalType === "custom" ? customAnimal : animalType} Veterinarians in {city}</Text>
        {data.length > 0 && <Text style={styles.headerSubtitle}>Found {data.length} clinics</Text>}
      </View>

      {/* Loading */}
      {loading && <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 16 }} />}

      {/* Error */}
      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><RetryButton /></View>}

      {/* No search yet */}
      {!hasSearched && !loading && getAnimalIcon()}

      {/* Vet Cards */}
      {data.map((vet, idx) => <VetCard key={idx} vet={vet} />)}

      {/* No results */}
      {!loading && hasSearched && data.length === 0 && !error && (
        <View style={{ alignItems: "center", marginVertical: 32 }}>
          {getAnimalIcon()}
          <Text style={styles.noDataText}>No Veterinarians Found</Text>
          <RetryButton />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F3F4F6" },
  selectionContainer: { marginBottom: 16, backgroundColor: "#fff", padding: 16, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  animalButtons: { flexDirection: "row", justifyContent: "space-between" },
  animalButton: { flex: 1, alignItems: "center", padding: 12, borderWidth: 2, borderColor: "#D1D5DB", borderRadius: 12, marginHorizontal: 4 },
  selectedButton: { borderColor: "#3B82F6", backgroundColor: "#DBEAFE" },
  buttonText: { marginTop: 4, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 10, marginTop: 12 },
  headerContainer: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  ratingBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#3B82F6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { color: "#fff", marginLeft: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { marginLeft: 6, color: "#374151" },
  animalBadge: { backgroundColor: "#D1FAE5", color: "#065F46", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginRight: 4, marginTop: 4 },
  additionalInfo: { marginLeft: 6, fontStyle: "italic", color: "#6B7280", flex: 1 },
  retryButton: { flexDirection: "row", backgroundColor: "#3B82F6", padding: 10, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 8 },
  retryButtonText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  errorBox: { backgroundColor: "#FEE2E2", padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: "#B91C1C", fontWeight: "600" },
  noDataText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 12 }
});
