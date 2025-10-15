import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';
import { LoginResponse } from './api';

const STORAGE_KEYS = {
  USER_DATA: 'userData',
  TOKEN: 'token',
  LOGIN_TIMESTAMP: 'loginTimestamp'
};

export const saveUserData = async (userData: LoginResponse) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, userData.token);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const getUserData = async (): Promise<LoginResponse | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
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