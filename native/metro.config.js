const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// the domain logic (rotation, streak, copy, time) is shared with the web app and the Edge Functions
config.watchFolders = [path.resolve(__dirname, '../supabase/functions/_shared/domain')];

// expo-sqlite's web worker ships a wasm binary (only used by the web build for screenshots)
config.resolver.assetExts.push('wasm');

module.exports = config;
