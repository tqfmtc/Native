import { Platform } from 'react-native';

let MapView: any;
let Marker: any;
let Circle: any;

if (Platform.OS === 'web') {
  const WebMapView = require('./WebMapView').default;
  const { WebMarker, WebCircle } = require('./WebMapView');
  
  MapView = WebMapView;
  Marker = WebMarker;
  Circle = WebCircle;
} else {
  // Native platforms (iOS/Android)
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  Circle = RNMaps.Circle;
}

export { Circle, MapView, Marker };
