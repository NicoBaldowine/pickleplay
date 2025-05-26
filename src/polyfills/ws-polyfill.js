// WebSocket polyfill for React Native
// This provides empty implementations to prevent bundling errors

class WebSocketPolyfill {
  constructor() {
    console.warn('WebSocket is not available in React Native. Realtime features are disabled.');
  }
  
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

// Export both default and named exports to handle different import styles
module.exports = WebSocketPolyfill;
module.exports.default = WebSocketPolyfill;
module.exports.WebSocket = WebSocketPolyfill;

// For ES6 imports
if (typeof exports === 'object') {
  exports.WebSocket = WebSocketPolyfill;
  exports.default = WebSocketPolyfill;
} 