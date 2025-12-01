# Notification & Active Chat - Role Verification

## ✅ Both Customer and Consultant Are Fully Supported

### 1. FCM Token Storage

**Works for both roles:**

- Uses `userData.id` from storage (same for customers and consultants)
- Firestore path: `users/{userId}/fcmTokens/{deviceId}`
- No role-specific logic needed

**Code:** `src/services/notifications.ts` → `saveFCMTokenToBackend()`

### 2. Active Chat Tracking

**Works for both roles:**

- Uses `userData.id` from storage (same for customers and consultants)
- Firestore path: `user_active_chats/{userId}/activeChats/{consultationId}`
- No role-specific logic needed

**Code:** `src/api/chat/useActiveChat.ts`

- `setActiveChat()` - Works for both
- `clearActiveChat()` - Works for both
- `clearAllActiveChats()` - Works for both
- `getActiveChat()` - Works for both

### 3. Chat Screen Integration

**Both use the same screen:**

- **Screen:** `src/screens/consulant/chat/Conversation.tsx` (ConsultantChatScreen)
- **Customers:** Navigate with `asCustomer: true`
- **Consultants:** Navigate with `asCustomer: false` (or omitted)

**Active chat integration:**

- ✅ Sets active chat when screen opens (both roles)
- ✅ Clears active chat when screen closes (both roles)
- Uses `consultationId` from route params (works for both)

**Code:** `src/screens/consulant/chat/Conversation.tsx` → Lines 93-109

### 4. Notification Navigation

**Fixed to handle both roles:**

- Detects user role from `useAuth()` hook
- Sets `asCustomer` flag correctly:
  - `asCustomer: true` for customers
  - `asCustomer: false` for consultants

**Code:** `src/components/notifications/NotificationHandler.tsx`

- Uses `user?.role === 'consultant'` to determine role
- Navigation respects user role

### 5. App Background Handling

**Works for both roles:**

- Clears all active chats when app goes to background
- Uses `userData.id` (same for both roles)

**Code:** `src/components/notifications/NotificationHandler.tsx` → Lines 118-125

## Navigation Flow

### Customer Flow:

1. Customer logs in → FCM token saved to `users/{customerId}/fcmTokens/{deviceId}`
2. Customer opens chat → Active chat set in `user_active_chats/{customerId}/activeChats/{consultationId}`
3. Customer receives notification → Navigates with `asCustomer: true`
4. Customer closes chat → Active chat cleared
5. App goes to background → All active chats cleared

### Consultant Flow:

1. Consultant logs in → FCM token saved to `users/{consultantId}/fcmTokens/{deviceId}`
2. Consultant opens chat → Active chat set in `user_active_chats/{consultantId}/activeChats/{consultationId}`
3. Consultant receives notification → Navigates with `asCustomer: false`
4. Consultant closes chat → Active chat cleared
5. App goes to background → All active chats cleared

## Verification Checklist

- ✅ FCM token storage works for customers
- ✅ FCM token storage works for consultants
- ✅ Active chat tracking works for customers
- ✅ Active chat tracking works for consultants
- ✅ Chat screen sets/clears active chat for customers
- ✅ Chat screen sets/clears active chat for consultants
- ✅ Notification navigation works for customers
- ✅ Notification navigation works for consultants
- ✅ App background clears active chats for customers
- ✅ App background clears active chats for consultants

## Key Points

1. **Same Implementation:** Both roles use the same code paths
2. **Role Detection:** Only needed for navigation (`asCustomer` flag)
3. **Firestore Structure:** Same structure for both roles (uses `userId`)
4. **No Duplication:** Single implementation handles both cases

## Testing

### Test as Customer:

1. Log in as customer
2. Open chat → Check Firestore: `user_active_chats/{customerId}/activeChats/{consultationId}`
3. Receive notification → Verify navigation with `asCustomer: true`
4. Close chat → Verify active chat cleared

### Test as Consultant:

1. Log in as consultant
2. Open chat → Check Firestore: `user_active_chats/{consultantId}/activeChats/{consultationId}`
3. Receive notification → Verify navigation with `asCustomer: false`
4. Close chat → Verify active chat cleared

Both flows are identical except for the `asCustomer` flag in navigation.
