# App Permissions Documentation

This document outlines all permissions requested by the Senior Stylist app on both Android and iOS platforms, along with their purpose and usage.

## Android Permissions

### Network Permissions

#### `INTERNET`

- **Permission**: `android.permission.INTERNET`
- **Purpose**: Allows the app to access the internet for API calls, fetching data, and communicating with backend services.
- **Usage**: Required for all network operations including authentication, fetching consultation data, user profiles, subscription plans, and other API communications.
- **Location**: `android/app/src/main/AndroidManifest.xml`

#### `ACCESS_NETWORK_STATE`

- **Permission**: `android.permission.ACCESS_NETWORK_STATE`
- **Purpose**: Allows the app to check network connectivity status (Wi-Fi, mobile data, etc.).
- **Usage**: Used to determine if the device has an active internet connection before making API calls, providing offline/online status indicators, and handling network errors gracefully.
- **Location**: `android/app/src/main/AndroidManifest.xml`

### Notification Permissions

#### `POST_NOTIFICATIONS`

- **Permission**: `android.permission.POST_NOTIFICATIONS`
- **Purpose**: Required for Android 13+ (API 33+) to display push notifications to users.
- **Usage**: Enables the app to send push notifications for consultation updates, messages, appointment reminders, and other important alerts.
- **Location**: `android/app/src/main/AndroidManifest.xml`
- **Note**: This permission is automatically requested at runtime on Android 13+ devices.

### Camera Permissions

#### `CAMERA`

- **Permission**: `android.permission.CAMERA`
- **Purpose**: Allows the app to access the device camera to capture photos.
- **Usage**: Used for taking photos during styling consultations, capturing outfit images, profile pictures, and other styling-related photography features.
- **Location**: `android/app/src/main/AndroidManifest.xml`
- **Note**: This permission is requested at runtime when the user attempts to use camera features.

### Media/Storage Permissions

#### `READ_MEDIA_IMAGES`

- **Permission**: `android.permission.READ_MEDIA_IMAGES`
- **Purpose**: Allows the app to read images from the device's photo library (Android 13+ / API 33+).
- **Usage**: Enables users to select existing photos from their gallery for styling consultations, profile pictures, and sharing outfit images.
- **Location**: `android/app/src/main/AndroidManifest.xml`
- **Note**: This permission replaces `READ_EXTERNAL_STORAGE` for media files on Android 13+.

#### `READ_EXTERNAL_STORAGE`

- **Permission**: `android.permission.READ_EXTERNAL_STORAGE`
- **Purpose**: Allows the app to read files from external storage (Android < 13 / API < 33).
- **Usage**: Used on older Android versions to access photos and images from the device storage for styling consultations and profile management.
- **Location**: `android/app/src/main/AndroidManifest.xml`
- **Note**: Limited to Android versions below API 33 (`maxSdkVersion="32"`). On Android 13+, `READ_MEDIA_IMAGES` is used instead.

---

## iOS Permissions

### Camera Permissions

#### `NSCameraUsageDescription`

- **Key**: `NSCameraUsageDescription`
- **Purpose**: Explains to users why the app needs access to the camera.
- **Usage**: Allows users to take photos using the device camera for styling consultations, outfit captures, and profile pictures.
- **User-Facing Message**: "We need access to your camera to take photos for styling consultations and recommendations."
- **Location**: `ios/Senior_stylist/Info.plist`
- **Note**: This permission is requested at runtime when the user attempts to use camera features.

### Photo Library Permissions

#### `NSPhotoLibraryUsageDescription`

- **Key**: `NSPhotoLibraryUsageDescription`
- **Purpose**: Explains to users why the app needs read access to their photo library.
- **Usage**: Allows users to select existing photos from their photo library for styling consultations, profile pictures, and sharing outfit images.
- **User-Facing Message**: "We need access to your photo library to select images for styling consultations and recommendations."
- **Location**: `ios/Senior_stylist/Info.plist`
- **Note**: This permission is requested at runtime when the user attempts to access the photo library.

