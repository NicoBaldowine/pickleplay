const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for Node.js modules
config.resolver.alias = {
  crypto: 'react-native-get-random-values',
  stream: 'readable-stream',
  url: 'react-native-url-polyfill',
  util: 'util',
  buffer: '@craftzdog/react-native-buffer',
  events: 'events',
  process: 'process/browser',
};

// Add platform extensions
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Block WebSocket packages
config.resolver.blockList = [
  /node_modules\/ws\//,
  /node_modules\/isomorphic-ws\//,
];

module.exports = config; 