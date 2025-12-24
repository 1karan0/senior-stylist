import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { fetchRandomAd, Ad, AdSize } from '@/services/adService';
import { getCurrentPlatformAdConfig, isAdsEnabled, isAdSizeAllowed } from '@/api/ads/getAdsConfig';
import type { PlatformAdConfig } from '@/api/ads/getAdsConfig';

interface AdContextType {
  // Config
  adConfig: PlatformAdConfig | null;
  isAdsEnabled: boolean;
  isLoadingConfig: boolean;

  // Preloaded ads
  currentSmallAd: Ad | null;
  currentLargeAd: Ad | null;
  isLoadingAd: boolean;

  // Methods
  preloadAd: (size?: AdSize) => Promise<void>;
  getAndConsumeAd: (size?: AdSize) => Ad | null;
  refreshConfig: () => Promise<void>;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const useAds = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};

interface AdProviderProps {
  children: React.ReactNode;
}

export const AdProvider: React.FC<AdProviderProps> = ({ children }) => {
  const [adConfig, setAdConfig] = useState<PlatformAdConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [currentSmallAd, setCurrentSmallAd] = useState<Ad | null>(null);
  const [currentLargeAd, setCurrentLargeAd] = useState<Ad | null>(null);
  const [isLoadingAd, setIsLoadingAd] = useState(false);

  const preloadInProgressRef = useRef<{ small: boolean; large: boolean }>({
    small: false,
    large: false,
  });

  /**
   * Loads ad configuration from backend
   */
  const refreshConfig = useCallback(async () => {
    try {
      setIsLoadingConfig(true);
      const config = await getCurrentPlatformAdConfig();
      setAdConfig(config);
    } catch (error) {
      console.error('[AdContext] Failed to load config:', error);
      setAdConfig(null);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  /**
   * Preloads an ad in the background
   */
  const preloadAd = useCallback(
    async (size: AdSize = 'small') => {
      // Prevent duplicate preloads
      if (preloadInProgressRef.current[size]) {
        return;
      }

      // Check if ads are enabled
      const enabled = await isAdsEnabled();
      if (!enabled) {
        console.log('[AdContext] Ads are disabled, skipping preload');
        return;
      }

      // Check if size is allowed
      const allowed = await isAdSizeAllowed(size);
      if (!allowed) {
        console.log(`[AdContext] Size "${size}" not allowed, skipping preload`);
        return;
      }

      // Check if we already have a preloaded ad
      if (size === 'small' && currentSmallAd) {
        return; // Already have one
      }
      if (size === 'large' && currentLargeAd) {
        return; // Already have one
      }

      preloadInProgressRef.current[size] = true;
      setIsLoadingAd(true);

      try {
        const ad = await fetchRandomAd(size);
        if (ad) {
          if (size === 'small') {
            setCurrentSmallAd(ad);
          } else {
            setCurrentLargeAd(ad);
          }
          console.log(`[AdContext] Preloaded ${size} ad:`, ad.id);
        }
      } catch (error) {
        console.error(`[AdContext] Failed to preload ${size} ad:`, error);
      } finally {
        preloadInProgressRef.current[size] = false;
        setIsLoadingAd(false);
      }
    },
    [currentSmallAd, currentLargeAd]
  );

  /**
   * Gets and consumes (removes) a preloaded ad
   */
  const getAndConsumeAd = useCallback(
    (size: AdSize = 'small'): Ad | null => {
      let ad: Ad | null = null;

      if (size === 'small') {
        ad = currentSmallAd;
        setCurrentSmallAd(null); // Consume it
      } else {
        ad = currentLargeAd;
        setCurrentLargeAd(null); // Consume it
      }

      // Immediately preload the next one in the background
      if (ad) {
        preloadAd(size).catch((err) => {
          console.error(`[AdContext] Failed to preload next ${size} ad:`, err);
        });
      }

      return ad;
    },
    [currentSmallAd, currentLargeAd, preloadAd]
  );

  // Load config on mount
  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Preload small ad on mount if enabled
  useEffect(() => {
    if (!isLoadingConfig && adConfig?.enabled) {
      // Small delay to not block app startup
      const timer = setTimeout(() => {
        preloadAd('small').catch((err) => {
          console.error('[AdContext] Initial preload failed:', err);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoadingConfig, adConfig, preloadAd]);

  const value: AdContextType = {
    adConfig,
    isAdsEnabled: adConfig?.enabled === true,
    isLoadingConfig,
    currentSmallAd,
    currentLargeAd,
    isLoadingAd,
    preloadAd,
    getAndConsumeAd,
    refreshConfig,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
};
