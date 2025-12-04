import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, ScrollView, FlatList,
  TouchableOpacity, StyleSheet, Modal 
} from 'react-native';
import Papa from 'papaparse';
import { Picker } from '@react-native-picker/picker';

export default function DiseaseAlertsDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1GYaSR_EL4c-oKNyiTyx1XOv2aI-ON8WmGJ0G491j35E/export?format=csv";

  useEffect(() => {
    fetchSheetData();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, selectedType]);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
      Papa.parse(SHEET_URL, {
        download: true,
        header: true,
        complete: (result) => {
          const data = result.data
            .filter((row: any) => row.Type && row.DiseaseName)
            .map((row: any, index: number) => ({ id: index + 1, ...row }));

          setAlerts(data);
          setFilteredAlerts(data);
          setLoading(false);
        },
        error: () => {
          setError('Failed to fetch data from Google Sheets');
          setLoading(false);
        },
      });
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.DiseaseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.Locations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert['Disease Overview']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(
        alert => alert.Type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    setFilteredAlerts(filtered);
  };

  const openAlertDetails = (alert: any) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAlert(null);
    setIsModalOpen(false);
  };

  const alertTypes = ['all', ...Array.from(new Set(alerts.map(a => a.Type)))];

  const getBadgeColor = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'outbreak': return '#fee2e2';
      case 'alert': return '#ffedd5';
      case 'warning': return '#fef3c7';
      case 'info': return '#dbeafe';
      default: return '#e5e7eb';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading disease alerts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity onPress={fetchSheetData} style={styles.retryButton}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Disease Alerts</Text>
        <Text style={styles.subText}>Live outbreaks & preventive updates</Text>
        <Text style={styles.stats}>{alerts.length} Active Alerts</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        placeholder="Search disease or location..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.searchBar}
      />

      {/* Type Dropdown */}
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={selectedType}
          onValueChange={(v) => setSelectedType(v)}
          style={styles.dropdown}
        >
          {alertTypes.map(type => (
            <Picker.Item
              key={type}
              label={type === 'all' ? "All Types" : type}
              value={type}
            />
          ))}
        </Picker>
      </View>

      {/* Disease Cards */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openAlertDetails(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.DiseaseName}</Text>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: getBadgeColor(item.Type) },
                ]}
              >
                <Text style={styles.badgeText}>{item.Type}</Text>
              </View>
            </View>

            <Text style={styles.locationText}>
              📍 {item.Locations || "Multiple regions"}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {selectedAlert && (
              <>
                <Text style={styles.modalTitle}>{selectedAlert.DiseaseName}</Text>

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getBadgeColor(selectedAlert.Type) },
                  ]}
                >
                  <Text style={styles.badgeText}>{selectedAlert.Type}</Text>
                </View>

                <Text style={styles.modalSub}>Location(s):</Text>
                <Text style={styles.modalText}>{selectedAlert.Locations}</Text>

                <Text style={styles.modalSub}>Overview:</Text>
                <Text style={styles.modalText}>
                  {selectedAlert['Disease Overview'] || 'N/A'}
                </Text>

                <Text style={styles.modalSub}>Preventive Measures:</Text>
                <Text style={styles.modalText}>
                  {selectedAlert['Possible Preventive Measure'] || 'N/A'}
                </Text>

                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={{ color: '#fff' }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },

  header: { marginBottom: 18 },
  screenTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subText: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  stats: { fontSize: 12, color: "#10B981", marginTop: 4 },

  searchBar: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginBottom: 12,
  },

  dropdownWrapper: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 18,
  },

  dropdown: { width: "100%" },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },

  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },

  locationText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 18,
    padding: 18,
  },

  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  modalSub: { marginTop: 10, fontWeight: "700", fontSize: 14 },
  modalText: { fontSize: 14, color: "#374151", marginTop: 4 },

  closeButton: {
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  retryButton: {
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 8,
  },
});
