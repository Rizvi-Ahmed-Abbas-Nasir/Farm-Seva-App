import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private initialized = false;

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('🔕 Notifications not supported on web');
      return false;
    }

    if (this.initialized) {
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('urgent', {
          name: 'Urgent Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      this.initialized = true;
      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(
    id: string,
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any,
    priority: 'default' | 'urgent' = 'default'
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          priority: priority === 'urgent' 
            ? Notifications.AndroidNotificationPriority.MAX 
            : Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      console.log(`✅ Scheduled notification: ${id}`);
    } catch (error) {
      console.error(`❌ Error scheduling notification ${id}:`, error);
    }
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log(`🗑️ Cancelled notification: ${id}`);
    } catch (error) {
      console.error(`❌ Error cancelling notification ${id}:`, error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Cancelled all notifications');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  /**
   * Schedule vaccination reminder
   */
  async scheduleVaccinationReminder(
    vaccinationId: string,
    animalName: string,
    vaccineName: string,
    scheduledDate: Date,
    reminderHours: number = 24
  ): Promise<void> {
    const reminderTime = new Date(scheduledDate);
    reminderTime.setHours(reminderTime.getHours() - reminderHours);

    if (reminderTime <= new Date()) {
      console.log(`⏰ Vaccination reminder time has passed for ${vaccinationId}`);
      return;
    }

    await this.scheduleNotification(
      `vaccination_${vaccinationId}`,
      '💉 Vaccination Reminder',
      `${animalName} needs ${vaccineName} vaccination`,
      {
        type: 'date',
        date: reminderTime,
        repeats: false,
      } as Notifications.DateTriggerInput,
      {
        type: 'vaccination_reminder',
        vaccinationId,
        animalName,
        vaccineName,
      },
      'urgent'
    );
  }

  /**
   * Schedule checkup reminder
   */
  async scheduleCheckupReminder(
    checkupId: string,
    animalName: string,
    checkupType: string,
    scheduledDate: Date,
    reminderHours: number = 1
  ): Promise<void> {
    const reminderTime = new Date(scheduledDate);
    reminderTime.setHours(reminderTime.getHours() - reminderHours);

    if (reminderTime <= new Date()) {
      console.log(`⏰ Checkup reminder time has passed for ${checkupId}`);
      return;
    }

    await this.scheduleNotification(
      `checkup_${checkupId}`,
      '🩺 Health Checkup Reminder',
      `${animalName} - ${checkupType} checkup scheduled`,
      {
        type: 'date',
        date: reminderTime,
        repeats: false,
      } as Notifications.DateTriggerInput,
      {
        type: 'checkup_reminder',
        checkupId,
        animalName,
        checkupType,
      },
      'default'
    );
  }

  /**
   * Schedule task reminder
   */
  async scheduleTaskReminder(
    taskId: string,
    taskName: string,
    taskDate: Date,
    taskTime: string,
    reminderMinutes: number = 30
  ): Promise<void> {
    const [hours, minutes] = taskTime.split(':').map(Number);
    const reminderTime = new Date(taskDate);
    reminderTime.setHours(hours, minutes - reminderMinutes, 0, 0);

    if (reminderTime <= new Date()) {
      console.log(`⏰ Task reminder time has passed for ${taskId}`);
      return;
    }

    await this.scheduleNotification(
      `task_${taskId}`,
      '📋 Task Reminder',
      `${taskName} is due soon`,
      {
        type: 'date',
        date: reminderTime,
        repeats: false,
      } as Notifications.DateTriggerInput,
      {
        type: 'task_reminder',
        taskId,
        taskName,
      },
      'default'
    );
  }

  /**
   * Schedule risk assessment alert
   */
  async scheduleRiskAlert(level: string, overview: string): Promise<void> {
    const emoji = level === 'high' ? '🔴' : level === 'medium' ? '🟡' : '🟢';
    
    await this.scheduleNotification(
      `risk_${Date.now()}`,
      `${emoji} Risk Assessment Alert`,
      `Risk Level: ${level.toUpperCase()} - ${overview.substring(0, 100)}`,
      null, // Immediate notification
      {
        type: 'risk_alert',
        level,
        overview,
      },
      level === 'high' ? 'urgent' : 'default'
    );
  }

  /**
   * Schedule outbreak alert
   */
  async scheduleOutbreakAlert(
    diseaseName: string,
    location: string,
    severity: string
  ): Promise<void> {
    await this.scheduleNotification(
      `outbreak_${Date.now()}`,
      '🚨 Outbreak Alert',
      `${diseaseName} detected near ${location}`,
      null, // Immediate notification
      {
        type: 'outbreak_alert',
        diseaseName,
        location,
        severity,
      },
      'urgent'
    );
  }

  /**
   * Schedule IoT alert (temperature, water level, etc.)
   */
  async scheduleIoTAlert(
    sensorType: string,
    value: number,
    threshold: number,
    status: 'high' | 'low' | 'critical'
  ): Promise<void> {
    const emoji = status === 'critical' ? '🔴' : '🟡';
    const message = 
      status === 'high' 
        ? `${sensorType} is high: ${value} (threshold: ${threshold})`
        : `${sensorType} is low: ${value} (threshold: ${threshold})`;

    await this.scheduleNotification(
      `iot_${sensorType}_${Date.now()}`,
      `${emoji} ${sensorType} Alert`,
      message,
      null, // Immediate notification
      {
        type: 'iot_alert',
        sensorType,
        value,
        threshold,
        status,
      },
      status === 'critical' ? 'urgent' : 'default'
    );
  }

  /**
   * Schedule daily summary notification
   */
  async scheduleDailySummary(hour: number = 8): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);

    await this.scheduleNotification(
      'daily_summary',
      '📊 Daily Farm Summary',
      'Check your farm activities and reminders for today',
      {
        type: 'daily',
        hour,
        minute: 0,
        repeats: true,
      } as Notifications.DailyTriggerInput,
      {
        type: 'daily_summary',
      },
      'default'
    );
  }
}

export const notificationService = new NotificationService();

