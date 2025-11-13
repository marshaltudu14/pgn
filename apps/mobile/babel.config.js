module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './',
          },
        },
      ],
      // React Native Reanimated plugin has to be listed last.
      'react-native-reanimated/plugin',
    ],
  };
};