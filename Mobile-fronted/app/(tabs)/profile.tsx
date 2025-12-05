import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LogOut } from 'lucide-react-native';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

type FarmerProfile = {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  state?: string;
  location?: string;
  role?: string;
  image?: string;
  full_name?: string; // Some backends use snake_case
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

      console.log('🔍 Fetching profile...');
      
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Profile response:', JSON.stringify(response.data, null, 2));
      
      // Handle different response structures
      let profileData = null;
      
      // Option 1: { success: true, data: {...} }
      if (response.data.success && response.data.data) {
        profileData = response.data.data;
      } 
      // Option 2: Direct user object
      else if (response.data.id || response.data.email) {
        profileData = response.data;
      }
      // Option 3: { user: {...} }
      else if (response.data.user) {
        profileData = response.data.user;
      }
      // Option 4: Empty response
      else {
        console.log('⚠️ Unexpected response structure');
        profileData = {};
      }

      console.log('📊 Processed profile data:', profileData);
      
      // Normalize field names (handle both camelCase and snake_case)
      const normalizedProfile = {
        id: profileData.id || '',
        fullName: profileData.fullName || profileData.full_name || 'User',
        email: profileData.email || '',
        phone: profileData.phone || 'Not provided',
        state: profileData.state || 'Not provided',
        location: profileData.location || 'Not provided',
        role: profileData.role || 'farmer', // Default to 'farmer' if not provided
        image: profileData.image || null
      };

      console.log('🎯 Normalized profile:', normalizedProfile);
      setProfile(normalizedProfile);
      
    } catch (error: any) {
      console.error("❌ Error fetching profile:", error);
      
      // Detailed error logging
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          Alert.alert("Session Expired", "Please login again");
          router.replace("/auth");
        } else if (error.response.status === 404) {
          Alert.alert("Not Found", "User profile not found");
        } else {
          Alert.alert("Error", error.response.data?.error || "Unable to load profile");
        }
      } else if (error.request) {
        console.log('No response received:', error.request);
        Alert.alert("Connection Error", "Cannot connect to server. Check your internet.");
      } else {
        console.log('Request setup error:', error.message);
        Alert.alert("Error", "Unable to load profile");
      }
      
      // Set default profile on error
      setProfile({
        id: '',
        fullName: 'User',
        email: '',
        phone: 'Not provided',
        state: 'Not provided',
        location: 'Not provided',
        role: 'farmer',
      });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {profile?.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={64} color="#2e7d32" />
            </View>
          )}
        </View>

        <Text style={styles.name}>{profile?.fullName || 'User'}</Text>
        <Text style={styles.email}>{profile?.email || 'No email'}</Text>
        
        {/* Show role as badge - with safe access */}
        {profile?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {typeof profile.role === 'string' ? profile.role.toUpperCase() : 'USER'}
            </Text>
          </View>
        )}

        {/* Details with safe access */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>State</Text>
            <Text style={styles.infoValue}>{profile?.state || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City / Location</Text>
            <Text style={styles.infoValue}>{profile?.location || 'Not provided'}</Text>
          </View>

        
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
  container: { 
    flex: 1, 
    backgroundColor: '#e8f5e9' 
  },
  contentContainer: { 
    padding: 20,
    paddingBottom: 40 
  },
  loadingText: { 
    textAlign: 'center', 
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  },
  messageText: { 
    textAlign: 'center', 
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#c8e6c9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60 
  },
  name: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginBottom: 6,
    color: '#2e7d32'
  },
  email: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 8 
  },
  roleBadge: {
    backgroundColor: '#c8e6c9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  roleText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#f1f8e9",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: { 
    color: "#2e7d32", 
    fontWeight: "bold", 
    fontSize: 14,
    marginBottom: 4
  },
  infoValue: { 
    fontSize: 16, 
    color: "#333" 
  },
  logoutButton: {
    backgroundColor: "#dd2c00",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { 
    color: "white", 
    fontWeight: "bold",
    fontSize: 16 
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    alignSelf: 'center',
    minWidth: 120,
  },
  buttonText: { 
    color: "white", 
    fontWeight: "bold" 
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  debugButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
});