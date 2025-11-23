const { withAndroidManifest } = require('@expo/config-plugins');

const withNotifeeForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Add foreground service type to Notifee service
    const services = androidManifest.manifest.application[0].service || [];

    // Find or create the Notifee foreground service
    let notifeeService = services.find(service => {
      return service.$ && service.$['android:name'] === 'app.notifee.core.ForegroundService';
    });

    if (notifeeService) {
      // Update existing service
      notifeeService.$['android:foregroundServiceType'] = 'location';
    } else {
      // Add new service
      services.push({
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
          'android:foregroundServiceType': 'location',
          'android:exported': 'false'
        }
      });
    }

    // Add Notifee receiver activities for permission handling
    const activities = androidManifest.manifest.application[0].activity || [];

    // Add Notifee permission receiver activity
    activities.push({
      $: {
        'android:name': 'app.notifee.core.NotificationPermissionActivity',
        'android:exported': 'false',
        'android:theme': '@android:style/Theme.Translucent.NoTitleBar'
      }
    });

    // Ensure the service and activity arrays exist
    androidManifest.manifest.application[0].service = services;
    androidManifest.manifest.application[0].activity = activities;

    return config;
  });
};

module.exports = (config) => {
  return withNotifeeForegroundService(config);
};