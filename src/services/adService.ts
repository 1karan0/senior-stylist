import { getCurrentPlatformAdConfig, isAdSizeAllowed } from '@/api/ads/getAdsConfig';

export type AdMediaType = 'image' | 'video';
export type AdSize = 'small' | 'large';

export interface Ad {
  id: number;
  title: string;
  description: string;
  mediaType: AdMediaType;
  mediaUrl: string; // URL to media file
  segundosActivo: number; // seconds before close button appears
  redirectUrl: string | null;
  size: AdSize;
}

interface AdProviderAd {
  id: number;
  tab_id: string;
  title: string;
  description: string;
  media_type: 'image' | 'video';
  media_url: string;
  redirect_url: string | null;
  size: 'small' | 'large';
  segundos_activo: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdProviderResponse {
  success: boolean;
  message: string;
  data?: {
    ads: AdProviderAd[];
    count: number;
    tab_id: string;
  };
}

/**
 * Normalizes the API response to our Ad type
 */
const parseAdFromApi = (apiData: AdProviderAd | null | undefined): Ad | null => {
  if (!apiData) return null;

  return {
    id: apiData.id,
    title: apiData.title,
    description: apiData.description || '',
    mediaType: apiData.media_type,
    mediaUrl: apiData.media_url || '',
    segundosActivo: apiData.segundos_activo,
    redirectUrl: apiData.redirect_url,
    size: apiData.size,
  };
};

/**
 * Fetches a random ad from the external provider
 */
export const fetchRandomAd = async (size: AdSize = 'small'): Promise<Ad | null> => {
  try {
    if (__DEV__) {
      console.log('[Ads] Fetching ad', { size });
    }
    // Check if ads are enabled and size is allowed
    const isAllowed = await isAdSizeAllowed(size);
    if (!isAllowed) {
      console.log(`[Ads] Ad size "${size}" is not allowed for current platform`);
      return null;
    }

    // Get the provider URL from config
    const config = await getCurrentPlatformAdConfig();
    if (!config?.provider_url) {
      console.error('[Ads] No provider URL configured');
      return null;
    }
    if (__DEV__) {
      console.log('[Ads] Provider URL', config.provider_url);
    }

    // Fetch ads from provider
    const response = await fetch(config.provider_url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Ads] Provider returned status ${response.status}`);
      return null;
    }

    const data: AdProviderResponse = await response.json();

    if (!data.success || !data.data?.ads?.length) {
      console.log('[Ads] Provider returned no ad data');
      return null;
    }

    const activeAds = data.data.ads.filter((ad) => ad.is_active);
    const sizeMatchedAds = activeAds.filter((ad) => ad.size === size);
    const candidates = sizeMatchedAds.length > 0 ? sizeMatchedAds : activeAds;
    if (__DEV__) {
      console.log('[Ads] Provider ads', {
        total: data.data.ads.length,
        active: activeAds.length,
        sizeMatched: sizeMatchedAds.length,
        chosenPool: candidates.length,
      });
    }
    if (candidates.length === 0) {
      console.log('[Ads] No active ads available');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];
    if (__DEV__) {
      console.log('[Ads] Selected ad', {
        id: selected.id,
        mediaType: selected.media_type,
        size: selected.size,
        redirectUrl: Boolean(selected.redirect_url),
      });
    }
    return parseAdFromApi(selected);
  } catch (error) {
    console.error('[Ads] Error fetching ad:', error);
    return null;
  }
};
