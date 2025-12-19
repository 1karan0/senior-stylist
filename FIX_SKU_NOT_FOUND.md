# Fix: SKU Not Found Error - Solution

## 🔍 Problem Identified

Your setup is **almost correct**, but there's one critical issue:

- ✅ App package matches: `com.seniorstylist.app.dev`
- ✅ Subscriptions created: `premium_monthly`, `standard_monthly`, etc.
- ✅ Internal testing track is Active
- ❌ **App is installed via `adb install` instead of Play Store**

## 🎯 Root Cause

**Google Play Billing requires the app to be installed FROM Play Store** (even for internal testing) for IAP products to be accessible.

When you install via `adb install`, Google Play doesn't recognize it as a "Play Store app", so it won't return your subscription products.

## ✅ Solution: Install from Play Store Internal Testing

### Step 1: Upload Release Build to Internal Testing

1. **Build a signed release APK/AAB:**

   ```bash
   cd android
   ./gradlew bundleRelease  # Creates AAB (recommended) or assembleRelease for APK
   ```

2. **Upload to Play Console:**
   - Go to: **Test and release** → **Internal testing**
   - Click **Create new release**
   - Upload your AAB/APK file
   - Fill in release notes
   - Click **Save** → **Review release** → **Start rollout to Internal testing**

3. **Wait for processing:**
   - Google needs 5-10 minutes to process the upload
   - Wait until status shows "Available" or "Rolled out"

### Step 2: Install from Play Store

**Option A: Using Testing Link (Easiest)**

1. In Play Console → **Internal testing** → **Testers** tab
2. Copy the **Testing link** (looks like: `https://play.google.com/apps/internaltest/...`)
3. Open this link on your emulator/device (in Chrome or Play Store app)
4. Click **Download** or **Install** button
5. The app will install from Play Store ✅

**Option B: Search in Play Store**

1. On your emulator, open **Play Store** app
2. Make sure you're signed in with the **same Google account** that's:
   - Added as a tester in Internal testing track
   - Added as a license tester
3. Search for "Senior Stylist" or your app name
4. You should see it with a "Testing" badge
5. Click **Install**

### Step 3: Verify Installation

```bash
# Check if app is installed from Play Store
adb shell dumpsys package com.seniorstylist.app.dev | grep installer

# Should show: installer=com.android.vending (Play Store)
# If it shows installer=null or something else, it's not from Play Store
```

### Step 4: Test IAP Again

1. Open your app (now installed from Play Store)
2. Navigate to Pricing screen
3. Click "Subscribe"
4. Check console logs:

   **✅ Success:**

   ```
   [SubscriptionModal] Fetched subscriptions: [{ productId: 'premium_monthly', ... }]
   ```

   - Should NOT be empty array anymore
   - Google Play billing dialog should appear

   **❌ Still failing:**
   - Check if you're signed in with the correct Google account
   - Verify license tester is set up
   - Wait a few more minutes (propagation delay)

---

## 🔧 Alternative: Quick Test Without Upload (Limited)

If you can't upload to Play Store right now, you can try:

### Option 1: Use Physical Device

Physical devices sometimes work better with IAP even with adb install:

1. Connect your Android phone
2. Build release APK
3. Install via adb
4. Test IAP (may work better than emulator)

### Option 2: Check Product Status in Play Console

1. Go to **Monetization** → **Products** → **Subscriptions**
2. Click on `premium_monthly`
3. Check:
   - Status should be **Active** (green)
   - All required fields filled (name, description, price, billing period)
   - No warnings or errors shown
4. If status is "Inactive" or "Draft", click **Activate**

---

## 📋 Complete Checklist

Before testing IAP:

- [ ] App uploaded to **Internal testing** track in Play Console
- [ ] Release status shows "Available" or "Rolled out"
- [ ] App installed **FROM Play Store** (not adb install)
- [ ] Google account signed in on device/emulator
- [ ] Account added as **License tester** (Settings → License testing)
- [ ] Account added as **Internal testing** tester
- [ ] Subscription products are **Active** in Play Console
- [ ] Product IDs match exactly: `premium_monthly`, `standard_monthly`
- [ ] Using **release build** (not debug)

---

## 🚨 Why This Happens

Google Play Billing has security measures:

- It verifies the app's signing key matches Play Console
- It checks if the app was distributed through Play Store
- It ensures products belong to the correct app package

When you install via `adb install`, Google Play doesn't recognize it as a "Play Store app", so it won't return IAP products for security reasons.

---

## ✅ Expected Result After Fix

Once installed from Play Store:

1. **Console logs:**

   ```
   [SubscriptionModal] Fetched subscriptions: [
     {
       productId: 'premium_monthly',
       price: '£10.00',
       ...
     }
   ]
   ```

2. **Purchase flow:**
   - Click "Subscribe" → Google Play billing dialog appears
   - Shows subscription details
   - Can complete test purchase

3. **No more errors:**
   - No "sku-not-found"
   - No empty subscriptions array
   - Purchase completes successfully

---

## 🎯 Quick Action Items

**Right now, do this:**

1. **Build release bundle:**

   ```bash
   cd android
   ./gradlew bundleRelease
   ```

   - File will be at: `app/build/outputs/bundle/release/app-release.aab`

2. **Upload to Play Console:**
   - Internal testing → Create new release → Upload AAB

3. **Install from Play Store:**
   - Use testing link or search in Play Store
   - Install the app

4. **Test again:**
   - Open app → Pricing → Subscribe
   - Should work now! ✅

---

This is the **most common issue** with IAP testing. Once you install from Play Store, everything should work! 🚀
