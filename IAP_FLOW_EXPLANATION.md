# IAP Purchase Flow - How Functions Connect

## 🔗 The Connection: Event Listener Pattern

The functions are connected through an **event listener pattern** set up by `react-native-iap`. Here's how it works:

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. COMPONENT MOUNTS                                              │
│    useEffect() runs (lines 420-578)                              │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Sets up purchaseUpdatedListener (line 477-480)        │    │
│    │                                                       │    │
│    │ purchaseUpdatedListener(async (purchase) => {        │    │
│    │   await handlePurchaseUpdate(purchase);  ←───┐       │    │
│    │ });                                          │       │    │
│    └──────────────────────────────────────────────┘       │    │
│                                                             │    │
│    This listener is REGISTERED with the native module      │    │
│    It waits for purchase events from Google Play/App Store │    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Listener is now active and waiting
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. USER CLICKS SUBSCRIBE BUTTON                                 │
│    handleSubscribe() is called (lines 60-237)                   │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ • Validates productId                                │    │
│    │ • Fetches subscriptions                              │    │
│    │ • Calls requestPurchase(purchaseParams)  ←───┐        │    │
│    └──────────────────────────────────────────────┘        │    │
│                                                             │    │
│    requestPurchase() triggers the NATIVE payment dialog    │    │
│    (Google Play or App Store payment screen)               │    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ User completes payment
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. NATIVE MODULE (Google Play/App Store)                        │
│    • Processes the payment                                      │
│    • When payment completes, it EMITS AN EVENT                 │
│    • This event contains the purchase data                      │
│                                                                  │
│    The native module automatically calls the registered         │
│    purchaseUpdatedListener with the purchase data               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Event is emitted
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. LISTENER CATCHES THE EVENT                                    │
│    purchaseUpdatedListener receives the purchase event           │
│    (line 477-480)                                                │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ purchaseUpdatedListener(async (purchase) => {        │    │
│    │   await handlePurchaseUpdate(purchase);  ←───┐       │    │
│    │ });                                          │       │    │
│    └──────────────────────────────────────────────┘       │    │
│                                                             │    │
│    This is AUTOMATIC - you don't call it manually!         │    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Automatically calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. handlePurchaseUpdate() RUNS                                   │
│    (lines 241-417)                                               │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ • Validates purchase is successful                   │    │
│    │ • Extracts purchase data                             │    │
│    │ • Prepares purchaseDataForBackend                    │    │
│    │ • Calls sendPurchaseToBackend()  ←───┐               │    │
│    └──────────────────────────────────────┘               │    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. sendPurchaseToBackend() RUNS                                 │
│    (lines 581-643)                                               │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ • Gets auth token                                    │    │
│    │ • Sends POST to /api/subscriptions/verify-purchase   │    │
│    │ • Returns verification result                         │    │
│    └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Returns to handlePurchaseUpdate
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. BACKEND VERIFICATION COMPLETE                                │
│    handlePurchaseUpdate() continues:                             │
│    • Calls finishTransaction() (required by react-native-iap)   │
│    • Shows success alert                                         │
│    • Closes modal                                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔑 Key Points

### 1. **Event Listener Setup (useEffect)**

- When the component mounts, `useEffect` runs
- It sets up `purchaseUpdatedListener` which is registered with the native IAP module
- This listener **waits** for events from Google Play/App Store
- **You don't call `handlePurchaseUpdate` directly** - the listener does it automatically

### 2. **Purchase Initiation (handleSubscribe)**

- When user clicks subscribe, `handleSubscribe()` runs
- It calls `requestPurchase()` which opens the native payment dialog
- **After calling `requestPurchase()`, the function returns**
- The native module handles the payment asynchronously

### 3. **Event Emission (Native Module)**

- When payment completes, the native module (Google Play/App Store) emits an event
- This happens **automatically** - you don't control it
- The event contains all the purchase data (transactionId, purchaseToken, etc.)

### 4. **Event Reception (Listener)**

- The `purchaseUpdatedListener` you set up **catches** this event
- It automatically calls `handlePurchaseUpdate(purchase)` with the purchase data
- This is why `handlePurchaseUpdate` runs even though you never called it directly

### 5. **Backend Verification (sendPurchaseToBackend)**

- `handlePurchaseUpdate` calls `sendPurchaseToBackend` to verify the purchase
- This sends the purchase data to your backend API

## 🎯 Why This Pattern?

This is an **event-driven architecture**:

- **Asynchronous**: Payment happens in the native module (separate process)
- **Non-blocking**: Your JavaScript code doesn't wait for payment
- **Event-based**: Native module notifies you when payment completes
- **Reliable**: Works even if the app is backgrounded during payment

## 📝 Code Locations

| Function                        | Location      | When It Runs                         |
| ------------------------------- | ------------- | ------------------------------------ |
| `useEffect`                     | Lines 420-578 | Component mounts                     |
| `purchaseUpdatedListener` setup | Lines 477-480 | Component mounts                     |
| `handleSubscribe`               | Lines 60-237  | User clicks subscribe                |
| `requestPurchase`               | Line 200      | Called by handleSubscribe            |
| `handlePurchaseUpdate`          | Lines 241-417 | **Automatically called by listener** |
| `sendPurchaseToBackend`         | Lines 581-643 | Called by handlePurchaseUpdate       |

## 🔍 Console Logs to Watch

When you test, you'll see logs in this order:

1. `[SubscriptionModal] 🚀 INITIATING PURCHASE` - handleSubscribe starts
2. `[SubscriptionModal] ✅ requestPurchase() CALLED SUCCESSFULLY` - Payment dialog opened
3. `[SubscriptionModal] 🎯 PURCHASE EVENT RECEIVED!` - Listener caught the event
4. `[SubscriptionModal] 📥 handlePurchaseUpdate() CALLED` - Your handler runs
5. `[SubscriptionModal] 🔄 CALLING sendPurchaseToBackend()` - Backend verification starts
6. `[SubscriptionModal] ✅ BACKEND VERIFICATION COMPLETE` - Verification done

## ❓ Common Questions

**Q: Why doesn't `handlePurchaseUpdate` run immediately after `requestPurchase`?**
A: Because `requestPurchase` only **initiates** the payment. The actual payment happens in the native module (Google Play/App Store), which takes time. The listener waits for the native module to emit the completion event.

**Q: What if the user cancels the payment?**
A: The `purchaseErrorListener` (set up in the same useEffect) will catch the cancellation and handle it separately.

**Q: Can I call `handlePurchaseUpdate` directly?**
A: Technically yes, but you shouldn't. The listener pattern ensures you get the correct purchase data from the native module. If you call it manually, you won't have the real purchase data.

**Q: What if the app is closed during payment?**
A: The native module will still emit the event when payment completes. When the app reopens, `react-native-iap` can restore pending purchases, and your listener will catch them.
