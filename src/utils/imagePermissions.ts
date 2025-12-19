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
