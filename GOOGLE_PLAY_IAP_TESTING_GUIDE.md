# Google Play In-App Purchase Testing Guide

## 📋 Quick Checklist

- [ ] Check what product IDs your app is using
- [ ] Create subscription products in Google Play Console
- [ ] Build and install a release APK
- [ ] Add your account as a license tester
- [ ] Test the purchase flow
- [ ] Verify purchase completion

---

## Step 1: Check Your Product IDs

### 1.1 Check Your API Response

Your app gets subscription plans from `/api/subscription-plans`. The product IDs are in the `google_product_id` field.

**To see what product IDs you're using:**

1. Open your app
2. Navigate to the Pricing screen
3. Check the console logs - you should see logs like:
   ```
   [SubscriptionModal] Platform detection: {
     platform: 'android',
     selectedProductId: 'premium_monthly',  // <-- This is what you need
     allProductIds: {
       apple: 'premium_monthly_ios',
       google: 'premium_monthly'  // <-- This is the Google product ID
     }
   }
   ```

**Or check your API directly:**

- Make a GET request to `/api/subscription-plans`
- Look for the `google_product_id` field in each plan
- Common values: `standard_monthly`, `premium_monthly`, etc.

### 1.2 Document Your Product IDs

Based on your logs, you're using:

- `premium_monthly`
- `standard_monthly` (likely)

**Write down all product IDs you need to create in Play Console.**

---

## Step 2: Set Up Products in Google Play Console

### 2.1 Access Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (package: `com.seniorstylist.app` or `com.seniorstylist.app.dev`)

### 2.2 Create Subscription Products

1. Navigate to: **Monetization** → **Products** → **Subscriptions**
2. Click **Create subscription**
3. For each product ID from Step 1:

   **Product ID:** (Must match exactly)
   - Example: `premium_monthly`
   - ⚠️ **CRITICAL:** Must match exactly what your API returns in `google_product_id`
   - No spaces, no typos, case-sensitive

   **Name:** (User-facing name)
   - Example: "Premium Monthly Subscription"

   **Description:** (User-facing description)
   - Example: "Premium plan with 12 consultations per month"

   **Billing period:**
   - Select: **Monthly** (or whatever matches your plan)

   **Price:**
   - Set the price (e.g., £10.00)
   - This should match your API's `discounted_price` or `monthly_price`

   **Free trial / Introductory price:** (Optional)
   - If your API shows a discount, you can set an introductory price here

4. Click **Save** and **Activate** the subscription

### 2.3 Verify Product Status

- Products should be **Active** (green status)
- Status can be "Active" or "Inactive" - both work for testing
- Make sure the Product ID matches **exactly** what your app uses

---

## Step 3: Set Up License Testing

### 3.1 Add License Testers

1. In Google Play Console, go to: **Settings** → **License testing**
2. Under **License testers**, click **Add email addresses**
3. Add your Google account email (the one signed into your emulator/device)
4. Click **Save**

⚠️ **Important:** This is different from app testers. You need BOTH:

- License tester (for IAP testing)
- App tester (for accessing the app in testing track)

### 3.2 Add App Testers (If Using Internal Testing)

1. Go to: **Testing** → **Internal testing** (or your testing track)
2. Click **Testers** tab
3. Add your Google account email
4. Make sure the app version is available in this track

---

## Step 4: Build and Install Release APK

### 4.1 Why Release APK?

**IAP only works with release builds**, not debug builds. Google Play Billing requires a signed release APK.

### 4.2 Build Release APK

**Option A: Using Gradle (Recommended)**

```bash
cd /home/codedrill/senior-stylist/senior-stylist/android

# Build release APK
./gradlew assembleRelease

# The APK will be at:
# app/build/outputs/apk/release/app-release.apk
```

**Option B: Using React Native CLI**

```bash
cd /home/codedrill/senior-stylist/senior-stylist

# Build release APK
npx react-native build-android --mode=release
```

### 4.3 Sign the APK (If Not Already Signed)

If you haven't set up signing yet:

1. Create a keystore:

   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`:

   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('my-release-key.keystore')
               storePassword 'YOUR_PASSWORD'
               keyAlias 'my-key-alias'
               keyPassword 'YOUR_PASSWORD'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. Rebuild:
   ```bash
   ./gradlew assembleRelease
   ```

### 4.4 Install Release APK

**Option A: Direct Install (For Quick Testing)**

```bash
# Install the release APK directly
adb install app/build/outputs/apk/release/app-release.apk

# If app is already installed, use -r flag to replace
adb install -r app/build/outputs/apk/release/app-release.apk
```

**Option B: Upload to Play Console (Recommended for Real Testing)**

1. Go to Google Play Console → **Testing** → **Internal testing**
2. Click **Create new release**
3. Upload your APK or AAB file
4. Fill in release notes
5. Click **Save** → **Review release** → **Start rollout to Internal testing**
6. Wait a few minutes for processing
7. Install from Play Store on your device:
   - Open Play Store on emulator/device
   - Search for your app or use the testing link
   - Install from Play Store (not via adb)

---

## Step 5: Verify Setup

### 5.1 Check App Package Name

Make sure your app's package name matches what's in Play Console:

```bash
# Check installed app package
adb shell dumpsys package | grep -i seniorstylist

