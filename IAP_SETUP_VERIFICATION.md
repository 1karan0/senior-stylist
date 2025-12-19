# IAP Setup Verification Checklist

## ✅ Code Implementation Status

### 1. **API Integration** ✅

- [x] `useGetSubscriptionPlans` hook created
- [x] Fetches from `/api/subscription-plans`
- [x] Returns `apple_product_id` and `google_product_id`
- [x] Data structure matches API response

### 2. **Pricing Screen** ✅

- [x] Fetches subscription plans from API
- [x] Filters out test plans (slug with `-test`)
- [x] Sorts by `sort_order`
- [x] Passes full `originalPlan` to SubscriptionModal
- [x] Displays price, consultations, and features correctly
- [x] Console logs for debugging

### 3. **SubscriptionModal** ✅

- [x] IAP initialization with `initConnection()`
- [x] Platform detection (`Platform.OS`)
- [x] Product ID selection (iOS vs Android)
- [x] Purchase initiation with `requestSubscription()`
- [x] Purchase update listener
- [x] Purchase error listener
- [x] Backend verification call
- [x] Transaction finishing with `finishTransaction()`
- [x] Error handling for IAP initialization
- [x] User-friendly error messages
- [x] Console logs for debugging

### 4. **Data Flow** ✅

- [x] API → Pricing: Product IDs passed correctly
- [x] Pricing → Modal: `originalPlan` with product IDs passed
- [x] Modal → Store: Correct product ID selected based on platform
- [x] Store → Modal: Purchase data received
- [x] Modal → Backend: Purchase verification data sent

## ⚠️ Required Updates Before Testing

### 1. **Backend Endpoint** ⚠️ **CRITICAL**

**Location:** `SubscriptionModal.tsx` line 426

**Current:**

```typescript
const response = await fetch('https://your-api.com/api/subscriptions/verify-purchase', {
```

**Action Required:**

- Replace `'https://your-api.com/api/subscriptions/verify-purchase'` with your actual backend endpoint
- Use `BASE_URL` from config if available
- Example: `${BASE_URL}/api/subscriptions/verify-purchase`

### 2. **User Authentication** ⚠️ **CRITICAL**

**Location:** `SubscriptionModal.tsx` line 205 and 430

**Current:**

```typescript
userId: 'current_user_id', // TODO: Replace with actual user ID
Authorization: 'Bearer YOUR_AUTH_TOKEN', // Add auth if needed
```

**Action Required:**

- Get user ID from AuthContext or auth service
- Get auth token from storage or auth service
- Replace placeholders with actual values

**Example Fix:**

```typescript
import { useAuth } from '@/contexts/AuthContext';

// In component:
const { user, token } = useAuth();

// In purchaseDataForBackend:
userId: user?.id || user?.uid,

// In fetch headers:
Authorization: `Bearer ${token}`,
```

### 3. **Backend Response Format** ⚠️

**Location:** `SubscriptionModal.tsx` line 247

**Expected Response:**

```typescript
{
  success: boolean;
  // ... other fields
}
```

**Action Required:**

- Ensure backend returns `{ success: true }` on successful verification
- Handle error responses appropriately

## ✅ Google Play Console Setup Checklist

### 1. **App Published**

- [ ] App is published to at least **Internal Testing** or **Closed Testing** track
- [ ] Version code matches the APK you're testing
- [ ] App status is "Available" or "In review"

### 2. **Subscription Products Created**

- [ ] Go to: **Monetization** → **Products** → **Subscriptions**
- [ ] Create products with IDs matching your API's `google_product_id`
  - Example: If API returns `google_product_id: "standard_monthly"`, create product with ID `standard_monthly`
- [ ] Set pricing, billing period, and other details
- [ ] Status can be **Active** or **Inactive** (both work for testing)

### 3. **License Testing**

- [ ] Go to: **Settings** → **License testing**
- [ ] Add your Google account email as a **License tester**
- [ ] ⚠️ This is different from app tester - you need BOTH

### 4. **Test Account**

- [ ] Your Google account is added to the testing track
- [ ] Account is signed in on the emulator/device
- [ ] Account has access to the app version

## ✅ Testing Setup Checklist

### 1. **Emulator/Device**

- [x] Emulator has Google Play Services (Play Store icon visible)
- [x] Google account signed in to Play Store
- [ ] Release APK installed (not debug build)

### 2. **Build Release APK**

```bash
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

### 3. **Verify Product IDs Match**

- [ ] Check console logs when Pricing screen loads
- [ ] Verify `google_product_id` from API matches products in Play Console
- [ ] Example log: `[Pricing] Mapped plan "Standard": { google: "standard_monthly" }`

## 🧪 Testing Steps

### Step 1: Verify IAP Initialization

1. Open app
2. Navigate to Pricing screen
3. Click "Continue to Payment" on any plan
4. Check console logs:
   - Should see: `[SubscriptionModal] IAP connection initialized`
   - If error: Check error message and follow troubleshooting

### Step 2: Test Purchase Flow

1. Select a plan
2. Click "Subscribe"
3. Google Play billing dialog should appear
4. Complete test purchase (no real charge)
5. Check console logs for:
   - Purchase update received
   - Backend verification
   - Transaction finished

### Step 3: Verify Backend

1. Check backend logs for verification request
2. Verify purchase token/receipt
3. Confirm subscription activated in database

## 🔍 Debugging Console Logs

### Expected Log Flow:

```
[Pricing] Raw subscription plans from API: [...]
[Pricing] Mapped plan "Standard": { google: "standard_monthly" }
[SubscriptionModal] Modal opened with plan: { selectedProductId: "standard_monthly" }
[SubscriptionModal] Initializing IAP connection...
[SubscriptionModal] IAP connection initialized
[SubscriptionModal] handleSubscribe called
[SubscriptionModal] Initiating purchase for product: standard_monthly
[SubscriptionModal] Purchase update received: { productId: "standard_monthly" }
[SubscriptionModal] Purchase successful, processing...
[SubscriptionModal] Sending purchase to backend for verification...
[SubscriptionModal] Backend verification success
[SubscriptionModal] Transaction finished successfully
```

## ❌ Common Issues & Solutions

### Issue: "Failed to initialize billing connection"

**Solution:**

- Use emulator with Google Play (not Google APIs)
- Or test on physical device
- Or build release APK

### Issue: "Products not available"

**Solution:**

- Verify products exist in Google Play Console
- Check product IDs match exactly (case-sensitive)
- Ensure products are Active or Inactive (not deleted)

### Issue: "Backend verification failed"

**Solution:**

- Check backend endpoint URL is correct
- Verify auth token is valid
- Check backend logs for errors
- Ensure backend handles test purchases

### Issue: Purchase completes but subscription not activated

**Solution:**

- Check backend verification endpoint
- Verify purchase token is being validated
- Check database for subscription record

## 📝 Pre-Deployment Checklist

Before deploying to production:

- [ ] Backend endpoint updated with production URL
- [ ] User authentication integrated
- [ ] Products created in Google Play Console (production)
- [ ] Products created in App Store Connect (iOS)
- [ ] Backend verification tested
- [ ] Error handling tested
- [ ] Console logs reviewed (remove sensitive data in production)
- [ ] Test on physical devices (both Android and iOS)

## 🎯 Summary

**Code Implementation:** ✅ **COMPLETE**
**Required Updates:** ⚠️ **2 Critical Items**

1. Backend endpoint URL
2. User authentication

**Next Steps:**

1. Update backend endpoint and auth
2. Create products in Google Play Console
3. Add account as license tester
4. Build release APK
5. Test purchase flow
6. Verify backend receives and processes purchases
