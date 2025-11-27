import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import notifee from '@notifee/react-native';

// Set the environment variable before expo-router tries to use it
process.env.EXPO_ROUTER_APP_ROOT = './app';

// Register the foreground service - exactly as shown in docs
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Long running task...
  });
});

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);