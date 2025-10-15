import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';

const STORAGE_KEYS = {
  PHONE: 'phone',
  PASSWORD: 'password',
  LOGIN_TIMESTAMP: 'loginTimestamp'
};

export const saveLoginCredentials = async (phone: string, password: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PHONE, phone);
    await AsyncStorage.setItem(STORAGE_KEYS.PASSWORD, password);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error saving login credentials:', error);
    throw error;
  }
};

export const getStoredCredentials = async (): Promise<{phone: string, password: string} | null> => {
  try {
    const phone = await AsyncStorage.getItem(STORAGE_KEYS.PHONE);
    const password = await AsyncStorage.getItem(STORAGE_KEYS.PASSWORD);
    
    if (phone && password) {
      return { phone, password };
    }
    return null;
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return null;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

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

export const clearUserData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.LOGIN_TIMESTAMP
    ]);
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};