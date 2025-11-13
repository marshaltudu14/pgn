const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Configure resolver for monorepo
config.resolver.alias = {
  '@': path.resolve(projectRoot, '.'),
};

module.exports = config;