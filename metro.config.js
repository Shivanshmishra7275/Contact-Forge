const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm support to Metro so it can resolve .wasm assets required by expo-sqlite on web
config.resolver.assetExts.push('wasm');

// Inject headers required for SharedArrayBuffer (necessary for expo-sqlite / sqlite-wasm on web)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      return middleware(req, res, next);
    };
  }
};

module.exports = config;
