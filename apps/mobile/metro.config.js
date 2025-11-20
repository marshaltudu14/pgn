const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(projectRoot);

// Only watch specific package folders, not the whole repo root
config.watchFolders = [
  path.resolve(workspaceRoot, "packages/shared"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// nativewind compatible transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-css-transformer")
};

module.exports = config;