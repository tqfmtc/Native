import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SideBarProps {
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({ onClose, onNavigate }) => {
  const go = (screen: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => go('/attendance')}>
        <Text style={styles.menuText}>Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => go('/student-management')}>
        <Text style={styles.menuText}>Student Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => go('/subject-management')}>
        <Text style={styles.menuText}>Subject Marks</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.menuItem} onPress={() => go('/settings')}>
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity> */}
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
  closeButton: { position: 'absolute', top: 20, right: 20 },
  closeText: { fontSize: 28, fontWeight: 'bold' },
  menuItem: { marginVertical: 15 },
  menuText: { fontSize: 18, color: '#007AFF' },
});
