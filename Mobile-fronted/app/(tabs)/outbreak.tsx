import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
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


    type DiseaseAlert = {
  Type: string;
  DiseaseName: string;
  Locations: string;
  'Disease Overview'?: string;
  'Possible Preventive Measure'?: string;
  MonthYear?: string;
  UpdatedDate?: string;
  UpdatedOn?: string;
  OBTID?: string;
  [key: string]: any; // in case CSV has extra columns
};

Papa.parse<DiseaseAlert>(SHEET_URL, {
  download: true,
  header: true,
  complete: (result) => {
    const data = result.data
      .filter(row => row.Type && row.DiseaseName)
      .map((row, index) => ({ id: index + 1, ...row }));
    setAlerts(data);
    setFilteredAlerts(data);
    setLoading(false);
  },
  error: (error) => {
    console.error(error);
    setError('Failed to fetch data from Google Sheets');
    setLoading(false);
  },
});

  useEffect(() => {
    fetchSheetData();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, selectedType]);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
     Papa.parse<DiseaseAlert>(SHEET_URL, {
  download: true,
  header: true,
  complete: (result) => {
    const data = result.data
      .filter(row => row.Type && row.DiseaseName)
      .map((row, index) => ({ id: index + 1, ...row }));
    setAlerts(data);
    setFilteredAlerts(data);
    setLoading(false);
  },
  error: (error) => {
    console.error(error);
    setError('Failed to fetch data from Google Sheets');
    setLoading(false);
  },
});
    } catch (err) {
      console.error(err);
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
      filtered = filtered.filter(alert => alert.Type?.toLowerCase() === selectedType.toLowerCase());
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

  const alertTypes = ['all', ...Array.from(new Set(alerts.map(alert => alert.Type).filter(Boolean)))];

  const getSeverityColor = (type: string | undefined) => {
    switch(type?.toLowerCase()) {
      case 'outbreak': return '#FEE2E2';
      case 'alert': return '#FFEDD5';
      case 'warning': return '#FEF3C7';
      case 'info': return '#DBEAFE';
      default: return '#E5E7EB';
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
        <Text style={styles.title}>🏥 Disease Alerts & Prevention</Text>
        <Text style={styles.subtitle}>
          Real-time disease outbreak information and preventive measures for farmers
        </Text>
        <Text style={styles.stats}>Last Updated: {new Date().toLocaleDateString()}</Text>
        <Text style={styles.stats}>{alerts.length} Active Alerts</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TextInput
          placeholder="Search by disease or location..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.input}
        />
        <Picker
          selectedValue={selectedType}
          onValueChange={(itemValue) => setSelectedType(itemValue)}
          style={styles.picker}
        >
          {alertTypes.map(type => (
            <Picker.Item key={type} label={type === 'all' ? 'All Types' : type} value={type} />
          ))}
        </Picker>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: getSeverityColor(item.Type) }]} onPress={() => openAlertDetails(item)}>
            <Text style={styles.cardTitle}>{item.DiseaseName}</Text>
            <Text style={styles.cardSubtitle}>Affected Areas: {item.Locations}</Text>
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
                <Text style={styles.modalSubtitle}>Type: {selectedAlert.Type}</Text>
                <Text style={styles.modalSubtitle}>Locations: {selectedAlert.Locations}</Text>
                <Text style={styles.modalText}>Overview: {selectedAlert['Disease Overview'] || 'N/A'}</Text>
                <Text style={styles.modalText}>Preventive Measures: {selectedAlert['Possible Preventive Measure'] || 'N/A'}</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#ECFDF5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryButton: { backgroundColor: '#059669', padding: 12, borderRadius: 8 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#065F46' },
  subtitle: { fontSize: 14, marginBottom: 4, color: '#4B5563' },
  stats: { fontSize: 12, color: '#065F46' },
  filters: { marginBottom: 16 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  picker: { backgroundColor: '#fff', borderRadius: 8 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#374151' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 16, marginBottom: 4 },
  modalText: { fontSize: 14, marginBottom: 8 },
  closeButton: { backgroundColor: '#059669', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
});
