import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';

/**
 * Check and request camera permission
 * Note: react-native-image-picker automatically requests permissions,
 * but this function allows us to check/request explicitly for better UX
 * @returns Promise<boolean> - true if permission granted or will be requested, false otherwise
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: react-native-image-picker will automatically request permission
      // when launchCamera is called. The Info.plist NSCameraUsageDescription
      // will be shown automatically. We return true to proceed and handle
      // permission errors in the picker response.
      return true;
    } else {
      // Android: Check and request permission explicitly
      const cameraPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
      const hasPermission = await PermissionsAndroid.check(cameraPermission);

      if (hasPermission) {
        return true;
      }

      const result = await PermissionsAndroid.request(cameraPermission);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    // Even if check fails, react-native-image-picker will handle it on iOS
    return true;
  }
};

/**
 * Check and request photo library permission
 * Note: react-native-image-picker automatically requests permissions,
 * but this function allows us to check/request explicitly for better UX
 * @returns Promise<boolean> - true if permission granted or will be requested, false otherwise
 */
export const requestPhotoLibraryPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: react-native-image-picker will automatically request permission
      // when launchImageLibrary is called. The Info.plist NSPhotoLibraryUsageDescription
      // will be shown automatically. We return true to proceed and handle
      // permission errors in the picker response.
      return true;
    } else {
      // Android: Handle version-specific permissions
      const androidVersion =
        typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
      if (androidVersion >= 33) {
        // Android 13+ uses READ_MEDIA_IMAGES
        const permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        const hasPermission = await PermissionsAndroid.check(permission);

        if (hasPermission) {
          return true;
        }

        const result = await PermissionsAndroid.request(permission);
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android < 13 uses READ_EXTERNAL_STORAGE
        const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const hasPermission = await PermissionsAndroid.check(permission);

        if (hasPermission) {
          return true;
        }

        const result = await PermissionsAndroid.request(permission);
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
  } catch (error) {
    console.error('Error requesting photo library permission:', error);
    // Even if check fails, react-native-image-picker will handle it on iOS
    return true;
  }
};

/**
 * Check and request storage permission for document picker
 * Used for file uploads like CV, documents, etc.
 * @returns Promise<boolean> - true if permission granted or will be requested, false otherwise
 */
export const requestStoragePermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Document picker doesn't require explicit permission
      // The system handles it automatically
      return true;
    } else {
      // Android: Handle version-specific permissions
      const androidVersion =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : parseInt(String(Platform.Version), 10);
      if (androidVersion >= 33) {
        // Android 13+ uses system file picker which doesn't require READ_EXTERNAL_STORAGE
        // The document picker handles permissions automatically via SAF (Storage Access Framework)
        return true;
      } else {
        // Android < 13 uses READ_EXTERNAL_STORAGE
        const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        try {
          const hasPermission = await PermissionsAndroid.check(permission);

          if (hasPermission) {
            return true;
          }

          const result = await PermissionsAndroid.request(permission);

          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          } else if (result === PermissionsAndroid.RESULTS.DENIED) {
            return false;
          } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            return false;
          } else {
            return false;
          }
        } catch (permError: any) {
          console.error('Error during storage permission request:', permError);
          // Return false if permission request fails
          return false;
        }
      }
    }
  } catch (error) {
    console.error('[permissions] Error requesting storage permission:', error);
    // Return false on error so user knows permission wasn't granted
    return false;
  }
};

/**
 * Check and request write storage permission for downloading files
 * Used for saving files to device storage (Downloads folder, etc.)
 * @returns Promise<boolean> - true if permission granted or will be requested, false otherwise
 */
export const requestWriteStoragePermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: No explicit permission needed for saving to Documents/Downloads
      return true;
    } else {
      // Android: Handle version-specific permissions
      const androidVersion =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : parseInt(String(Platform.Version), 10);

      // For Android 13+ (API 33+), we don't need WRITE_EXTERNAL_STORAGE for app-specific directories
      // But we still request it for compatibility and for accessing public Downloads folder
      if (androidVersion >= 33) {
        // Android 13+: Scoped storage is fully enforced
        // App-specific directories don't need permission
        // For public Downloads, we'd need MANAGE_EXTERNAL_STORAGE (not recommended)
        // So we'll use app-specific directories which don't need permission
        return true;
      } else if (androidVersion >= 29) {
        // Android 10-12 (API 29-32): Scoped storage is partially enforced
        // WRITE_EXTERNAL_STORAGE is deprecated but can still be requested
        // However, it won't grant access to public directories
        // We'll use app-specific directories which don't need permission
        // But we can still try to request it for compatibility
        const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

        try {
          const hasPermission = await PermissionsAndroid.check(permission);
          if (hasPermission) {
            return true;
          }

          // Try to request, but don't fail if it's denied (we'll use app-specific dir)
          const result = await PermissionsAndroid.request(permission, {
            title: 'Storage Permission',
            message: 'This app needs access to storage to download files to your device.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          });

          return result === PermissionsAndroid.RESULTS.GRANTED;
        } catch (permError: any) {
          console.log(
            '[permissions] Permission request failed on Android 10+, using app-specific directory'
          );
          // On Android 10+, we can use app-specific directories without permission
          return false; // Return false but we'll handle it in the download function
        }
      } else {
        // Android < 10: Need WRITE_EXTERNAL_STORAGE
        const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

        try {
          // Check if permission is already granted
          const hasPermission = await PermissionsAndroid.check(permission);

          if (hasPermission) {
            console.log('[permissions] Storage permission already granted');
            return true;
          }

          console.log('[permissions] Requesting storage permission...');
          // Request permission - this will show the system dialog
          const result = await PermissionsAndroid.request(permission, {
            title: 'Storage Permission',
            message: 'This app needs access to storage to download files to your device.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          });

          console.log('[permissions] Permission request result:', result);

          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('[permissions] Storage permission granted');
            return true;
          } else if (result === PermissionsAndroid.RESULTS.DENIED) {
            console.log('[permissions] Storage permission denied by user');
            return false;
          } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            console.log('[permissions] Storage permission denied permanently');
            return false;
          } else {
            console.log('[permissions] Storage permission unknown result:', result);
            return false;
          }
        } catch (permError: any) {
          console.error('[permissions] Error during write storage permission request:', permError);
          return false;
        }
      }
    }
  } catch (error) {
    console.error('[permissions] Error requesting write storage permission:', error);
    return false;
  }
};

/**
 * Show alert to guide user to settings if permission is denied
 */
export const showPermissionDeniedAlert = (permissionType: 'camera' | 'photo' | 'storage') => {
  const message =
    permissionType === 'camera'
      ? 'Camera permission is required to take photos. Please enable it in Settings.'
      : permissionType === 'photo'
        ? 'Photo library permission is required to select images. Please enable it in Settings.'
        : 'Storage permission is required to access files. Please enable it in Settings.';

  Alert.alert('Permission Required', message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Open Settings',
      onPress: () => {
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:');
        } else {
          Linking.openSettings();
        }
      },
    },
  ]);
};
