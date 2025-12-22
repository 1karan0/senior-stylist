import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  purchaseUpdatedListener,
  purchaseErrorListener,
  initConnection,
  finishTransaction,
  requestPurchase,
} from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { storage } from '@/services/storage';
import { BASE_URL } from '@/config';

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
      stripe_product_id: string | null;
    };
  } | null;
  onClose?: () => void;
}

export default function SubscriptionModal({ plan, onClose }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [iapInitialized, setIapInitialized] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);

  // Log when modal receives plan data (high-level only)
  useEffect(() => {
    if (plan?.originalPlan) {
      console.log('[SubscriptionModal] Modal opened', {
        planId: plan.originalPlan.id,
        planName: plan.title,
        platform: Platform.OS,
      });
    }
  }, [plan]);

  // 2. Initiating the Purchase
  const handleSubscribe = useCallback(async () => {
    if (!plan?.originalPlan) {
      Alert.alert('Error', 'Plan information is missing.');
      return;
    }

    // Check if IAP is initialized
    if (!iapInitialized) {
      const errorMsg = iapError || 'Payment system is not available.';
      Alert.alert('Payment Unavailable', errorMsg, [{ text: 'OK' }]);
      return;
    }

    console.log('[SubscriptionModal] Subscribe pressed', {
      planId: plan.originalPlan.id,
      planName: plan.title,
    });

    setIsLoading(true);
    setIsProcessingPurchase(true);

    // Get platform-specific product ID (declare outside try for error handling)
    const productId = Platform.select({
      ios: plan.originalPlan.apple_product_id,
      android: plan.originalPlan.google_product_id,
    });

    try {
      console.log('[SubscriptionModal] Entered try block', { productId, platform: Platform.OS });

      if (!productId) {
        console.error('[SubscriptionModal] Product ID is null/undefined');
        const errorMsg = `Product ID not configured for ${Platform.OS}`;
        throw new Error(errorMsg);
      }

      console.log(
        '[SubscriptionModal] Initiating purchase - platform:',
        Platform.OS,
        'productId:',
        productId
      );

      // CRITICAL: Simple string logs - if these don't show, execution stopped or logs are filtered
      console.log('[SubscriptionModal] === LOG TEST 1 ===');
      console.log('[SubscriptionModal] === LOG TEST 2 ===');
      console.log('[SubscriptionModal] === LOG TEST 3 ===');
      console.warn('[SubscriptionModal] === WARN TEST ===');
      console.error('[SubscriptionModal] === ERROR TEST ===');

      // Check productId safely
      const productIdType = typeof productId;
      const isEmpty = !productId;
      let isWhitespace = false;
      try {
        isWhitespace = productId && typeof productId === 'string' ? productId.trim() === '' : false;
      } catch (e) {
        console.error('[SubscriptionModal] Error checking productId whitespace:', e);
      }

      console.log('[SubscriptionModal] STEP C: ProductId validation check', {
        productId,
        productIdType,
        isEmpty,
        isWhitespace,
      });

      // Validate productId is not empty
      if (!productId || productId.trim() === '') {
        console.error('[SubscriptionModal] Product ID is empty or invalid', {
          productId,
          isEmpty: !productId,
          isWhitespace: productId?.trim() === '',
        });
        throw new Error(`Product ID is empty or invalid for ${Platform.OS}`);
      }

      console.log('[SubscriptionModal] Step 1: Validating product ID - OK', { productId });

      // Fetch subscriptions first to ensure products are loaded in the store
      // This is required for the store to recognize the product IDs
      const productIds = [productId];
      console.log('[SubscriptionModal] Step 2: Fetching subscriptions from store...', {
        productIds,
      });

      let subscriptions: any[] = [];
      try {
        console.log('[SubscriptionModal] Checking if getSubscriptions is available...');
        if ((RNIap as any).getSubscriptions) {
          console.log('[SubscriptionModal] getSubscriptions is available, calling it...');

          // Add timeout wrapper to prevent hanging
          const getSubscriptionsPromise = (RNIap as any).getSubscriptions(productIds);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('getSubscriptions timeout after 10 seconds')), 10000)
          );

          console.log('[SubscriptionModal] Awaiting getSubscriptions response...');
          subscriptions = (await Promise.race([getSubscriptionsPromise, timeoutPromise])) as any[];

          console.log('[SubscriptionModal] getSubscriptions response received:', {
            count: subscriptions?.length || 0,
            subscriptions: subscriptions,
          });

          if (!subscriptions || subscriptions.length === 0) {
            console.error('[SubscriptionModal] No subscriptions returned from store');
            throw new Error(
              `Product "${productId}" not found in store. Please verify it's configured in ${
                Platform.OS === 'android' ? 'Google Play Console' : 'App Store Connect'
              }`
            );
          }
          console.log('[SubscriptionModal] Step 2: Subscriptions fetched successfully');
        } else {
          console.warn('[SubscriptionModal] getSubscriptions not available, skipping validation');
        }
      } catch (fetchError: any) {
        console.error('[SubscriptionModal] getSubscriptions failed:', {
          code: fetchError.code,
          message: fetchError.message,
          error: fetchError,
          stack: fetchError.stack,
        });
        // Re-throw with more context
        throw new Error(
          `Unable to load subscription product: ${fetchError.message || 'Product not found in store'}. Please verify the product ID "${productId}" is correctly configured in ${
            Platform.OS === 'android' ? 'Google Play Console' : 'App Store Connect'
          }`
        );
      }

      // In react-native-iap v14, requestPurchase for subscriptions requires:
      // { request: { google: { skus: [...] } or apple: { sku: ... } }, type: 'subs' }
      // Ensure skus is a non-empty array for Android
      const skusArray = [productId].filter((id) => id && id.trim() !== '');

      if (Platform.OS === 'android' && skusArray.length === 0) {
        throw new Error('Product ID is required for Android purchase');
      }

      // Build the request object - use both 'google' and 'android' for maximum compatibility
      const purchaseParams = {
        request:
          Platform.OS === 'android'
            ? {
                google: {
                  skus: skusArray, // Android uses 'skus' (plural) as an array - MUST be non-empty
                },
                android: {
                  skus: skusArray, // Also include deprecated 'android' for backward compatibility
                },
              }
            : {
                apple: {
                  sku: productId, // iOS uses 'sku' (singular) as string
                },
                ios: {
                  sku: productId, // Also include deprecated 'ios' for backward compatibility
                },
              },
        type: 'subs' as const, // Specify this is a subscription
      };

      console.log('[SubscriptionModal] Step 3: Calling requestPurchase...', {
        platform: Platform.OS,
        productId,
        skusArray: Platform.OS === 'android' ? skusArray : undefined,
      });

      try {
        await requestPurchase(purchaseParams);
        console.log(
          '[SubscriptionModal] Step 3: requestPurchase called successfully, waiting for purchase update event'
        );
      } catch (requestError: any) {
        console.error('[SubscriptionModal] requestPurchase failed:', {
          code: requestError.code,
          message: requestError.message,
          error: requestError,
        });
        // Re-throw to be caught by outer catch
        throw requestError;
      }

      // Note: The purchase result will come through the purchaseUpdatedListener
      // We don't set loading to false here because the listener will handle it
    } catch (error: any) {
      setIsLoading(false);
      setIsProcessingPurchase(false);

      console.error('[SubscriptionModal] ========== PURCHASE INITIATION ERROR ==========');
      console.error('[SubscriptionModal] Error caught in catch block');
      console.error('[SubscriptionModal] Error details:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error: error,
        productId: productId,
        platform: Platform.OS,
      });
      console.error('[SubscriptionModal] ===============================================');

      // Check if user cancelled
      if (error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_CANCELED') {
        console.log('[SubscriptionModal] Purchase cancelled by user');
        return;
      }

      // Handle specific error codes
      let errorMessage = 'Failed to start purchase process.';
      let errorTitle = 'Purchase Failed';

      if (
        error.code === 'E_ITEM_UNAVAILABLE' ||
        error.message?.includes('not found') ||
        error.message?.includes('could not be found')
      ) {
        errorTitle = 'Product Not Found';
        errorMessage = `The subscription product "${productId}" could not be found in the ${
          Platform.OS === 'android' ? 'Google Play Store' : 'App Store'
        }.\n\nPlease verify:\n• The product ID matches exactly in ${
          Platform.OS === 'android' ? 'Google Play Console' : 'App Store Connect'
        }\n• The product is Active and available\n• You're using the correct app package/account`;
        console.error('[SubscriptionModal] Product not found in store:', {
          productId,
          platform: Platform.OS,
          errorCode: error.code,
        });
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
        console.error('[SubscriptionModal] Network error during purchase');
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    }
  }, [plan, iapInitialized, iapError]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: any) => {
      console.log('[SubscriptionModal] handlePurchaseUpdate called', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        purchaseState: purchase.purchaseState,
        transactionStateIOS: purchase.transactionStateIOS,
      });

      // Check if purchase is successful
      let isPurchaseSuccessful = false;

      if (Platform.OS === 'android') {
        // In v14, Android uses purchase.purchaseState (string) and dataAndroid.purchaseState (number)
        const purchaseState = purchase.purchaseState;
        const purchaseStateString =
          purchaseState !== undefined && purchaseState !== null
            ? String(purchaseState).toLowerCase()
            : undefined;

        let dataAndroidPurchaseState: number | null = null;
        if (purchase.dataAndroid) {
          try {
            const parsed = JSON.parse(purchase.dataAndroid);
            dataAndroidPurchaseState = parsed.purchaseState;
          } catch {
            // ignore parse errors – we'll rely on purchaseStateString
          }
        }

        isPurchaseSuccessful =
          purchaseStateString === 'purchased' ||
          dataAndroidPurchaseState === 0 ||
          (purchaseStateString !== 'canceled' && purchaseStateString !== 'refunded');

        console.log('[SubscriptionModal] Android purchase state', {
          purchaseState,
          purchaseStateString,
          dataAndroidPurchaseState,
          isPurchaseSuccessful,
        });
      } else {
        isPurchaseSuccessful = purchase.transactionStateIOS === 1;
        console.log('[SubscriptionModal] iOS purchase state', {
          transactionStateIOS: purchase.transactionStateIOS,
          isPurchaseSuccessful,
        });
      }

      if (!isPurchaseSuccessful) {
        console.warn('[SubscriptionModal] Purchase not marked successful, skipping backend call', {
          platform: Platform.OS,
          purchaseState: purchase.purchaseState,
          transactionStateIOS: purchase.transactionStateIOS,
          productId: purchase.productId,
        });
        setIsProcessingPurchase(false);
        return;
      }

      console.log('[SubscriptionModal] Purchase successful, processing');

      try {
        // Get user data and token for backend verification
        const [userData, token] = await Promise.all([storage.getUserData(), storage.getToken()]);

        if (!userData?.id) {
          throw new Error('User not authenticated');
        }

        if (!token) {
          throw new Error('Authentication token missing');
        }

        // Extract purchase data for backend (single log before sending)
        const purchaseDataForBackend = {
          userId: userData.id,
          planId: plan?.originalPlan.id,
          platform: Platform.OS,
          transactionId: purchase.transactionId,
          productId: purchase.productId,
          purchaseDate: purchase.transactionDate,

          // Platform-specific verification data
          ...(Platform.OS === 'android' && {
            purchaseToken: purchase.purchaseToken, // CRITICAL for Android verification
            orderId: purchase.orderId,
            dataAndroid: purchase.dataAndroid,
            autoRenewing: purchase.autoRenewingAndroid,
            packageName: purchase.packageNameAndroid,
          }),

          ...(Platform.OS === 'ios' && {
            originalTransactionId: purchase.originalTransactionIdentifierIOS, // CRITICAL for iOS
            transactionReceipt: purchase.transactionReceipt, // CRITICAL for iOS verification
          }),

          // Additional metadata
          planName: plan?.title,
          planPrice: plan?.price,
          purchaseTime: new Date().toISOString(),
        };

        console.log('[SubscriptionModal] Sending purchase to backend for verification');
        console.log(purchaseDataForBackend, 'purchaseDataForBackend we have reached here');
        const verificationResult = await sendPurchaseToBackend(purchaseDataForBackend);
        console.log('[SubscriptionModal] Backend verification result', verificationResult);

        if (verificationResult.success) {
          console.log('[SubscriptionModal] Backend verification successful, finishing transaction');
          await finishTransaction({ purchase, isConsumable: false });
          console.log('[SubscriptionModal] Transaction finished successfully');

          Alert.alert('Success!', 'Your subscription has been activated successfully.', [
            { text: 'OK', onPress: () => onClose?.() },
          ]);

          // Optionally, you can trigger a callback to refresh user subscription status
          // onPurchaseSuccess?.(purchaseDataForBackend);
        } else {
          console.error('[SubscriptionModal] Backend verification failed:', verificationResult);
          throw new Error('Backend verification failed');
        }
      } catch (error: any) {
        console.error('[SubscriptionModal] Error processing purchase', {
          message: error.message,
        });
        Alert.alert(
          'Verification Failed',
          'Purchase was made but could not be verified. Please contact support.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
        setIsProcessingPurchase(false);
        console.log('[SubscriptionModal] Purchase processing completed');
      }
    },
    [plan, onClose]
  );

  // 1. Preparation: Initialize IAP and set up listeners
  useEffect(() => {
    let purchaseUpdateSubscription: any = null;
    let purchaseErrorSubscription: any = null;
    let isMounted = true;

    const initializeIAP = async () => {
      try {
        // Initialize connection to App Store/Google Play
        await initConnection();

        if (!isMounted) return;

        // Clear any pending transactions (important for Android)
        if (Platform.OS === 'android') {
          // @ts-ignore - some versions of react-native-iap don't expose this in types
          if ((RNIap as any).flushFailedPurchasesCachedAsPendingAndroid) {
            // @ts-ignore
            await (RNIap as any).flushFailedPurchasesCachedAsPendingAndroid();
          }
        }

        if (!isMounted) return;

        // Fetch available subscriptions to ensure products are loaded (optional but recommended)
        // This helps ensure the product IDs are recognized by the store
        if (plan?.originalPlan) {
          const productIds =
            Platform.OS === 'android'
              ? [plan.originalPlan.google_product_id]
              : [plan.originalPlan.apple_product_id];

          try {
            // Try to get subscriptions to verify they're available
            if ((RNIap as any).getSubscriptions) {
              const subscriptions = await (RNIap as any).getSubscriptions(productIds);
              console.log(subscriptions, 'subscriptions');
            }
          } catch (fetchError: any) {
            console.warn('[SubscriptionModal] Could not fetch subscriptions:', fetchError.message);
          }
        }

        if (!isMounted) return;

        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: any) => {
          console.log('[SubscriptionModal] Purchase event received from native module');
          await handlePurchaseUpdate(purchase);
        });

        // Set up purchase error listener
        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
          console.error('[SubscriptionModal] Purchase error from listener', {
            code: error.code,
            message: error.message,
          });

          setIsLoading(false);
          setIsProcessingPurchase(false);

          // Don't show alert for user cancellation
          const errorCode = (error as any)?.code;
          if (errorCode !== 'E_USER_CANCELLED' && errorCode !== 'E_USER_CANCELED') {
            Alert.alert('Purchase Error', error.message || 'An error occurred during purchase');
          } else {
            console.log('[SubscriptionModal] User cancelled purchase');
          }
        });

        if (!isMounted) return;

        console.log('[SubscriptionModal] IAP initialized, listeners set up');
        setIapInitialized(true);
        setIapError(null);
      } catch (error: any) {
        console.error('[SubscriptionModal] Failed to initialize IAP', {
          message: error.message,
          code: error.code,
          responseCode: error.responseCode,
          debugMessage: error.debugMessage,
        });

        if (!isMounted) return;

        setIapInitialized(false);

        // Check for specific error codes
        const errorCode = error?.code || '';
        const responseCode = error?.responseCode;

        let errorMessage = 'Failed to initialize payment system.';
        let detailedMessage = '';

        // Android-specific errors
        if (Platform.OS === 'android') {
          if (errorCode === 'init-connection' || responseCode === -1) {
            errorMessage = 'Google Play Services Not Available';
            detailedMessage =
              'In-app purchases require Google Play Services.\n\n' +
              'To test IAP:\n' +
              '1. Use an emulator with Google Play (not Google APIs)\n' +
              '2. Or test on a physical Android device\n' +
              '3. Or build a release APK and install it\n\n' +
              'For development, you can continue testing other features.';
          } else if (errorCode === 'E_ITEM_UNAVAILABLE') {
            errorMessage = 'Products Not Available';
            detailedMessage = 'Subscription products are not configured in Google Play Console.';
          }
        } else {
          // iOS-specific errors
          if (errorCode === 'init-connection') {
            errorMessage = 'App Store Not Available';
            detailedMessage = 'In-app purchases require a physical iOS device or TestFlight.';
          }
        }

        setIapError(errorMessage);

        // Show alert only in development, or if it's a critical error
        if (__DEV__) {
          Alert.alert(
            errorMessage,
            detailedMessage || error.message || 'Please check your device settings and try again.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    initializeIAP();

    // Cleanup listeners when component unmounts
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
  const sendPurchaseToBackend = async (purchaseData: any) => {
    console.log(purchaseData, 'purchaseData we have reached here');
    try {
      // Get auth token for backend request
      const token = await storage.getToken();
      if (!token) {
        throw new Error('Authentication token missing');
      }

      // Send purchase verification to backend
      const response = await fetch(`${BASE_URL}/api/subscriptions/verify-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SubscriptionModal] Backend error response', {
          status: response.status,
          body: errorText,
        });
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[SubscriptionModal] Backend verification successful');
      return result;
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
          disabled={isLoading || isProcessingPurchase || !iapInitialized}
          className={`mt-5 rounded-xl overflow-hidden ${
            isLoading || isProcessingPurchase || !iapInitialized ? 'opacity-70' : ''
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
                {isProcessingPurchase ? 'Processing...' : 'Subscribe'}
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
