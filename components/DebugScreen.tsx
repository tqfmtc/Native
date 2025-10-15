import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_CONFIG, APP_CONFIG } from '../constants/config';
import { checkAppVersion, testConnectivity } from '../utils/api';

interface DebugScreenProps {
  onClose: () => void;
}

export default function DebugScreen({ onClose }: DebugScreenProps) {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setDebugInfo([]);
    
    addDebugInfo('🚀 Starting diagnostics...');
    
    // Test 1: Basic connectivity
    try {
      addDebugInfo('🔍 Testing basic connectivity...');
      const hasConnectivity = await testConnectivity();
      addDebugInfo(`✅ Basic connectivity: ${hasConnectivity ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      addDebugInfo(`❌ Basic connectivity error: ${error}`);
    }

    // Test 2: API endpoint
    try {
      addDebugInfo('🌐 Testing API endpoint...');
      addDebugInfo(`API URL: ${API_CONFIG.BASE_URL}`);
      const versionResponse = await checkAppVersion();
      addDebugInfo(`✅ Version check: ${JSON.stringify(versionResponse)}`);
    } catch (error) {
      addDebugInfo(`❌ Version check error: ${error}`);
    }

    // Test 3: App config
    addDebugInfo(`📱 App version: ${APP_CONFIG.APP_VERSION}`);
    addDebugInfo(`📍 Attendance radius: ${APP_CONFIG.ATTENDANCE_RADIUS}m`);
    
    setTesting(false);
    addDebugInfo('✅ Diagnostics complete');
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Information</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>
            {info}
          </Text>
        ))}
        {testing && (
          <Text style={styles.testingText}>Running diagnostics...</Text>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.retestButton} 
        onPress={runDiagnostics}
        disabled={testing}
      >
        <Text style={styles.retestButtonText}>
          {testing ? 'Testing...' : 'Run Tests Again'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 5,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
  },
  testingText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
  },
  retestButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  retestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});