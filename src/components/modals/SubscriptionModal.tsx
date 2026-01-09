import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  purchaseUpdatedListener,
  purchaseErrorListener,
  initConnection,
  MutationRequestPurchaseArgs,
} from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { storage, type PendingPurchaseVerification } from '@/services/storage';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useQueryClient } from '@tanstack/react-query';
import InfoModal from '@/common/components/modals/InfoModal';

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

    setIsLoading(true);

    try {
      // ---------------------------------------------------------
      // 1. Current subscription from BACKEND (source of truth)
      // ---------------------------------------------------------

      const currentBasePlanId = profileData?.subscription?.store_plan_id ?? null;

      const currentPurchaseToken = profileData?.subscription?.purchase_token ?? null;

      // ---------------------------------------------------------
      // 2. Fetch product + offers from Play
      // ---------------------------------------------------------

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
        throw new Error(`No subscription offers found for ${productId}`);
      }

      // ---------------------------------------------------------
      // 3. Resolve selected base plan + offer
      // ---------------------------------------------------------

      const selectedBasePlanId = plan.originalPlan.base_plan_product_id as string;

      const matchingOffers = offers.filter((o: any) => o.basePlanId === selectedBasePlanId);

      if (!matchingOffers.length) {
        throw new Error(`No offer found for basePlanId=${selectedBasePlanId}`);
      }

      const selectedOfferId = plan.originalPlan.offer_plan_id;

      const targetOffer =
        matchingOffers.find((o: any) => o.offerId === selectedOfferId) || matchingOffers[0];

      if (!targetOffer?.offerToken) {
        throw new Error(`OfferToken missing for ${selectedBasePlanId}`);
      }

      // ---------------------------------------------------------
      // 4. Decide: INITIAL / UPGRADE / DOWNGRADE / NO_CHANGE
      // ---------------------------------------------------------

      const currentIndex = currentBasePlanId
        ? BASE_PLAN_ORDER.indexOf(currentBasePlanId as any)
        : -1;

      const targetIndex = BASE_PLAN_ORDER.indexOf(selectedBasePlanId as any);

      let planChange: 'INITIAL' | 'UPGRADE' | 'DOWNGRADE' | 'NO_CHANGE' = 'INITIAL';

      if (currentIndex === -1) {
        planChange = 'INITIAL';
      } else if (targetIndex > currentIndex) {
        planChange = 'UPGRADE';
      } else if (targetIndex < currentIndex) {
        planChange = 'DOWNGRADE';
      } else {
        planChange = 'NO_CHANGE';
      }

      // ---------------------------------------------------------
      // 5. Replacement params (only when needed)
      // ---------------------------------------------------------

      let purchaseTokenAndroid: string | undefined;
      let replacementModeAndroid: number | undefined;

      if ((planChange === 'UPGRADE' || planChange === 'DOWNGRADE') && currentPurchaseToken) {
        purchaseTokenAndroid = currentPurchaseToken;

        replacementModeAndroid =
          planChange === 'UPGRADE'
            ? 5 // CHARGE_FULL_PRICE
            : 3; // WITH_TIME_PRORATION
      }

      // ---------------------------------------------------------
      // 6. Build purchase request
      // ---------------------------------------------------------

      const requestObj: any = {
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
            obfuscatedAccountIdAndroid: profileData?.user?.uuid,

            ...(purchaseTokenAndroid && {
              purchaseTokenAndroid,
              replacementModeAndroid,
            }),
          },
        },
      };

      await RNIap.requestPurchase(requestObj);
    } catch (err: any) {
      console.error('Subscription error:', err);
      Alert.alert('Error', err.message || 'Unable to process subscription.');
    } finally {
      setIsLoading(false);
    }
  }, [plan, iapInitialized, iapError, profileData]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: RNIap.Purchase) => {
      // Ensure we don't show "syncing" once the store has delivered a purchase callback.
      setIsSyncingWithStore(false);
      const currentSub = currentSubscriptionRef.current;
      // Determine purchase scenario for logging

      // Log Android-specific properties
      const purchaseAny = purchase as any;
      // 1. Determine Success State correctly for v14
      // Using type assertion to access platform-specific properties (purchaseAny already declared above)
      let isPurchaseSuccessful = false;

      // Start backend verification flow: we'll keep UI in "Verifying purchase..." until Profile API reflects the change.
      // This makes sure base_plan_id/store_plan_id has actually changed on the backend (source of truth).
      const startBackendVerification = async () => {
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
          if (!verificationActiveRef.current) return;

          // Timeout guard
          if (Date.now() - startedAt > timeoutMs) {
            verificationActiveRef.current = false;
            setIsVerifyingBackend(false);
            return;
          }

          try {
            const res = await refetchProfile();
            const sub = res.data?.subscription ?? null;

            const newStorePlanId = (sub?.store_plan_id as string | null) ?? null;
            const newPlanId =
              typeof sub?.plan_id === 'number'
                ? (sub.plan_id as number)
                : sub?.plan_id
                  ? Number(sub.plan_id)
                  : null;

            const baselineStorePlanId = baselineStorePlanIdRef.current;
            const baselinePlanId = baselinePlanIdRef.current;

            const isActiveNow = !!sub && (sub.status === 'active' || sub.is_active === true);
            const storePlanChanged =
              (baselineStorePlanId === null && newStorePlanId !== null) ||
              (baselineStorePlanId !== null &&
                newStorePlanId !== null &&
                newStorePlanId !== baselineStorePlanId);
            const planChanged =
              (baselinePlanId === null && newPlanId !== null) ||
              (baselinePlanId !== null && newPlanId !== null && newPlanId !== baselinePlanId);

            if (isActiveNow && (storePlanChanged || planChanged)) {
              // Update baselines so we don't re-trigger
              baselineStorePlanIdRef.current = newStorePlanId;
              baselinePlanIdRef.current = newPlanId;

              verificationActiveRef.current = false;
              setIsVerifyingBackend(false);
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
        console.log('[SubscriptionModal] Duplicate purchase update ignored', { dedupeKey });
        setIsProcessingPurchase(false);
        setIsLoading(false);
        return;
      }
      if (dedupeKey) processedPurchaseKeysRef.current.add(dedupeKey);
    },
    [plan, onClose]
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
          await handlePurchaseUpdate(purchase);
        });
        console.log('[SubscriptionModal] ✅ Purchase update listener established and listening');

        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
          const code = error?.code;
          // User cancellation is expected.
          if (
            code === 'user-cancelled' ||
            code === 'E_USER_CANCELLED' ||
            code === 'E_USER_CANCELED'
          ) {
            setIsLoading(false);
            setIsProcessingPurchase(false);
            return;
          }

          console.error('[SubscriptionModal] Purchase error from listener:', error);
          setIsLoading(false);
          setIsProcessingPurchase(false);

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

  return (
    <View className="absolute inset-0 bg-black/80 items-center justify-center px-6">
      <View className="bg-white w-full rounded-md p-7 max-w-md">
        {/* CLOSE BUTTON */}
        <Pressable
          onPress={handleClose}
          className="absolute right-4 top-4 z-10"
          disabled={
            isProcessingPurchase ||
            isSyncingWithStore ||
            isUpgradeConfirmationPending ||
            isUpgradeAppliedMessageVisible ||
            isLoading
          }
        >
          <Ionicons name="close" size={28} color="#6B7280" />
        </Pressable>

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

        {/* Current Subscription Info */}
        {currentSubscription &&
          (currentSubscription.status === 'active' || currentSubscription.is_active) && (
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
              <Text className="text-blue-700 font-medium">Syncing with Play Store...</Text>
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

        {/* SUBSCRIBE BUTTON */}
        <Pressable
          onPress={handleSubscribe}
          disabled={
            isLoading ||
            isProcessingPurchase ||
            isSyncingWithStore ||
            isVerifyingBackend ||
            isUpgradeAppliedMessageVisible ||
            !iapInitialized ||
            (currentSubscription?.plan_id === plan.originalPlan.id &&
              (currentSubscription.status === 'active' || currentSubscription.is_active))
          }
          className={`mt-5 rounded-xl overflow-hidden ${
            isLoading ||
            isProcessingPurchase ||
            isSyncingWithStore ||
            isVerifyingBackend ||
            isUpgradeAppliedMessageVisible ||
            !iapInitialized ||
            (currentSubscription?.plan_id === plan.originalPlan.id &&
              (currentSubscription.status === 'active' || currentSubscription.is_active))
              ? 'opacity-70'
              : ''
          }`}
        >
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl items-center justify-center py-4"
          >
            {isLoading || isVerifyingBackend ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                <Text className="text-white text-[16px] font-semibold">
                  {isVerifyingBackend ? 'Verifying...' : 'Preparing...'}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-[16px] font-semibold">
                {isProcessingPurchase
                  ? 'Processing...'
                  : currentSubscription?.plan_id === plan.originalPlan.id &&
                      currentSubscription.status === 'active'
                    ? 'Current Plan'
                    : currentSubscription && currentSubscription.status === 'active'
                      ? 'Switch Plan'
                      : 'Subscribe'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

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
            onClose?.();
          }}
          onClose={() => {
            setShowSubscriptionActiveModal(false);
            onClose?.();
          }}
        />

        {/* Platform Info */}
        <View className="mt-4 pt-4 border-t border-gray-100">
          <Text className="text-center text-gray-500 text-xs">
            Payment will be processed through{' '}
            <Text className="font-semibold">
              {Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store'}
            </Text>
          </Text>
          <Text className="text-center text-gray-400 text-xs mt-1">
            Product ID:{' '}
            {Platform.OS === 'ios'
              ? plan.originalPlan.apple_product_id
              : plan.originalPlan.google_product_id}
          </Text>
        </View>
      </View>
    </View>
  );
}
