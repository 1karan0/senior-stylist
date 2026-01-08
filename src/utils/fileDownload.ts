import { Platform } from 'react-native';
import { requestWriteStoragePermission, showPermissionDeniedAlert } from './imagePermissions';

// Safely import react-native-fs
let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
  if (!RNFS || !RNFS.CachesDirectoryPath) RNFS = null;
} catch {
  RNFS = null;
}

interface DownloadDirectory {
  dir: string;
  name: string;
}

export const getDownloadDirectory = async (): Promise<DownloadDirectory> => {
  if (!RNFS) {
    throw new Error('File system is not available on this device.');
  }

  const appDir =
    RNFS.DocumentDirectoryPath || RNFS.ExternalDirectoryPath || RNFS.CachesDirectoryPath;

  if (Platform.OS === 'ios') {
    return { dir: RNFS.DocumentDirectoryPath || RNFS.CachesDirectoryPath, name: 'Documents' };
  }

  if (Platform.OS !== 'android') {
    return { dir: appDir, name: 'Documents' };
  }

  const androidVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);
  const hasPermission = await requestWriteStoragePermission();

  if (!hasPermission) {
    return { dir: appDir, name: 'Documents' };
  }

  // Try Downloads folder
  if (RNFS.DownloadDirectoryPath) {
    return { dir: RNFS.DownloadDirectoryPath, name: 'Downloads' };
  }

  if (RNFS.ExternalStorageDirectoryPath) {
    const downloadDir = `${RNFS.ExternalStorageDirectoryPath}/Download`;
    try {
      if (!(await RNFS.exists(downloadDir))) {
        await RNFS.mkdir(downloadDir);
      }
      return { dir: downloadDir, name: 'Downloads' };
    } catch {
      return { dir: appDir, name: androidVersion >= 29 ? 'App Documents' : 'Documents' };
    }
  }

  return { dir: appDir, name: androidVersion >= 29 ? 'App Documents' : 'Documents' };
};

export const saveFile = async (path: string, url?: string, base64?: string): Promise<void> => {
  if (!RNFS) {
    throw new Error('File system is not available on this device.');
  }

  if (url) {
    const res = RNFS.downloadFile({ fromUrl: url, toFile: path });
    await res.promise;
  } else if (base64) {
    await RNFS.writeFile(path, base64, 'base64');
  } else {
    throw new Error('Download data was not in a supported format.');
  }

  if (!(await RNFS.exists(path))) {
    throw new Error('File download failed. Please try again.');
  }
};

export interface DownloadFileResult {
  filename: string;
  directoryName: string;
}

export const downloadFile = async (
  payload: any,
  filename: string,
  onSuccess: (result: DownloadFileResult) => void
): Promise<void> => {
  if (!RNFS) {
    throw new Error('File system is not available on this device.');
  }

  const url =
    payload?.url ||
    payload?.file_url ||
    payload?.fileUrl ||
    payload?.download_url ||
    payload?.downloadUrl ||
    payload?.link;
  const base64 = payload?.base64 || payload?.content_base64 || payload?.content;

  if (!url && !base64) {
    throw new Error('Download data was not in a supported format.');
  }

  const { dir, name } = await getDownloadDirectory();
  const path = `${dir}/${filename}`;
  const appDir =
    RNFS.DocumentDirectoryPath || RNFS.ExternalDirectoryPath || RNFS.CachesDirectoryPath;

  try {
    await saveFile(path, url, base64);
    onSuccess({ filename, directoryName: name });
  } catch (error: any) {
    // Fallback to app storage if Downloads failed
    if (name === 'Downloads' && Platform.OS === 'android' && base64) {
      try {
        const fallbackPath = `${appDir}/${filename}`;
        await saveFile(fallbackPath, undefined, base64);
        onSuccess({ filename, directoryName: 'App Documents' });
        return;
      } catch {
        // Continue to error handling
      }
    }

    if (error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      showPermissionDeniedAlert('storage');
      throw new Error('Storage permission is required to download files.');
    }
    throw error;
  }
};