#### `NSPhotoLibraryAddUsageDescription`

- **Key**: `NSPhotoLibraryAddUsageDescription`
- **Purpose**: Explains to users why the app needs write access to save photos to their photo library.
- **Usage**: Allows the app to save consultation images, styled outfit photos, and other generated content to the user's photo library.
- **User-Facing Message**: "We need permission to save photos to your library for your styling consultations."
- **Location**: `ios/Senior_stylist/Info.plist`
- **Note**: This permission is requested at runtime when the app attempts to save photos.

---

## Permission Request Flow

### Android

1. **Install-time permissions**: `INTERNET` and `ACCESS_NETWORK_STATE` are granted automatically at install time.
2. **Runtime permissions**: `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`, and `POST_NOTIFICATIONS` are requested when the user attempts to use the related feature.
3. **Version-specific handling**: The app automatically uses `READ_MEDIA_IMAGES` on Android 13+ and `READ_EXTERNAL_STORAGE` on older versions.

### iOS

1. **All permissions are runtime**: iOS requires explicit user consent for all privacy-sensitive permissions.
2. **User-facing descriptions**: All permission requests show the usage description defined in `Info.plist`.
3. **One-time request**: Once granted or denied, the permission status is remembered until the app is uninstalled.

---

## Privacy Compliance

### Google Play Store

- All permissions are declared in `AndroidManifest.xml`
- Runtime permissions are properly requested with user-friendly explanations
- Version-specific permissions are correctly configured
- No unnecessary permissions are requested

### Apple App Store

- All privacy usage descriptions are provided in `Info.plist`
- Descriptions clearly explain why each permission is needed
- No unused permissions are declared
- Compliant with App Store Review Guidelines

---

## Permission Usage Summary

| Feature            | Android Permission                                         | iOS Permission                      | Purpose                  |
| ------------------ | ---------------------------------------------------------- | ----------------------------------- | ------------------------ |
| Network Access     | `INTERNET`                                                 | N/A (automatic)                     | API calls, data fetching |
| Network Status     | `ACCESS_NETWORK_STATE`                                     | N/A (automatic)                     | Check connectivity       |
| Push Notifications | `POST_NOTIFICATIONS`                                       | N/A (automatic)                     | Send notifications       |
| Camera Access      | `CAMERA`                                                   | `NSCameraUsageDescription`          | Take photos              |
| Read Photos        | `READ_MEDIA_IMAGES` (13+)<br>`READ_EXTERNAL_STORAGE` (<13) | `NSPhotoLibraryUsageDescription`    | Select existing photos   |
| Save Photos        | N/A (automatic)                                            | `NSPhotoLibraryAddUsageDescription` | Save photos to library   |

---

## Maintenance Notes

- **Last Updated**: 2024
- **Android Target SDK**: 36
- **iOS Minimum Version**: 15.1
- **Review Frequency**: Review permissions quarterly or when adding new features that require additional permissions

---

## IAP (In-App Purchase) Requirements

### No Special Permissions Needed

- **react-native-iap** doesn't require any special permissions in manifest/Info.plist
- Permissions are handled by the platform's billing system
- The app uses the native billing APIs provided by iOS and Android

### Setup Requirements

#### iOS

- **App Store Connect Configuration**:
  - Products must be configured in App Store Connect
  - App must be in "Ready to Submit" or "In Review" state
  - Subscription products must have proper pricing and duration settings
  - Product IDs must match those returned by the backend API (`apple_product_id`)

- **Backend Verification**:
  - Backend must verify receipts using App Store Server API
  - Verify `transactionReceipt` and `originalTransactionIdentifierIOS`
  - Handle subscription status changes (renewals, cancellations, refunds)
  - Store subscription status in database

- **User Experience**:
  - Subscription management UI should link to App Store subscription management
  - Provide clear information about subscription terms and pricing
  - Handle purchase errors gracefully

#### Android

