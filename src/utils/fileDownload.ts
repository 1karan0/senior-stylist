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

// react-native-share for iOS Save to Files (RNFS DownloadDirectoryPath doesn't exist on iOS)
let Share: { open: (options: Record<string, unknown>) => Promise<unknown> } | null = null;
try {
  Share = require('react-native-share').default;
} catch {
  Share = null;
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
    // iOS: Try Downloads folder first if available, otherwise use Documents
    if (RNFS.DownloadDirectoryPath) {
      return { dir: RNFS.DownloadDirectoryPath, name: 'Downloads' };
    }
    return { dir: RNFS.DocumentDirectoryPath || RNFS.CachesDirectoryPath, name: 'Documents' };
  }

  if (Platform.OS !== 'android') {
    return { dir: appDir, name: 'Documents' };
  }

  const androidVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);

  // For Android, prioritize Downloads folder
  // DownloadDirectoryPath uses MediaStore API on Android 10+ which handles scoped storage
  if (RNFS.DownloadDirectoryPath) {
    // Request permission (may not be needed on Android 10+ but helps on older versions)
    await requestWriteStoragePermission();
    // Use DownloadDirectoryPath directly - react-native-fs handles MediaStore integration
    return { dir: RNFS.DownloadDirectoryPath, name: 'Downloads' };
  }

  // Fallback: Try creating/accessing Download folder in ExternalStorage (for older Android versions)
  if (RNFS.ExternalStorageDirectoryPath) {
    const downloadDir = `${RNFS.ExternalStorageDirectoryPath}/Download`;
    try {
      const hasPermission = await requestWriteStoragePermission();
      if (hasPermission || androidVersion >= 29) {
        // Try to ensure directory exists
        const exists = await RNFS.exists(downloadDir);
        if (!exists) {
          await RNFS.mkdir(downloadDir);
        }
        return { dir: downloadDir, name: 'Downloads' };
      }
    } catch (error) {
      console.log(
        '[fileDownload] ExternalStorage Download folder not accessible, using app directory'
      );
    }
  }

  // Only fall back to app directory if Downloads truly fails
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

  // iOS: Use react-native-share with saveToFiles - RNFS DownloadDirectoryPath doesn't exist on iOS,
  // and app Documents folder is sandboxed. Share opens Files app so user can save to iCloud/On My iPhone.
  if (Platform.OS === 'ios' && Share && base64) {
    try {
      const dataUrl = `data:text/csv;base64,${base64}`;
      await Share.open({
        saveToFiles: true,
        url: dataUrl,
        filename,
        type: 'text/csv',
        failOnCancel: true,
      });
      onSuccess({ filename, directoryName: 'Files' });
      return;
    } catch (error: any) {
      // User cancelled - don't show error
      const msg = String(error?.message ?? '').toLowerCase();
      if (
        msg.includes('user did not share') ||
        msg.includes('cancel') ||
        msg.includes('dismissed') ||
        msg.includes('user cancelled')
      ) {
        return;
      }
      throw error;
    }
  }

  // Android (and fallback): Use RNFS to save directly to Downloads
  if (!RNFS) {
    throw new Error('File system is not available on this device.');
  }

  const { dir, name } = await getDownloadDirectory();
  const path = `${dir}/${filename}`;
  const appDir =
    RNFS.DocumentDirectoryPath || RNFS.ExternalDirectoryPath || RNFS.CachesDirectoryPath;

  try {
    await saveFile(path, url, base64);

    // Verify file was actually saved
    if (await RNFS.exists(path)) {
      onSuccess({ filename, directoryName: name });
      return;
    } else {
      throw new Error('File was not saved successfully');
    }
  } catch (error: any) {
    // Only fallback to app storage if we were trying Downloads and it failed
    // But don't fallback if we're already using app storage
    if (name === 'Downloads' && Platform.OS === 'android') {
      console.log('[fileDownload] Downloads folder failed, trying app storage as fallback');
      try {
        const fallbackPath = `${appDir}/${filename}`;
        await saveFile(fallbackPath, url, base64);

        // Verify fallback file was saved
        if (await RNFS.exists(fallbackPath)) {
          onSuccess({ filename, directoryName: 'App Documents' });
          return;
        }
      } catch (fallbackError: any) {
        console.error('[fileDownload] Fallback to app storage also failed:', fallbackError);
        // Continue to error handling
      }
    }

    if (error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      showPermissionDeniedAlert('storage');
      throw new Error('Storage permission is required to download files.');
    }

    // Android fallback: Use Share when RNFS fails - user can save via share sheet
    if (Platform.OS === 'android' && Share && base64) {
      try {
        const dataUrl = `data:text/csv;base64,${base64}`;
        await Share.open({
          url: dataUrl,
          filename,
          type: 'text/csv',
          failOnCancel: true,
        });
        onSuccess({ filename, directoryName: 'Files / Downloads' });
        return;
      } catch (shareError: any) {
        const msg = String(shareError?.message ?? '').toLowerCase();
        if (
          msg.includes('user did not share') ||
          msg.includes('cancel') ||
          msg.includes('dismissed')
        ) {
          return;
        }
      }
    }

    throw error;
  }
};
