import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Set the environment variable before expo-router tries to use it
process.env.EXPO_ROUTER_APP_ROOT = './app';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);