import { Platform } from 'react-native';

// Import based on platform
const MapView = Platform.select({
  native: () => require('react-native-maps').default,
  web: () => require('./WebMapView').default,
})();

const Marker = Platform.select({
  native: () => require('react-native-maps').Marker,
  web: () => require('./WebMapView').WebMarker,
})();

const Circle = Platform.select({
  native: () => require('react-native-maps').Circle,
  web: () => require('./WebMapView').WebCircle,
})();

export { Circle, MapView, Marker };
