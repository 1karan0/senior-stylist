# In-App Purchase Flow Documentation

## Data Flow Overview

### 1. API → Pricing Component

- **API Endpoint**: `/api/subscriptions-plans`
- **Response**: Array of `SubscriptionPlan` objects with:
  - `apple_product_id`: Product ID for iOS App Store
  - `google_product_id`: Product ID for Google Play Store
  - Other plan details (pricing, features, etc.)

### 2. Pricing Component Processing

- Filters out test plans (plans with `-test` in slug)
- Sorts plans by `sort_order`
- Maps API data to `PlanDisplay` format
- Stores full `originalPlan` object for passing to modal

### 3. Pricing → SubscriptionModal

- User selects a plan
- Clicks "Continue to Payment"
- `selectedPlan` (with `originalPlan` containing product IDs) is passed to `SubscriptionModal`

### 4. SubscriptionModal → Platform Store

- Uses `Platform.select()` to detect iOS vs Android
- Selects appropriate product ID:
  - iOS: `plan.originalPlan.apple_product_id`
  - Android: `plan.originalPlan.google_product_id`
- Calls `requestSubscription()` with the product ID
- Native store handles the purchase flow

## How Platform Detection Works

### React Native Platform Detection

```typescript
const productId = Platform.select({
  ios: plan.originalPlan.apple_product_id, // Used on iOS devices
  android: plan.originalPlan.google_product_id, // Used on Android devices
});
```

**How it works:**

1. `Platform.OS` is a built-in React Native constant that returns `'ios'` or `'android'` at runtime
2. `Platform.select()` evaluates the current platform and returns the matching value
3. The native `react-native-iap` library then uses this product ID to query the appropriate store:
   - **iOS**: Queries App Store Connect using `apple_product_id`
   - **Android**: Queries Google Play Console using `google_product_id`

**Important:** The app doesn't "know" which store to use - React Native automatically detects the platform at runtime, and the native IAP library handles the store-specific API calls.

## Console Log Flow

### Pricing Component Logs

```
[Pricing] Raw subscription plans from API: [...]
[Pricing] Filtered plans (removed test plans): 3
[Pricing] Sorted plans by sort_order: ["Basic", "Standard", "Premium"]
[Pricing] Mapped plan "Basic": { key, productIds: { apple, google }, planId }
[Pricing] Setting default selected plan: {...}
[Pricing] Continue to Payment clicked: { selectedPlan: {...} }
```

### SubscriptionModal Logs

```
[SubscriptionModal] Modal opened with plan: { planName, productIds, platform, selectedProductId }
[SubscriptionModal] Initializing IAP connection...
[SubscriptionModal] Platform: android (or ios)
[SubscriptionModal] IAP connection initialized
[SubscriptionModal] Setting up purchase update listener...
[SubscriptionModal] Setting up purchase error listener...
[SubscriptionModal] IAP initialized successfully, listeners set up
[SubscriptionModal] handleSubscribe called
[SubscriptionModal] Plan data available: { planId, planName, appleProductId, googleProductId }
[SubscriptionModal] Platform detection: { platform, selectedProductId, allProductIds }
[SubscriptionModal] Initiating purchase for product: basic_monthly
[SubscriptionModal] Purchase configuration: { productId, platform, planId }
[SubscriptionModal] Calling requestSubscription with: { sku: "basic_monthly" }
[SubscriptionModal] requestSubscription called successfully, waiting for purchase update...
[SubscriptionModal] Purchase update listener triggered
[SubscriptionModal] Purchase update received: { productId, transactionId, platform, ... }
[SubscriptionModal] Purchase success check: { isPurchaseSuccessful: true, ... }
[SubscriptionModal] Purchase successful, processing...
[SubscriptionModal] Purchase data prepared for backend: { planId, productId, platform, ... }
[SubscriptionModal] Sending purchase to backend for verification...
[SubscriptionModal] Backend verification result: { success: true }
[SubscriptionModal] Backend verification successful, finishing transaction...
[SubscriptionModal] Transaction finished successfully
[SubscriptionModal] Purchase processing completed
```

