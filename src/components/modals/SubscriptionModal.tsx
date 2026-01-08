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
import {
  verifyPurchase,
  type VerifyPurchasePayload,
  type VerifyPurchaseResponse,
} from '@/api/subscription/verifyPurchase';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useQueryClient } from '@tanstack/react-query';

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
  onNavigateToProfile?: () => void; // Callback to navigate (to profile tab or consultation tab based on source)
  onNavigateToConsultation?: () => void; // Callback to navigate specifically to consultation screen (post-upgrade)
  fromSignup?: boolean; // Indicates if user came from signup flow
  fromProfile?: boolean; // Indicates if user came from Profile/Manage Subscription
}

export default function SubscriptionModal({
  plan,
  onClose,
  onNavigateToProfile,
  onNavigateToConsultation,
  fromSignup = false,
  fromProfile = false,
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isSyncingWithStore, setIsSyncingWithStore] = useState(false);
  const [isUpgradeConfirmationPending, setIsUpgradeConfirmationPending] = useState(false);
  const [isUpgradeAppliedMessageVisible, setIsUpgradeAppliedMessageVisible] = useState(false);
  const [iapInitialized, setIapInitialized] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: profileData } = useGetProfile();
  const currentSubscription = profileData?.subscription ?? null;
  const processedPurchaseKeysRef = useRef<Set<string>>(new Set());
  const currentSubscriptionRef = useRef<any | null>(null);
  const upgradeRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log(plan, 'plan');

  useEffect(() => {
    currentSubscriptionRef.current = currentSubscription;
  }, [currentSubscription]);

  useEffect(() => {
    return () => {
      if (upgradeRedirectTimeoutRef.current) {
        clearTimeout(upgradeRedirectTimeoutRef.current);
        upgradeRedirectTimeoutRef.current = null;
      }
    };
  }, []);

  // Subscription status is sourced from Profile API (no AsyncStorage subscription state).

  // 2. Initiating the Purchase
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
      // 1. Current user plan from Google
      const activeSubs = await RNIap.getActiveSubscriptions();
      const currentSub = activeSubs?.[0] ?? null;

      console.log('currentSub', currentSub);

      let currentBasePlanId: string | null = null;

      const sub: any = currentSub; // override bad type from RNIap

      if (sub?.subscriptionOfferDetails?.length) {
        currentBasePlanId = sub.subscriptionOfferDetails[0].basePlanId ?? null;
      }

      // 2. Fetch product + all base-plan offers
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

      if (!offers || offers.length === 0) {
        throw new Error(`No subscription offers found for ${productId}`);
      }

      // 3. Filter only the offers belonging to THE SELECTED PLAN
      const selectedBasePlanId = plan.originalPlan.base_plan_product_id as string;

      const matchingOffers = offers.filter((o: any) => o.basePlanId === selectedBasePlanId);

      console.log('matchingOffers', matchingOffers);

      if (matchingOffers.length === 0) {
        throw new Error(`No offer found for basePlanId=${selectedBasePlanId}. Check Play Console.`);
      }

      // Choose offer matching backend offer_plan_id OR fallback to first
      const selectedOfferId = plan.originalPlan.offer_plan_id;

      const targetOffer =
        matchingOffers.find((o: any) => o.offerId === selectedOfferId) || matchingOffers[0];

      console.log('targetOffer', targetOffer);

      if (!targetOffer.offerToken) {
        throw new Error(`OfferToken missing for ${selectedBasePlanId}`);
      }

      // ---------------------------------------------------------
      // 4. Determine upgrade/downgrade using numeric base plan index
      // ---------------------------------------------------------

      const planIndex = Number(selectedBasePlanId.split('-').pop());
      const currentIndex = currentBasePlanId ? Number(currentBasePlanId.split('-').pop()) : null;

      let purchaseTokenAndroid: string | undefined;
      let replacementModeAndroid: number | undefined;

      if (currentIndex && currentSub?.purchaseToken) {
        if (planIndex > currentIndex) {
          // UPGRADE
          purchaseTokenAndroid = currentSub.purchaseToken;
          replacementModeAndroid = 2; // IMMEDIATE_WITHOUT_PRORATION
        } else if (planIndex < currentIndex) {
          // DOWNGRADE
          purchaseTokenAndroid = currentSub.purchaseToken;
          replacementModeAndroid = 2; // IMMEDIATE_WITHOUT_PRORATION
        }
        // if equal → normal purchase → no replacementMode
      }

      console.log(purchaseTokenAndroid, currentSub?.purchaseTokenAndroid, 'purchaseTokenAndroid');

      // ---------------------------------------------------------
      // 5. Build purchase request
      // ---------------------------------------------------------
      const requestObj: MutationRequestPurchaseArgs = {
        request: {
          android: {
            skus: [productId],
            subscriptionOffers: [
              {
                sku: productId,
                offerToken: targetOffer.offerToken,
              },
            ],
            ...(currentSub?.purchaseTokenAndroid && {
              purchaseTokenAndroid: currentSub?.purchaseTokenAndroid,
              replacementModeAndroid: 2,
            }),
          },
        },
        type: 'subs',
      };

      console.log('requestObj', requestObj);

      await RNIap.requestPurchase(requestObj);
    } catch (err: any) {
      console.error('Subscription error:', err);
      Alert.alert('Error', err.message || 'Unable to process subscription.');
    } finally {
      setIsLoading(false);
    }
  }, [plan, iapInitialized, iapError]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: RNIap.Purchase) => {
      // Ensure we don't show "syncing" once the store has delivered a purchase callback.
      setIsSyncingWithStore(false);
      const currentSub = currentSubscriptionRef.current;
      // Determine purchase scenario for logging
      const hasActiveSub =
        !!currentSub && (currentSub.status === 'active' || currentSub.is_active === true);
      const purchaseScenario = !hasActiveSub
        ? 'FIRST_TIME_PURCHASE'
        : plan?.originalPlan?.id && currentSub?.plan_id
          ? Number(plan.originalPlan.id) > Number(currentSub.plan_id)
            ? 'UPGRADE'
            : Number(plan.originalPlan.id) < Number(currentSub.plan_id)
              ? 'DOWNGRADE'
              : 'SAME_PLAN'
          : 'UNKNOWN';

      console.log('[SubscriptionModal] ========================================');
      console.log('[SubscriptionModal] 🎉 PURCHASE UPDATE RECEIVED FROM GOOGLE PLAY');
      console.log('[SubscriptionModal] ========================================');
      console.log('[SubscriptionModal] Purchase Scenario:', {
        scenario: purchaseScenario,
        currentPlanId: currentSub?.plan_id || 'NONE',
        newPlanId: plan?.originalPlan?.id || 'NONE',
        timestamp: new Date().toISOString(),
      });

      // Log the complete raw purchase object from Google Play
      console.log('[SubscriptionModal] 📦 Complete Purchase Object from Google Play:', {
        // Standard properties
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionDate: purchase.transactionDate,
        // Full purchase object (all properties)
        fullPurchaseObject: JSON.stringify(purchase, null, 2),
      });

      console.log(purchase, 'purchase');

      // Log Android-specific properties
      const purchaseAny = purchase as any;
      if (Platform.OS === 'android') {
        console.log('[SubscriptionModal] 🤖 Android-Specific Purchase Data:', {
          orderId: purchaseAny.orderId || 'NOT_FOUND',
          purchaseToken: purchaseAny.purchaseToken || 'NOT_FOUND',
          purchaseState: purchaseAny.purchaseState || 'NOT_FOUND',
          purchaseStateAndroid: purchaseAny.purchaseStateAndroid ?? 'NOT_FOUND',
          purchaseStateMeaning:
            purchaseAny.purchaseState === 'purchased'
              ? 'PURCHASED ✅'
              : purchaseAny.purchaseState === 'pending'
                ? 'PENDING'
                : purchaseAny.purchaseState === 'failed'
                  ? 'FAILED'
                  : purchaseAny.purchaseState || 'UNKNOWN',
          signatureAndroid: purchaseAny.signatureAndroid || 'NOT_FOUND',
          developerPayloadAndroid: purchaseAny.developerPayloadAndroid || 'NOT_FOUND',
          autoRenewingAndroid: purchaseAny.autoRenewingAndroid ?? 'NOT_FOUND',
          isAcknowledgedAndroid: purchaseAny.isAcknowledgedAndroid ?? 'NOT_FOUND',
          // Subscription-specific Android properties
          subscriptionPurchaseData: purchaseAny.subscriptionPurchaseData || 'NOT_FOUND',
          basePlanId: purchaseAny.basePlanId || 'NOT_FOUND',
          offerId: purchaseAny.offerId || 'NOT_FOUND',
          offerToken: purchaseAny.offerToken || 'NOT_FOUND',
        });
      }

      // Log iOS-specific properties
      if (Platform.OS === 'ios') {
        console.log('[SubscriptionModal] 🍎 iOS-Specific Purchase Data:', {
          transactionReceipt: purchaseAny.transactionReceipt || 'NOT_FOUND',
          transactionStateIOS: purchaseAny.transactionStateIOS ?? 'NOT_FOUND',
          transactionStateIOSMeaning:
            purchaseAny.transactionStateIOS === 0
              ? 'PURCHASING'
              : purchaseAny.transactionStateIOS === 1
                ? 'PURCHASED ✅'
                : purchaseAny.transactionStateIOS === 2
                  ? 'FAILED'
                  : purchaseAny.transactionStateIOS === 3
                    ? 'RESTORED'
                    : purchaseAny.transactionStateIOS === 4
                      ? 'DEFERRED'
                      : 'UNKNOWN',
          originalTransactionIdentifierIOS:
            purchaseAny.originalTransactionIdentifierIOS || 'NOT_FOUND',
        });
      }

      // Log all available keys in the purchase object
      console.log('[SubscriptionModal] 🔑 All Available Purchase Object Keys:', {
        standardKeys: Object.keys(purchase),
        allKeys: Object.keys(purchaseAny),
        hasOrderId: 'orderId' in purchaseAny,
        hasPurchaseToken: 'purchaseToken' in purchaseAny,
        hasPurchaseState: 'purchaseState' in purchaseAny,
        hasPurchaseStateAndroid: 'purchaseStateAndroid' in purchaseAny,
        purchaseStateValue: purchaseAny.purchaseState || 'NOT_FOUND',
      });

      console.log('[SubscriptionModal] Basic Purchase Info:', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        transactionDate: purchase.transactionDate,
      });

      console.log(purchase, 'purchase we have reached here');

      // 1. Determine Success State correctly for v14
      // Using type assertion to access platform-specific properties (purchaseAny already declared above)
      let isPurchaseSuccessful = false;

      if (Platform.OS === 'android') {
        /**
         * Android purchase state can come in different shapes depending on react-native-iap version:
         * - `purchaseStateAndroid` (number): 0 unspecified, 1 purchased, 2 pending
         * - `purchaseState` (string): 'purchased' | 'pending' | ...
         * - `dataAndroid` (stringified JSON) includes `purchaseState` + `orderId` + `purchaseToken`
         */
        const getAndroidPurchaseState = (): number | null => {
          // Preferred: numeric state
          if (typeof purchaseAny.purchaseStateAndroid === 'number')
            return purchaseAny.purchaseStateAndroid;

          // Common: string state
          if (typeof purchaseAny.purchaseState === 'string') {
            const s = purchaseAny.purchaseState.toLowerCase();
            if (s === 'purchased') return 1;
            if (s === 'pending') return 2;
          }

          // Fallback: parse raw payload from Google Play
          if (typeof purchaseAny.dataAndroid === 'string' && purchaseAny.dataAndroid.trim()) {
            try {
              const parsed = JSON.parse(purchaseAny.dataAndroid);
              const rawState = parsed?.purchaseState;
              if (typeof rawState === 'number') {
                // Some environments report purchaseState=0 even when `purchaseState: 'purchased'`
                // and `orderId/purchaseToken` are present. Treat that as purchased.
                if (
                  rawState === 0 &&
                  (parsed?.orderId || purchaseAny.orderId) &&
                  (parsed?.purchaseToken || purchaseAny.purchaseToken)
                ) {
                  return 1;
                }
                return rawState;
              }
            } catch {
              // ignore parse errors
            }
          }

          return null;
        };

        const androidPurchaseState = getAndroidPurchaseState();
        if (__DEV__) {
          console.log('[SubscriptionModal][DEBUG] Android purchase state resolution', {
            purchaseStateAndroid: purchaseAny.purchaseStateAndroid,
            purchaseState: purchaseAny.purchaseState,
            parsedPurchaseState: androidPurchaseState,
            orderId: purchaseAny.orderId,
            purchaseTokenPreview: purchaseAny.purchaseToken
              ? String(purchaseAny.purchaseToken).slice(0, 12) + '…'
              : null,
          });
        }

        if (androidPurchaseState === 2) {
          // Pending purchase: don't verify yet, but also don't leave UI stuck.
          Alert.alert(
            'Purchase Pending',
            'Your purchase is pending. We will activate your subscription once Google Play confirms the payment.'
          );
          setIsProcessingPurchase(false);
          setIsLoading(false);
          return;
        }

        isPurchaseSuccessful = androidPurchaseState === 1;
      } else {
        // transactionStateIOS: 1 (purchased), 3 (restored)
        isPurchaseSuccessful =
          purchaseAny.transactionStateIOS === 1 || purchaseAny.transactionStateIOS === 3;
      }

      if (!isPurchaseSuccessful) {
        console.warn('[SubscriptionModal] Purchase not successful, skipping backend', {
          platform: Platform.OS,
          purchaseStateAndroid: purchaseAny.purchaseStateAndroid,
          purchaseState: purchaseAny.purchaseState,
        });
        setIsProcessingPurchase(false);
        setIsLoading(false);
        return;
      }

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

      try {
        setIsLoading(true);
        const userData = await storage.getUserData();

        if (!userData?.id || !plan?.originalPlan?.id) {
          throw new Error('User or Plan authentication failed.');
        }

        const toStringOrEmptySafe = (v: unknown) => {
          if (v === undefined || v === null) return '';
          if (typeof v === 'string') return v;
          if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint')
            return String(v);
          try {
            return JSON.stringify(v);
          } catch {
            return String(v);
          }
        };

        // 2. Build Payload for Backend (purchase only)
        // Using type assertion to access platform-specific properties
        const resolvedTransactionIdRaw =
          Platform.OS === 'android'
            ? purchaseAny.orderId ||
              purchase.transactionId ||
              purchaseAny.transactionId ||
              purchaseAny.id
            : purchase.transactionId || purchaseAny.transactionId;

        const resolvedTransactionId =
          resolvedTransactionIdRaw !== undefined && resolvedTransactionIdRaw !== null
            ? String(resolvedTransactionIdRaw)
            : '';

        if (!resolvedTransactionId) {
          throw new Error('Missing transactionId from purchase. Cannot verify with backend.');
        }

        const purchaseDataForBackend: VerifyPurchasePayload = {
          userId: userData.id,
          planId: plan.originalPlan.id,
          platform: Platform.OS as 'android' | 'ios',
          // Android uses orderId for the high-level receipt
          transactionId: toStringOrEmptySafe(resolvedTransactionId),
          productId: String(purchase.productId),
          base_plan_id: Platform.OS === 'android' ? plan.originalPlan.base_plan_product_id : null,
          purchaseDate: purchase.transactionDate
            ? typeof purchase.transactionDate === 'number'
              ? purchase.transactionDate
              : String(purchase.transactionDate)
            : null,

          // Android specific
          purchaseToken: purchaseAny.purchaseToken || null,
          // Some backends validate this as `string` (not `nullable|string`), so avoid null.
          orderId: Platform.OS === 'android' ? '' : null,
          packageName: Platform.OS === 'android' ? purchaseAny.packageNameAndroid || null : null,
          autoRenewing:
            Platform.OS === 'android' ? (purchaseAny.autoRenewingAndroid ?? null) : null,

          // iOS specific
          // Some backends validate these as string even on Android; send empty string instead of null.
          transactionReceipt:
            Platform.OS === 'ios' ? toStringOrEmptySafe(purchaseAny.transactionReceipt) : '',
          originalTransactionId:
            Platform.OS === 'ios'
              ? toStringOrEmptySafe(purchaseAny.originalTransactionIdentifierIOS)
              : '',
        };

        // Ensure we always persist a purchaseDate for recovery.
        // Some Android purchase objects may not include transactionDate reliably.
        const safePurchaseDate: string | number | null =
          purchaseDataForBackend.purchaseDate ?? purchase.transactionDate ?? Date.now();

        // Persist purchase payload locally BEFORE calling backend (crash/offline recovery).
        // This is intentionally NOT subscription state—only a pending verification queue.
        const pendingId =
          Platform.OS === 'android'
            ? String(
                purchaseAny.purchaseToken ||
                  purchaseAny.orderId ||
                  purchase.transactionId ||
                  purchaseAny.transactionId ||
                  ''
              )
            : String(
                purchaseAny.originalTransactionIdentifierIOS ||
                  purchase.transactionId ||
                  purchaseAny.transactionId ||
                  ''
              );

        if (pendingId) {
          try {
            const existing = await storage.getPendingPurchaseVerifications();
            const prev = existing.find((p) => p.id === pendingId);

            const pendingItem: PendingPurchaseVerification = {
              id: pendingId,
              platform: Platform.OS as 'android' | 'ios',
              planId: purchaseDataForBackend.planId,
              purchaseDate: safePurchaseDate,
              createdAt: prev?.createdAt ?? Date.now(),
              updatedAt: Date.now(),
              attempts: prev?.attempts ?? 0,
              lastError: prev?.lastError ?? null,
              payload: {
                ...purchaseDataForBackend,
                purchaseDate: safePurchaseDate,
              },
            };

            await storage.upsertPendingPurchaseVerification(pendingItem);
          } catch (e) {
            console.warn('[SubscriptionModal] Failed to persist pending verification item', e);
          }
        }

        // Action hint for backend (especially for deferred downgrades).
        try {
          const hasActiveSub =
            !!currentSub && (currentSub.status === 'active' || currentSub.is_active === true);
          const currentPlanId = Number(currentSub?.plan_id);
          const newPlanId = Number(plan?.originalPlan?.id);

          if (hasActiveSub && Number.isFinite(currentPlanId) && Number.isFinite(newPlanId)) {
            if (newPlanId < currentPlanId) {
              // Downgrades are deferred (take effect next cycle)
              purchaseDataForBackend.action = 'deferred_downgrade';
              // Backend requires scheduled_plan_id when action is deferred_downgrade
              purchaseDataForBackend.scheduledPlanId = String(newPlanId);
              if (currentSub?.expires_at) {
                const ts = new Date(currentSub.expires_at).getTime();
                if (!Number.isNaN(ts)) purchaseDataForBackend.scheduledStartDate = ts;
              }
            } else if (newPlanId > currentPlanId) {
              // Do NOT send action for upgrades
            } else {
              // same plan -> no-op hint
            }
          } else if (!hasActiveSub) {
            // Do NOT send action for initial purchase
          }
        } catch {
          // ignore
        }

        // 3. Backend Verification
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📡 SENDING TO BACKEND FOR VERIFICATION');
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] Backend Call Details:', {
          endpoint: 'verifyPurchase',
          userId: purchaseDataForBackend.userId,
          planId: purchaseDataForBackend.planId,
          transactionId: purchaseDataForBackend.transactionId,
        });
        console.log('[SubscriptionModal] 📡 Sending purchase to backend for verification...');
        const shouldShowUpgradeRequestedMessage =
          purchaseScenario === 'UPGRADE' && Platform.OS === 'android';
        if (shouldShowUpgradeRequestedMessage) setIsUpgradeConfirmationPending(true);
        let verificationResult: Awaited<ReturnType<typeof sendPurchaseToBackend>>;
        try {
          verificationResult = await sendPurchaseToBackend(purchaseDataForBackend);
        } finally {
          if (shouldShowUpgradeRequestedMessage) setIsUpgradeConfirmationPending(false);
        }

        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📥 BACKEND VERIFICATION RESPONSE RECEIVED');
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] Backend Verification Response:', {
          success: verificationResult.success,
          code: verificationResult.code,
          message: verificationResult.message,
          data: verificationResult.data,
          verified: verificationResult.success,
        });

        if (verificationResult.success) {
          console.log(
            '[SubscriptionModal] ✅ Purchase verified successfully (Google → Backend) and will be acknowledged/finished now.'
          );
          // Refresh Profile API data after successful verification (source of truth).
          await queryClient.invalidateQueries({ queryKey: ['profileData'] });

          // 4. CRITICAL: Acknowledge / finish the transaction (Android)
          // This tells Google Play the entitlement was delivered.
          // If you don't acknowledge, Google can automatically refund and/or show "developer didn't acknowledge" errors.
          const getAndroidAckInfo = (): { token: string | null; acknowledged: boolean | null } => {
            if (Platform.OS !== 'android') return { token: null, acknowledged: null };
            const token: string | null = purchaseAny.purchaseToken || null;
            const acknowledgedRaw: boolean | null =
              typeof purchaseAny.isAcknowledgedAndroid === 'boolean'
                ? purchaseAny.isAcknowledgedAndroid
                : null;

            if (token && acknowledgedRaw !== null) return { token, acknowledged: acknowledgedRaw };

            if (typeof purchaseAny.dataAndroid === 'string' && purchaseAny.dataAndroid.trim()) {
              try {
                const parsed = JSON.parse(purchaseAny.dataAndroid);
                return {
                  token:
                    token ||
                    (typeof parsed?.purchaseToken === 'string' ? parsed.purchaseToken : null),
                  acknowledged:
                    acknowledgedRaw !== null
                      ? acknowledgedRaw
                      : typeof parsed?.acknowledged === 'boolean'
                        ? parsed.acknowledged
                        : null,
                };
              } catch {
                // ignore parse errors
              }
            }

            return { token, acknowledged: acknowledgedRaw };
          };

          const { token: androidToken, acknowledged: androidAck } = getAndroidAckInfo();
          if (Platform.OS === 'android' && androidToken && androidAck === false) {
            try {
              // Prefer explicit ack when available
              if (typeof (RNIap as any).acknowledgePurchaseAndroid === 'function') {
                await (RNIap as any).acknowledgePurchaseAndroid(androidToken);
              }
            } catch (ackErr) {
              console.warn(
                '[SubscriptionModal] acknowledgePurchaseAndroid failed, will fallback to finishTransaction',
                ackErr
              );
            }
          }

          // Always attempt finishTransaction as well (handles iOS + acts as fallback for Android)
          try {
            await (RNIap as any).finishTransaction({
              purchase,
              isConsumable: false, // Subscriptions are always non-consumable
            });
          } catch (finishErr: any) {
            // If already acknowledged/finished, treat as non-fatal.
            const msg = String(finishErr?.message || '');
            if (Platform.OS === 'android' && /acknowledged|already|finished/i.test(msg)) {
              console.warn('[SubscriptionModal] finishTransaction non-fatal on Android:', msg);
            } else {
              throw finishErr;
            }
          }

          // Remove pending verification item after successful backend verification + transaction finalize.
          if (pendingId) {
            try {
              await storage.removePendingPurchaseVerification(pendingId);
            } catch (e) {
              console.warn('[SubscriptionModal] Failed to remove pending verification item', e);
            }
          }

          // Upgrade UX: backend indicates the purchase is an upgrade.
          // Show message for 5 seconds then route to Consultation screen.
          const isUpgradeFromBackend = verificationResult?.data?.is_upgrade === true;
          if (isUpgradeFromBackend) {
            setIsUpgradeAppliedMessageVisible(true);
            if (upgradeRedirectTimeoutRef.current) {
              clearTimeout(upgradeRedirectTimeoutRef.current);
              upgradeRedirectTimeoutRef.current = null;
            }
            upgradeRedirectTimeoutRef.current = setTimeout(() => {
              try {
                onClose?.();
              } finally {
                onNavigateToConsultation?.();
              }
            }, 5000);
            return;
          }

          Alert.alert('Success!', 'Subscription activated.', [
            { text: 'OK', onPress: () => onClose?.() },
          ]);
        } else {
          console.error('[SubscriptionModal] ❌ Backend validation failed:', verificationResult);
          throw new Error('Backend validation failed');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('[SubscriptionModal] ❌ Error in handlePurchaseUpdate:', {
          errorMessage,
          error: error instanceof Error ? error.stack : error,
          purchaseProductId: purchase.productId,
          purchaseTransactionId: purchase.transactionId,
        });
        Alert.alert('Verification Failed', 'Please contact support if you were charged.');
      } finally {
        setIsUpgradeConfirmationPending(false);
        // Keep upgrade success message visible until redirect triggers or modal closes.
        setIsProcessingPurchase(false);
        setIsLoading(false);
        setIsSyncingWithStore(false);
      }
    },
    [plan, onClose]
  );
  // 1. Preparation: Initialize IAP and set up listeners
  useEffect(() => {
    // ============================================
    // MOCK IAP INITIALIZATION - COMMENTED OUT FOR REAL IAP TESTING
    // ============================================
    /*
    // MOCK: Set IAP as initialized for UI testing
    setIapInitialized(true);
    setIapError(null);
    */

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

  // Function to send purchase data to your backend
  const sendPurchaseToBackend = async (purchaseData: VerifyPurchasePayload) => {
    console.log('[SubscriptionModal] ========================================');
    console.log('[SubscriptionModal] 🌐 BACKEND API CALL');
    console.log('[SubscriptionModal] ========================================');
    console.log('[SubscriptionModal] Calling verifyPurchase API with data:', {
      userId: purchaseData.userId,
      planId: purchaseData.planId,
      platform: purchaseData.platform,
      transactionId: purchaseData.transactionId,
      hasPurchaseToken: !!purchaseData.purchaseToken,
      purchaseDate: purchaseData.purchaseDate,
    });
    console.log('[SubscriptionModal] Full purchase data:', JSON.stringify(purchaseData, null, 2));

    try {
      // Import BASE_URL for logging
      const { BASE_URL } = await import('@/config');
      console.log('[SubscriptionModal] 📞 Making API request to backend...', {
        baseUrl: BASE_URL,
        endpoint: '/api/subscriptions/verify-purchase',
        fullUrl: `${BASE_URL}/api/subscriptions/verify-purchase`,
      });

      const result: VerifyPurchaseResponse = await verifyPurchase(purchaseData);
      console.log('[SubscriptionModal] ✅ Backend API response received:', {
        status: result.status,
        code: result.code,
        message: result.message,
        hasData: !!result.data,
      });

      return {
        success: result.status === 'success',
        code: result.code,
        message: result.message,
        data: result.data,
      };
    } catch (error: any) {
      console.error('[SubscriptionModal] ========================================');
      console.error('[SubscriptionModal] ❌ BACKEND REQUEST FAILED');
      console.error('[SubscriptionModal] ========================================');
      console.error('[SubscriptionModal] Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        name: error?.name,
        stack: error?.stack?.substring(0, 500), // First 500 chars of stack
      });

      // Log axios-specific error details
      if (error?.response) {
        console.error('[SubscriptionModal] Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error?.request) {
        console.error('[SubscriptionModal] Request error (no response):', {
          request: error.request,
          message: 'The request was made but no response was received',
        });
      } else {
        console.error('[SubscriptionModal] Network/Configuration error:', {
          message: error?.message,
          code: error?.code,
        });
      }

      // Import BASE_URL for error message
      const { BASE_URL } = await import('@/config');
      console.error('[SubscriptionModal] Request configuration:', {
        baseUrl: BASE_URL,
        endpoint: '/api/subscriptions/verify-purchase',
        fullUrl: `${BASE_URL}/api/subscriptions/verify-purchase`,
      });

      throw error;
    }
  };

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

        {/* Purchase/Upgrade Status Indicator */}
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
            isUpgradeAppliedMessageVisible ||
            !iapInitialized ||
            (currentSubscription?.plan_id === plan.originalPlan.id &&
              (currentSubscription.status === 'active' || currentSubscription.is_active))
          }
          className={`mt-5 rounded-xl overflow-hidden ${
            isLoading ||
            isProcessingPurchase ||
            isSyncingWithStore ||
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
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                <Text className="text-white text-[16px] font-semibold">Preparing...</Text>
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
