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
        const subscription = await storage.getUserSubscription();
        setCurrentSubscription(subscription);
        if (subscription) {
          console.log('[SubscriptionModal] Current subscription loaded from storage', {
            planId: subscription.plan_id,
            status: subscription.status,
            platform: subscription.platform,
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          '[SubscriptionModal] Failed to load subscription from storage:',
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

    const basePlanId =
      Platform.OS === 'android' ? plan.originalPlan.base_plan_product_id || null : null;
    const offerPlanId = Platform.OS === 'android' ? plan.originalPlan.offer_plan_id || null : null;

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

        // STEP 1: Log ALL available offers from Google Play with their details
        console.log('[SubscriptionModal] 📋 All subscription offers from Google Play:', {
          productId,
          totalOffers: offers.length,
          offers: offers.map((o: any) => ({
            basePlanId: o.basePlanId,
            offerId: o.offerId,
            offerToken: o.offerToken,
            offerTokenPreview: o.offerToken?.substring(0, 40) + '...',
            price: o.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice,
            pricingPhasesCount: o.pricingPhases?.pricingPhaseList?.length || 0,
            hasMultiplePhases: (o.pricingPhases?.pricingPhaseList?.length || 0) > 1,
            allPhases: o.pricingPhases?.pricingPhaseList?.map((phase: any) => ({
              price: phase.formattedPrice,
              billingPeriod: phase.billingPeriod,
              billingCycleCount: phase.billingCycleCount,
            })),
          })),
        });

        // STEP 2: Match the basePlanId (e.g., 'premium-monthly')
        console.log('[SubscriptionModal] 🔍 Searching for offer:', {
          searchingForBasePlanId: basePlanId,
          searchingForOfferId: offerPlanId,
          availableBasePlanIds: [...new Set(offers.map((o: any) => o.basePlanId))],
        });

        let selectedOffer = offers.find((o: any) => o.basePlanId === basePlanId);

        // If an offerId/discount is specified, use that specific offer
        if (offerPlanId && selectedOffer) {
          const matchingOffer = offers.find(
            (o: any) => o.basePlanId === basePlanId && o.offerId === offerPlanId
          );
          if (matchingOffer) {
            selectedOffer = matchingOffer;
            console.log('[SubscriptionModal] ✅ Found specific offer with offerId:', {
              basePlanId: matchingOffer.basePlanId,
              offerId: matchingOffer.offerId,
            });
          }
        }

        if (!selectedOffer) {
          console.error('[SubscriptionModal] ❌ No matching offer found!', {
            searchingForBasePlanId: basePlanId,
            searchingForOfferId: offerPlanId,
            availableOffers: offers.map((o: any) => ({
              basePlanId: o.basePlanId,
              offerId: o.offerId,
            })),
          });
          throw new Error(
            `No offer found for basePlanId: ${basePlanId}. ` +
              `Available basePlanIds: ${offers.map((o: any) => o.basePlanId).join(', ')}`
          );
        }

        if (!selectedOffer.offerToken) {
          throw new Error(
            `Offer token is missing for basePlanId: ${basePlanId}. ` +
              'Please check your Google Play Console subscription offer configuration.'
          );
        }

        selectedOfferToken = selectedOffer.offerToken;

        // STEP 3: Log the selected offer details
        console.log('[SubscriptionModal] ✅ Selected plan and offer token:', {
          selectedPlan: plan.title,
          planId: plan.originalPlan.id,
          productId,
          basePlanId: selectedOffer.basePlanId,
          offerId: selectedOffer.offerId,
          offerToken: selectedOffer.offerToken,
          offerTokenPreview: selectedOffer.offerToken.substring(0, 40) + '...',
          price: selectedOffer.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice,
          method: fetchMethod,
        });

        // --- 2. PREPARE THE CORRECT REQUEST STRUCTURE FOR v14+ ---
        // CRITICAL: For Android subscriptions with offers, we need the nested structure
        // The "Missing purchase request configuration" error means the structure is wrong
        const subscriptionOffer: any = {
          sku: String(productId), // Must match the productId in skus array
          basePlanId: basePlanId, // REQUIRED: Identifies which base plan
          offerToken: selectedOfferToken, // REQUIRED: The token from Google Play
        };

        // CRITICAL: Include offerId if available - Google Play may need this to show correct price
        if (selectedOffer.offerId) {
          subscriptionOffer.offerId = selectedOffer.offerId;
        }

        const purchaseRequest: any = {
          request: {
            android: {
              // Top-level skus array is REQUIRED for Android Billing Library 5+
              skus: [String(productId)],
              // subscriptionOffers must be inside android object
              subscriptionOffers: [subscriptionOffer],
            },
          },
        };

        // Handle Upgrades/Downgrades (for existing subscriptions)
        if (currentSubscription?.transaction_id) {
          // Add proration properties inside android object
          purchaseRequest.request.android.purchaseToken = currentSubscription.transaction_id;
          purchaseRequest.request.android.prorationMode =
            plan.originalPlan.id > (currentSubscription.plan_id || 0) ? 1 : 4; // 1 = IMMEDIATE, 4 = DEFERRED
        }

        // STEP 4: Log the final purchase request (minimal, just key info)
        console.log('[SubscriptionModal] 🚀 Sending purchase request:', {
          productId,
          basePlanId,
          offerId: selectedOffer.offerId || 'none',
          offerTokenPreview: selectedOfferToken?.substring(0, 40) + '...',
          hasProration: !!currentSubscription?.transaction_id,
          requestStructure: JSON.stringify(purchaseRequest, null, 2),
        });

        // --- 3. EXECUTE PURCHASE REQUEST ---
        // v14+ API: Pass request object with nested android structure
        await (RNIap as any).requestPurchase(purchaseRequest);
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
      console.log('[SubscriptionModal] Purchase update received', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
      });

      // 1. Determine Success State correctly for v14
      // Using type assertion to access platform-specific properties
      const purchaseAny = purchase as any;
      let isPurchaseSuccessful = false;

      if (Platform.OS === 'android') {
        // purchaseStateAndroid: 0 (unspecified), 1 (purchased), 2 (pending)
        isPurchaseSuccessful = purchaseAny.purchaseStateAndroid === 1;
      } else {
        // transactionStateIOS: 1 (purchased), 3 (restored)
        isPurchaseSuccessful = purchaseAny.transactionStateIOS === 1;
      }

      if (!isPurchaseSuccessful) {
        console.warn('[SubscriptionModal] Purchase not successful, skipping backend');
        setIsProcessingPurchase(false);
        return;
      }

      try {
        setIsLoading(true);
        const userData = await storage.getUserData();

        if (!userData?.id || !plan?.originalPlan?.id) {
          throw new Error('User or Plan authentication failed.');
        }

        // 2. Build Payload for Backend
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
          purchaseToken: purchaseAny.purchaseToken || null,

          // iOS specific
          transactionReceipt: purchaseAny.transactionReceipt || null,
        };

        // 3. Backend Verification
        const verificationResult = await sendPurchaseToBackend(purchaseDataForBackend);

        if (verificationResult.success) {
          // 4. CRITICAL: Finish Transaction
          // This tells the store the product was delivered so they can close the billing cycle
          await (RNIap as any).finishTransaction({
            purchase,
            isConsumable: false, // Subscriptions are always non-consumable
          });

          Alert.alert('Success!', 'Subscription activated.', [
            { text: 'OK', onPress: () => onClose?.() },
          ]);
        } else {
          throw new Error('Backend validation failed');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('[SubscriptionModal] Error:', errorMessage);
        Alert.alert('Verification Failed', 'Please contact support if you were charged.');
      } finally {
        setIsProcessingPurchase(false);
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
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: RNIap.Purchase) => {
          console.log('[SubscriptionModal] Purchase update event received');
          await handlePurchaseUpdate(purchase);
        });

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
        console.log('[SubscriptionModal] IAP initialized successfully');
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
    console.log(purchaseData, 'purchaseData we have reached here');
    try {
      const result: VerifyPurchaseResponse = await verifyPurchase(purchaseData);
      console.log('[SubscriptionModal] Backend verification successful', result);

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
