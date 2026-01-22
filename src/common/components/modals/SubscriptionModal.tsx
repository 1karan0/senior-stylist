import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Alert, Platform, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { purchaseUpdatedListener, purchaseErrorListener, initConnection } from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import InfoModal from '@/common/components/modals/InfoModal';
import { Linking } from 'react-native';
import Button from '@/common/components/Button';

interface SubscriptionModalProps {
  plan: {
    key: string;
    title: string;
    price: string;
    priceSub: string;
    desc: string;
    features: string[];
    consulationPerMonth: number;
    originalPlan: {
      id: number;
      apple_product_id: string;
      google_product_id: string;
      base_plan_product_id?: string | null; // Google Play base plan ID (from API: base_plan_product_id)
      offer_plan_id?: string | null; // Google Play offer ID for discounted/introductory offers
      plan_type?: 'base' | 'sub';
      stripe_product_id: string | null;
    };
  } | null;
  onClose?: () => void;
}

export default function SubscriptionModal({ plan, onClose }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isSyncingWithStore, setIsSyncingWithStore] = useState(false);
  const [isUpgradeConfirmationPending, setIsUpgradeConfirmationPending] = useState(false);
  const [isUpgradeAppliedMessageVisible, setIsUpgradeAppliedMessageVisible] = useState(false);
  const [isVerifyingBackend, setIsVerifyingBackend] = useState(false);
  const [hasStorePurchaseCallback, setHasStorePurchaseCallback] = useState(false);
  const [awaitingProfileConfirmation, setAwaitingProfileConfirmation] = useState(false);
  const [showSubscriptionActiveModal, setShowSubscriptionActiveModal] = useState(false);
  const [verifiedPlanName, setVerifiedPlanName] = useState<string | null>(null);
  const [verifiedConsultationsAllowed, setVerifiedConsultationsAllowed] = useState<number | null>(
    null
  );
  const [iapInitialized, setIapInitialized] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);

  const { data: profileData, refetch: refetchProfile } = useGetProfile();
  const currentSubscription = profileData?.subscription ?? null;
  const processedPurchaseKeysRef = useRef<Set<string>>(new Set());
  const currentSubscriptionRef = useRef<any | null>(null);
  const upgradeRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baselineStorePlanIdRef = useRef<string | null>(null);
  const baselinePlanIdRef = useRef<number | null>(null);
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verificationActiveRef = useRef(false);

  useEffect(() => {
    currentSubscriptionRef.current = currentSubscription;
  }, [currentSubscription]);

  // 0) Snapshot baseline subscription when modal opens.
  // We do an explicit refetch on open so we compare against the freshest backend state.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await refetchProfile();
        if (!mounted) return;
        const sub = res.data?.subscription ?? null;
        baselineStorePlanIdRef.current = (sub?.store_plan_id as string | null) ?? null;
        baselinePlanIdRef.current =
          typeof sub?.plan_id === 'number'
            ? (sub.plan_id as number)
            : sub?.plan_id
              ? Number(sub.plan_id)
              : null;
      } catch {
        // If refetch fails, fall back to whatever is currently cached.
        const sub = currentSubscriptionRef.current;
        baselineStorePlanIdRef.current = sub?.store_plan_id ?? null;
        baselinePlanIdRef.current = sub?.plan_id ?? null;
      }
    })();

    return () => {
      mounted = false;
    };
    // Intentionally only on mount/open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (upgradeRedirectTimeoutRef.current) {
        clearTimeout(upgradeRedirectTimeoutRef.current);
        upgradeRedirectTimeoutRef.current = null;
      }
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
        verificationTimerRef.current = null;
      }
      verificationActiveRef.current = false;
    };
  }, []);

  // Subscription status is sourced from Profile API (no AsyncStorage subscription state).
  const BASE_PLAN_ORDER = ['base-plan-1', 'base-plan-2', 'base-plan-3'] as const;

  const handleSubscribe = useCallback(async () => {
    if (!iapInitialized) {
      Alert.alert('Payment Unavailable', iapError || 'Payment not available.');
      return;
    }

    if (!plan?.originalPlan) {
      Alert.alert('Error', 'Plan data missing.');
      return;
    }

    const productId =
      Platform.OS === 'ios'
        ? plan.originalPlan.apple_product_id
        : plan.originalPlan.google_product_id;

    if (!productId) {
      Alert.alert('Error', `Product ID missing for ${Platform.OS}`);
      return;
    }

    // Lock UI immediately
    setIsLoading(true);
    setIsProcessingPurchase(true);
    setAwaitingProfileConfirmation(true);
    setIsSyncingWithStore(true);

    try {
      // =====================================================
      // ======================= iOS =========================
      // =====================================================
      if (Platform.OS === 'ios') {
        console.log('ios in-app payment request');
        console.log('productId', productId);

        // Optional: fetch subscription metadata from App Store (v14+ API)
        const subscriptions = await RNIap.fetchProducts({
          skus: [productId],
          type: 'subs',
        });

        console.log('Found subscription:', subscriptions);

        await RNIap.requestPurchase({
          request: {
            ios: {
              sku: productId,
              andDangerouslyFinishTransactionAutomatically: false,
              appAccountToken: profileData?.user?.uuid,
            },
          },
          type: 'subs',
        });

        console.log('purchase request successful');

        // Keep button disabled - awaitingProfileConfirmation stays true until profile returns
        // Stop showing loading spinner but keep button disabled
        setIsLoading(false);
        setIsProcessingPurchase(false);
        setIsSyncingWithStore(false);

        return;
      }

      // =====================================================
      // ===================== ANDROID =======================
      // =====================================================

      const currentBasePlanId = profileData?.subscription?.store_plan_id ?? null;
      const currentPurchaseToken = profileData?.subscription?.purchase_token ?? null;

      const products = await RNIap.fetchProducts({
        skus: [productId],
        type: 'subs',
      });

      if (!products?.length) {
        throw new Error(`Product ${productId} not found on Google Play`);
      }

      const product: any = products[0];
      const offers =
        product.subscriptionOfferDetailsAndroid ||
        product.subscriptionOfferDetails ||
        product.subscriptionOffers;

      if (!offers?.length) {
        throw new Error(`No subscription offers found`);
      }

      const selectedBasePlanId = plan.originalPlan.base_plan_product_id as string;
      const matchingOffers = offers.filter((o: any) => o.basePlanId === selectedBasePlanId);

      if (!matchingOffers.length) {
        throw new Error(`No offer for basePlanId=${selectedBasePlanId}`);
      }

      const targetOffer =
        matchingOffers.find((o: any) => o.offerId === plan.originalPlan.offer_plan_id) ||
        matchingOffers[0];

      let purchaseTokenAndroid: string | undefined;
      let replacementModeAndroid: number | undefined;

      const currentIndex = currentBasePlanId
        ? BASE_PLAN_ORDER.indexOf(currentBasePlanId as any)
        : -1;

      const targetIndex = BASE_PLAN_ORDER.indexOf(selectedBasePlanId as any);

      if (currentPurchaseToken && currentIndex !== -1 && targetIndex !== currentIndex) {
        purchaseTokenAndroid = currentPurchaseToken;
        replacementModeAndroid = targetIndex > currentIndex ? 5 : 3;
      }

      await RNIap.requestPurchase({
        type: 'subs',
        request: {
          android: {
            skus: [productId],
            subscriptionOffers: [
              {
                sku: productId,
                offerToken: targetOffer.offerToken,
              },
            ],
            obfuscatedAccountId: profileData?.user?.uuid,
            ...(purchaseTokenAndroid && {
              purchaseTokenAndroid,
              replacementModeAndroid,
            }),
          },
        },
      });

      // Keep button disabled - awaitingProfileConfirmation stays true until profile returns
      // Stop showing loading spinner but keep button disabled
      setIsLoading(false);
      setIsProcessingPurchase(false);
      setIsSyncingWithStore(false);
    } catch (err: any) {
      console.error('Subscription error:', err);
      Alert.alert('Error', err.message || 'Unable to process subscription.');
      setAwaitingProfileConfirmation(false);
      setIsProcessingPurchase(false);
      setIsSyncingWithStore(false);
    } finally {
      setIsLoading(false);
    }
  }, [plan, iapInitialized, iapError, profileData]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: RNIap.Purchase) => {
      console.log('purchase update callback 2');
      console.log('purchase', purchase);
      // Store delivered a callback → stop "syncing with store" and begin backend verification.
      setIsSyncingWithStore(false);
      setHasStorePurchaseCallback(true);

      console.log('purchase 1');

      const purchaseAny = purchase as any;
      console.log('purchaseAny', purchaseAny);
      const toPlanIdNumber = (v: unknown): number | null => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim()) {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      };

      console.log('purchase 2');

      // Minimal success guard: don't start backend verification for pending/failed callbacks.
      const isPendingPurchase = (() => {
        if (Platform.OS !== 'android') return false;
        const n =
          typeof purchaseAny.purchaseStateAndroid === 'number'
            ? purchaseAny.purchaseStateAndroid
            : null;
        const s =
          typeof purchaseAny.purchaseState === 'string'
            ? purchaseAny.purchaseState.toLowerCase()
            : null;
        return n === 2 || s === 'pending';
      })();
      if (isPendingPurchase) return;

      console.log('purchase 3');

      const isSuccessfulPurchase = (() => {
        if (Platform.OS === 'android') {
          const n =
            typeof purchaseAny.purchaseStateAndroid === 'number'
              ? purchaseAny.purchaseStateAndroid
              : null;
          const s =
            typeof purchaseAny.purchaseState === 'string'
              ? purchaseAny.purchaseState.toLowerCase()
              : null;
          return n === 1 || s === 'purchased' || !!purchaseAny.purchaseToken;
        }
        // iOS: purchased/restored or receipt present
        return (
          purchaseAny.transactionStateIOS === 1 ||
          purchaseAny.transactionStateIOS === 3 ||
          !!purchaseAny.transactionReceipt
        );
      })();
      if (!isSuccessfulPurchase) {
        setAwaitingProfileConfirmation(false);
        setIsProcessingPurchase(false);
        return;
      }

      // Start backend verification flow: we'll keep UI in "Verifying purchase..." until Profile API reflects the change.
      // This makes sure base_plan_id/store_plan_id has actually changed on the backend (source of truth).
      const startBackendVerification = async () => {
        console.log('startBackendVerification');
        if (verificationTimerRef.current) {
          clearTimeout(verificationTimerRef.current);
          verificationTimerRef.current = null;
        }
        verificationActiveRef.current = true;
        setIsVerifyingBackend(true);

        const startedAt = Date.now();
        const timeoutMs = 90_000;
        const pollEveryMs = 2_500;

        const tick = async () => {
          console.log('tick');
          if (!verificationActiveRef.current) return;

          // Timeout guard
          if (Date.now() - startedAt > timeoutMs) {
            verificationActiveRef.current = false;
            setIsVerifyingBackend(false);
            // If backend hasn't confirmed in time, release processing so user can retry.
            setAwaitingProfileConfirmation(false);
            setIsProcessingPurchase(false);
            return;
          }

          try {
            const res = await refetchProfile();
            const sub = res.data?.subscription ?? null;

            console.log('sub======>', sub);

            const newStorePlanId = (sub?.store_plan_id as string | null) ?? null;
            const newPlanId = toPlanIdNumber(sub?.plan_id);

            const baselineStorePlanId = baselineStorePlanIdRef.current;
            const baselinePlanId = baselinePlanIdRef.current;

            const isActiveNow = !!sub && (sub.status === 'active' || sub.is_active === true);

            // Only finish verification when backend shows the TARGET plan as active.
            // This guarantees UI is strictly: Processing... -> Current Plan (no intermediate "Switch Plan").
            const targetPlanId = plan?.originalPlan?.id ?? null;
            const targetStorePlanId =
              (plan?.originalPlan?.base_plan_product_id as string | null) ?? null;
            const matchesTargetPlan =
              (targetPlanId !== null && newPlanId !== null && newPlanId === Number(targetPlanId)) ||
              (targetStorePlanId !== null &&
                newStorePlanId !== null &&
                newStorePlanId === targetStorePlanId);

            const storePlanChanged =
              (baselineStorePlanId === null && newStorePlanId !== null) ||
              (baselineStorePlanId !== null &&
                newStorePlanId !== null &&
                newStorePlanId !== baselineStorePlanId);
            const planChanged =
              (baselinePlanId === null && newPlanId !== null) ||
              (baselinePlanId !== null && newPlanId !== null && newPlanId !== baselinePlanId);

            if (isActiveNow && matchesTargetPlan && (storePlanChanged || planChanged)) {
              // ✅ FINISH APPLE TRANSACTION HERE (AFTER BACKEND CONFIRMATION)
              if (Platform.OS === 'ios' && purchase) {
                try {
                  await RNIap.finishTransaction({
                    purchase,
                    isConsumable: false, // subscriptions are non-consumable
                  });
                } catch (e) {
                  console.warn('[IAP] finishTransaction (iOS) failed:', e);
                  // Do NOT block UI if this fails
                }
              }
              // Update baselines so we don't re-trigger
              baselineStorePlanIdRef.current = newStorePlanId;
              baselinePlanIdRef.current = newPlanId;

              verificationActiveRef.current = false;
              setIsVerifyingBackend(false);
              // Release "Processing..." so the button can render "Current Plan"
              setAwaitingProfileConfirmation(false);
              setIsProcessingPurchase(false);
              setVerifiedPlanName(sub?.plan_name || sub?.plan_slug || 'Your plan');
              setVerifiedConsultationsAllowed(
                typeof sub?.consultations_allowed === 'number' ? sub.consultations_allowed : null
              );
              setShowSubscriptionActiveModal(true);
              return;
            }
          } catch {
            // Ignore transient polling errors
          }

          verificationTimerRef.current = setTimeout(tick, pollEveryMs);
        };

        // Run immediately
        await tick();
      };

      // De-dupe: purchaseUpdatedListener can fire multiple times for the same transaction.
      // Prefer the platform-specific unique identifier.
      const dedupeKey =
        Platform.OS === 'android'
          ? String(purchaseAny.purchaseToken || purchaseAny.orderId || purchase.transactionId || '')
          : String(
              purchaseAny.originalTransactionIdentifierIOS ||
                purchaseAny.transactionId ||
                purchase.transactionId ||
                ''
            );
      if (dedupeKey && processedPurchaseKeysRef.current.has(dedupeKey)) {
        // Keep processing UI — we may already be verifying backend.
        return;
      }
      if (dedupeKey) processedPurchaseKeysRef.current.add(dedupeKey);

      // Start verifying against backend now that we have a successful store callback.
      await startBackendVerification();
    },
    [refetchProfile]
  );
  // 1. Preparation: Initialize IAP and set up listeners
  useEffect(() => {
    // ============================================
    // REAL IAP INITIALIZATION CODE - ACTIVE FOR GOOGLE PLAY TESTING
    // ============================================
    let purchaseUpdateSubscription: any = null;
    let purchaseErrorSubscription: any = null;
    let isMounted = true;

    const initializeIAP = async () => {
      try {
        // 1. Correct Initialization
        await initConnection();

        if (!isMounted) return;

        // =====================================================
        // NEW: FINISH PENDING TRANSACTIONS (CRITICAL FOR iOS)
        // =====================================================
        try {
          if (Platform.OS === 'ios') {
            // This clears the queue of any stuck/processed payments
            const pending = await RNIap.getPendingTransactionsIOS();
            if (pending.length) {
              await RNIap.clearTransactionIOS();
            }
          }
        } catch (err) {
          console.warn('[SubscriptionModal] Failed to clear stale transactions:', err);
        }

        // 2. Clear pending transactions (Android)
        // Using type assertion as this method might not be in TypeScript definitions
        if (Platform.OS === 'android') {
          try {
            if ((RNIap as any).flushFailedPurchasesCachedAsPendingAndroid) {
              await (RNIap as any).flushFailedPurchasesCachedAsPendingAndroid();
            }
          } catch {
            // Ignore flush errors - not critical
            console.warn('[SubscriptionModal] Flush failed, continuing...');
          }
        }

        // 3. Setup Listeners

        if (!isMounted) return;

        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: RNIap.Purchase) => {
          console.log('purchase data', purchase);
          await handlePurchaseUpdate(purchase);
        });
        console.log('[SubscriptionModal] ✅ Purchase update listener established and listening');

        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
          const code = error?.code;
          const message: string = String(error?.message || '');

          const resetPurchaseUi = () => {
            setIsLoading(false);
            setIsProcessingPurchase(false);
            setIsSyncingWithStore(false);
            setAwaitingProfileConfirmation(false);
            setIsVerifyingBackend(false);
            setHasStorePurchaseCallback(false);
            setIsUpgradeConfirmationPending(false);
            setIsUpgradeAppliedMessageVisible(false);
          };

          // User cancellation is expected.
          if (
            code === 'user-cancelled' ||
            code === 'E_USER_CANCELLED' ||
            code === 'E_USER_CANCELED'
          ) {
            resetPurchaseUi();
            return;
          }

          // "Already owned" / "Already subscribed" should stop spinners and let UI reflect current plan.
          // Different stores/versions can use different codes/messages, so we check both.
          const isAlreadyOwned =
            code === 'E_ALREADY_OWNED' ||
            code === 'E_ITEM_ALREADY_OWNED' ||
            code === 'itemAlreadyOwned' ||
            /already owned|already subscribed|item is already owned/i.test(message);

          if (isAlreadyOwned) {
            console.warn('[SubscriptionModal] Item already owned:', { code, message });
            resetPurchaseUi();
            // Refresh backend state so the modal can show "Current Plan" if subscription is active.
            refetchProfile?.();
            Alert.alert(
              'Already Subscribed',
              'This subscription is already active on your account.'
            );
            return;
          }

          console.error('[SubscriptionModal] Purchase error from listener:', error);
          resetPurchaseUi();

          const errorMessage = error?.message || 'An error occurred during purchase';
          Alert.alert('Purchase Error', errorMessage);
        });

        if (!isMounted) return;

        setIapInitialized(true);
        setIapError(null);
      } catch (error: unknown) {
        console.error('[SubscriptionModal] IAP initialization failed:', error);
        if (!isMounted) return;
        setIapInitialized(false);
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        setIapError(errorMessage);
      }
    };

    initializeIAP();

    return () => {
      isMounted = false;
      if (purchaseUpdateSubscription?.remove) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription?.remove) {
        purchaseErrorSubscription.remove();
      }
    };
  }, [plan, handlePurchaseUpdate]);

  // Handle modal close with purchase in progress warning
  const handleClose = () => {
    // IMPORTANT: Do not allow closing while purchase/verification is in progress.
    // Closing mid-flow can break Google Play/App Store purchase listeners and leave transactions unverified.
    if (
      isProcessingPurchase ||
      isSyncingWithStore ||
      isUpgradeConfirmationPending ||
      isUpgradeAppliedMessageVisible ||
      isVerifyingBackend ||
      isLoading
    ) {
      Alert.alert(
        'Purchase in Progress',
        'Please wait while we confirm your payment. Do not close this screen.'
      );
      return;
    }

    onClose?.();
  };

  if (!plan) return null;

  // Check if current plan matches selected plan (same condition for both disabled state and button text)
  const isCurrentPlan =
    currentSubscription?.plan_id === plan.originalPlan.id &&
    (currentSubscription.status === 'active' || currentSubscription.is_active);

  // Button should be disabled when:
  // - Awaiting profile confirmation (from the moment handleSubscribe is clicked until profile returns)
  // - Verifying backend (after purchase completes)
  // - Upgrade message is visible
  // - IAP not initialized
  // - It's the current plan
  const isSubscribeDisabled =
    awaitingProfileConfirmation ||
    isVerifyingBackend ||
    isUpgradeAppliedMessageVisible ||
    !iapInitialized ||
    isCurrentPlan;

  // Button shows loading spinner when:
  // - Verifying backend (after purchase completes)
  // - Awaiting profile confirmation after purchase callback
  const isSubscribeLoading =
    isVerifyingBackend || (awaitingProfileConfirmation && hasStorePurchaseCallback);

  // Button text logic:
  // 1. If it's the current plan -> "Current Plan"
  // 2. If awaiting profile confirmation or verifying backend -> "Verifying the purchase"
  // 3. Otherwise -> "Subscribe"
  const subscribeButtonText = isCurrentPlan
    ? 'Current Plan'
    : awaitingProfileConfirmation || isVerifyingBackend
      ? 'Verifying the purchase'
      : 'Subscribe';

  return (
    <View className="absolute inset-0 bg-black/80 items-center justify-center px-6">
      <View className="bg-white w-full rounded-md p-7 max-w-md">
        {/* CLOSE BUTTON */}
        <Button
          variant="light"
          onPress={handleClose}
          disabled={
            isProcessingPurchase ||
            isSyncingWithStore ||
            isUpgradeConfirmationPending ||
            isUpgradeAppliedMessageVisible ||
            isLoading
          }
          icon={<Ionicons name="close" size={28} color="#6B7280" />}
          className="absolute right-4 top-4 z-10 bg-transparent p-0"
        />

        {/* PLAN TITLE */}
        <Text className="text-[22px] font-bold text-textPrimary mb-2">{plan.title}</Text>

        {/* PRICES */}
        <View className="flex-row items-center gap-0">
          <Text className="text-[#162721] font-medium text-[22px]">{plan.price}</Text>
          <Text className="text-[#658176] font-medium text-[16px]">/</Text>
          <Text className="text-[#658176] font-medium text-[16px]">Monthly</Text>
          <Text className="text-[#658176] font-medium text-[14px] ml-1">
            {`- ${plan.consulationPerMonth} consultations`}
          </Text>
        </View>

        {/* DESCRIPTION */}
        <Text className="text-textMuted mt-1 mb-4">{plan.desc}</Text>

        {/* FEATURES */}
        <View className="mb-6">
          {plan.features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <Text className="text-[#23A76F] mr-2">✓</Text>
              <Text className="text-textDark">{feature}</Text>
            </View>
          ))}
        </View>

        {/* IAP Error Indicator */}
        {!iapInitialized && iapError && (
          <View className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="warning" size={20} color="#D97706" className="mr-2" />
              <Text className="text-yellow-800 font-semibold">Payment System Unavailable</Text>
            </View>
            <Text className="text-yellow-700 text-xs mt-1">
              {Platform.OS === 'android'
                ? 'Google Play Services is required. Use a device with Google Play or a properly configured emulator.'
                : 'App Store is required. Use a physical device or TestFlight.'}
            </Text>
          </View>
        )}

        {/* Purchase/Upgrade/Verification Status Indicator */}
        {isUpgradeAppliedMessageVisible ? (
          <View className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
              <Text className="text-green-700 font-medium">
                Upgrade requested. It will be applied shortly.
              </Text>
            </View>
          </View>
        ) : isSyncingWithStore ? (
          <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
              <Text className="text-blue-700 font-medium">
                Syncing with {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'}...
              </Text>
            </View>
          </View>
        ) : isUpgradeConfirmationPending ? (
          <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
              <Text className="text-blue-700 font-medium">
                Upgrade requested. We'll apply it as soon as Google confirms.
              </Text>
            </View>
          </View>
        ) : awaitingProfileConfirmation && hasStorePurchaseCallback ? (
          <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
              <Text className="text-blue-700 font-medium">Verifying purchase...</Text>
            </View>
            <Text className="text-blue-600 text-sm mt-1">
              Waiting for confirmation from our server. Please don’t close this screen.
            </Text>
          </View>
        ) : isVerifyingBackend ? (
          <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
              <Text className="text-blue-700 font-medium">Verifying purchase...</Text>
            </View>
            <Text className="text-blue-600 text-sm mt-1">
              Waiting for confirmation from our server. Please don’t close this screen.
            </Text>
          </View>
        ) : (
          isProcessingPurchase && (
            <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
                <Text className="text-blue-700 font-medium">Processing your purchase...</Text>
              </View>
              <Text className="text-blue-600 text-sm mt-1">
                Please wait while we confirm your payment.
              </Text>
            </View>
          )
        )}

        {/* Current Subscription Info (hide while verifying purchase) */}
        {currentSubscription &&
          (currentSubscription.status === 'active' || currentSubscription.is_active) &&
          !awaitingProfileConfirmation &&
          !isVerifyingBackend && (
            <View className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <View className="flex-row items-center mb-1">
                <Ionicons name="information-circle" size={20} color="#D97706" className="mr-2" />
                <Text className="text-yellow-800 font-semibold">Active Subscription</Text>
              </View>
              <Text className="text-yellow-700 text-xs mt-1">
                You currently have an active {currentSubscription.plan_name || 'subscription'}.
                {currentSubscription.plan_id !== plan.originalPlan.id
                  ? ' Switching plans will cancel your current subscription.'
                  : ' This is the same plan you already have.'}
              </Text>
            </View>
          )}

        <InfoModal
          visible={showSubscriptionActiveModal}
          title="Subscription Active"
          message={
            verifiedPlanName
              ? `Your subscription is now active: ${verifiedPlanName}${
                  verifiedConsultationsAllowed !== null
                    ? ` (${verifiedConsultationsAllowed} consultations/month)`
                    : ''
                }.`
              : 'Your subscription has been activated successfully.'
          }
          variant="success"
          onConfirm={() => {
            setShowSubscriptionActiveModal(false);
            setHasStorePurchaseCallback(false);
            onClose?.();
          }}
          onClose={() => {
            setShowSubscriptionActiveModal(false);
            setHasStorePurchaseCallback(false);
            onClose?.();
          }}
        />

        {/* Payment Terms and Subscription Info */}
        <View className="mt-4 pt-4 border-t border-gray-100">
          {Platform.OS === 'ios' ? (
            <>
              <Text className="text-center text-gray-500 text-xs mb-2">
                Payment will be charged to your Apple ID account at confirmation of purchase.
              </Text>
              <Text className="text-center text-gray-500 text-xs mb-2">
                Subscription automatically renews unless cancelled at least 24 hours before the end
                of the current period.
              </Text>
              <Text className="text-center text-gray-500 text-xs mb-2">
                Your account will be charged for renewal within 24 hours prior to the end of the
                current period.
              </Text>
              <Text className="text-center text-gray-500 text-xs">
                You can manage or cancel your subscription in your App Store account settings.
              </Text>
            </>
          ) : (
            <>
              <Text className="text-center text-gray-500 text-xs mb-2">
                Payment will be processed through Google Play Store
              </Text>
              <Text className="text-center text-gray-500 text-xs mb-3">
                Subscription automatically renews monthly unless cancelled at least 24 hours before
                the end of the current period.
              </Text>
            </>
          )}
          <View className="flex-row justify-center items-center gap-2 my-2">
            <Pressable
              onPress={() => {
                Linking.openURL('https://senior-stylist.com/terms-conditions').catch((err) =>
                  console.error('Failed to open Terms & Conditions:', err)
                );
              }}
            >
              <Text className="text-gray-500 text-xs underline">Terms of Use</Text>
            </Pressable>
            <Text className="text-gray-500 text-xs">|</Text>
            <Pressable
              onPress={() => {
                Linking.openURL('https://senior-stylist.com/privacy-policy').catch((err) =>
                  console.error('Failed to open Privacy Policy:', err)
                );
              }}
            >
              <Text className="text-gray-500 text-xs underline">Privacy Policy</Text>
            </Pressable>
          </View>
        </View>

        {/* SUBSCRIBE BUTTON */}
        <Button
          text={subscribeButtonText}
          onPress={handleSubscribe}
          variant="gradient"
          disabled={isSubscribeDisabled}
          loading={isSubscribeLoading}
          className="mt-5 rounded-xl"
          textClassName="text-[16px]"
        />
      </View>
    </View>
  );
}
