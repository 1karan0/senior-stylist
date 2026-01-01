import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  purchaseUpdatedListener,
  purchaseErrorListener,
  initConnection,
  getAvailablePurchases,
} from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { storage } from '@/services/storage';
import {
  verifyPurchase,
  type VerifyPurchasePayload,
  type VerifyPurchaseResponse,
} from '@/api/subscription/verifyPurchase';

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
  fromSignup?: boolean; // Indicates if user came from signup flow
  fromProfile?: boolean; // Indicates if user came from Profile/Manage Subscription
}

export default function SubscriptionModal({
  plan,
  onClose,
  onNavigateToProfile,
  fromSignup = false,
  fromProfile = false,
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [iapInitialized, setIapInitialized] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const processedPurchaseKeysRef = useRef<Set<string>>(new Set());
  const currentSubscriptionRef = useRef<any | null>(null);
  const lastPurchaseErrorRef = useRef<{ code?: string; message?: string; at: number } | null>(null);

  useEffect(() => {
    currentSubscriptionRef.current = currentSubscription;
  }, [currentSubscription]);

  // Fetch current subscription from AsyncStorage when modal opens
  useEffect(() => {
    const loadCurrentSubscription = async () => {
      try {
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📂 LOADING SUBSCRIPTION FROM ASYNCSTORAGE');
        console.log('[SubscriptionModal] ========================================');

        const subscription = await storage.getUserSubscription();
        setCurrentSubscription(subscription);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          '[SubscriptionModal] ❌ Failed to load subscription from storage:',
          errorMessage
        );
        // Don't block the flow if we can't load subscription
      }
    };

    if (plan?.originalPlan) {
      loadCurrentSubscription();
    }
  }, [plan]);

  // Optional: Ask Google/Apple what purchases are currently owned by this account.
  // NOTE: This is useful for debugging and recovery flows, but your backend should still be the source of truth.
  useEffect(() => {
    let cancelled = false;
    const logAvailablePurchases = async () => {
      try {
        if ((RNIap as any).getAvailablePurchases) {
          const purchases = await (RNIap as any).getAvailablePurchases();
          console.log('purchases', purchases);
          if (cancelled) return;
          console.log('[SubscriptionModal] 🧾 getAvailablePurchases() result', {
            count: Array.isArray(purchases) ? purchases.length : null,
            purchases: Array.isArray(purchases)
              ? purchases.map((p: any) => ({
                  productId: p.productId,
                  transactionId: p.transactionId,
                  purchaseTokenPreview: p.purchaseToken
                    ? String(p.purchaseToken).slice(0, 12) + '…'
                    : null,
                  isAcknowledgedAndroid: p.isAcknowledgedAndroid,
                  purchaseState: p.purchaseState,
                  transactionDate: p.transactionDate,
                  platform: p.platform,
                }))
              : purchases,
          });
        } else {
          console.log(
            '[SubscriptionModal] getAvailablePurchases() not available in this react-native-iap version'
          );
        }
      } catch (e) {
        console.warn('[SubscriptionModal] getAvailablePurchases() failed', e);
      }
    };

    // Only run when modal opens for a plan (keeps noise down).
    if (plan?.originalPlan) {
      void logAvailablePurchases();
    }

    return () => {
      cancelled = true;
    };
  }, [plan]);

  // 2. Initiating the Purchase
  const handleSubscribe = useCallback(async () => {
    if (!plan?.originalPlan) {
      Alert.alert('Error', 'Plan information is missing.');
      return;
    }

    if (!iapInitialized) {
      Alert.alert('Payment Unavailable', iapError || 'Payment system is not available.');
      return;
    }

    // Determine purchase scenario
    const purchaseScenario =
      !currentSubscription || !currentSubscription.transaction_id
        ? 'FIRST_TIME_PURCHASE'
        : plan.originalPlan.id > (currentSubscription.plan_id || 0)
          ? 'UPGRADE'
          : plan.originalPlan.id < (currentSubscription.plan_id || 0)
            ? 'DOWNGRADE'
            : 'SAME_PLAN';

    console.log('[SubscriptionModal] ========================================');
    console.log('[SubscriptionModal] 🛒 PURCHASE SCENARIO DETECTED');
    console.log('[SubscriptionModal] ========================================');
    console.log('[SubscriptionModal] Purchase Type:', {
      scenario: purchaseScenario,
      currentPlanId: currentSubscription?.plan_id || 'NONE',
      newPlanId: plan.originalPlan.id,
      hasCurrentSubscription: !!currentSubscription,
      hasTransactionId: !!currentSubscription?.transaction_id,
    });

    setIsLoading(true);
    setIsProcessingPurchase(true);

    const productId = Platform.select({
      ios: plan.originalPlan.apple_product_id,
      android: plan.originalPlan.google_product_id,
    });

    if (!productId) {
      setIsLoading(false);
      setIsProcessingPurchase(false);
      Alert.alert('Error', `Product ID not configured for ${Platform.OS}`);
      return;
    }

    /**
     * Google Play subscriptions model:
     * - productId: subscription product id (e.g. "senior_stylist_subscription")
     * - basePlanId: base plan id (e.g. "basic-monthly", "premium-monthly", "pro-monthly")
     * - offerId: offer id under that base plan (e.g. "basic-intro-6m")
     *
     * Our API currently doesn't always provide `offer_plan_id`, and `base_plan_product_id`
     * may not be present on every plan row. So we derive safely from the plan slug.
     */
    const deriveAndroidBasePlanId = (): string | null => {
      const anyPlan = plan.originalPlan as any;
      // Prefer explicit field when present
      if (typeof anyPlan.base_plan_product_id === 'string' && anyPlan.base_plan_product_id.trim()) {
        return anyPlan.base_plan_product_id.trim();
      }
      // Fallback: slug matches Play Console basePlanId in your structure (basic-monthly, etc.)
      if (typeof anyPlan.slug === 'string' && anyPlan.slug.trim()) {
        return anyPlan.slug.trim();
      }
      return null;
    };

    const deriveAndroidOfferId = (basePlanId: string | null): string | null => {
      const anyPlan = plan.originalPlan as any;
      // Prefer explicit field when present
      if (typeof anyPlan.offer_plan_id === 'string' && anyPlan.offer_plan_id.trim()) {
        return anyPlan.offer_plan_id.trim();
      }

      // If discount is configured (e.g. 6 months), derive offerId like: basic-intro-6m
      const months =
        typeof anyPlan.discount_duration_months === 'number' ? anyPlan.discount_duration_months : 0;
      if (!basePlanId || !months || months <= 0) return null;

      const prefix = basePlanId.replace(/-monthly$/i, '').trim();
      if (!prefix) return null;
      return `${prefix}-intro-${months}m`;
    };

    const basePlanId = Platform.OS === 'android' ? deriveAndroidBasePlanId() : null;
    const offerPlanId = Platform.OS === 'android' ? deriveAndroidOfferId(basePlanId) : null;

    try {
      if (Platform.OS === 'android') {
        const rnIapAny = RNIap as any;

        // --- STEP 1: Check for existing purchases using getAvailablePurchases ---
        console.log('[SubscriptionModal] 🔍 Checking for existing purchases...');
        let existingPurchase: RNIap.Purchase | null = null;
        let existingPurchaseToken: string | null = null;
        let existingProductId: string | null = null;

        try {
          const availablePurchases = await getAvailablePurchases();
          console.log('[SubscriptionModal] Available purchases:', {
            count: availablePurchases.length,
            productIds: availablePurchases.map((p) => p.productId),
          });

          // Find the current subscription purchase
          if (availablePurchases.length > 0) {
            // Try to find purchase matching current subscription product ID
            existingPurchase =
              availablePurchases.find(
                (p) => p.productId === productId || p.productId === currentSubscription?.product_id
              ) || availablePurchases[0]; // Fallback to first purchase if no match

            if (existingPurchase) {
              const purchaseAny = existingPurchase as any;
              existingPurchaseToken = purchaseAny.purchaseToken || null;
              existingProductId = existingPurchase.productId;

              console.log('[SubscriptionModal] ✅ Found existing purchase:', {
                productId: existingProductId,
                hasPurchaseToken: !!existingPurchaseToken,
                purchaseTokenPreview: existingPurchaseToken
                  ? existingPurchaseToken.substring(0, 40) + '...'
                  : 'NOT_FOUND',
              });
            }
          } else {
            console.log(
              '[SubscriptionModal] ℹ️ No existing purchases found - this is a first-time purchase'
            );
          }
        } catch (err) {
          console.warn('[SubscriptionModal] ⚠️ Failed to get available purchases:', err);
          // Continue with purchase flow even if getAvailablePurchases fails
        }

        // --- STEP 2: Fetch subscription product details ---
        let selectedOfferToken: string | null = null;
        let subscriptions: any[] = [];
        let fetchMethod = 'none';

        // Try getProducts first (most commonly available in v14+)
        if (typeof rnIapAny.getProducts === 'function') {
          try {
            const products = await rnIapAny.getProducts({
              skus: [productId],
              type: 'subs',
            });
            if (products && products.length > 0) {
              subscriptions = products.map((p: any) => ({
                productId: p.productId || p.id,
                subscriptionOfferDetails:
                  p.subscriptionOfferDetailsAndroid ||
                  p.subscriptionOfferDetails ||
                  p.subscriptionOffers ||
                  null,
              }));
              fetchMethod = 'getProducts';
            }
          } catch (err) {
            console.warn('[SubscriptionModal] getProducts failed, trying alternatives:', err);
          }
        }

        // Try getSubscriptions if getProducts didn't work
        if (subscriptions.length === 0 && typeof rnIapAny.getSubscriptions === 'function') {
          try {
            subscriptions = await rnIapAny.getSubscriptions({ skus: [productId] });
            if (subscriptions && subscriptions.length > 0) {
              fetchMethod = 'getSubscriptions';
            }
          } catch (err) {
            console.warn('[SubscriptionModal] getSubscriptions failed, trying fetchProducts:', err);
          }
        }

        // Try fetchProducts as final fallback
        if (subscriptions.length === 0 && typeof rnIapAny.fetchProducts === 'function') {
          try {
            const products = await rnIapAny.fetchProducts({
              skus: [productId],
              type: 'subs',
            });
            if (__DEV__) {
              console.log('[SubscriptionModal][DEBUG] fetchProducts() raw return', {
                count: Array.isArray(products) ? products.length : null,
                products: Array.isArray(products)
                  ? products.map((p: any) => ({
                      productId: p.productId || p.id,
                      title: p.title,
                      type: p.type,
                      // show both possible fields
                      subscriptionOfferDetailsCount:
                        (
                          p.subscriptionOfferDetailsAndroid ||
                          p.subscriptionOfferDetails ||
                          p.subscriptionOffers ||
                          []
                        )?.length ?? 0,
                      subscriptionOfferDetails:
                        p.subscriptionOfferDetailsAndroid ||
                        p.subscriptionOfferDetails ||
                        p.subscriptionOffers ||
                        null,
                    }))
                  : products,
              });
            }
            if (__DEV__) {
              console.log('[SubscriptionModal][DEBUG] fetchProducts() raw return', {
                count: Array.isArray(products) ? products.length : null,
                products: Array.isArray(products)
                  ? products.map((p: any) => ({
                      productId: p.productId || p.id,
                      title: p.title,
                      type: p.type,
                      // show both possible fields
                      subscriptionOfferDetailsCount:
                        (
                          p.subscriptionOfferDetailsAndroid ||
                          p.subscriptionOfferDetails ||
                          p.subscriptionOffers ||
                          []
                        )?.length ?? 0,
                      subscriptionOfferDetails:
                        p.subscriptionOfferDetailsAndroid ||
                        p.subscriptionOfferDetails ||
                        p.subscriptionOffers ||
                        null,
                    }))
                  : products,
              });
            }
            if (products && products.length > 0) {
              subscriptions = products.map((p: any) => ({
                productId: p.productId || p.id,
                subscriptionOfferDetails:
                  p.subscriptionOfferDetailsAndroid ||
                  p.subscriptionOfferDetails ||
                  p.subscriptionOffers ||
                  null,
              }));
              fetchMethod = 'fetchProducts';
            }
          } catch (err) {
            console.warn('[SubscriptionModal] fetchProducts failed:', err);
          }
        }

        // If all methods failed, throw error
        if (subscriptions.length === 0) {
          throw new Error(
            'Could not fetch subscription details from Google Play Store. ' +
              'Please ensure you are connected to the internet and Google Play Services is available.'
          );
        }

        const product = subscriptions.find((s: any) => (s.productId || s.id) === productId);

        if (!product) {
          throw new Error(
            `Product ${productId} not found in Google Play Store. ` +
              'Please verify the product ID matches your Google Play Console configuration.'
          );
        }

        if (!product.subscriptionOfferDetails || product.subscriptionOfferDetails.length === 0) {
          throw new Error(
            `No subscription offers found for product ${productId}. ` +
              'Please check your Google Play Console subscription configuration.'
          );
        }

        const offers = product.subscriptionOfferDetails;

        if (!basePlanId) {
          throw new Error(
            `Android basePlanId is missing for plan "${plan.title}". ` +
              `Expected basePlanId like "basic-monthly". ` +
              `Fix: ensure API returns base_plan_product_id OR plan.slug matches your Play base plan id.`
          );
        }

        // Select offer deterministically:
        // 1) If offerPlanId provided/derived, prefer exact basePlanId+offerId match
        // 2) Else prefer "promo" offer (offerId present OR multiple pricing phases)
        // 3) Else fallback to the first offer for that basePlanId
        let selectedOffer: any =
          (offerPlanId
            ? offers.find((o: any) => o.basePlanId === basePlanId && o.offerId === offerPlanId)
            : null) ||
          offers.find(
            (o: any) =>
              o.basePlanId === basePlanId &&
              (!!o.offerId ||
                ((o.pricingPhases?.pricingPhaseList?.length || 0) > 1 &&
                  o.pricingPhases?.pricingPhaseList?.[0]?.billingCycleCount > 0))
          ) ||
          offers.find((o: any) => o.basePlanId === basePlanId);

        if (__DEV__) {
          console.log('[SubscriptionModal][DEBUG] selectedOffer details', {
            basePlanId,
            desiredOfferPlanId: offerPlanId,
            selectedOfferBasePlanId: selectedOffer?.basePlanId,
            selectedOfferOfferId: selectedOffer?.offerId,
            hasOfferIdKey: selectedOffer
              ? Object.prototype.hasOwnProperty.call(selectedOffer, 'offerId')
              : null,
            selectedOfferKeys: selectedOffer ? Object.keys(selectedOffer) : null,
            selectedOfferTokenPreview: selectedOffer?.offerToken
              ? String(selectedOffer.offerToken).slice(0, 16) + '…'
              : null,
            selectedOfferRaw: selectedOffer ?? null,
          });
        }

        if (!selectedOffer) {
          throw new Error(
            `No offer found for basePlanId: ${basePlanId}. ` +
              `Available basePlanIds: ${[...new Set(offers.map((o: any) => o.basePlanId))].join(', ')}`
          );
        }

        if (!selectedOffer.offerToken) {
          throw new Error(
            `Offer token is missing for basePlanId: ${basePlanId}. ` +
              'Please check your Google Play Console subscription offer configuration.'
          );
        }

        selectedOfferToken = selectedOffer.offerToken;

        // --- 2. PREPARE THE CORRECT REQUEST STRUCTURE FOR v14+ ---
        const subscriptionOffer: any = {
          sku: String(productId), // Must match the productId in skus array
          offerToken: selectedOfferToken, // REQUIRED: The token from Google Play
        };

        const purchaseRequest: any = {
          // CRITICAL: If `type` is not set to 'subs', react-native-iap treats this as an in-app purchase,
          // and will ignore `subscriptionOffers` => Google Play can default to the first base plan.
          type: 'subs',
          request: {
            android: {
              // Top-level skus array is REQUIRED for Android Billing Library 5+ (including 8.0)
              skus: [String(productId)],
              // subscriptionOffers must be inside android object for Billing Library 8.0
              subscriptionOffers: [subscriptionOffer],
            },
          },
        };

        console.log(subscriptionOffer, 'subscriptionOffer');

        // Handle Upgrades/Downgrades (for existing subscriptions)
        // Billing Library 8.0 uses the same replacement mode constants
        // Note: purchaseScenario already declared at function start

        if (currentSubscription?.transaction_id) {
          // react-native-iap expects these keys for subscription replacement
          purchaseRequest.request.android.purchaseTokenAndroid = currentSubscription.transaction_id;
          // replacementModeAndroid: 1 = CHARGE_PRORATED_PRICE (immediate), 4 = DEFERRED
          const selectedTier = Number((plan.originalPlan as any)?.sort_order);
          const currentTier = Number(
            (currentSubscription as any)?.plan_sort_order ??
              (currentSubscription as any)?.sortOrder ??
              (currentSubscription as any)?.plan?.sort_order ??
              (currentSubscription as any)?.plan?.sortOrder ??
              NaN
          );

          const canCompareTiers = Number.isFinite(selectedTier) && Number.isFinite(currentTier);
          const isUpgrade = canCompareTiers ? selectedTier > currentTier : false;
          const isDowngrade = canCompareTiers ? selectedTier < currentTier : false;

          // If we can't compare tiers, default to immediate replacement (safer UX than deferring unexpectedly)
          purchaseRequest.request.android.replacementModeAndroid = isDowngrade ? 4 : 1;

          if (__DEV__) {
            console.log('[SubscriptionModal][DEBUG] Replacement mode decision', {
              selectedTier,
              currentTier,
              canCompareTiers,
              isUpgrade,
              isDowngrade,
              replacementModeAndroid: purchaseRequest.request.android.replacementModeAndroid,
            });
          }
        }

        // --- 3. EXECUTE PURCHASE REQUEST ---
        await (RNIap as any).requestPurchase(purchaseRequest);

        console.log(
          '[SubscriptionModal] ✅ Purchase request sent successfully - waiting for purchase update...'
        );
      } else {
        // iOS Implementation
        await (RNIap as any).requestPurchase({ sku: productId });
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setIsProcessingPurchase(false);

      const iapErr = err as any;
      // Silent return on user cancel
      if (iapErr.code === 'E_USER_CANCELLED' || iapErr.code === 'E_USER_CANCELED') return;

      Alert.alert('Purchase Failed', iapErr.message || 'An unknown error occurred');
      console.error('[SubscriptionModal] Purchase error:', iapErr);
    }
  }, [plan, iapInitialized, iapError, currentSubscription]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: RNIap.Purchase) => {
      const currentSub = currentSubscriptionRef.current;
      // Determine purchase scenario for logging
      const purchaseScenario =
        !currentSub || !currentSub.transaction_id
          ? 'FIRST_TIME_PURCHASE'
          : plan?.originalPlan?.id && currentSub.plan_id
            ? plan.originalPlan.id > currentSub.plan_id
              ? 'UPGRADE'
              : plan.originalPlan.id < currentSub.plan_id
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

        // 2. Build Payload for Backend
        // Determine purchase scenario for backend payload (reuse from function start)
        const backendPurchaseScenario =
          !currentSubscription || !currentSubscription.transaction_id
            ? 'FIRST_TIME_PURCHASE'
            : plan.originalPlan.id > (currentSubscription.plan_id || 0)
              ? 'UPGRADE'
              : plan.originalPlan.id < (currentSubscription.plan_id || 0)
                ? 'DOWNGRADE'
                : 'SAME_PLAN';

        // Determine action for backend
        const action: 'deferred_downgrade' | 'upgrade' | 'downgrade' | 'initial' =
          backendPurchaseScenario === 'FIRST_TIME_PURCHASE'
            ? 'initial'
            : backendPurchaseScenario === 'UPGRADE'
              ? 'upgrade'
              : backendPurchaseScenario === 'DOWNGRADE'
                ? 'deferred_downgrade'
                : 'initial';

        // For downgrades, calculate scheduled start date (next billing cycle)
        // This is typically the current subscription's expiry date
        const scheduledStartDate =
          backendPurchaseScenario === 'DOWNGRADE' && currentSubscription?.expires_at
            ? new Date(currentSubscription.expires_at).getTime()
            : null;

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
          transactionId: resolvedTransactionId,
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
          transactionReceipt: Platform.OS === 'ios' ? purchaseAny.transactionReceipt || '' : '',
          originalTransactionId:
            Platform.OS === 'ios' ? purchaseAny.originalTransactionIdentifierIOS || '' : '',
        };

        // Persist a "pending verification" snapshot immediately so we don't lose the purchase
        // if the app is killed before backend verification finishes.
        try {
          const pendingSubSnapshot: any = {
            status: 'pending',
            platform: Platform.OS as 'android' | 'ios',
            plan_id: plan.originalPlan.id,
            planId: plan.originalPlan.id,
            planName: plan.title,
            plan_sort_order: (plan.originalPlan as any)?.sort_order ?? null,
            product_id: purchase.productId,
            base_plan_id: Platform.OS === 'android' ? plan.originalPlan.base_plan_product_id : null,
            // keep both for compatibility
            transaction_id:
              Platform.OS === 'android'
                ? purchaseAny.purchaseToken || purchaseAny.orderId || purchase.transactionId
                : purchase.transactionId,
            transactionId: purchaseDataForBackend.transactionId,
            purchaseToken: purchaseDataForBackend.purchaseToken ?? null,
            packageName: purchaseDataForBackend.packageName ?? null,
            autoRenewing: purchaseDataForBackend.autoRenewing ?? null,
            purchaseDate: purchaseDataForBackend.purchaseDate ?? null,
            last_purchase_payload: purchaseDataForBackend,
            updated_at: Date.now(),
          };

          await storage.setUserSubscription(pendingSubSnapshot);
          setCurrentSubscription(pendingSubSnapshot);
        } catch (e) {
          console.warn('[SubscriptionModal] Failed to persist pending purchase snapshot', e);
        }

        // Add action hint for backend (upgrade vs deferred downgrade) when applicable.
        try {
          if (Platform.OS === 'android' && currentSub?.transaction_id) {
            const selectedTier = Number((plan.originalPlan as any)?.sort_order);
            const currentTier = Number(
              (currentSub as any)?.plan_sort_order ??
                (currentSub as any)?.sortOrder ??
                (currentSub as any)?.plan?.sort_order ??
                (currentSub as any)?.plan?.sortOrder ??
                NaN
            );
            if (Number.isFinite(selectedTier) && Number.isFinite(currentTier)) {
              if (selectedTier > currentTier) purchaseDataForBackend.action = 'upgrade';
              else if (selectedTier < currentTier)
                purchaseDataForBackend.action = 'deferred_downgrade';
            }
          }
        } catch {
          // ignore
        }

        // 3. Backend Verification
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📡 SENDING TO BACKEND FOR VERIFICATION');
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] Backend Call Details:', {
          scenario: backendPurchaseScenario,
          endpoint: 'verifyPurchase',
          userId: purchaseDataForBackend.userId,
          planId: purchaseDataForBackend.planId,
          transactionId: purchaseDataForBackend.transactionId,
        });
        console.log('[SubscriptionModal] 📡 Sending purchase to backend for verification...');

        const verificationResult = await sendPurchaseToBackend(purchaseDataForBackend);

        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📥 BACKEND VERIFICATION RESPONSE RECEIVED');
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] Backend Verification Response:', {
          scenario: backendPurchaseScenario,
          success: verificationResult.success,
          code: verificationResult.code,
          message: verificationResult.message,
          data: verificationResult.data,
          verified: verificationResult.success,
        });

        if (verificationResult.success) {
          // Persist verified subscription locally (used by Pricing/Profile flows).
          // Keep shape backwards-compatible since some screens expect `planId/planName`,
          // while others expect API-style `plan_id/transaction_id`.
          try {
            const verifiedSub: any = verificationResult.data?.subscription ?? null;
            const normalizedSub: any = verifiedSub
              ? {
                  ...verifiedSub,
                  // ensure both naming conventions exist
                  plan_id: verifiedSub.plan_id ?? verifiedSub.planId ?? plan.originalPlan.id,
                  planId: verifiedSub.planId ?? verifiedSub.plan_id ?? plan.originalPlan.id,
                  planName:
                    verifiedSub.planName ??
                    verifiedSub.plan?.name ??
                    verifiedSub.plan?.title ??
                    plan.title,
                  // Persist tier so we can correctly decide upgrade vs downgrade later
                  plan_sort_order:
                    verifiedSub.plan_sort_order ??
                    verifiedSub.plan?.sort_order ??
                    (plan.originalPlan as any)?.sort_order ??
                    null,
                  status: verifiedSub.status ?? 'active',
                  platform: verifiedSub.platform ?? (Platform.OS as 'android' | 'ios'),
                  product_id: verifiedSub.product_id ?? purchase.productId,
                  base_plan_id:
                    verifiedSub.base_plan_id ??
                    (Platform.OS === 'android' ? plan.originalPlan.base_plan_product_id : null),
                  transaction_id:
                    verifiedSub.transaction_id ??
                    (Platform.OS === 'android'
                      ? purchaseAny.purchaseToken || purchaseAny.orderId || purchase.transactionId
                      : purchase.transactionId),
                }
              : {
                  // Minimal fallback if backend doesn't return subscription object
                  plan_id: plan.originalPlan.id,
                  planId: plan.originalPlan.id,
                  planName: plan.title,
                  plan_sort_order: (plan.originalPlan as any)?.sort_order ?? null,
                  status: 'active',
                  platform: Platform.OS as 'android' | 'ios',
                  product_id: purchase.productId,
                  base_plan_id:
                    Platform.OS === 'android' ? plan.originalPlan.base_plan_product_id : null,
                  transaction_id:
                    Platform.OS === 'android'
                      ? purchaseAny.purchaseToken || purchaseAny.orderId || purchase.transactionId
                      : purchase.transactionId,
                };

            await storage.setUserSubscription(normalizedSub);
            setCurrentSubscription(normalizedSub);
          } catch (e) {
            console.warn('[SubscriptionModal] Failed to persist subscription in storage', e);
          }

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
        setIsProcessingPurchase(false);
        setIsLoading(false);
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
          const now = Date.now();
          const code = error?.code;
          const message = error?.message;
          const last = lastPurchaseErrorRef.current;
          // De-dupe noisy repeated events (common when listeners are accidentally registered multiple times)
          if (last && last.code === code && last.message === message && now - last.at < 2000) {
            return;
          }
          lastPurchaseErrorRef.current = { code, message, at: now };

          console.error('[SubscriptionModal] Purchase error from listener:', error);
          setIsLoading(false);
          setIsProcessingPurchase(false);
          const errorCode = error?.code;
          if (errorCode !== 'E_USER_CANCELLED' && errorCode !== 'E_USER_CANCELED') {
            const errorMessage = error?.message || 'An error occurred during purchase';
            Alert.alert('Purchase Error', errorMessage);
          }
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
    if (isProcessingPurchase) {
      Alert.alert(
        'Purchase in Progress',
        'A purchase is currently being processed. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Close',
            onPress: () => {
              setIsProcessingPurchase(false);
              setIsLoading(false);
              onClose?.();
            },
          },
        ]
      );
    } else {
      onClose?.();
    }
  };

  if (!plan) return null;

  return (
    <View className="absolute inset-0 bg-black/80 items-center justify-center px-6">
      <View className="bg-white w-full rounded-md p-7 max-w-md">
        {/* CLOSE BUTTON */}
        <Pressable
          onPress={handleClose}
          className="absolute right-4 top-4 z-10"
          disabled={isProcessingPurchase}
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
        {currentSubscription && currentSubscription.status === 'active' && (
          <View className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="information-circle" size={20} color="#D97706" className="mr-2" />
              <Text className="text-yellow-800 font-semibold">Active Subscription</Text>
            </View>
            <Text className="text-yellow-700 text-xs mt-1">
              You currently have an active {currentSubscription.plan?.name || 'subscription'}.
              {currentSubscription.plan_id !== plan.originalPlan.id
                ? ' Switching plans will cancel your current subscription.'
                : ' This is the same plan you already have.'}
            </Text>
          </View>
        )}

        {/* Purchase Status Indicator */}
        {isProcessingPurchase && (
          <View className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#23A76F" className="mr-2" />
              <Text className="text-blue-700 font-medium">Processing your purchase...</Text>
            </View>
            <Text className="text-blue-600 text-sm mt-1">
              Please wait while we confirm your payment.
            </Text>
          </View>
        )}

        {/* SUBSCRIBE BUTTON */}
        <Pressable
          onPress={handleSubscribe}
          disabled={
            isLoading ||
            isProcessingPurchase ||
            !iapInitialized ||
            (currentSubscription?.plan_id === plan.originalPlan.id &&
              currentSubscription.status === 'active')
          }
          className={`mt-5 rounded-xl overflow-hidden ${
            isLoading ||
            isProcessingPurchase ||
            !iapInitialized ||
            (currentSubscription?.plan_id === plan.originalPlan.id &&
              currentSubscription.status === 'active')
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
