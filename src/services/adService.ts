import { getCurrentPlatformAdConfig, isAdSizeAllowed } from '@/api/ads/getAdsConfig';

export type AdMediaType = 'image' | 'video';
export type AdSize = 'small' | 'large';

export interface Ad {
  id: number;
  title: string;
  description: string;
  mediaType: AdMediaType;
  mediaUrl: string; // base64 data URI
  segundosActivo: number; // seconds before close button appears
  redirectUrl: string | null;
  size: AdSize;
}

interface AdProviderResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    tab_id: string;
    title: string;
    description: string;
    media_type: 'image' | 'video';
    media_url: string; // base64 data URI
    redirect_url: string | null;
    size: 'small' | 'large';
    segundos_activo: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Normalizes the API response to our Ad type
 */
const parseAdFromApi = (apiData: AdProviderResponse['data']): Ad | null => {
  if (!apiData) return null;

  // Normalize media URL so the rest of the app can always treat it as a
  // valid data URI. Some providers might send raw base64 without the prefix.
  const rawMediaUrl = apiData.media_url || '';
  let normalizedMediaUrl = rawMediaUrl;

  const isAlreadyDataUri = rawMediaUrl.startsWith('data:');
  const isHttpOrFile =
    rawMediaUrl.startsWith('http://') ||
    rawMediaUrl.startsWith('https://') ||
    rawMediaUrl.startsWith('file://');

  if (!isAlreadyDataUri && !isHttpOrFile && rawMediaUrl.length > 0) {
    // Assume raw base64 content; infer mime type from media_type
    const mimeType = apiData.media_type === 'video' ? 'video/mp4' : 'image/png';
    normalizedMediaUrl = `data:${mimeType};base64,${rawMediaUrl}`;
  }

  return {
    id: apiData.id,
    title: apiData.title,
    description: apiData.description || '',
    mediaType: apiData.media_type,
    mediaUrl: normalizedMediaUrl,
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

    // Build the URL with size
    const providerUrl = `${config.provider_url}/${size}`;

    // Fetch the ad
    const response = await fetch(providerUrl, {
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

    if (!data.success || !data.data) {
      console.log('[Ads] Provider returned no ad data');
      return null;
    }

    // Normalize and return
    const ad = parseAdFromApi(data.data);
    return ad;
  } catch (error) {
    console.error('[Ads] Error fetching ad:', error);
    return null;
  }
};
