import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Simple web fallback for maps
const WebMapView = ({ children, style, initialRegion, ...props }: any) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <Text style={styles.mapText}>Map View</Text>
      <Text style={styles.mapSubtext}>
        Center: {initialRegion?.latitude?.toFixed(4)}, {initialRegion?.longitude?.toFixed(4)}
      </Text>
      <Text style={styles.mapSubtext}>
        Web version - Use mobile app for full map functionality
      </Text>
      {children}
    </View>
  );
};

const WebMarker = ({ coordinate, title, description, ...props }: any) => {
  return (
    <View style={styles.marker}>
      <Text style={styles.markerText}>📍 {title}</Text>
      {description && <Text style={styles.markerDesc}>{description}</Text>}
    </View>
  );
};

const WebCircle = ({ center, radius, ...props }: any) => {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>Radius: {radius}m</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 20,
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  marker: {
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 5,
    margin: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  markerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  markerDesc: {
    fontSize: 10,
    color: '#666',
  },
  circle: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 5,
    borderRadius: 5,
    margin: 2,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  circleText: {
    fontSize: 10,
    color: '#007AFF',
  },
});

export default WebMapView;
export { WebCircle, WebMarker };
