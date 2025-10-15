import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { checkAppVersion, LoginResponse, loginTutor } from '../utils/api';
import { getStoredCredentials, isLoginValid } from '../utils/storage';
import AttendanceScreen from './AttendanceScreen';
import LoginScreen from './LoginScreen';
import NetworkErrorScreen from './NetworkErrorScreen';
import UpdateRequiredScreen from './UpdateRequiredScreen';

type AppState = 'loading' | 'network-error' | 'update-required' | 'login' | 'logged-in' | 'debug';

export default function MainApp() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [updateInfo, setUpdateInfo] = useState<{ currentVersion: string } | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    console.log('🚀 Starting app initialization...');
    setAppState('loading');
    
    // Add timeout to prevent infinite loading - more tolerant for unstable networks
    const initTimeout = setTimeout(() => {
      console.error('⏰ App initialization timeout - forcing network error state');
      Alert.alert(
        'Connection Timeout',
        'The app is taking too long to connect. Please check your internet connection.',
        [{ text: 'OK' }]
      );
      setAppState('network-error');
    }, 20000); // 20 seconds
    
    try {
      // First check version and internet connectivity
      console.log('📡 Checking app version...');
      const versionResponse = await checkAppVersion();
      console.log('✅ Version check response:', versionResponse);
      
      // Handle different response cases from backend
      if (versionResponse.updateRequired) {
        console.log('🔄 Update required');
        // Status 426 - Update required
        setUpdateInfo({ currentVersion: versionResponse.currentVersion || 'Unknown' });
        setAppState('update-required');
        clearTimeout(initTimeout);
        return;
      }
      
      // Status 200 - Version is OK (latest version or version check completed)
      console.log('✅ Version OK, checking login status...');
      // Proceed with login check
      await checkLoginStatus();
      clearTimeout(initTimeout);
      
    } catch (error) {
      console.error('❌ Version check failed:', error);
      clearTimeout(initTimeout);
      
      // Handle different error scenarios
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // Check if it's a 400 error (missing userVersion)
        if (error.message.includes('400')) {
          console.error('Bad request - userVersion missing');
          setAppState('network-error');
        }
        // Check if it's a 500 error (server error)
        else if (error.message.includes('500')) {
          console.error('Server error during version check');
          setAppState('network-error');
        }
        // Network connectivity issues
        else {
          console.error('Network or other error');
          setAppState('network-error');
        }
      } else {
        console.error('Unknown error type:', error);
        setAppState('network-error');
      }
    }
  };

  const checkLoginStatus = async () => {
    try {
      console.log('🔐 Checking login validity...');
      const loginValid = await isLoginValid();
      console.log('Login valid:', loginValid);
      
      if (loginValid) {
        console.log('🔑 Login is valid, getting stored credentials...');
        // Try auto-login with stored credentials
        const credentials = await getStoredCredentials();
        console.log('Stored credentials found:', !!credentials);
        
        if (credentials) {
          try {
            console.log('🔄 Attempting auto-login...');
            const freshUserData = await loginTutor(credentials);
            console.log('✅ Auto-login successful');
            setUserData(freshUserData);
            setAppState('logged-in');
          } catch (error) {
            console.error('❌ Auto-login failed:', error);
            setAppState('login');
          }
        } else {
          console.log('📝 No stored credentials, showing login screen');
          setAppState('login');
        }
      } else {
        console.log('📝 Login not valid, showing login screen');
        setAppState('login');
      }
    } catch (error) {
      console.error('❌ Error checking login status:', error);
      setAppState('network-error');
    }
  };

  const handleLoginSuccess = (userData: LoginResponse) => {
    setUserData(userData);
    setAppState('logged-in');
  };

  const handleLogout = () => {
    setUserData(null);
    setAppState('login');
  };

  const handleRetry = () => {
    initializeApp();
  };

  // Removed skip version check and debug flows per requirements

  const renderScreen = () => {
    switch (appState) {
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        );
      
      case 'network-error':
        return <NetworkErrorScreen onRetry={handleRetry} />;
      
      case 'update-required':
        return (
          <UpdateRequiredScreen 
            currentVersion={updateInfo?.currentVersion || 'Unknown'} 
            onRetry={handleRetry} 
          />
        );
      
      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      
      case 'logged-in':
        return userData ? (
          <AttendanceScreen userData={userData} onLogout={handleLogout} />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        );
      
      default:
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});