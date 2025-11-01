import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StudentsManagement from './StudentsManagement'; // <- correct import
import type { StackNavigationProp } from '@react-navigation/stack';

// If you have defined your navigation types:
type RootStackParamList = {
  StudentManagement: undefined;
  Profile: undefined;
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SideBarProps {
  onClose: () => void;
}

const SideBar: React.FC<SideBarProps> = ({ onClose }) => {
  const navigation = useNavigation<NavigationProp>();

  const handleNavigate = (screen: keyof RootStackParamList) => {
    onClose(); // close sidebar first
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      {/* Menu items */}
      <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('StudentManagement')}>
        <Text style={styles.menuText}>Student Management</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Profile')}>
        <Text style={styles.menuText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Settings')}>
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
