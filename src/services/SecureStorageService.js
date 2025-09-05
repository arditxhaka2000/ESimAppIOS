import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SecureStorageService {
  static instance = null;

  constructor() {
    this.serviceName = 'NextESimApp';
  }

  static getInstance() {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  static async initialize() {
    return SecureStorageService.getInstance();
  }

  static async getAsync(key) {
    try {
      // For sensitive data like tokens, use SecureStore
      if (key === 'bearer_token' || key.includes('password') || key.includes('token')) {
        const value = await SecureStore.getItemAsync(key);
        return value;
      }
      
      // For non-sensitive data, use AsyncStorage
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error getting secure storage value:', error.message);
      return null;
    }
  }

  static async setAsync(key, value) {
    try {
      // For sensitive data like tokens, use SecureStore
      if (key === 'bearer_token' || key.includes('password') || key.includes('token')) {
        await SecureStore.setItemAsync(key, value, {
          requireAuthentication: false, // Set to true if you want biometric auth
        });
        return;
      }
      
      // For non-sensitive data, use AsyncStorage
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting secure storage value:', error.message);
      // Fallback to AsyncStorage if SecureStore fails
      try {
        await AsyncStorage.setItem(key, value);
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError.message);
      }
    }
  }

  static async removeAsync(key) {
    try {
      // For sensitive data like tokens, use SecureStore
      if (key === 'bearer_token' || key.includes('password') || key.includes('token')) {
        await SecureStore.deleteItemAsync(key);
        return true;
      }
      
      // For non-sensitive data, use AsyncStorage
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing secure storage value:', error.message);
      return false;
    }
  }

  static async removeAllAsync() {
    try {
      // Clear all AsyncStorage
      await AsyncStorage.clear();
      
      // Clear common secure keys
      const commonKeys = ['bearer_token', 'user_token', 'refresh_token'];
      for (const key of commonKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Ignore individual key errors
        }
      }
    } catch (error) {
      console.error('Error removing all secure storage values:', error.message);
    }
  }
}