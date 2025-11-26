import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type User = {
  _id: string;
  fullName: string;
  email: string;
  score: number;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newScore, setNewScore] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (_id: string) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/students/${_id}/score`,
        { score: Number(newScore) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingUserId(null);
      fetchUsers(); 
    } catch (error) {
      Alert.alert('Error', 'Failed to update score');
    }
  };

  const deleteUser = async (_id: string) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/students/${_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('adminToken');
    router.replace('/admin-login' as never);
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      
      {editingUserId === item._id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.scoreInput}
            value={newScore}
            onChangeText={setNewScore}
            keyboardType="numeric"
            placeholder="New score"
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => updateScore(item._id)}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditingUserId(item._id);
              setNewScore(item.score.toString());
            }}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteUser(item._id)}
      >
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  userEmail: {
    color: '#666',
    fontSize: 14,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 60,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});