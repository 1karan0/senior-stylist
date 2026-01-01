import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { purchaseUpdatedListener, purchaseErrorListener, initConnection } from 'react-native-iap';
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

  // Fetch current subscription from AsyncStorage when modal opens
  useEffect(() => {
    const loadCurrentSubscription = async () => {
      try {
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📂 LOADING SUBSCRIPTION FROM ASYNCSTORAGE');
        console.log('[SubscriptionModal] ========================================');

        const subscription = await storage.getUserSubscription();
        setCurrentSubscription(subscription);

        if (subscription) {
          console.log('[SubscriptionModal] ✅ Subscription data found in AsyncStorage:', {
            subscriptionId: subscription.id,
            planId: subscription.plan_id,
            status: subscription.status,
            platform: subscription.platform,
            transactionId: subscription.transaction_id,
            createdAt: subscription.created_at,
            updatedAt: subscription.updated_at,
            fullData: JSON.stringify(subscription, null, 2),
          });
          console.log(
            '[SubscriptionModal] ✅ Current subscription loaded from storage successfully'
          );
        } else {
          console.log(
            '[SubscriptionModal] ℹ️ No subscription found in AsyncStorage (first-time user)'
          );
        }

        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] 📂 STORAGE LOAD COMPLETE');
        console.log('[SubscriptionModal] ========================================');
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

    const basePlanId = Platform.OS === 'android' ? deriveAndroidBasePlanId() : null;
    // Note: Only base offers exist in Google Play Console (no promotional offers with offerId)
    // All offers have offerId: null, so we only match by basePlanId
    const offerPlanId = null;

    try {
      if (Platform.OS === 'android') {
        let selectedOfferToken: string | null = null;
        const rnIapAny = RNIap as any;

        // --- 1. FETCH SUBSCRIPTIONS (with fallback for different react-native-iap versions) ---
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
        if (__DEV__) {
          console.log('[SubscriptionModal][DEBUG] offers raw shape', {
            fetchMethod,
            offersCount: offers?.length ?? 0,
            offers: Array.isArray(offers)
              ? offers.map((o: any) => ({
                  basePlanId: o.basePlanId,
                  offerId: o.offerId,
                  hasOfferIdKey: Object.prototype.hasOwnProperty.call(o, 'offerId'),
                  offerTokenPreview: o.offerToken ? String(o.offerToken).slice(0, 16) + '…' : null,
                  keys: Object.keys(o || {}),
                  pricingPhasesCount: o.pricingPhases?.pricingPhaseList?.length ?? 0,
                  firstPhase: o.pricingPhases?.pricingPhaseList?.[0]
                    ? {
                        formattedPrice: o.pricingPhases.pricingPhaseList[0].formattedPrice,
                        billingPeriod: o.pricingPhases.pricingPhaseList[0].billingPeriod,
                        billingCycleCount: o.pricingPhases.pricingPhaseList[0].billingCycleCount,
                        recurrenceMode: o.pricingPhases.pricingPhaseList[0].recurrenceMode,
                      }
                    : null,
                }))
              : offers,
          });
        }

        if (!basePlanId) {
          throw new Error(
            `Android basePlanId is missing for plan "${plan.title}". ` +
              `Expected basePlanId like "basic-monthly". ` +
              `Fix: ensure API returns base_plan_product_id OR plan.slug matches your Play base plan id.`
          );
        }

        // Select offer by matching basePlanId only
        // Note: All offers are base offers (offerId: null), so we only need to match basePlanId
        let selectedOffer: any = offers.find((o: any) => o.basePlanId === basePlanId);

        if (__DEV__) {
          console.log('[SubscriptionModal][DEBUG] selectedOffer details', {
            basePlanId,
            selectedOfferBasePlanId: selectedOffer?.basePlanId,
            selectedOfferOfferId: selectedOffer?.offerId || 'null (base offer)',
            selectedOfferPrice: selectedOffer?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice,
            selectedOfferTokenPreview: selectedOffer?.offerToken
              ? String(selectedOffer.offerToken).slice(0, 16) + '…'
              : null,
          });
        }

        if (!selectedOffer) {
          throw new Error(
            `No offer found for basePlanId: ${basePlanId}. ` +
              `Available basePlanIds: ${[...new Set(offers.map((o: any) => o.basePlanId))].join(
                ', '
              )}`
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

        // CRITICAL: Include basePlanId to help Google Play identify which base plan this offer belongs to
        // Without basePlanId, Google Play may default to the first base plan even with correct offerToken
        if (basePlanId) {
          subscriptionOffer.basePlanId = basePlanId;
        }

        // Note: No promotional offers exist - all offers are base offers with offerId: null
        // So we don't include offerId in the purchase request

        const purchaseRequest: any = {
          // CRITICAL: If `type` is not set to 'subs', react-native-iap treats this as an in-app purchase,
          // and will ignore `subscriptionOffers` => Google Play can default to the first base plan.
          // This structure is compatible with Google Play Billing Library 8.0
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
          // react-native-iap expects these keys for subscription replacement (Billing Library 8.0 compatible)
          purchaseRequest.request.android.purchaseTokenAndroid = currentSubscription.transaction_id;
          // replacementModeAndroid for Billing Library 8.0:
          // 1 = IMMEDIATE_WITH_TIME_PRORATION (charge prorated price immediately)
          // 4 = DEFERRED (defer the change until next renewal)
          const isUpgrade = plan.originalPlan.id > (currentSubscription.plan_id || 0);
          purchaseRequest.request.android.replacementModeAndroid = isUpgrade ? 1 : 4;

          console.log('[SubscriptionModal] 🔄 Subscription Replacement Configuration:', {
            scenario: purchaseScenario,
            currentPlanId: currentSubscription.plan_id,
            newPlanId: plan.originalPlan.id,
            purchaseTokenAndroid: currentSubscription.transaction_id?.substring(0, 40) + '...',
            replacementModeAndroid: purchaseRequest.request.android.replacementModeAndroid,
            replacementModeMeaning:
              purchaseRequest.request.android.replacementModeAndroid === 1
                ? 'IMMEDIATE_WITH_TIME_PRORATION (Upgrade)'
                : 'DEFERRED (Downgrade)',
          });
        } else {
          console.log('[SubscriptionModal] 🆕 First Time Purchase - No replacement mode needed');
        }

        // Final validation - show complete purchase request structure
        console.log('[SubscriptionModal] 🚀 Final Purchase Request:', {
          type: purchaseRequest.type,
          requestStructure: {
            android: {
              skus: purchaseRequest.request.android.skus,
              subscriptionOffers: purchaseRequest.request.android.subscriptionOffers.map(
                (offer: any) => ({
                  sku: offer.sku,
                  basePlanId: offer.basePlanId || 'MISSING',
                  offerId: offer.offerId || 'BASE_OFFER',
                  offerTokenPreview: offer.offerToken?.substring(0, 40) + '...',
                })
              ),
              hasProration: !!purchaseRequest.request.android.purchaseTokenAndroid,
              replacementMode: purchaseRequest.request.android.replacementModeAndroid,
            },
          },
          fullRequest: JSON.stringify(purchaseRequest, null, 2),
        });

        // --- 3. EXECUTE PURCHASE REQUEST ---
        console.log('[SubscriptionModal] 🎯 Calling requestPurchase with:', {
          productId,
          basePlanId,
          hasOfferToken: !!selectedOfferToken,
          requestType: purchaseRequest.type,
        });

        await (RNIap as any).requestPurchase(purchaseRequest);

        console.log(
          '[SubscriptionModal] ✅ requestPurchase called successfully - waiting for purchase update...'
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
      // Determine purchase scenario for logging
      const purchaseScenario =
        !currentSubscription || !currentSubscription.transaction_id
          ? 'FIRST_TIME_PURCHASE'
          : plan?.originalPlan?.id && currentSubscription.plan_id
            ? plan.originalPlan.id > currentSubscription.plan_id
              ? 'UPGRADE'
              : plan.originalPlan.id < currentSubscription.plan_id
                ? 'DOWNGRADE'
                : 'SAME_PLAN'
            : 'UNKNOWN';

      console.log('[SubscriptionModal] ========================================');
      console.log('[SubscriptionModal] 🎉 PURCHASE UPDATE RECEIVED FROM GOOGLE PLAY');
      console.log('[SubscriptionModal] ========================================');
      console.log('[SubscriptionModal] Purchase Scenario:', {
        scenario: purchaseScenario,
        currentPlanId: currentSubscription?.plan_id || 'NONE',
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

      // 1. Determine Success State correctly for v14
      // Using type assertion to access platform-specific properties (purchaseAny already declared above)
      let isPurchaseSuccessful = false;

      if (Platform.OS === 'android') {
        // Check purchaseState: 'purchased' (string) instead of purchaseStateAndroid === 1 (number)
        // Also support legacy purchaseStateAndroid for backward compatibility
        isPurchaseSuccessful =
          purchaseAny.purchaseState === 'purchased' || purchaseAny.purchaseStateAndroid === 1;
        console.log('[SubscriptionModal] ✅ Purchase State Check (Android):', {
          purchaseState: purchaseAny.purchaseState || 'NOT_FOUND',
          purchaseStateAndroid: purchaseAny.purchaseStateAndroid ?? 'NOT_FOUND',
          isPurchaseSuccessful,
          meaning: isPurchaseSuccessful
            ? 'PURCHASED - Proceeding to backend'
            : 'NOT_PURCHASED - Skipping backend',
        });
      } else {
        // transactionStateIOS: 1 (purchased), 3 (restored)
        isPurchaseSuccessful = purchaseAny.transactionStateIOS === 1;
        console.log('[SubscriptionModal] ✅ Purchase State Check (iOS):', {
          transactionStateIOS: purchaseAny.transactionStateIOS,
          isPurchaseSuccessful,
          meaning: isPurchaseSuccessful
            ? 'PURCHASED - Proceeding to backend'
            : 'NOT_PURCHASED - Skipping backend',
        });
      }

      if (!isPurchaseSuccessful) {
        console.warn(
          '[SubscriptionModal] ⚠️ Purchase not successful, skipping backend verification'
        );
        console.warn('[SubscriptionModal] Purchase state details:', {
          platform: Platform.OS,
          androidPurchaseState: Platform.OS === 'android' ? purchaseAny.purchaseState : 'N/A',
          androidPurchaseStateAndroid:
            Platform.OS === 'android' ? purchaseAny.purchaseStateAndroid : 'N/A',
          iosState: Platform.OS === 'ios' ? purchaseAny.transactionStateIOS : 'N/A',
        });
        setIsProcessingPurchase(false);
        return;
      }

      console.log(
        '[SubscriptionModal] ✅ Purchase is successful! Proceeding to backend verification...'
      );

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

        // Using type assertion to access platform-specific properties
        const purchaseDataForBackend: VerifyPurchasePayload = {
          userId: userData.id,
          planId: plan.originalPlan.id,
          platform: Platform.OS as 'android' | 'ios',
          // Android uses orderId for the high-level receipt
          transactionId:
            Platform.OS === 'android'
              ? purchaseAny.orderId || purchase.transactionId
              : purchase.transactionId,
          productId: purchase.productId,
          base_plan_id: Platform.OS === 'android' ? plan.originalPlan.base_plan_product_id : null,
          purchaseDate: purchase.transactionDate,

          // Android specific
          purchaseToken: Platform.OS === 'android' ? purchaseAny.purchaseToken || null : null,

          // iOS specific - For Android, use purchaseToken as transactionReceipt since backend expects it
          transactionReceipt:
            Platform.OS === 'android'
              ? purchaseAny.purchaseToken || null // Android uses purchaseToken as receipt
              : purchaseAny.transactionReceipt || null, // iOS uses actual transactionReceipt
        };

        console.log('[SubscriptionModal] 📤 Purchase Data Prepared for Backend:', {
          scenario: backendPurchaseScenario,
          userId: purchaseDataForBackend.userId,
          planId: purchaseDataForBackend.planId,
          previousPlanId: currentSubscription?.plan_id || null,
          platform: purchaseDataForBackend.platform,
          transactionId: purchaseDataForBackend.transactionId,
          productId: purchaseDataForBackend.productId,
          purchaseToken: purchaseDataForBackend.purchaseToken
            ? purchaseDataForBackend.purchaseToken.substring(0, 40) + '...'
            : 'null',
          transactionReceipt: purchaseDataForBackend.transactionReceipt
            ? purchaseDataForBackend.transactionReceipt.substring(0, 40) + '...'
            : 'null',
          base_plan_id: purchaseDataForBackend.base_plan_id,
          purchaseDate: purchaseDataForBackend.purchaseDate,
          isUpgrade: backendPurchaseScenario === 'UPGRADE',
          isDowngrade: backendPurchaseScenario === 'DOWNGRADE',
          isFirstPurchase: backendPurchaseScenario === 'FIRST_TIME_PURCHASE',
          note:
            Platform.OS === 'android'
              ? 'transactionReceipt set from purchaseToken (Android requirement)'
              : 'transactionReceipt from purchase object (iOS)',
          fullPayload: JSON.stringify(purchaseDataForBackend, null, 2),
        });

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
          // 4. CRITICAL: Finish Transaction
          // This tells the store the product was delivered so they can close the billing cycle
          console.log(
            '[SubscriptionModal] ✅ Backend verification successful! Finishing transaction...'
          );
          await (RNIap as any).finishTransaction({
            purchase,
            isConsumable: false, // Subscriptions are always non-consumable
          });
          console.log('[SubscriptionModal] ✅ Transaction finished successfully!');

          // 5. STORE SUBSCRIPTION DATA IN ASYNCSTORAGE
          // IMPORTANT: Only store for FIRST_TIME_PURCHASE and UPGRADE
          // For DOWNGRADE: The change is deferred (DEFERRED mode), so the current plan
          // continues until the next billing cycle. The backend will update the subscription
          // at the next renewal, so we should NOT update local storage immediately.
          console.log('[SubscriptionModal] ========================================');
          console.log('[SubscriptionModal] 💾 STORING SUBSCRIPTION DATA IN ASYNCSTORAGE');
          console.log('[SubscriptionModal] ========================================');
          console.log('[SubscriptionModal] Storage Decision:', {
            scenario: backendPurchaseScenario,
            shouldStore:
              backendPurchaseScenario === 'FIRST_TIME_PURCHASE' ||
              backendPurchaseScenario === 'UPGRADE',
            reason:
              backendPurchaseScenario === 'DOWNGRADE'
                ? 'SKIP: Downgrade is deferred - current plan continues until renewal. Backend will update at next billing cycle.'
                : backendPurchaseScenario === 'FIRST_TIME_PURCHASE'
                  ? 'STORE: First-time purchase - subscription starts immediately'
                  : backendPurchaseScenario === 'UPGRADE'
                    ? 'STORE: Upgrade is immediate with proration - subscription changes now'
                    : 'UNKNOWN SCENARIO',
          });

          const subscriptionDataFromBackend = verificationResult.data?.subscription;
          const isDowngrade = backendPurchaseScenario === 'DOWNGRADE';

          // Only store subscription data for first-time purchases and upgrades
          // Skip storage for downgrades (deferred changes)
          if (subscriptionDataFromBackend && !isDowngrade) {
            try {
              console.log('[SubscriptionModal] Subscription data from backend:', {
                subscriptionId: subscriptionDataFromBackend.id,
                planId: subscriptionDataFromBackend.plan_id,
                status: subscriptionDataFromBackend.status,
                platform: subscriptionDataFromBackend.platform,
                transactionId: subscriptionDataFromBackend.transaction_id,
                isUpgrade: verificationResult.data?.is_upgrade || false,
                fullData: JSON.stringify(subscriptionDataFromBackend, null, 2),
              });

              // Store subscription data in AsyncStorage
              await storage.setUserSubscription(subscriptionDataFromBackend);
              console.log(
                '[SubscriptionModal] ✅ Subscription data stored in AsyncStorage successfully!'
              );

              // Verify the data was stored correctly
              const storedSubscription = await storage.getUserSubscription();
              if (storedSubscription) {
                console.log(
                  '[SubscriptionModal] ✅ Verification: Data retrieved from AsyncStorage:',
                  {
                    storedPlanId: storedSubscription.plan_id,
                    storedStatus: storedSubscription.status,
                    storedTransactionId: storedSubscription.transaction_id,
                    storedPlatform: storedSubscription.platform,
                    dataMatches: storedSubscription.plan_id === subscriptionDataFromBackend.plan_id,
                  }
                );
              } else {
                console.warn(
                  '[SubscriptionModal] ⚠️ Warning: Could not retrieve stored subscription data'
                );
              }

              // Update current subscription state to reflect the new subscription
              setCurrentSubscription(subscriptionDataFromBackend);
              console.log('[SubscriptionModal] ✅ Current subscription state updated');

              console.log('[SubscriptionModal] ========================================');
              console.log('[SubscriptionModal] 💾 STORAGE COMPLETE');
              console.log('[SubscriptionModal] ========================================');
            } catch (storageError: unknown) {
              const storageErrorMessage =
                storageError instanceof Error ? storageError.message : 'Unknown storage error';
              console.error('[SubscriptionModal] ❌ Failed to store subscription data:', {
                error: storageErrorMessage,
                subscriptionData: subscriptionDataFromBackend,
              });
              // Don't throw - the purchase was successful, storage failure is non-critical
              // but should be logged for debugging
            }
          } else if (isDowngrade) {
            console.log('[SubscriptionModal] ⏭️ Skipping storage for downgrade:', {
              reason:
                'Downgrade is deferred (DEFERRED mode). Current subscription continues until next billing cycle.',
              currentPlanId: currentSubscription?.plan_id || 'NONE',
              newPlanId: plan.originalPlan.id,
              note: 'Backend will update subscription at next renewal. Local storage will be updated when backend syncs.',
            });
            console.log(
              '[SubscriptionModal] ℹ️ Current subscription remains active until renewal date'
            );
          } else {
            console.warn(
              '[SubscriptionModal] ⚠️ Warning: Backend response does not contain subscription data',
              {
                verificationResult: verificationResult,
                hasData: !!verificationResult.data,
                hasSubscription: !!verificationResult.data?.subscription,
              }
            );
          }

          console.log('[SubscriptionModal] ========================================');
          console.log('[SubscriptionModal] ✅ PURCHASE FLOW COMPLETED SUCCESSFULLY');
          console.log('[SubscriptionModal] ========================================');
          console.log('[SubscriptionModal] Complete Purchase Flow Summary:', {
            scenario: backendPurchaseScenario,
            step1_listenerEstablished: '✅ YES',
            step2_purchaseRequestSent: '✅ YES',
            step3_purchaseUpdateReceived: '✅ YES',
            step4_purchaseStateVerified: '✅ YES',
            step5_backendCalled: '✅ YES',
            step6_backendVerified: '✅ YES',
            step7_transactionFinished: '✅ YES',
            step8_subscriptionStored: isDowngrade
              ? '⏭️ SKIPPED (Deferred - backend updates at renewal)'
              : subscriptionDataFromBackend
                ? '✅ YES'
                : '⚠️ NO DATA',
            previousPlanId: currentSubscription?.plan_id || 'NONE',
            newPlanId: plan.originalPlan.id,
            storedPlanId: isDowngrade
              ? currentSubscription?.plan_id || 'NONE (kept current)'
              : subscriptionDataFromBackend?.plan_id || 'NONE',
            transactionId: purchase.transactionId,
            productId: purchase.productId,
            isUpgrade: verificationResult.data?.is_upgrade || false,
            isDowngrade: isDowngrade,
            downgradeNote: isDowngrade
              ? 'Current plan continues until next billing cycle. Backend will update subscription at renewal.'
              : null,
          });

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
      }
    },
    [plan, onClose, currentSubscription]
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

        // 3. Pre-fetch check (optional - helps verify products are available)
        if (plan?.originalPlan) {
          const productId =
            Platform.OS === 'android'
              ? plan.originalPlan.google_product_id
              : plan.originalPlan.apple_product_id;

          if (productId) {
            try {
              // Try to fetch subscription/product details (optional check)
              // Using type assertion as getSubscriptions/getProducts might not be in TypeScript definitions
              // Use more defensive checks to avoid "is not a function" errors
              const rnIapAny = RNIap as any;

              if (typeof rnIapAny.getProducts === 'function') {
                const products = await rnIapAny.getProducts({
                  skus: [productId],
                });
                console.log('[SubscriptionModal] Products loaded:', products?.length || 0);
              } else if (typeof rnIapAny.getSubscriptions === 'function') {
                const subs = await rnIapAny.getSubscriptions({ skus: [productId] });
                console.log('[SubscriptionModal] Subscriptions loaded:', subs?.length || 0);
              } else if (typeof rnIapAny.fetchProducts === 'function') {
                // Fallback to fetchProducts with type: 'subs'
                try {
                  const products = await rnIapAny.fetchProducts({
                    skus: [productId],
                    type: 'subs',
                  });
                  console.log(
                    '[SubscriptionModal] Subscriptions loaded (via fetchProducts):',
                    products?.length || 0
                  );
                } catch {
                  // Try without type parameter
                  const products = await rnIapAny.fetchProducts({
                    skus: [productId],
                  });
                  console.log(
                    '[SubscriptionModal] Products loaded (via fetchProducts):',
                    products?.length || 0
                  );
                }
              } else {
                console.log(
                  '[SubscriptionModal] No subscription fetching methods available for pre-fetch'
                );
              }
            } catch (fetchError: unknown) {
              const errorMessage =
                fetchError instanceof Error ? fetchError.message : 'Unknown error';
              console.warn('[SubscriptionModal] Pre-fetch warning:', errorMessage);
              // Don't block initialization if fetch fails (could be network or product not configured)
            }
          }
        }

        if (!isMounted) return;

        // 4. Setup Listeners
        console.log('[SubscriptionModal] ✅ Setting up purchase update listener...');
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: RNIap.Purchase) => {
          console.log('[SubscriptionModal] ========================================');
          console.log('[SubscriptionModal] 🔔 PURCHASE UPDATE LISTENER TRIGGERED');
          console.log('[SubscriptionModal] ========================================');
          console.log('[SubscriptionModal] Listener triggered with purchase:', {
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            timestamp: new Date().toISOString(),
            listenerActive: true,
          });
          console.log(
            '[SubscriptionModal] ✅ Listener is working! Passing data to handlePurchaseUpdate...'
          );
          await handlePurchaseUpdate(purchase);
        });
        console.log('[SubscriptionModal] ✅ Purchase update listener established and listening');

        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
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
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] ✅ IAP INITIALIZATION COMPLETE');
        console.log('[SubscriptionModal] ========================================');
        console.log('[SubscriptionModal] IAP Status:', {
          initialized: true,
          listenerEstablished: !!purchaseUpdateSubscription,
          errorListenerEstablished: !!purchaseErrorSubscription,
          platform: Platform.OS,
          readyForPurchases: true,
        });
        console.log(
          '[SubscriptionModal] ✅ IAP initialized successfully - Ready to handle purchases'
        );
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
      console.log('[SubscriptionModal] 📞 Making API request to backend...');
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
      console.error('[SubscriptionModal] Backend request failed', {
        message: error.message,
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
