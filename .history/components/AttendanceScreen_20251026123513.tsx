import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { APP_CONFIG } from '../constants/config';
import {
  Announcement,
  getAnnouncements,
  getRecentAttendance,
  getButtonStatus,
  LoginResponse,
  markAttendance,
} from '../utils/api';
import { calculateDistance, isWithinRadius, LocationCoords } from '../utils/location';
import { clearStoredCredentials } from '../utils/storage';
import SideBar from './SideBar'; // ✅ Sidebar import

interface AttendanceScreenProps {
  userData: LoginResponse;
  onLogout: () => void;
}

export default function AttendanceScreen({ userData, onLogout }: AttendanceScreenProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const [checkingButtonStatus, setCheckingButtonStatus] = useState(true);

  // Sidebar state + animation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useState(new Animated.Value(-250))[0];

  const toggleSidebar = () => {
    if (sidebarOpen) {
      Animated.timing(sidebarAnim, {
        toValue: -250,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setSidebarOpen(false));
    } else {
      setSidebarOpen(true);
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Mount effects
  useEffect(() => {
    getCurrentLocation();
    checkTodayAttendance();
    checkButtonStatus();
    showLatestAnnouncement();
  }, []);

  const checkButtonStatus = async () => {
    try {
      setCheckingButtonStatus(true);
      const response = await getButtonStatus(userData.token);
      setButtonEnabled(response.status);
    } catch (error) {
      console.log('Failed to check button status:', error);
      setButtonEnabled(true);
    } finally {
      setCheckingButtonStatus(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const recent = await getRecentAttendance(userData.token);
      if (Array.isArray(recent) && recent.length > 0) {
        setAttendanceMarked(true);
      }
    } catch (err) {
      console.log('Failed to check recent attendance:', err);
    }
  };

  const showLatestAnnouncement = async () => {
    try {
      const list: Announcement[] = await getAnnouncements(userData.token);
      if (Array.isArray(list) && list.length > 0) {
        const latest = list[0];
        Alert.alert(latest.title || 'Announcement', latest.body, [{ text: 'OK' }], {
          cancelable: true,
        });
      }
    } catch (e) {
      console.log('Announcements fetch failed:', e);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to mark attendance');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get your current location');
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!buttonEnabled) {
      Alert.alert('Attendance Disabled', 'Attendance has been disabled by the administrator');
      return;
    }

    if (new Date().getDay() === 0) {
      Alert.alert('Attendance Disabled', 'Sunday attendance is disabled');
      return;
    }

    if (!currentLocation || !userData?.assignedCenter) {
      Alert.alert('Error', 'Location or center data not available');
      return;
    }

    const centerLocation: LocationCoords = {
      lat: userData.assignedCenter.coordinates[0],
      lng: userData.assignedCenter.coordinates[1],
    };

    const withinRadius = isWithinRadius(currentLocation, centerLocation, APP_CONFIG.ATTENDANCE_RADIUS);

    if (!withinRadius) {
      const distance = Math.round(calculateDistance(currentLocation, centerLocation));
      Alert.alert(
        'Out of Range',
        `You are ${distance}m away from the center. You need to be within ${APP_CONFIG.ATTENDANCE_RADIUS}m to mark attendance.`
      );
      return;
    }

    setLoading(true);
    try {
      const coordinates: [number, number] = [currentLocation.lat, currentLocation.lng];

      if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(coord => typeof coord === 'number' && !isNaN(coord))) {
        throw new Error('Invalid coordinates: ' + JSON.stringify(coordinates));
      }

      const resp = await markAttendance(coordinates, userData.token);
      if (resp?.message === 'Attendance submitted successfully') {
        setAttendanceMarked(true);
        Alert.alert('Success', 'Attendance marked successfully');
      } else if (resp?.message === 'Attendance disabled by Admin') {
        Alert.alert('Attendance Disabled', 'Attendance marking has been disabled by the ADMIN.');
      } else if (resp?.message === 'Attendance only allowed at respective time') {
        Alert.alert('Attendance not allowed', `Attendance can only be marked during ${resp.assignedTime}.`);
      } else {
        setAttendanceMarked(true);
        Alert.alert('Success', resp?.message || 'Attendance marked successfully');
      }
    } catch (error) {
      console.error('Attendance marking error:', error);
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          Alert.alert('Attendance Error', 'Invalid request. Please check your location and try again.\n\nDetails: ' + error.message);
        } else if (error.message.includes('401')) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
        } else if (error.message.includes('403')) {
          Alert.alert('Permission Error', 'You do not have permission to mark attendance.');
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'Failed to mark attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearStoredCredentials();
          onLogout();
        },
      },
    ]);
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />
      )}

      {/* Animated sidebar */}
      <Animated.View style={[styles.sidebarContainer, { left: sidebarAnim }]}>
        <SideBar onClose={toggleSidebar} onNavigate={(screen) => console.log('Navigate to', screen)} />
      </Animated.View>

      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity
            style={styles.hamburgerButton3D}
            onPress={() => setIsSidebarOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.hamburgerButtonInner}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
 <View style={styles.headerContent}>
          <Text style={styles.date}>{formatDate()}</Text>
          <Text style={styles.time}>{formatTime()}</Text>
          <Text style={styles.centerName}>Center: {userData.assignedCenter?.name || 'No Center Assigned'}</Text>
          <Text style={styles.username}> Welcome {userData.name || 'Guest'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Button */}
      <View style={styles.attendanceContainer}>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            new Date().getDay() === 0 && styles.attendanceButtonSunday,
            attendanceMarked && styles.attendanceButtonMarked,
            (loading || !buttonEnabled || checkingButtonStatus) && styles.attendanceButtonDisabled,
          ]}
          onPress={handleMarkAttendance}
          disabled={loading || attendanceMarked || !buttonEnabled || checkingButtonStatus}
        >
          {loading || checkingButtonStatus ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Text style={styles.attendanceButtonText}>
              {!buttonEnabled
                ? 'Attendance Disabled by Admin'
                : attendanceMarked
                ? 'Attendance Marked Successfully'
                : 'Mark Attendance'}
            </Text>
          )}
        </TouchableOpacity>

        {currentLocation && userData?.assignedCenter && (
          <View style={styles.distanceInfo}>
            <Text style={styles.distanceText}>
              Distance to center:{' '}
              {Math.round(
                calculateDistance(currentLocation, {
                  lat: userData.assignedCenter.coordinates[0],
                  lng: userData.assignedCenter.coordinates[1],
                })
              )}
              m
            </Text>
            <Text style={styles.radiusText}>Required: Within {APP_CONFIG.ATTENDANCE_RADIUS}m</Text>
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {locationLoading ? (
          <View style={styles.mapLoadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          </View>
        ) : currentLocation && userData.assignedCenter ? (
          <WebView
            style={styles.map}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <style>body { margin: 0; } #map { height: 100vh; width: 100vw; }</style>
                </head>
                <body>
                  <div id="map"></div>
                  <script>
                    const centerLat = ${userData.assignedCenter.coordinates[0]};
                    const centerLng = ${userData.assignedCenter.coordinates[1]};
                    const userLat = ${currentLocation.lat};
                    const userLng = ${currentLocation.lng};
                    const radius = ${APP_CONFIG.ATTENDANCE_RADIUS};
                    const map = L.map('map').setView([centerLat, centerLng], 16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
                    L.marker([centerLat, centerLng]).addTo(map).bindPopup('${userData.assignedCenter.name}');
                    L.marker([userLat, userLng]).addTo(map).bindPopup('You');
                    L.circle([centerLat, centerLng], { color: 'blue', fillColor: 'lightblue', fillOpacity: 0.2, radius }).addTo(map);
                  </script>
                </body>
                </html>
              `,
            }}
          />
        ) : (
          <View style={styles.mapErrorContainer}>
            <Text style={styles.mapErrorText}>Unable to load map</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 9,
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#fff',
    zIndex: 10,
    elevation: 10,
  },
 header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    width: 56,
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  
   hamburgerButton3D: {
    width: 44,
    height: 44,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    backgroundColor: 'transparent',
    transform: [{ translateY: -50 }], 
  },
  hamburgerButtonInner: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0056CC',
    shadowColor: '#003E99',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 6,
  },
  hamburgerLine: {
    width: 22,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginVertical: 2,
  },
  menuButton: { marginRight: 10 },
  menuIcon: { fontSize: 26, color: '#007AFF', fontWeight: 'bold' },
  headerContent: { flex: 1 },
   date: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f70d01ff',
  },

  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  attendanceContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  attendanceButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  attendanceButtonSunday: { backgroundColor: '#808080' },
  attendanceButtonMarked: { backgroundColor: '#34C759' },
  attendanceButtonDisabled: { backgroundColor: '#ccc' },
  attendanceButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  distanceInfo: { marginTop: 20, alignItems: 'center' },
  distanceText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  radiusText: { fontSize: 14, color: '#666' },
  mapContainer: {
    height: height * 0.4,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
  },
  map: { flex: 1 },
  mapLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  mapLoadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  mapErrorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  mapErrorText: { fontSize: 16, color: '#666' },
});
