# Firestore Migration - FCM Tokens & Active Chats

## Overview

Migrated from MySQL database storage to Firestore for:

1. **FCM Token Storage** - From `device_tokens` table to Firestore `users/{userId}/fcmTokens/{deviceId}`
2. **Active Chat Tracking** - From API endpoints to Firestore `user_active_chats/{userId}/activeChats/{consultationId}`

## Changes Made

### 1. FCM Token Storage (`src/services/notifications.ts`)

**Before (MySQL via API):**

```typescript
POST /api/device-token/register
{
  "device_token": "fcm-token",
  "platform": "ios",
  ...
}
```

**After (Firestore Direct):**

```typescript
firestore()
  .collection('users')
  .doc(userId)
  .collection('fcmTokens')
  .doc(deviceId)
  .set(
    {
      token: fcmToken,
      platform: 'ios' | 'android' | 'web',
      deviceType: 'iPhone 13',
      appVersion: '1.0.0',
      osVersion: '17.0',
      isActive: true,
      lastUsedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
```

**Firestore Path:** `users/{userId}/fcmTokens/{deviceId}`

### 2. Active Chat Tracking (`src/api/chat/useActiveChat.ts`)

**Before (API endpoints):**

```typescript
POST / api / chat / active;
GET / api / chat / active;
```

**After (Firestore Direct):**

#### Set Active Chat (when user opens chat):

```typescript
firestore()
  .collection('user_active_chats')
  .doc(userId)
  .collection('activeChats')
  .doc(consultationId.toString())
  .set(
    {
      consultationId: consultationId.toString(),
      lastActivityAt: serverTimestamp(),
      deviceId: deviceId,
    },
    { merge: true }
  );
```

#### Clear Active Chat (when user closes chat):

```typescript
firestore()
  .collection('user_active_chats')
  .doc(userId)
  .collection('activeChats')
  .doc(consultationId.toString())
  .delete();
```

#### Clear All Active Chats (when app goes to background):

```typescript
// Get all active chats and delete them
const snapshot = await firestore()
  .collection('user_active_chats')
  .doc(userId)
  .collection('activeChats')
  .get();

await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
```

**Firestore Path:** `user_active_chats/{userId}/activeChats/{consultationId}`

### 3. App Background Handling (`src/components/notifications/NotificationHandler.tsx`)

Added automatic clearing of all active chats when app goes to background:

```typescript
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    clearAllActiveChats(); // Clear all active chats
  }
});
```

## Firestore Structure

### FCM Tokens

```
users/
  {userId}/
    fcmTokens/
      {deviceId}/
        token: string
        platform: 'ios' | 'android' | 'web'
        deviceType: string
        appVersion: string
        osVersion: string
        isActive: boolean
        lastUsedAt: timestamp
        createdAt: timestamp
```

### Active Chats

```
user_active_chats/
  {userId}/
    activeChats/
      {consultationId}/
        consultationId: string
        lastActivityAt: timestamp
        deviceId: string
```

## Functions Available

### FCM Token Management

- `saveFCMTokenToBackend(token)` - Saves FCM token to Firestore
- `setupTokenRefreshListener()` - Listens for token refresh and saves to Firestore

### Active Chat Management

- `setActiveChat(consultationId)` - Sets active chat in Firestore
- `clearActiveChat(consultationId)` - Clears specific active chat
- `clearAllActiveChats()` - Clears all active chats (called on app background)
- `getActiveChat()` - Gets current active chat from Firestore

## Integration Points

### Chat Screen (`src/screens/consulant/chat/Conversation.tsx`)

- Sets active chat when screen opens
- Clears active chat when screen closes/unmounts

### Notification Handler (`src/components/notifications/NotificationHandler.tsx`)

- Clears all active chats when app goes to background
- This ensures notifications are sent when app is not active

### Auth Context (`src/contexts/AuthContext.tsx`)

- Initializes notifications after login
- FCM token is automatically saved to Firestore

## Benefits

1. **Real-time Updates** - Firestore provides real-time sync
2. **No API Calls** - Direct Firestore writes (faster, offline support)
3. **Automatic Cleanup** - Active chats cleared on app background
4. **Scalable** - Firestore handles high read/write volumes
5. **Cloud Functions** - Backend can listen to Firestore changes for notifications

## Testing

### Test FCM Token Storage

1. Log in to app
2. Check Firestore: `users/{userId}/fcmTokens/{deviceId}`
3. Verify token is saved with all device info

### Test Active Chat

1. Open a chat screen
2. Check Firestore: `user_active_chats/{userId}/activeChats/{consultationId}`
3. Close chat screen
4. Verify document is deleted

### Test Background Clearing

1. Open multiple chat screens
2. Put app in background
3. Check Firestore: All active chats should be cleared
4. Verify notifications are sent (since no active chats)

## Backend Cloud Functions

The backend Cloud Functions should:

1. Listen to Firestore `user_active_chats` changes
2. Query `users/{userId}/fcmTokens` for active tokens
3. Send notifications via FCM when:
   - New message arrives AND chat is not active
   - New consultation request is dispatched

## Migration Notes

- Old API endpoints (`/api/device-token/register`, `/api/chat/active`) are no longer used
- All data is now stored in Firestore
- Backend should migrate existing tokens from MySQL to Firestore if needed
- Cloud Functions should be set up to handle notifications based on Firestore data
