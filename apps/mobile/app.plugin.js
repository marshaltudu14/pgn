const { withAndroidManifest } = require('@expo/config-plugins');

const withLocationForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure manifest has uses-permissions array
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    // Add required Android 14+ foreground service permissions
    const permissions = androidManifest.manifest['uses-permission'];

    // Required permissions for Android 14+ foreground services
    const requiredPermissions = [
      { $: { 'android:name': 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK' } },
      { $: { 'android:name': 'android.permission.FOREGROUND_SERVICE_LOCATION' } },
      { $: { 'android:name': 'android.permission.FOREGROUND_SERVICE_CAMERA' } },
    ];

    requiredPermissions.forEach(permission => {
      const exists = permissions.some(p => p.$ && p.$['android:name'] === permission.$['android:name']);
      if (!exists) {
        permissions.push(permission);
      }
    });

    // Ensure application array exists
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }

    // Add foreground service type for location tracking
    const services = androidManifest.manifest.application[0].service || [];

    // Configure Notifee ForegroundService with proper types
    const notifeeServiceIndex = services.findIndex(service =>
      service.$ && service.$['android:name'] === 'app.notifee.core.ForegroundService'
    );

    if (notifeeServiceIndex >= 0) {
      // Update existing Notifee service with required foreground service types
      services[notifeeServiceIndex].$ = {
        'android:name': 'app.notifee.core.ForegroundService',
        'android:foregroundServiceType': 'location|mediaPlayback|camera',
        'android:exported': 'false',
        'tools:replace': 'android:foregroundServiceType'
      };
    } else {
      // Add Notifee service if it doesn't exist
      services.push({
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
          'android:foregroundServiceType': 'location|mediaPlayback|camera',
          'android:exported': 'false',
          'tools:replace': 'android:foregroundServiceType'
        }
      });
    }

    // Remove the old location service that's causing issues
    const filteredServices = services.filter(service =>
      !service.$ || service.$['android:name'] !== 'com.pgn.mobile.LocationForegroundService'
    );

    // Ensure the service array exists
    androidManifest.manifest.application[0].service = filteredServices;

    return config;
  });
};

module.exports = (config) => {
  return withLocationForegroundService(config);
};