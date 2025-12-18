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
      // when launchCamera is called, so we return true to proceed
      // The Info.plist NSCameraUsageDescription will be shown automatically
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
    // Even if check fails, react-native-image-picker will handle it
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
      // when launchImageLibrary is called, so we return true to proceed
      // The Info.plist NSPhotoLibraryUsageDescription will be shown automatically
      return true;
    } else {
      // Android: Handle version-specific permissions
      if (Platform.Version >= 33) {
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
    // Even if check fails, react-native-image-picker will handle it
    return true;
  }
};

/**
 * Show alert to guide user to settings if permission is denied
 */
export const showPermissionDeniedAlert = (permissionType: 'camera' | 'photo') => {
  const message =
    permissionType === 'camera'
      ? 'Camera permission is required to take photos. Please enable it in Settings.'
      : 'Photo library permission is required to select images. Please enable it in Settings.';

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
