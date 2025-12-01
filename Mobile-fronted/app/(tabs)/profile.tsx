import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LogOut } from 'lucide-react-native';

//  const API_URL = "http://192.168.0.167:5000"; // Android Emulator
// const API_URL = "http://localhost:5000"; // iOS Simulator
// const API_URL = "http://YOUR_PC_IP:5000"; // Real Device
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type FarmerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  location: string;
  role: string;
  image?: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    router.replace("/auth");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Please log in to view your profile</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/auth')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileCard}>

        {/* Profile Image */}
        <View style={styles.avatarContainer}>
          {profile.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <User size={64} color="#2e7d32" />
          )}
        </View>

        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        {/* Details */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{profile.phone}</Text>

          <Text style={styles.infoLabel}>State</Text>
          <Text style={styles.infoValue}>{profile.state}</Text>

          <Text style={styles.infoLabel}>City / Location</Text>
          <Text style={styles.infoValue}>{profile.location}</Text>

          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{profile.role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="white" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  contentContainer: { padding: 20 },
  loadingText: { textAlign: 'center', marginTop: 20 },
  messageText: { textAlign: 'center', marginTop: 20 },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#c8e6c9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  email: { fontSize: 16, color: '#666', marginBottom: 20 },
  infoBox: {
    width: "100%",
    backgroundColor: "#f1f8e9",
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: { color: "#2e7d32", fontWeight: "bold", marginTop: 6 },
  infoValue: { fontSize: 16, color: "#333" },
  logoutButton: {
    backgroundColor: "#dd2c00",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { color: "white", fontWeight: "bold" },
  button: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
});