- **Google Play Console Configuration**:
  - Products must be configured in Google Play Console
  - Subscription products must be properly set up with pricing tiers
  - Product IDs must match those returned by the backend API (`google_product_id`)

- **Backend Verification**:
  - Backend must verify purchase tokens using Google Play Developer API
  - Verify `purchaseToken` and `orderId`
  - Handle subscription status changes (renewals, cancellations, refunds)
  - Store subscription status in database

- **User Experience**:
  - Subscription management UI should link to Play Store subscription management
  - Provide clear information about subscription terms and pricing
  - Handle purchase errors gracefully

### Backend Requirements

#### iOS Receipt Verification

- **Required Fields**:
  - `transactionReceipt` - The receipt data for verification
  - `originalTransactionIdentifierIOS` - Original transaction ID for subscription tracking
  - `transactionId` - Current transaction identifier
  - `productId` - The product identifier from App Store Connect

#### Android Purchase Verification

- **Required Fields**:
  - `purchaseToken` - Critical for Android verification (must be sent to backend)
  - `orderId` - Order identifier from Google Play
  - `transactionId` - Transaction identifier
  - `productId` - The product identifier from Google Play Console

#### Subscription Management

- Handle subscription status changes:
  - Renewals - Update subscription expiry date
  - Cancellations - Mark subscription as cancelled
  - Refunds - Process refunds and revoke access
  - Grace periods - Handle grace period scenarios
- Store subscription status in database:
  - User ID
  - Plan ID
  - Subscription status (active, cancelled, expired, etc.)
  - Expiry date
  - Platform (iOS/Android)
  - Transaction details

### Implementation Notes

- **Location**: `src/components/modals/SubscriptionModal.tsx`
- **API Hook**: `src/api/subscription/useGetSubscriptionPlans.ts`
- **Purchase Flow**: Handled via `react-native-iap` library
- **Backend Endpoint**: `/api/subscriptions/verify-purchase` (to be implemented)

---

## Testing Checklist

After implementation, verify the following:

### Permission Testing

- [ ] Test camera permission on Android 13+ device
- [ ] Test photo library permission on Android 13+ device
- [ ] Test camera permission on iOS device
- [ ] Test photo library permission on iOS device
- [ ] Test on Android < 13 device (if supporting) - Verify `READ_EXTERNAL_STORAGE` works correctly
- [ ] Verify permission denial handling (app should gracefully handle denied permissions)

### Account Management Testing

- [ ] Test account deletion actually deletes account (verify with backend)
- [ ] Test account deletion removes all user data
- [ ] Test account deletion clears local storage
- [ ] Verify logout functionality works correctly

### Legal Links Testing

- [ ] Test Privacy Policy link opens correctly
- [ ] Test Terms & Conditions link opens correctly
- [ ] Verify links open in-app browser or external browser as intended
- [ ] Test link accessibility and readability

### App Store Compliance

- [ ] Verify permissions appear in Play Store listing
- [ ] Verify permissions appear in App Store listing
- [ ] Verify permission descriptions match what's shown to users
- [ ] Check that no unnecessary permissions are declared

### In-App Purchase Testing

- [ ] Test IAP purchase flow (sandbox/test environment)
- [ ] Test subscription purchase on iOS (sandbox account)
- [ ] Test subscription purchase on Android (test account)
- [ ] Test subscription cancellation
- [ ] Test subscription renewal flow
- [ ] Verify purchase verification with backend
- [ ] Test error handling (network errors, cancelled purchases, etc.)
- [ ] Test subscription status updates
- [ ] Verify subscription management links work correctly

### Additional Testing

- [ ] Test app on different Android versions (if supporting < 13)
- [ ] Test app on different iOS versions (minimum 15.1+)
- [ ] Verify all permissions are requested at appropriate times
- [ ] Test app behavior when permissions are denied
- [ ] Verify offline functionality (if applicable)

---

## Contact

For questions about permissions or privacy concerns, please refer to the app's Privacy Policy or contact support.
