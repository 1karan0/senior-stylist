import Config from 'react-native-config';

/**
 * Configuration Module
 *
 * This file acts as a bridge between .env files and your app code.
 *
 * How it works:
 * 1. .env.dev / .env.prod files store the raw values
 * 2. react-native-config reads those files at build time
 * 3. This config.ts file provides a clean, typed interface with fallbacks
 * 4. Your app imports from @/config (not directly from react-native-config)
 *
 * Benefits:
 * - Single source of truth for all config values
 * - Type safety and fallback values
 * - Easy to refactor or change implementation
 * - Centralized place for computed/derived values
 */

// Environment
export const ENV = Config.ENV;
console.log('env checking=======', ENV);
// API Configuration
export const BASE_URL = Config.BASE_URL;
console.log('base url checking=======', BASE_URL);
// Export all config values in one object (optional, for convenience)
export const config = {
  ENV,
  BASE_URL,
  FIREBASE_PROJECT_ID: Config.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: Config.FIREBASE_STORAGE_BUCKET,
  FIREBASE_API_KEY: Config.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: Config.FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID: Config.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: Config.FIREBASE_APP_ID,
  // Add other environment variables here as needed:
  // API_KEY: Config.API_KEY || '',
  // DEBUG_MODE: Config.DEBUG_MODE === 'true',
  // FEATURE_FLAG_X: Config.FEATURE_FLAG_X === 'true',
};
