// services/versionCheck.ts
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { VersionCheckResponse } from '@/api/app/useVersionCheck';

export interface CheckAppVersionResult {
  forceUpdateRequired: boolean;
  updateAvailable: boolean;
  latestVersion: string;
  message: string | null;
  forceFullyUpdated?: boolean;
  minVersion?: string;
  currentVersion: string;
}

/**
 * Main function to check app version using your existing API
 */
export const checkAppVersion = async (): Promise<CheckAppVersionResult> => {
  try {
    const currentVersion = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();

    console.log('Checking app version:', {
      currentVersion,
      buildNumber,
      platform: Platform.OS,
    });

    // Import dynamically to avoid circular dependencies
    const { useVersionCheck } = await import('@/api/app/useVersionCheck');

    // Since useVersionCheck is a React hook, we need a different approach
    // We'll call the API directly instead of using the hook
    return await callVersionCheckAPI(currentVersion);
  } catch (error) {
    console.error('Version check failed:', error);

    // Fallback: Return safe defaults allowing app to continue
    return {
      forceUpdateRequired: false,
      updateAvailable: false,
      latestVersion: DeviceInfo.getVersion(),
      message: null,
      forceFullyUpdated: false,
      currentVersion: DeviceInfo.getVersion(),
    };
  }
};

/**
 * Direct API call function (since we can't use React hooks outside components)
 */
const callVersionCheckAPI = async (currentVersion: string): Promise<CheckAppVersionResult> => {
  try {
    const { BASE_URL } = await import('@/config');

    const payload = {
      platform: Platform.OS === 'ios' ? ('ios' as const) : ('android' as const),
      current_version: currentVersion,
    };

    console.log('Making version check request:', payload);

    // Using fetch directly since we can't use axios with hooks
    const response = await fetch(`${BASE_URL}/api/app/version-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Version check failed with status: ${response.status}`);
    }

    const data: VersionCheckResponse = await response.json();

    console.log('Version check API response:', data);

    // Map your API response to the expected format
    const versionData = data.data;

    // Determine if update is available by comparing versions
    const updateAvailable = compareVersions(currentVersion, versionData.min_required_version) < 0; // Current version is less than min required

    return {
      forceUpdateRequired: versionData.force_update_required,
      updateAvailable: updateAvailable,
      latestVersion: versionData.min_required_version, // Assuming min_required_version is the latest
      message: versionData.message || null,
      forceFullyUpdated: versionData.force_update_required, // Same as forceUpdateRequired
      minVersion: versionData.min_required_version,
      currentVersion: versionData.current_version,
    };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

/**
 * Alternative: Axios-based implementation (if you want to use axios directly)
 */
const callVersionCheckWithAxios = async (
  currentVersion: string
): Promise<CheckAppVersionResult> => {
  try {
    const axios = (await import('axios')).default;
    const { BASE_URL } = await import('@/config');

    const payload = {
      platform: Platform.OS === 'ios' ? ('ios' as const) : ('android' as const),
      current_version: currentVersion,
    };

    const response = await axios.post<VersionCheckResponse>(
      `${BASE_URL}/api/app/version-check`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    const versionData = data.data;

    const updateAvailable = compareVersions(currentVersion, versionData.min_required_version) < 0;

    return {
      forceUpdateRequired: versionData.force_update_required,
      updateAvailable: updateAvailable,
      latestVersion: versionData.min_required_version,
      message: versionData.message || null,
      forceFullyUpdated: versionData.force_update_required,
      minVersion: versionData.min_required_version,
      currentVersion: versionData.current_version,
    };
  } catch (error) {
    console.error('Axios version check failed:', error);
    throw error;
  }
};

/**
 * Helper function to compare semantic versions
 * Returns:
 *  -1 if v1 < v2
 *   0 if v1 == v2
 *   1 if v1 > v2
 */
export const compareVersions = (v1: string, v2: string): number => {
  // Remove any non-numeric prefixes/suffixes
  const cleanVersion = (version: string): string => {
    return version.replace(/[^0-9.]/g, '').replace(/^\.+|\.+$/g, '');
  };

  const v1Parts = cleanVersion(v1).split('.').map(Number);
  const v2Parts = cleanVersion(v2).split('.').map(Number);

  // Pad arrays to equal length
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  while (v1Parts.length < maxLength) v1Parts.push(0);
  while (v2Parts.length < maxLength) v2Parts.push(0);

  for (let i = 0; i < maxLength; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1;
    if (v1Parts[i] < v2Parts[i]) return -1;
  }

  return 0;
};

/**
 * Check if current version meets minimum requirement
 */
export const isVersionCompatible = (currentVersion: string, minVersion: string): boolean => {
  return compareVersions(currentVersion, minVersion) >= 0;
};

/**
 * Mock version for development/testing
 */
export const mockCheckAppVersion = (
  scenario: 'force' | 'optional' | 'none' = 'none'
): Promise<CheckAppVersionResult> => {
  const currentVersion = DeviceInfo.getVersion();

  const scenarios = {
    force: {
      forceUpdateRequired: true,
      updateAvailable: true,
      latestVersion: '2.0.0',
      message: 'Critical security update required. Please update immediately.',
      forceFullyUpdated: true,
      minVersion: '2.0.0',
      currentVersion: currentVersion,
    },
    optional: {
      forceUpdateRequired: false,
      updateAvailable: true,
      latestVersion: '1.5.0',
      message: 'New features and bug fixes available. Recommended update.',
      forceFullyUpdated: false,
      minVersion: '1.0.15',
      currentVersion: currentVersion,
    },
    none: {
      forceUpdateRequired: false,
      updateAvailable: false,
      latestVersion: currentVersion,
      message: null,
      forceFullyUpdated: false,
      minVersion: '1.0.0',
      currentVersion: currentVersion,
    },
  };

  return Promise.resolve(scenarios[scenario]);
};

// Optional: Add caching to prevent frequent API calls
let lastCheckTime: number | null = null;
let cachedResult: CheckAppVersionResult | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const checkAppVersionWithCache = async (
  forceRefresh = false
): Promise<CheckAppVersionResult> => {
  const now = Date.now();

  // Return cached result if still valid and not forcing refresh
  if (!forceRefresh && cachedResult && lastCheckTime && now - lastCheckTime < CACHE_DURATION) {
    console.log('Returning cached version check result');
    return cachedResult;
  }

  try {
    const result = await checkAppVersion();
    cachedResult = result;
    lastCheckTime = now;
    return result;
  } catch (error) {
    // If API fails but we have a valid cache, return cache
    if (cachedResult && lastCheckTime && now - lastCheckTime < CACHE_DURATION * 2) {
      console.warn('Version check API failed, returning cached result');
      return cachedResult;
    }
    // If no cache or cache expired, return safe defaults
    return {
      forceUpdateRequired: false,
      updateAvailable: false,
      latestVersion: DeviceInfo.getVersion(),
      message: null,
      forceFullyUpdated: false,
      currentVersion: DeviceInfo.getVersion(),
    };
  }
};

/**
 * Utility to determine update type based on API response
 */
export const getUpdateType = (result: CheckAppVersionResult): 'force' | 'optional' | 'none' => {
  if (result.forceUpdateRequired) return 'force';
  if (result.updateAvailable) return 'optional';
  return 'none';
};
