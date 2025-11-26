import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SquareCheck as CheckSquare, Clock, Users, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function TasksScreen() {
  const todayTasks = [
    { 
      id: 1, 
      title: 'Morning Feed Distribution', 
      location: 'All Areas', 
      assignee: 'John Smith',
      priority: 'high',
      completed: true,
      time: '06:00 AM'
    },
    { 
      id: 2, 
      title: 'Vaccination - Pig Pen 3', 
      location: 'Pig Pen 3', 
      assignee: 'Maria Garcia',
      priority: 'high',
      completed: false,
      time: '09:30 AM'
    },
    { 
      id: 3, 
      title: 'Cleaning - Broiler House 1', 
      location: 'Broiler House 1', 
      assignee: 'David Johnson',
      priority: 'medium',
      completed: false,
      time: '11:00 AM'
    },
    { 
      id: 4, 
      title: 'Health Check - Layer Cages', 
      location: 'Layer Cage Area', 
      assignee: 'Sarah Wilson',
      priority: 'medium',
      completed: false,
      time: '02:00 PM'
    },
  ];

  const upcomingTasks = [
    { 
      title: 'Weekly Deep Clean', 
      location: 'Entire Facility', 
      date: 'Tomorrow',
      assignee: 'All Staff'
    },
    { 
      title: 'Veterinary Inspection', 
      location: 'All Areas', 
      date: 'Dec 28',
      assignee: 'Dr. Anderson'
    },
    { 
      title: 'Feed Stock Delivery', 
      location: 'Storage Area', 
      date: 'Dec 30',
      assignee: 'John Smith'
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const toggleTaskComplete = (taskId: number) => {
    // In a real app, this would update the task status
    console.log(`Toggle task ${taskId} completion`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Task Management</Text>
        <Text style={styles.subtitle}>Daily tasks and assignments</Text>
      </View>

      {/* Task Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <CheckSquare size={24} color="#10B981" />
          <Text style={styles.summaryValue}>12</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Clock size={24} color="#F59E0B" />
          <Text style={styles.summaryValue}>4</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Users size={24} color="#3B82F6" />
          <Text style={styles.summaryValue}>6</Text>
          <Text style={styles.summaryLabel}>Staff Active</Text>
        </View>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        {todayTasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={styles.taskItem}
            onPress={() => toggleTaskComplete(task.id)}
          >
            <View style={styles.taskCheckbox}>
              <View style={[
                styles.checkbox, 
                task.completed && styles.checkboxCompleted
              ]}>
                {task.completed && (
                  <CheckSquare size={16} color="#FFFFFF" />
                )}
              </View>
            </View>
            <View style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <Text style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted
                ]}>
                  {task.title}
                </Text>
                <View style={[
                  styles.priorityBadge, 
                  { backgroundColor: getPriorityColor(task.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText, 
                    { color: getPriorityColor(task.priority) }
                  ]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.taskLocation}>📍 {task.location}</Text>
              <View style={styles.taskFooter}>
                <Text style={styles.taskAssignee}>👤 {task.assignee}</Text>
                <Text style={styles.taskTime}>⏰ {task.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
        {upcomingTasks.map((task, index) => (
          <View key={index} style={styles.upcomingTaskItem}>
            <View style={styles.upcomingTaskContent}>
              <Text style={styles.upcomingTaskTitle}>{task.title}</Text>
              <Text style={styles.upcomingTaskLocation}>📍 {task.location}</Text>
              <View style={styles.upcomingTaskFooter}>
                <Text style={styles.upcomingTaskAssignee}>👤 {task.assignee}</Text>
                <Text style={styles.upcomingTaskDate}>📅 {task.date}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <CheckSquare size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Users size={20} color="#3B82F6" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Assign Staff</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'flex-start',
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  taskLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskAssignee: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  taskTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  upcomingTaskItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  upcomingTaskContent: {
    flex: 1,
  },
  upcomingTaskTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  upcomingTaskLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  upcomingTaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upcomingTaskAssignee: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  upcomingTaskDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
});