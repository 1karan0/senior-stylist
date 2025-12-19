# Testing In-App Purchases on Android Emulator

## ✅ YES, You Can Test IAP on Emulator!

You **CAN** test in-app purchases on an Android emulator, but you need to meet specific requirements.

---

## 📋 Requirements Checklist

### ✅ 1. Emulator with Google Play Services

**You need:**

- An emulator created with **Google Play** (not Google APIs)
- Google Play Store app visible on the emulator
- Google Play Services installed

**Check if you have it:**

- Look for **Play Store icon** in the app drawer
- If you see it, you have Google Play Services ✅

**If you don't have it:**

- Create a new AVD (Android Virtual Device) with **Google Play** system image
- In Android Studio: **Tools** → **Device Manager** → **Create Device**
- Select a device → Choose a system image with **Google Play** (not Google APIs)

### ✅ 2. Release Build (NOT Debug)

**CRITICAL:** IAP only works with **release builds**, not debug builds.

**Why?**

- Google Play Billing requires a signed release APK
- Debug builds don't work with IAP

**How to build release:**

```bash
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

### ✅ 3. Google Account Signed In

**You need:**

- Sign into Google account on the emulator
- This should be the **same account** you'll add as a license tester

**How to sign in:**

1. Open **Play Store** app on emulator
2. Sign in with your Google account
3. Verify you're signed in: **Settings** → **Accounts** → Should see your Google account

### ✅ 4. Products Created in Play Console

**You need:**

- Subscription products created in Google Play Console
- Product IDs must match exactly what your app uses

**From your logs, you need:**

- `premium_monthly`
- `standard_monthly` (likely)

**How to create:**

1. Go to [Google Play Console](https://play.google.com/console)
2. **Monetization** → **Products** → **Subscriptions**
3. Create products with matching Product IDs
4. Activate them

### ✅ 5. License Tester Setup

**You need:**

- Your Google account added as a license tester

**How to set up:**

1. Google Play Console → **Settings** → **License testing**
2. Add your Google account email
3. Save

---

## 🚀 Quick Setup Steps for Emulator Testing

### Step 1: Verify Emulator Setup

```bash
# Check if Play Store is available
adb shell pm list packages | grep com.android.vending

# Should return: package:com.android.vending
# If empty, you don't have Play Store
```

### Step 2: Sign Into Google Account

1. Open **Play Store** on emulator
2. Sign in with your Google account
3. Verify: **Settings** → **Accounts** → Your Google account is listed

### Step 3: Build Release APK

```bash
cd /home/codedrill/senior-stylist/senior-stylist/android
./gradlew assembleRelease
```

### Step 4: Install Release APK

```bash
# Uninstall debug version first (if installed)
adb uninstall com.seniorstylist.app

# Install release version
adb install app/build/outputs/apk/release/app-release.apk
```

### Step 5: Create Products in Play Console

1. Go to Google Play Console
2. Create subscription products with IDs:
   - `premium_monthly`
   - `standard_monthly`
3. Activate them

### Step 6: Add License Tester

1. Google Play Console → **Settings** → **License testing**
2. Add your Google account email
3. Save

### Step 7: Test Purchase

1. Open your app on emulator
2. Navigate to Pricing screen
3. Click "Subscribe"
4. Check console logs

---

## 🔍 What to Expect

### ✅ Success Indicators

**Console logs should show:**

```
[SubscriptionModal] IAP connection initialized
[SubscriptionModal] Fetched subscriptions: [{ productId: 'premium_monthly', ... }]  // NOT empty array
[SubscriptionModal] Purchase params: { request: { google: { skus: ['premium_monthly'] } } }
```

**Then:**

- Google Play billing dialog appears
- Shows subscription details
- You can complete test purchase (no real charge)

### ❌ Common Issues

**1. "SKU not found"**

- Products not created in Play Console
- Product ID mismatch
- **Fix:** Create products with exact Product IDs

**2. "Google Play Services Not Available"**

- Using debug build instead of release
- **Fix:** Build and install release APK

**3. "getSubscriptions returns empty array"**

- Products not created
- Wrong package name
- **Fix:** Create products in Play Console

**4. Purchase dialog doesn't appear**

- IAP not initialized
- Product not found
- **Fix:** Check initialization logs, verify products exist

---

## 📱 Your Current Setup Status

Based on your previous logs:

✅ **You have:**

- Emulator with Google Play (Play Store icon visible)
- Google account signed in
- Code is correct (sending right data)

❌ **You need:**

- Release build installed (not debug)
- Products created in Play Console (`premium_monthly`, etc.)
- License tester added

---

## 🎯 Quick Test Command

Run this to check your setup:

```bash
# 1. Check if Play Store is installed
adb shell pm list packages | grep com.android.vending

# 2. Check installed app package
adb shell dumpsys package | grep -i seniorstylist

# 3. Build release APK
cd android && ./gradlew assembleRelease

# 4. Install release APK
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 💡 Pro Tips

1. **Always use release builds for IAP testing**
   - Debug builds won't work
   - Even in development, test with release APK

2. **Wait a few minutes after creating products**
   - Google Play needs time to propagate new products
   - If you just created a product, wait 2-5 minutes before testing

3. **Check Product IDs match exactly**
   - Case-sensitive
   - No spaces
   - Must match exactly what your API returns

4. **Test purchases are free**
   - As a license tester, purchases don't charge real money
   - Perfect for testing!

5. **Check console logs carefully**
   - `getSubscriptions` returning empty array = products not found
   - `sku-not-found` = Product ID doesn't exist in Play Console

---

## 🚨 Important Notes

### Emulator vs Physical Device

**Emulator:**

- ✅ Works for IAP testing
- ✅ Easier to debug
- ✅ Can test multiple scenarios quickly
- ⚠️ Must have Google Play Services
- ⚠️ Must use release build

**Physical Device:**

- ✅ More realistic testing
- ✅ Better performance
- ✅ Can test on different Android versions
- ⚠️ Need to install via Play Store or adb

**Both work!** Choose based on your preference.

---

## ✅ Final Checklist

Before testing IAP on emulator:

- [ ] Emulator has Google Play Services (Play Store icon visible)
- [ ] Google account signed in on emulator
- [ ] Release APK built (`./gradlew assembleRelease`)
- [ ] Release APK installed (not debug version)
- [ ] Products created in Play Console
- [ ] Product IDs match exactly
- [ ] License tester added in Play Console
- [ ] App package name matches Play Console

---

## 🎉 Ready to Test!

Once you've completed the checklist:

1. Open your app on emulator
2. Go to Pricing screen
3. Click "Subscribe"
4. Google Play billing dialog should appear
5. Complete test purchase
6. Check console logs for success

**You're all set!** 🚀
