const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo Config Plugin to enable Android TV (Leanback) support in AndroidManifest.xml
 */
const withAndroidTv = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // 1. Ensure uses-feature declarations
    if (!androidManifest['uses-feature']) {
      androidManifest['uses-feature'] = [];
    }

    // leanback requirement false so phone & TV both work
    const features = androidManifest['uses-feature'];
    const hasLeanback = features.some(
      (f) => f.$ && f.$['android:name'] === 'android.software.leanback'
    );
    if (!hasLeanback) {
      features.push({
        $: {
          'android:name': 'android.software.leanback',
          'android:required': 'false',
        },
      });
    }

    const hasTouchscreen = features.some(
      (f) => f.$ && f.$['android:name'] === 'android.hardware.touchscreen'
    );
    if (!hasTouchscreen) {
      features.push({
        $: {
          'android:name': 'android.hardware.touchscreen',
          'android:required': 'false',
        },
      });
    }

    // 2. Add LEANBACK_LAUNCHER to main activity
    const application = androidManifest.application?.[0];
    if (application && application.activity) {
      const mainActivity = application.activity.find(
        (a) => a.$ && a.$['android:name'] === '.MainActivity'
      );
      if (mainActivity) {
        if (!mainActivity['intent-filter']) {
          mainActivity['intent-filter'] = [];
        }

        const hasLeanbackCategory = mainActivity['intent-filter'].some(
          (filter) =>
            filter.category &&
            filter.category.some(
              (c) => c.$ && c.$['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER'
            )
        );

        if (!hasLeanbackCategory) {
          mainActivity['intent-filter'].push({
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [
              {
                $: {
                  'android:name': 'android.intent.category.LEANBACK_LAUNCHER',
                },
              },
            ],
          });
        }

        // Set banner if present
        mainActivity.$['android:banner'] = '@drawable/tv_banner';
      }
    }

    return config;
  });
};

module.exports = withAndroidTv;
