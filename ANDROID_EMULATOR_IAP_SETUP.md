# Android Emulator IAP Setup Guide

## Quick Check: Does Your Emulator Have Google Play?

### Method 1: Visual Check

1. Open your Pixel 4 Android 14 emulator
2. Look for the **Play Store** app icon in the app drawer
3. If you see it → ✅ Google Play is installed
4. If you don't see it → ❌ You need to recreate the emulator

### Method 2: Check System Image Type

1. Open **Android Studio**
2. Go to **Tools** → **AVD Manager**
3. Find your Pixel 4 emulator
4. Look at the **System Image** column:
   - ✅ **"Google Play"** → Has Google Play Services (GOOD for IAP)
   - ❌ **"Google APIs"** → No Google Play Services (WON'T work for IAP)

## Solution: Create New Emulator with Google Play

### Step 1: Open AVD Manager

- In Android Studio: **Tools** → **AVD Manager**
- Or click the device manager icon in the toolbar

### Step 2: Create Virtual Device

1. Click **"Create Virtual Device"** (or **"+"** button)
2. Select **Pixel 4** (or any device you prefer)
3. Click **Next**

### Step 3: Select System Image with Google Play

1. In the **System Image** selection screen:
   - Look for images labeled **"Google Play"** (not "Google APIs")
   - For Android 14, look for: **"Tiramisu API 34"** or **"UpsideDownCake API 34"** with **"Google Play"**
   - The image should show: `Google Play` badge/icon
2. If you don't see a Google Play image:
   - Click **"Download"** next to the image
   - Wait for download to complete
   - Select the downloaded image
3. Click **Next**

### Step 4: Configure and Finish

1. Name your emulator (e.g., "Pixel 4 Android 14 - Google Play")
2. Review settings (RAM, etc.)
3. Click **Finish**

### Step 5: Launch and Verify

1. Start the new emulator
2. Wait for it to boot completely
3. Look for **Play Store** icon
4. Open Play Store and sign in with a Google account
5. ✅ Your emulator now has Google Play Services!

## Testing IAP on Emulator

### Requirements:

1. ✅ Emulator with Google Play (you just created this)
2. ✅ Google account signed in to Play Store
3. ✅ Release build of your app (debug builds may not work)
4. ✅ Products configured in Google Play Console
5. ✅ Test account added as license tester

### Build Release APK:

```bash
cd android
./gradlew assembleRelease
```

### Install on Emulator:

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

### Test IAP:

1. Open your app
2. Navigate to Pricing screen
3. Select a plan
4. Click "Continue to Payment"
5. Google Play billing dialog should appear
6. Complete test purchase

## Troubleshooting

### Issue: "Failed to initialize billing connection"

**Cause:** Emulator doesn't have Google Play Services

**Solution:**

- Recreate emulator with Google Play system image (see steps above)
- Or test on a physical Android device

### Issue: "Products not available"

**Cause:** Products not configured in Google Play Console

**Solution:**

1. Go to Google Play Console
2. Navigate to: **Monetization** → **Products** → **Subscriptions**
3. Create products with IDs matching your API (`google_product_id`)
4. Set status to **Active** (or Inactive for testing)

### Issue: Play Store won't open

**Cause:** Google Play Services not fully initialized

**Solution:**

1. Wait a few minutes after first boot
2. Ensure emulator has internet connection
3. Try restarting the emulator
4. Check if Google Play Services app is installed (Settings → Apps)

## Notes

- **You CANNOT install Google Play on an existing "Google APIs" emulator**
- You must create a new emulator with a "Google Play" system image
- Android 14 (API 34) with Google Play is available and works for IAP
- Physical devices always have Google Play Services (easier for testing)

## Alternative: Use Physical Device

If emulator setup is too complex:

1. Connect your Android phone via USB
2. Enable USB debugging
3. Run: `npx react-native run-android`
4. Test IAP directly on device (always has Google Play Services)
