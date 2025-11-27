const { withAndroidManifest } = require('@expo/config-plugins');

const withLocationForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure application array exists
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }

    // Add foreground service type for location tracking
    const services = androidManifest.manifest.application[0].service || [];

    // Add a generic foreground service for location tracking if not exists
    const locationServiceExists = services.some(service => {
      return service.$ && service.$['android:foregroundServiceType'] &&
             service.$['android:foregroundServiceType'].includes('location');
    });

    if (!locationServiceExists) {
      services.push({
        $: {
          'android:name': 'com.pgn.mobile.LocationForegroundService',
          'android:foregroundServiceType': 'location',
          'android:exported': 'false',
          'android:enabled': 'true'
        }
      });
    }

    // Ensure the service array exists
    androidManifest.manifest.application[0].service = services;

    return config;
  });
};

module.exports = (config) => {
  return withLocationForegroundService(config);
};