# Should show: com.seniorstylist.app or com.seniorstylist.app.dev
```

### 5.2 Verify Google Account

1. On your emulator/device:
   - Open **Settings** → **Accounts**
   - Make sure your Google account is signed in
   - This should be the same account you added as a license tester

2. Open **Play Store** app:
   - Make sure you're signed in with the same account
   - Check that you can see your app (if uploaded to testing track)

### 5.3 Test IAP Initialization

1. Open your app
2. Navigate to Pricing screen
3. Click "Continue to Payment" on any plan
4. Check console logs:

   **✅ Success:**

   ```
   [SubscriptionModal] IAP connection initialized
   [SubscriptionModal] IAP initialized successfully, listeners set up
   ```

   **❌ Error:**

   ```
   [SubscriptionModal] Failed to initialize IAP: Google Play Services Not Available
   ```

   - This means you need Google Play Services or a release build

---

## Step 6: Test Purchase Flow

### 6.1 Start Purchase

1. Open app → Pricing screen
2. Select a plan (e.g., Premium)
3. Click "Subscribe"
4. Check console logs:

   **Expected logs:**

   ```
   [SubscriptionModal] Initiating purchase for product: premium_monthly
   [SubscriptionModal] Purchase params: { request: { google: { skus: ['premium_monthly'] } }, type: 'subs' }
   [SubscriptionModal] Android skus array: { length: 1, skus: ['premium_monthly'], isEmpty: false }
   ```

### 6.2 Google Play Billing Dialog

**✅ Success:**

- Google Play billing dialog should appear
- Shows subscription details (price, billing period)
- Has "Subscribe" button

**❌ Error - "SKU not found":**

- Product ID doesn't exist in Play Console
- Product ID mismatch (typo, wrong case, etc.)
- Product not activated
- Wrong package name / app

**Fix:**

- Double-check Product ID in Play Console matches exactly
- Make sure product is **Active**
- Verify you're testing the correct app package

### 6.3 Complete Test Purchase

1. In the Google Play billing dialog, click **Subscribe**
2. Since you're a license tester, this is a **test purchase** (no real charge)
3. You'll see a confirmation dialog
4. Check console logs:

   **Expected logs:**

   ```
   [SubscriptionModal] Purchase update received: {
     productId: 'premium_monthly',
     transactionId: '...',
     purchaseStateAndroid: 1  // 1 = purchased
   }
   [SubscriptionModal] Purchase successful, processing...
   [SubscriptionModal] Sending purchase to backend for verification...
   [SubscriptionModal] Backend verification success
   [SubscriptionModal] Transaction finished successfully
   ```

### 6.4 Verify Backend

1. Check your backend logs for the verification request
2. Verify the purchase token is received
3. Confirm subscription is saved in your database

---

## Step 7: Troubleshooting

### Error: "SKU not found"

**Causes:**

- Product ID doesn't exist in Play Console
- Product ID mismatch (typo, case sensitivity)
- Product not activated
- Wrong app package

**Solutions:**

1. Check Product ID in Play Console matches exactly (no spaces, correct case)
2. Verify product is **Active**
3. Check app package name matches
4. Wait a few minutes after creating product (propagation delay)

### Error: "Google Play Services Not Available"

**Causes:**

- Using debug build instead of release build
- Emulator doesn't have Google Play Services
- Not signed into Google account

**Solutions:**

1. Build and install release APK (see Step 4)
2. Use emulator with Google Play (not Google APIs)
3. Sign into Google account on device

### Error: "getSubscriptions returns empty array"

**Causes:**

- Products not created in Play Console
- Product IDs don't match
- App not installed from Play Store (if required)

**Solutions:**

1. Create products in Play Console (Step 2)
2. Verify Product IDs match exactly
3. Try installing from Play Store instead of adb

### Purchase Dialog Doesn't Appear

**Causes:**

- IAP not initialized
- Product not found
- Network issues

**Solutions:**

1. Check IAP initialization logs
2. Verify product exists in Play Console
3. Check internet connection
4. Try again after a few minutes

---

## Step 8: Verify Everything Works

### ✅ Success Checklist

- [ ] IAP initializes without errors
- [ ] `getSubscriptions` returns products (not empty array)
- [ ] Google Play billing dialog appears
- [ ] Purchase completes successfully
- [ ] Backend receives and verifies purchase
- [ ] Transaction is finished properly
- [ ] User sees success message

### 📊 Expected Console Log Flow

```
[SubscriptionModal] Initializing IAP connection...
[SubscriptionModal] IAP connection initialized
[SubscriptionModal] Fetching subscription products before purchase...
[SubscriptionModal] Fetched subscriptions: [{ productId: 'premium_monthly', ... }]
[SubscriptionModal] Calling requestPurchase with productId: premium_monthly
[SubscriptionModal] Purchase params: { request: { google: { skus: ['premium_monthly'] } }, type: 'subs' }
[SubscriptionModal] Purchase update received: { productId: 'premium_monthly', ... }
[SubscriptionModal] Purchase successful, processing...
[SubscriptionModal] Sending purchase to backend for verification...
[SubscriptionModal] Backend verification success
[SubscriptionModal] Transaction finished successfully
```

---

## Quick Reference: Product IDs from Your Logs

Based on your console logs, you're using:

- **Product ID:** `premium_monthly`
- **Product ID:** `standard_monthly` (likely)

Make sure these exact IDs exist in Google Play Console as subscription products.

---

## Next Steps

Once IAP is working:

1. Test all subscription plans
2. Test subscription cancellation
3. Test subscription renewal
4. Verify backend handles all purchase states
5. Test on physical device
6. Prepare for production release

---

## Need Help?

If you're still getting errors:

1. Check console logs for specific error messages
2. Verify Product IDs match exactly
3. Ensure you're using a release build
4. Confirm license tester is set up
5. Check Google Play Console for product status
