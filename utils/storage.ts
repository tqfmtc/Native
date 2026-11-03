import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../constants/config';

const STORAGE_KEYS = {
  PHONE: 'phone',
  PASSWORD: 'password',
  LOGIN_TIMESTAMP: 'loginTimestamp'
};

// The password lives in SecureStore (Android Keystore / iOS Keychain), never in
// AsyncStorage, which is unencrypted and readable from device backups.
export const saveLoginCredentials = async (phone: string, password: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PHONE, phone);
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD, password);
    await AsyncStorage.removeItem(STORAGE_KEYS.PASSWORD);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error saving login credentials:', error);
    throw error;
  }
};

export const getStoredCredentials = async (): Promise<{phone: string, password: string} | null> => {
  try {
    const phone = await AsyncStorage.getItem(STORAGE_KEYS.PHONE);
    let password = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD);

    // Migrate installs from older versions that kept the password in AsyncStorage
    if (!password) {
      const legacy = await AsyncStorage.getItem(STORAGE_KEYS.PASSWORD);
      if (legacy) {
        await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD, legacy);
        await AsyncStorage.removeItem(STORAGE_KEYS.PASSWORD);
        password = legacy;
      }
    }

    if (phone && password) {
      return { phone, password };
    }
    return null;
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return null;
  }
};

// Remove getToken function since we don't store tokens anymore

export const isLoginValid = async (): Promise<boolean> => {
  try {
    const loginTimestamp = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
    if (!loginTimestamp) return false;
    
    const loginTime = parseInt(loginTimestamp);
    const currentTime = Date.now();
    const daysDifference = (currentTime - loginTime) / (1000 * 60 * 60 * 24);
    
    return daysDifference < APP_CONFIG.LOGIN_PERSISTENCE_DAYS;
  } catch (error) {
    console.error('Error checking login validity:', error);
    return false;
  }
};

export const clearStoredCredentials = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PHONE,
      STORAGE_KEYS.PASSWORD,
      STORAGE_KEYS.LOGIN_TIMESTAMP
    ]);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD);
  } catch (error) {
    console.error('Error clearing stored credentials:', error);
    throw error;
  }
};

// Attendance tracking
export const getTodayAttendanceKey = () => {
  // yyyy-mm-dd in local time (toISOString() is UTC: yesterday before 05:30 IST)
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `attendance_marked_${today}`;
};

export const saveMarkedAttendance = async (studentIds: string[]) => {
  try {
    const key = getTodayAttendanceKey();
    await AsyncStorage.setItem(key, JSON.stringify(studentIds));
  } catch (error) {
    console.error('Error saving marked attendance:', error);
    throw error;
  }
};

export const getMarkedAttendance = async (): Promise<string[]> => {
  try {
    const key = getTodayAttendanceKey();
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting marked attendance:', error);
    return [];
  }
};

export const addMarkedStudent = async (studentId: string) => {
  try {
    const marked = await getMarkedAttendance();
    if (!marked.includes(studentId)) {
      marked.push(studentId);
      await saveMarkedAttendance(marked);
    }
  } catch (error) {
    console.error('Error adding marked student:', error);
    throw error;
  }
};