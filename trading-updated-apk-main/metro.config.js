const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for socket.io-client / engine.io-client resolution
config.resolver.sourceExts.push('mjs');

module.exports = config;
