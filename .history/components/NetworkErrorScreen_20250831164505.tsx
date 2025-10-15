import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface NetworkErrorScreenProps {
  onRetry: () => void;
}

export default function NetworkErrorScreen({ onRetry }: NetworkErrorScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          This app requires an internet connection to work.
        </Text>
        <Text style={styles.description}>
          Please check your internet connection and try again.
        </Text>
        
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        {onSkipVersionCheck && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkipVersionCheck}>
            <Text style={styles.skipButtonText}>Skip Version Check</Text>
          </TouchableOpacity>
        )}
        
        {onShowDebug && (
          <TouchableOpacity style={styles.debugButton} onPress={onShowDebug}>
            <Text style={styles.debugButtonText}>Show Debug Info</Text>
          </TouchableOpacity>
        )}
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
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FF9500',
    marginTop: 10,
  },
  debugButtonText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});