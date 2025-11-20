module.exports = {
  displayName: "PGN Mobile Tests",
  roots: ["<rootDir>"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  setupFiles: ["<rootDir>/jest.polyfills.js"],
  preset: "react-native",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "native.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(-.*)?|@expo(nent)?|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-native-async-storage|@react-navigation|react-native-vector-icons|expo-modules)/"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    ".(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: [
    "**/__tests__/**/*.test.{js,ts,tsx}",
    "**/utils/**/*.test.{js,ts,tsx}",
    "**/services/**/*.test.{js,ts,tsx}",
    "**/hooks/**/*.test.{js,ts,tsx}",
    "**/store/**/*.test.{js,ts,tsx}",
    "**/components/**/*.test.{js,ts,tsx}"
  ],
  collectCoverageFrom: [
    "**/utils/**/*.{js,jsx,ts,tsx}",
    "**/services/**/*.{js,jsx,ts,tsx}",
    "**/hooks/**/*.{js,jsx,ts,tsx}",
    "**/store/**/*.{js,jsx,ts,tsx}",
    "**/components/**/*.{js,jsx,ts,tsx}",
    "!**/__tests__/**",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  verbose: true,
  bail: false,
};