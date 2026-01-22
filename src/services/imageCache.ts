import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

const isWeb = Platform.OS === 'web';
const CACHE_DIR = isWeb ? '' : `${RNFS.CachesDirectoryPath}/image-cache`;

let cacheReady = false;
let cacheReadyPromise: Promise<string | null> | null = null;

const ensureCacheDir = async (): Promise<string | null> => {
  if (isWeb) return null;
  if (cacheReady) return CACHE_DIR;
  if (!cacheReadyPromise) {
    cacheReadyPromise = RNFS.exists(CACHE_DIR)
      .then((exists) => (exists ? true : RNFS.mkdir(CACHE_DIR).then(() => true)))
      .catch(() => false)
      .then(() => {
        cacheReady = true;
        return CACHE_DIR;
      });
  }
  return cacheReadyPromise;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const getUrlExtension = (url: string) => {
  const clean = url.split('?')[0];
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) return 'jpg';
  const ext = match[1].toLowerCase();
  return ext.length > 5 ? 'jpg' : ext;
};

const inFlight = new Map<string, Promise<string>>();

const downloadToCache = async (url: string): Promise<string> => {
  if (inFlight.has(url)) {
    return inFlight.get(url)!;
  }

  const promise = (async () => {
    const dir = await ensureCacheDir();
    if (!dir) return url;

    const filename = `${hashString(url)}.${getUrlExtension(url)}`;
    const filePath = `${dir}/${filename}`;
    const fileUri = `file://${filePath}`;

    const exists = await RNFS.exists(filePath);
    if (exists) return fileUri;

    try {
      await RNFS.downloadFile({ fromUrl: url, toFile: filePath, background: true }).promise;
      return fileUri;
    } catch {
      return url;
    }
  })();

  inFlight.set(url, promise);
  return promise.finally(() => {
    inFlight.delete(url);
  });
};

export const getCachedImageUri = async (url?: string | null): Promise<string | null> => {
  if (!url) return null;
  if (isWeb) return url;
  if (url.startsWith('file://')) return url;
  return downloadToCache(url);
};

export const prefetchImageUrls = async (urls: string[]): Promise<void> => {
  if (isWeb || urls.length === 0) return;
  const unique = Array.from(new Set(urls.filter(Boolean)));
  await Promise.all(unique.map((url) => downloadToCache(url)));
};
