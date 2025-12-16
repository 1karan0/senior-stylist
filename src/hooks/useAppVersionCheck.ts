import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { version as appVersion } from '../../package.json';
import { useVersionCheck } from '@/api/app/useVersionCheck';

interface UseAppVersionCheckResult {
  isChecking: boolean;
  forceUpdateRequired: boolean;
  message: string | null;
  openStore: () => Promise<void>;
}

// Helper: change this to your real Play Store / App Store URLs
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.seniorstylist'; // replace package name if needed
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000'; // replace with your real App Store app id

export const useAppVersionCheck = (): UseAppVersionCheckResult => {
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { mutate: checkVersion, isPending } = useVersionCheck();

  useEffect(() => {
    checkVersion(
      {
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        current_version: appVersion,
      },
      {
        onSuccess: (res) => {
          if (res?.data?.force_update_required) {
            setForceUpdateRequired(true);
            setMessage(res.data.message || null);
          } else {
            setForceUpdateRequired(false);
            setMessage(null);
          }
        },
        // If the API fails, we let the user continue using the app
        onError: () => {
          setForceUpdateRequired(false);
          setMessage(null);
        },
      }
    );
  }, [checkVersion]);

  const openStore = async () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (e) {
      // Optionally log error in dev; avoid blocking the user further here
    }
  };

  return {
    isChecking: isPending,
    forceUpdateRequired,
    message,
    openStore,
  };
};
