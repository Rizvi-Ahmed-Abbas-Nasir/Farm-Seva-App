import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Storage keys
const STORAGE_KEYS = {
  TASKS: '@offline_tasks',
  VACCINATIONS: '@offline_vaccinations',
  CHECKUPS: '@offline_checkups',
  SYNC_QUEUE: '@sync_queue',
  LAST_SYNC: '@last_sync',
  VET_DATA: '@offline_vet_data',
  GOVT_SCHEMES: '@offline_govt_schemes',
  OUTBREAK_ALERTS: '@offline_outbreak_alerts',
};

// Sync queue item interface
export interface SyncQueueItem {
  id: string;
  type: 'task' | 'vaccination' | 'checkup';
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineService {
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initNetworkListener();
  }

  // Initialize network status listener
  private initNetworkListener() {
    // Get initial state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected ?? false;
      this.notifyListeners();
    });

    // Listen for changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
        
        // Auto-sync when coming back online
        if (this.isOnline) {
          this.syncPendingActions();
        }
      }
    });
  }

  // Subscribe to network status changes
  subscribe(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  // Check if currently online
  isConnected(): boolean {
    return this.isOnline;
  }

  // Cache data locally
  async cacheData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error(`Error caching ${key}:`, error);
    }
  }

  // Get cached data
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data as T;
      }
    } catch (error) {
      console.error(`Error getting cached ${key}:`, error);
    }
    return null;
  }

  // Add action to sync queue
  async queueAction(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const queueItem: SyncQueueItem = {
        ...item,
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retries: 0,
      };
      
      queue.push(queueItem);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      
      console.log(`📦 Queued ${item.action} for ${item.type}:`, queueItem.id);
    } catch (error) {
      console.error('Error queueing action:', error);
    }
  }

  // Get sync queue
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  // Clear sync queue
  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }

  // Remove item from sync queue
  async removeFromQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  // Sync a single queued action
  async syncAction(item: SyncQueueItem, token: string, apiUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}${item.endpoint}`, {
        method: item.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: item.method !== 'GET' && item.data ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        console.log(`✅ Synced ${item.action} for ${item.type}:`, item.id);
        await this.removeFromQueue(item.id);
        return true;
      } else {
        // Increment retries
        item.retries += 1;
        const queue = await this.getSyncQueue();
        const index = queue.findIndex(q => q.id === item.id);
        if (index !== -1) {
          queue[index] = item;
          await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
        }
        
        // If retries exceed 3, remove from queue
        if (item.retries >= 3) {
          console.warn(`⚠️ Max retries reached for ${item.id}, removing from queue`);
          await this.removeFromQueue(item.id);
        }
        
        return false;
      }
    } catch (error) {
      console.error(`❌ Error syncing ${item.id}:`, error);
      item.retries += 1;
      const queue = await this.getSyncQueue();
      const index = queue.findIndex(q => q.id === item.id);
      if (index !== -1) {
        queue[index] = item;
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      }
      return false;
    }
  }

  // Sync all pending actions
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline) {
      console.log('📴 Offline - skipping sync');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      
      if (!token) {
        console.log('No token available for sync');
        return;
      }

      const queue = await this.getSyncQueue();
      if (queue.length === 0) {
        console.log('✅ No pending actions to sync');
        return;
      }

      console.log(`🔄 Syncing ${queue.length} pending actions...`);

      // Sync actions sequentially to avoid conflicts
      for (const item of queue) {
        await this.syncAction(item, token, apiUrl);
        // Small delay between syncs
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      console.log('✅ Sync completed');
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    }
  }

  // Task-specific methods
  async cacheTasks(tasks: any[]): Promise<void> {
    await this.cacheData(STORAGE_KEYS.TASKS, tasks);
  }

  async getCachedTasks(): Promise<any[] | null> {
    return await this.getCachedData<any[]>(STORAGE_KEYS.TASKS);
  }

  // Vaccination-specific methods
  async cacheVaccinations(vaccinations: any[]): Promise<void> {
    await this.cacheData(STORAGE_KEYS.VACCINATIONS, vaccinations);
  }

  async getCachedVaccinations(): Promise<any[] | null> {
    return await this.getCachedData<any[]>(STORAGE_KEYS.VACCINATIONS);
  }

  // Checkup-specific methods
  async cacheCheckups(checkups: any[]): Promise<void> {
    await this.cacheData(STORAGE_KEYS.CHECKUPS, checkups);
  }

  async getCachedCheckups(): Promise<any[] | null> {
    return await this.getCachedData<any[]>(STORAGE_KEYS.CHECKUPS);
  }

  // Vet-specific methods
  async cacheVetData(city: string, animalType: string, data: any[]): Promise<void> {
    const key = `${STORAGE_KEYS.VET_DATA}_${city}_${animalType}`;
    await this.cacheData(key, data);
  }

  async getCachedVetData(city: string, animalType: string): Promise<any[] | null> {
    const key = `${STORAGE_KEYS.VET_DATA}_${city}_${animalType}`;
    return await this.getCachedData<any[]>(key);
  }

  // Government Schemes methods
  async cacheGovtSchemes(schemes: any[]): Promise<void> {
    await this.cacheData(STORAGE_KEYS.GOVT_SCHEMES, schemes);
  }

  async getCachedGovtSchemes(): Promise<any[] | null> {
    return await this.getCachedData<any[]>(STORAGE_KEYS.GOVT_SCHEMES);
  }

  // Outbreak Alerts methods
  async cacheOutbreakAlerts(alerts: any[]): Promise<void> {
    await this.cacheData(STORAGE_KEYS.OUTBREAK_ALERTS, alerts);
  }

  async getCachedOutbreakAlerts(): Promise<any[] | null> {
    return await this.getCachedData<any[]>(STORAGE_KEYS.OUTBREAK_ALERTS);
  }

  // Clear all cached data (for logout)
  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.VACCINATIONS,
        STORAGE_KEYS.CHECKUPS,
        STORAGE_KEYS.SYNC_QUEUE,
        STORAGE_KEYS.LAST_SYNC,
        STORAGE_KEYS.VET_DATA,
        STORAGE_KEYS.GOVT_SCHEMES,
        STORAGE_KEYS.OUTBREAK_ALERTS,
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

