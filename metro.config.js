const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Get the default Metro config
const defaultConfig = getDefaultConfig(__dirname);

// Merge your custom settings (if any)
const config = mergeConfig(defaultConfig, {
  /* Add any custom metro settings here if needed */
});

// Wrap it with NativeWind
module.exports = withNativeWind(config, { input: "./global.css" });
