# Notification Permissions - When They're Requested

## Overview

Notification permissions are requested **after the user successfully logs in**, not on app startup. This ensures:

- Users understand why they need notifications (to receive messages/requests)
- Better permission grant rates (contextual request)
- No permission prompts for logged-out users

## When Permissions Are Requested

### 1. **After Successful Login** ✅

**Location:** `src/contexts/AuthContext.tsx` → `login()` function

**Flow:**

1. User enters email/password
2. Backend validates credentials
3. User receives auth token
4. **→ Notification permission dialog appears**
5. If granted → FCM token obtained → Token saved to backend

**Code:**

```typescript
const login = async (email: string, password: string) => {
  // ... login logic ...

  // Request notification permissions and register FCM token after successful login
  initializeNotifications().catch((error) => {
    if (__DEV__) {
      console.warn('[auth] Failed to initialize notifications:', error);
    }
  });
};
```

### 2. **After Email Verification (Signup)** ✅

**Location:** `src/contexts/AuthContext.tsx` → `verifyEmail()` function

**Flow:**

1. User signs up
2. User receives OTP code
3. User verifies email with OTP
4. User receives auth token
5. **→ Notification permission dialog appears**
6. If granted → FCM token obtained → Token saved to backend

**Code:**

```typescript
const verifyEmail = async (email: string, code: string) => {
  // ... verification logic ...

  // Request notification permissions and register FCM token after successful email verification
  initializeNotifications().catch((error) => {
    if (__DEV__) {
      console.warn('[auth] Failed to initialize notifications:', error);
    }
  });
};
```

### 3. **After App Restart (If Already Logged In)** ✅

**Location:** `src/contexts/AuthContext.tsx` → `checkAuthStatus()` function

**Flow:**

1. App starts
2. Checks if user has saved auth token
3. If token exists → User is logged in
4. **→ Notification permission dialog appears** (if not already granted)
5. If granted → FCM token obtained → Token saved to backend

**Code:**

```typescript
const checkAuthStatus = async () => {
  const [token, userData] = await Promise.all([storage.getToken(), storage.getUserData()]);

  if (token && userData) {
    setUser(userData);
    await ensureFirebaseSession();

    // Request notification permissions and register FCM token after restoring session
    initializeNotifications().catch((error) => {
      if (__DEV__) {
        console.warn('[auth] Failed to initialize notifications:', error);
      }
    });
  }
};
```

## What Happens When Permission is Requested

### Step-by-Step Flow:

1. **Permission Request**
   - Android 13+: Shows system permission dialog
   - iOS: Shows FCM permission dialog
   - Older Android: Permission granted automatically

2. **If Permission Granted:**
   - FCM token is obtained from Firebase
   - Token is sent to backend: `POST /api/device-token/register`
   - Backend stores token in `device_tokens` table
   - Token refresh listener is set up (for token updates)

3. **If Permission Denied:**
   - No FCM token obtained
   - User won't receive push notifications
   - Can be re-requested later (user can enable in Settings)

## Permission Request Details

### Android

- **Android 13+ (API 33+)**: Requires runtime permission `POST_NOTIFICATIONS`
- **Older Android**: Permission granted automatically
- Permission is in `AndroidManifest.xml`: ✅ Already added

### iOS

- Requires explicit permission request via FCM
- User sees native iOS permission dialog
- Can be denied and re-requested later

## Token Registration API

**Endpoint:** `POST /api/device-token/register`

**Request Body:**

```json
{
  "device_token": "fcm_token_here",
  "platform": "android", // or "ios" or "web"
  "device_type": "android", // optional
  "app_version": "0.0.1", // optional
  "os_version": "33", // optional (Android API level or iOS version)
  "device_id": "device_unique_id" // optional
}
```

**Headers:**

```
Authorization: Bearer {auth_token}
Content-Type: application/json
```

## Notification Handler Setup

The `NotificationHandler` component (in `App.tsx`) handles:

- ✅ Foreground notifications (when app is open)
- ✅ Background notifications (when app is in background)
- ✅ Quit state notifications (when app is closed)
- ✅ Notification tap navigation
- ✅ Token refresh (when FCM token changes)

**Note:** Notification handlers are set up on app start, but permissions are only requested after login.

## User Experience

### First Time User:

1. Opens app → No permission request yet
2. Logs in → **Permission dialog appears** → Grants permission
3. Receives notifications immediately

### Returning User (Already Logged In):

1. Opens app → Checks saved token → User is logged in
2. **Permission dialog appears** (if not already granted)
3. Receives notifications

### User Who Denied Permission:

1. Can enable later in device Settings
2. App will request again on next login (if permission was reset)
3. Token will be registered when permission is granted

## Testing

### Test Permission Request:

1. Log out of app
2. Log in with credentials
3. **Verify:** Permission dialog appears after successful login
4. Grant permission
5. **Verify:** Check logs for `[notifications] FCM token obtained`
6. **Verify:** Check backend logs for token registration

### Test Token Registration:

1. After granting permission, check backend `device_tokens` table
2. Verify token is saved with correct `platform`, `app_version`, etc.
3. Verify token is associated with correct user

## Summary

**Permissions are requested:**

- ✅ After successful login
- ✅ After email verification (signup)
- ✅ After app restart (if user already logged in)

**Permissions are NOT requested:**

- ❌ On app startup (before login)
- ❌ When user is logged out
- ❌ On every app open (only if not already granted)

This ensures users understand the context and are more likely to grant permission.