## Testing in Android Emulator

### ✅ Yes, you CAN test IAP in Android Emulator, but with requirements:

### Requirements:

1. **Google Play Services**: The emulator must have Google Play Services installed
   - Use an emulator image with "Google Play" (not "Google APIs")
   - Example: "Pixel 5 API 33" with Google Play

2. **Signed APK**: The app must be signed with a release key
   - Debug builds won't work with Google Play Billing
   - Use: `./gradlew assembleRelease` or `./gradlew bundleRelease`

3. **Test Account**: Use a Google account that's:
   - Added as a license tester in Google Play Console
   - Or part of an internal testing track

4. **Product Configuration**: Products must be:
   - Created in Google Play Console
   - Status: "Active" (or "Inactive" for testing)
   - Product IDs must match exactly: `basic_monthly`, `standard_monthly`, `premium_monthly`

### Steps to Test:

1. **Set up Google Play Console**:
   - Go to Google Play Console → Your App → Monetization → Products → Subscriptions
   - Create products with IDs matching your API (`google_product_id`)
   - Add your test account as a license tester

2. **Build Release APK**:

   ```bash
   cd android
   ./gradlew assembleRelease
   # Or for AAB:
   ./gradlew bundleRelease
   ```

3. **Install on Emulator**:

   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

4. **Test Purchase Flow**:
   - Open app, navigate to Pricing screen
   - Select a plan, click "Continue to Payment"
   - Google Play billing dialog should appear
   - Use test account to complete purchase
   - Check console logs for verification flow

### ⚠️ Limitations:

- **Sandbox Environment**: All purchases are test purchases (no real charges)
- **Verification**: Backend verification endpoint must handle test purchases
- **Some Features**: Some Google Play features may not work in emulator

### iOS Testing:

- Requires a physical device or TestFlight
- Cannot test IAP in iOS Simulator
- Use sandbox test accounts from App Store Connect

## Backend Verification

The purchase data sent to backend includes:

### Android:

- `purchaseToken` (CRITICAL) - Used to verify with Google Play Developer API
- `orderId` - Order identifier
- `productId` - Product ID from Google Play Console
- `transactionId` - Transaction identifier

### iOS:

- `transactionReceipt` (CRITICAL) - Used to verify with App Store Server API
- `originalTransactionId` - Original transaction ID for subscription tracking
- `productId` - Product ID from App Store Connect
- `transactionId` - Transaction identifier

### Backend Endpoint:

```
POST /api/subscriptions/verify-purchase
```

**TODO**: Update `sendPurchaseToBackend` function in `SubscriptionModal.tsx`:

- Replace `'https://your-api.com/api/subscriptions/verify-purchase'` with your actual endpoint
- Replace `'Bearer YOUR_AUTH_TOKEN'` with actual auth token from your auth context

## Troubleshooting

### Product ID Not Found:

- **Check**: Product IDs in API match exactly with Google Play Console / App Store Connect
- **Check**: Products are created and active in respective stores
- **Check**: Console logs show correct product ID being used

### Purchase Not Completing:

- **Check**: Console logs for error messages
- **Check**: Backend verification endpoint is working
- **Check**: Network connectivity
- **Check**: Test account has proper permissions

### Platform Detection Issues:

- **Check**: `Platform.OS` returns correct value (should be automatic)
- **Check**: Both `apple_product_id` and `google_product_id` exist in API response
- **Check**: Console logs show correct platform and product ID

## Next Steps

1. ✅ Data flow verified and logged
2. ✅ Platform detection working
3. ⏳ Update backend endpoint URL in `SubscriptionModal.tsx`
4. ⏳ Add actual user ID from auth context
5. ⏳ Implement backend verification endpoint
6. ⏳ Test on Android emulator with release build
7. ⏳ Test on iOS device with TestFlight
