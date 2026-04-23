const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const repoRoot = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [repoRoot],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
