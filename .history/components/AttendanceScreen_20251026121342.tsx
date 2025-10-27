import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import SideBar from './SideBar'; // make sure this file exists
import { APP_CONFIG } from '../constants/config'; // adjust path if needed

export default function Dashboard({ userData, handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const [checkingButtonStatus, setCheckingButtonStatus] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const sidebarAnim = useRef(new Animated.Value(-300)).current;

  const toggleSidebar = () => {
    const toValue = sidebarOpen ? -300 : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setSidebarOpen(!sidebarOpen));
  };

  const handleMarkAttendance = () => {
    setLoading(true);
    setTimeout(() => {
      setAttendanceMarked(true);
      setLoading(false);
    }, 2000);
  };

  // dummy location for testing
  useEffect(() => {
    setTimeout(() => {
      setCurrentLocation({ lat: 37.7749, lng: -122.4194 });
      setLocationLoading(false);
    }, 1000);
  }, []);

  const calculateDistance = (loc1, loc2) => {
    const dx = loc1.lat - loc2.lat;
    const dy = loc1.lng - loc2.lng;
    return Math.sqrt(dx * dx + dy * dy) * 111000; // rough meters
  };

  const formatDate = () => new Date().toLocaleDateString();
  const formatTime = () => new Date().toLocaleTimeString();

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

      {/* Header */}
      <View style={styles.header}>
        {/* Hamburger */}
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.hamburgerButton3D}
            onPress={toggleSidebar}
            activeOpacity={0.8}
          >
            <View style={styles.hamburgerButtonInner}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Center Texts */}
        <View style={styles.headerContent}>
          <Text style={styles.date}>{formatDate()}</Text>
          <Text style={styles.time}>{formatTime()}</Text>
          <Text style={styles.centerName}>
            Center: {userData?.assignedCenter?.name || 'No Center Assigned'}
          </Text>
          <Text style={styles.username}>Welcome {userData?.name || 'Guest'}</Text>
        </View>

        {/* Logout */}
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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: Math.min(300, width * 0.8),
    backgroundColor: '#fff',
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    transform: [{ translateY: -3 }], // moves it slightly up
  },
  hamburgerButtonInner: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0056CC',
  },
  hamburgerLine: {
    width: 22,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginVertical: 2,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  attendanceContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  attendanceButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  attendanceButtonSunday: { backgroundColor: '#808080' },
  attendanceButtonMarked: { backgroundColor: '#34C759' },
  attendanceButtonDisabled: { backgroundColor: '#ccc' },
  attendanceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  distanceInfo: { marginTop: 20, alignItems: 'center' },
  distanceText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  radiusText: { fontSize: 14, color: '#666' },
  mapContainer: {
    height: height * 0.4,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: { flex: 1 },
  mapLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  mapLoadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  mapErrorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  mapErrorText: { fontSize: 16, color: '#666' },
});
