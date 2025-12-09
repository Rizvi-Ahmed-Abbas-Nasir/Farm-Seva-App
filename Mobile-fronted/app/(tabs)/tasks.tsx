import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';
import { offlineService } from '@/app/lib/offlineService';
import OfflineIndicator from '@/components/OfflineIndicator';
import { notificationService } from '@/app/lib/notificationService';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Task {
  id: string;
  task_name: string;
  description?: string;
  task_date: string;
  task_time: string;
  goal?: string;
  completed: boolean;
  created_at: string;
}

interface TaskFormData {
  task_name: string;
  description: string;
  task_date: string;
  task_time: string;
  goal: string;
}

export default function TasksScreen() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [formData, setFormData] = useState<TaskFormData>({
    task_name: '',
    description: '',
    task_date: '',
    task_time: '',
    goal: '',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTasks();
    animateHeader();
    
    // Subscribe to network status
    const unsubscribe = offlineService.subscribe((online) => {
      setIsOnline(online);
      if (online) {
        // Auto-refresh when back online
        fetchTasks();
      }
    });
    
    return () => unsubscribe();
  }, []);

  const animateHeader = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        setLoading(false);
        Alert.alert(
          'Authentication Required',
          'Please login to view your tasks.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/auth');
              }
            }
          ]
        );
        return;
      }

      // Check if offline - use cached data
      if (!offlineService.isConnected()) {
        console.log('📴 Offline - loading cached tasks');
        const cachedTasks = await offlineService.getCachedTasks();
        if (cachedTasks && cachedTasks.length > 0) {
          setTasks(cachedTasks);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      console.log('📡 Fetching tasks from:', `${API_URL}/tasks`);
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Handle 401 Unauthorized (invalid/expired token)
        if (response.status === 401) {
          console.error('❌ Authentication failed:', errorData.error);
          await AsyncStorage.removeItem('userToken');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/auth');
                }
              }
            ]
          );
          setTasks([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        // If network error, try cached data
        const cachedTasks = await offlineService.getCachedTasks();
        if (cachedTasks && cachedTasks.length > 0) {
          console.log('📦 Using cached tasks due to network error');
          setTasks(cachedTasks);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        throw new Error(errorData.error || `Failed to fetch tasks: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Tasks fetched successfully:', result.count || 0);
      
      if (result.success && Array.isArray(result.data)) {
        setTasks(result.data);
        // Cache tasks for offline use
        await offlineService.cacheTasks(result.data);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching tasks:', error);
      
      // Try to load cached data on error
      const cachedTasks = await offlineService.getCachedTasks();
      if (cachedTasks && cachedTasks.length > 0) {
        console.log('📦 Using cached tasks due to error');
        setTasks(cachedTasks);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (offlineService.isConnected()) {
        Alert.alert(
          'Error',
          error.message || 'Failed to load tasks. Please try again.',
          [{ text: 'OK' }]
        );
      }
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format: HH:MM
  };

  const handleSubmit = async () => {
    console.log('🚀 Submit button clicked');
    console.log('📝 Form data:', formData);
    
    if (!formData.task_name.trim()) {
      console.log('❌ Validation failed: Task name is empty');
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    if (!formData.task_date) {
      console.log('❌ Validation failed: Task date is empty');
      Alert.alert('Error', 'Please select a date');
      return;
    }

    if (!formData.task_time) {
      console.log('❌ Validation failed: Task time is empty');
      Alert.alert('Error', 'Please select a time');
      return;
    }

    console.log('✅ Validation passed, submitting task...');
    setSubmitting(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No token found');
        Alert.alert('Error', 'Please login to create tasks');
        setSubmitting(false);
        return;
      }

      const requestBody = {
        task_name: formData.task_name.trim(),
        description: formData.description.trim() || null,
        task_date: formData.task_date,
        task_time: formData.task_time,
        goal: formData.goal.trim() || null,
      };

      console.log('📡 Making API call to:', `${API_URL}/tasks`);
      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('🔑 Token exists:', !!token);

      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        console.error('❌ Parsed error data:', errorData);
        
        if (response.status === 401) {
          console.log('🔒 Unauthorized - removing token');
          await AsyncStorage.removeItem('userToken');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth')
              }
            ]
          );
          setShowForm(false);
          setSubmitting(false);
          return;
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to create task (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Task created successfully!');
        Alert.alert('Success', 'Task created successfully!');
        setFormData({
          task_name: '',
          description: '',
          task_date: '',
          task_time: '',
          goal: '',
        });
        setShowForm(false);
        fetchTasks();
      } else {
        console.log('⚠️ Response success is false:', result);
        Alert.alert('Error', result.message || 'Failed to create task');
      }
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      
      // If offline, queue the action
      if (!offlineService.isConnected()) {
        console.log('📴 Offline - queueing task creation');
        await offlineService.queueAction({
          type: 'task',
          action: 'create',
          endpoint: '/tasks',
          method: 'POST',
          data: requestBody,
        });
        
        // Add to local state immediately for offline preview
        const tempTask: Task = {
          id: `temp_${Date.now()}`,
          task_name: requestBody.task_name,
          description: requestBody.description || '',
          task_date: requestBody.task_date,
          task_time: requestBody.task_time,
          goal: requestBody.goal || '',
          completed: false,
          created_at: new Date().toISOString(),
        };
        setTasks(prev => [...prev, tempTask]);
        await offlineService.cacheTasks([...tasks, tempTask]);
        
        Alert.alert(
          'Task Queued',
          'Task will be synced when you\'re back online.',
          [{ text: 'OK' }]
        );
        setFormData({
          task_name: '',
          description: '',
          task_date: '',
          task_time: '',
          goal: '',
        });
        setShowForm(false);
        setSubmitting(false);
        return;
      }
      
      console.error('❌ Error stack:', error.stack);
      Alert.alert(
        'Error',
        error.message || 'Failed to create task. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to update tasks');
        return;
      }

      // Update UI immediately
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !currentStatus } : task
      ));

      // If offline, queue the action
      if (!offlineService.isConnected()) {
        await offlineService.queueAction({
          type: 'task',
          action: 'update',
          endpoint: `/tasks/${taskId}/toggle`,
          method: 'PATCH',
          data: { completed: !currentStatus },
        });
        await offlineService.cacheTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
        return;
      }

      const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (!response.ok) {
        // Revert UI change on error
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, completed: currentStatus } : task
        ));
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 401) {
          await AsyncStorage.removeItem('userToken');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth')
              }
            ]
          );
          return;
        }
        
        throw new Error(errorData.error || 'Failed to update task');
      }

      const result = await response.json();
      if (result.success) {
        await offlineService.cacheTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      
      // If offline, action is already queued, so just show message
      if (!offlineService.isConnected()) {
        return;
      }
      
      Alert.alert('Error', error.message || 'Failed to update task. Please try again.');
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) return;

              // Remove from UI immediately
              const taskToDelete = tasks.find(t => t.id === taskId);
              setTasks(prev => prev.filter(t => t.id !== taskId));
              const updatedTasks = tasks.filter(t => t.id !== taskId);
              await offlineService.cacheTasks(updatedTasks);

              // If offline, queue the action
              if (!offlineService.isConnected()) {
                await offlineService.queueAction({
                  type: 'task',
                  action: 'delete',
                  endpoint: `/tasks/${taskId}`,
                  method: 'DELETE',
                  data: null,
                });
                return;
              }

              const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                // Revert UI change on error
                if (taskToDelete) {
                  setTasks(prev => [...prev, taskToDelete]);
                  await offlineService.cacheTasks([...updatedTasks, taskToDelete]);
                }
                throw new Error('Failed to delete task');
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              
              // If offline, action is already queued
              if (!offlineService.isConnected()) {
                return;
              }
              
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((task) => task.task_date === today);
  };

  const getUpcomingTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((task) => task.task_date > today && !task.completed);
  };

  const getCompletedCount = () => tasks.filter((task) => task.completed).length;
  const getPendingCount = () => tasks.filter((task) => !task.completed).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const headerTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.headerGradient}>
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="plus" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Task Management</Text>
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>Organize your daily tasks</Text>
                <View style={styles.taskBadge}>
                  <Feather name="check-circle" size={14} color="#10B981" />
                  <Text style={styles.taskBadgeText}>Active</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerDecoration} />
          </View>
        </Animated.View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Animated.View
            style={[
              styles.summaryCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.summaryCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="check-circle" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{getCompletedCount()}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.summaryCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.summaryCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="clock" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{getPendingCount()}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.summaryCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.summaryCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="list" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{tasks.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Today's Tasks */}
        {getTodayTasks().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="calendar" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Today's Tasks</Text>
              </View>
              <Text style={styles.sectionCount}>{getTodayTasks().length}</Text>
            </View>
            {getTodayTasks().map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskComplete}
                onDelete={deleteTask}
                formatTime={formatTime}
              />
            ))}
          </View>
        )}

        {/* Upcoming Tasks */}
        {getUpcomingTasks().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="clock" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
              </View>
              <Text style={styles.sectionCount}>{getUpcomingTasks().length}</Text>
            </View>
            {getUpcomingTasks().map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskComplete}
                onDelete={deleteTask}
                formatTime={formatTime}
                formatDate={formatDate}
              />
            ))}
          </View>
        )}

        {/* All Tasks */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="list" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>All Tasks</Text>
              </View>
            </View>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskComplete}
                onDelete={deleteTask}
                formatTime={formatTime}
                formatDate={formatDate}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {tasks.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Feather name="clipboard" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No tasks yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first task to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowForm(true)}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.emptyStateButtonGradient}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add Task</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>

      {/* Add Task Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Task Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter task name"
                  value={formData.task_name}
                  onChangeText={(value) => handleInputChange('task_name', value)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter task description (optional)"
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>
                    Date <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={formData.task_date}
                    onChangeText={(value) => handleInputChange('task_date', value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>
                    Time <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    value={formData.task_time}
                    onChangeText={(value) => handleInputChange('task_time', value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Goal</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What do you want to achieve? (optional)"
                  value={formData.goal}
                  onChangeText={(value) => handleInputChange('goal', value)}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  console.log('🔘 Submit button pressed');
                  handleSubmit();
                }}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  pointerEvents="none"
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Create Task</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Task Item Component
interface TaskItemProps {
  task: Task;
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  formatTime: (time: string) => string;
  formatDate?: (date: string) => string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  formatTime,
  formatDate,
}) => {
  return (
    <View style={[styles.taskItem, task.completed && styles.taskItemCompleted]}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => onToggle(task.id, task.completed)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            task.completed && styles.checkboxCompleted,
          ]}
        >
          {task.completed && (
            <Feather name="check" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text
            style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.task_name}
          </Text>
          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {task.goal && (
          <View style={styles.goalContainer}>
            <Feather name="target" size={14} color="#8B5CF6" />
            <Text style={styles.goalText}>{task.goal}</Text>
          </View>
        )}

        <View style={styles.taskFooter}>
          <View style={styles.taskInfo}>
            <Feather name="calendar" size={14} color="#6B7280" />
            <Text style={styles.taskInfoText}>
              {formatDate ? formatDate(task.task_date) : task.task_date}
            </Text>
          </View>
          <View style={styles.taskInfo}>
            <Feather name="clock" size={14} color="#6B7280" />
            <Text style={styles.taskInfoText}>{formatTime(task.task_time)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  headerGradient: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  addButtonContainer: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingRight: 140,
    zIndex: 1,
    marginTop: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0FDF4',
    opacity: 0.4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryCardGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'flex-start',
  },
  taskItemCompleted: {
    opacity: 0.7,
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  goalText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  taskFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskInfoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  formScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
