import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import notifee, { EventType } from '@notifee/react-native';

// Set the environment variable before expo-router tries to use it
process.env.EXPO_ROUTER_APP_ROOT = './app';

// Register the foreground service for long-running tasks
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    console.log('[ForegroundService] Started with notification:', notification);

    // Listen for foreground service events
    notifee.onForegroundEvent(async ({ type, detail }) => {
      console.log('[ForegroundService] Event:', type, detail);

      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'stop-tracking') {
        console.log('[ForegroundService] Stop tracking action pressed');
        await notifee.stopForegroundService();
      }
    });

    // This is a long-running task that will keep the service alive
    // You can add your location tracking logic here
  });
});

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);