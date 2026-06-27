const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const OPEN_RAIN_ALERT_ACTION = 'OPEN_RAIN_ALERT';
const DEFAULT_CATEGORY = 'android.intent.category.DEFAULT';

function hasOpenRainAlertIntentFilter(intentFilters = []) {
  return intentFilters.some((intentFilter) => {
    const actions = intentFilter.action ?? [];
    const categories = intentFilter.category ?? [];

    return (
      actions.some((action) => action.$?.['android:name'] === OPEN_RAIN_ALERT_ACTION) &&
      categories.some((category) => category.$?.['android:name'] === DEFAULT_CATEGORY)
    );
  });
}

module.exports = function withOpenRainAlertIntent(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      configWithManifest.modResults
    );
    const intentFilters = mainActivity['intent-filter'] ?? [];

    if (!hasOpenRainAlertIntentFilter(intentFilters)) {
      intentFilters.push({
        action: [
          {
            $: {
              'android:name': OPEN_RAIN_ALERT_ACTION,
            },
          },
        ],
        category: [
          {
            $: {
              'android:name': DEFAULT_CATEGORY,
            },
          },
        ],
      });

      mainActivity['intent-filter'] = intentFilters;
    }

    return configWithManifest;
  });
};
