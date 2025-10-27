import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SideBarProps {
  onClose: () => void;
  onNavigate: (screen: string) => void; // Example callback for navigation
}

const SideBar: React.FC<SideBarProps> = ({ onClose, onNavigate }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('StudentManagement')}>
        <Text style={styles.menuText}>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('Profile')}>
        <Text style={styles.menuText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('Settings')}>
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SideBar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: 250,
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  closeText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuItem: {
    marginVertical: 15,
  },
  menuText: {
    fontSize: 18,
    color: '#007AFF',
  },
});
