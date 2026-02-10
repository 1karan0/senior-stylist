// hooks/useAppVersionCheck.ts
import { useEffect, useState, useCallback } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useVersionCheck } from '@/api/app/useVersionCheck';

interface UseAppVersionCheckResult {
  isChecking: boolean;
  forceUpdateRequired: boolean;
  message: string | null;
  openStore: () => Promise<void>;
  checkAppVersion: () => Promise<void>;
}

// Store URLs - Update these with your actual App Store ID when available
// Android package: com.senior_stylist
// iOS bundle ID: com.seniorstylist.app
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.seniorstylist.app';
const APP_STORE_URL = 'https://apps.apple.com/app/id6757600475'; // TODO: Replace with actual App Store ID

export const useAppVersionCheck = (): UseAppVersionCheckResult => {
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { mutate: checkVersion, isPending } = useVersionCheck();

  const openStore = useCallback(async () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Show error alert if store cannot be opened
      Alert.alert('Error', 'Unable to open app store. Please try updating manually.');
    }
  }, []);

  const checkAppVersion = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const deviceVersion = DeviceInfo.getVersion();

        if (!deviceVersion) {
          // If we can't get version, allow user to continue
          setForceUpdateRequired(false);
          setMessage(null);
          resolve();
          return;
        }

        checkVersion(
          {
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            current_version: deviceVersion,
          },
          {
            onSuccess: (res) => {
              if (res?.data?.force_update_required) {
                setForceUpdateRequired(true);
                setMessage(res.data.message || 'A new version of the app is required to continue.');
              } else {
                setForceUpdateRequired(false);
                setMessage(null);
              }
              resolve();
            },
            onError: () => {
              // If API fails, let user continue using the app (fail gracefully)
              setForceUpdateRequired(false);
              setMessage(null);
              resolve();
            },
          }
        );
      } catch {
        // If any error occurs, allow user to continue
        setForceUpdateRequired(false);
        setMessage(null);
        resolve();
      }
    });
  }, [checkVersion]);

  // Initial check on mount
  useEffect(() => {
    checkAppVersion();
  }, [checkAppVersion]);

  return {
    isChecking: isPending,
    forceUpdateRequired,
    message,
    openStore,
    checkAppVersion,
  };
};
