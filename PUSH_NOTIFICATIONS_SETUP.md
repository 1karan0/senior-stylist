# Push Notifications Setup

## Overview

Push notifications have been integrated into the React Native app using Firebase Cloud Messaging (FCM) via React Native Firebase.

## What's Implemented

### 1. Notification Service (`src/services/notifications.ts`)

- ✅ Request notification permissions (Android 13+ and iOS)
- ✅ Get FCM token
- ✅ Save FCM token to backend (`POST /api/user/fcm-token`)
- ✅ Handle token refresh
- ✅ Handle foreground notifications
- ✅ Handle background/quit state notifications
- ✅ Handle notification taps for navigation

### 2. Active Chat API (`src/api/chat/useActiveChat.ts`)

- ✅ `setActiveChat(consultationId)` - Set active chat when user opens chat screen
- ✅ `setActiveChat(null)` - Clear active chat when user closes chat screen
- ✅ `getActiveChat()` - Get current active chat ID

### 3. Chat Screen Integration

- ✅ `src/screens/consulant/chat/Conversation.tsx` - Automatically sets/clears active chat on mount/unmount
- ✅ Works for both consultants and customers (uses same screen with `asCustomer` flag)

### 4. Notification Handler Component (`src/components/notifications/NotificationHandler.tsx`)

- ✅ Initializes notifications on app start
- ✅ Handles notification navigation:
  - `new_message` → Navigate to chat screen with `consultation_id`
  - `new_request` → Navigate to requests screen
- ✅ Handles app state changes (foreground/background)

### 5. App Integration

- ✅ `App.tsx` - NotificationHandler component added
- ✅ Android manifest permissions added (`POST_NOTIFICATIONS`)

## Notification Types

### 1. New Message Notification

```json
{
  "type": "new_message",
  "consultation_id": "123",
  "screen": "ConsultantChat"
}
```

- Only sent when chat is NOT active (handled by backend)
- Navigates to chat screen when tapped

### 2. New Request Notification

```json
{
  "type": "new_request",
  "request_id": "456",
  "screen": "Requests"
}
```

- Sent when consultation request is dispatched to stylist
- Navigates to requests screen when tapped

## Backend API Endpoints Required

### 1. Save FCM Token

**Endpoint:** `POST /api/user/fcm-token`

**Request:**

```json
{
  "fcm_token": "firebase_token_here"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "FCM token saved"
}
```

### 2. Set Active Chat

**Endpoint:** `POST /api/chat/active`

**Request:**

```json
{
  "consultation_id": 123 // or null to clear
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "consultation_id": 123
  }
}
```

### 3. Get Active Chat

**Endpoint:** `GET /api/chat/active`

**Response:**

```json
{
  "status": "success",
  "data": {
    "consultation_id": 123
  }
}
```

## How It Works

### Flow for Message Notifications

1. **User A sends message** → Backend receives message
2. **Backend checks** → Is User B's chat active? (via Firestore)
3. **If NOT active** → Backend sends FCM notification to User B
4. **If active** → No notification sent (user is already viewing chat)
5. **User B taps notification** → App navigates to chat screen
6. **Chat screen opens** → Calls `setActiveChat(consultationId)`
7. **Chat screen closes** → Calls `setActiveChat(null)`

### Flow for Request Notifications

1. **Customer creates consultation** → Backend dispatches to stylists
2. **Backend sends FCM notification** → To available stylists
3. **Stylist taps notification** → App navigates to requests screen
4. **Stylist can accept/decline** → From requests screen

## Testing

### Test Notification Permissions

1. Launch app
2. Check logs for: `[notifications] Permission status: ...`
3. Verify permission dialog appears (first time only)

### Test FCM Token

1. Check logs for: `[notifications] FCM token obtained: ...`
2. Verify token is saved to backend (check backend logs)

### Test Active Chat

1. Open a chat screen
2. Check logs for: `[active-chat] Active chat set: ...`
3. Close chat screen
4. Check logs for: `[active-chat] Active chat set: null`

### Test Notification Navigation

1. Send a message from another device/user
2. Receive notification (if chat not active)
3. Tap notification
4. Verify app navigates to correct chat screen

## Android Configuration

### Already Configured

- ✅ `POST_NOTIFICATIONS` permission in AndroidManifest.xml
- ✅ Firebase Messaging package installed
- ✅ `google-services.json` configured

### Additional Setup (if needed)

- Ensure Firebase project has FCM enabled
- Verify `google-services.json` has correct package name

## iOS Configuration (Future)

When implementing iOS:

1. Add Firebase iOS configuration (`GoogleService-Info.plist`)
2. Enable Push Notifications capability in Xcode
3. Request APNs permissions
4. Handle APNs token registration

## Troubleshooting

### Notifications not received

1. Check FCM token is obtained: Look for `[notifications] FCM token obtained`
2. Check token is saved to backend: Check backend logs
3. Verify backend is sending notifications: Check backend logs
4. Check notification permissions: Settings → Apps → Notifications

### Active chat not working

1. Check API calls: Look for `[active-chat]` logs
2. Verify backend endpoint: Test with Postman/curl
3. Check Firestore: Verify `user_active_chats/{userId}` document

### Navigation not working

1. Check notification data: Look for `[notifications] Handling notification:`
2. Verify navigation routes: Check `AppStackParamList` types
3. Check console errors: Look for navigation errors

## Next Steps

1. **Backend**: Ensure `/api/user/fcm-token` endpoint exists
2. **Testing**: Test with real devices (notifications don't work in emulator)
3. **iOS**: Implement iOS push notifications when ready
4. **Analytics**: Add notification open/click tracking if needed
