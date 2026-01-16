import axios from 'axios';
import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { Platform } from 'react-native';

export interface AdSizeConfig {
  large: boolean;
  small: boolean;
}

export interface PlatformAdConfig {
  enabled: boolean;
  sizes: AdSizeConfig;
  default_size: 'small' | 'large';
  provider_url: string;
}

export interface AdsConfigResponse {
  status: 'success' | 'error';
  code: number;
  message: string;
  data: {
    ios?: PlatformAdConfig;
    android?: PlatformAdConfig;
  };
}

/**
 * Fetches ad configuration from the backend
 */
export const getAdsConfig = async (): Promise<AdsConfigResponse> => {
  try {
    const token = await storage.getToken();
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    if (__DEV__) {
      console.log('[Ads] Fetching config', { platform, hasToken: Boolean(token) });
    }
    const response = await axios.get<AdsConfigResponse>(`${BASE_URL}/api/ads/config`, {
      params: { platform },
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    });

    if (__DEV__) {
      const platformData = response.data?.data?.[platform];
      console.log('[Ads] Config response', {
        status: response.data?.status,
        code: response.data?.code,
        enabled: platformData?.enabled,
        defaultSize: platformData?.default_size,
        hasProviderUrl: Boolean(platformData?.provider_url),
      });
    }
    return response.data;
  } catch (error: any) {
    console.error('[Ads] Failed to fetch ad config:', error);
    throw new Error(error?.response?.data?.message || 'Failed to fetch ad configuration');
  }
};

/**
 * Gets the current platform's ad configuration
 */
export const getCurrentPlatformAdConfig = async (): Promise<PlatformAdConfig | null> => {
  try {
    const config = await getAdsConfig();
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    return config.data[platform] || null;
  } catch (error) {
    console.error('[Ads] Failed to get platform ad config:', error);
    return null;
  }
};

/**
 * Checks if ads are enabled for the current platform
 */
export const isAdsEnabled = async (): Promise<boolean> => {
  try {
    const config = await getCurrentPlatformAdConfig();
    return config?.enabled === true;
  } catch {
    return false;
  }
};

/**
 * Checks if a specific ad size is allowed for the current platform
 */
export const isAdSizeAllowed = async (size: 'small' | 'large'): Promise<boolean> => {
  try {
    const config = await getCurrentPlatformAdConfig();
    if (!config?.enabled) return false;
    return config.sizes[size] === true;
  } catch {
    return false;
  }
};
