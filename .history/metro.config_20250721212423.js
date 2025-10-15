const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver to handle react-native-maps on web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclude react-native-maps from web bundle
config.resolver.blockList = [
  /react-native-maps\/.*\.web\.js$/,
];

module.exports = config;