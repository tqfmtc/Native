import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { APP_CONFIG } from '../constants/config';

interface UpdateRequiredScreenProps {
  currentVersion: string;
  onRetry: () => void;
}

export default function UpdateRequiredScreen({ currentVersion, onRetry }: UpdateRequiredScreenProps) {
  const handleUpdatePress = () => {
    Alert.alert(
      'Update Required',
      'Please download the latest version from your administrator.',
      [
        { text: 'OK', style: 'default' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.message}>
          Your app version ({APP_CONFIG.APP_VERSION}) is outdated.
        </Text>
        <Text style={styles.message}>
          Latest version: {currentVersion}
        </Text>
        <Text style={styles.description}>
          Please update your app to continue using the attendance system.
        </Text>
        
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePress}>
          <Text style={styles.updateButtonText}>Get Update</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Check Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 350,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    width: '100%',
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});