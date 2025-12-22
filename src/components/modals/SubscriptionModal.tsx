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

  // Log when modal receives plan data
  useEffect(() => {
    console.log('[SubscriptionModal] Modal opened with plan:', {
      planName: plan?.title,
      planKey: plan?.key,
      planId: plan?.originalPlan?.id,
      productIds: {
        apple: plan?.originalPlan?.apple_product_id,
        google: plan?.originalPlan?.google_product_id,
      },
      platform: Platform.OS,
      selectedProductId: Platform.select({
        ios: plan?.originalPlan?.apple_product_id,
        android: plan?.originalPlan?.google_product_id,
      }),
    });
  }, [plan]);

  // 2. Initiating the Purchase
  const handleSubscribe = useCallback(async () => {
    console.log('[SubscriptionModal] handleSubscribe called');

    if (!plan?.originalPlan) {
      console.error('[SubscriptionModal] Plan information is missing');
      Alert.alert('Error', 'Plan information is missing.');
      return;
    }

    // Check if IAP is initialized
    if (!iapInitialized) {
      const errorMsg = iapError || 'Payment system is not available.';
      Alert.alert(
        'Payment Unavailable',
        `${errorMsg}\n\n` +
          (Platform.OS === 'android'
            ? 'Please use a device with Google Play Services or a properly configured emulator.'
            : 'Please use a physical iOS device or TestFlight.'),
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('[SubscriptionModal] Plan data available:', {
      planId: plan.originalPlan.id,
      planName: plan.title,
      appleProductId: plan.originalPlan.apple_product_id,
      googleProductId: plan.originalPlan.google_product_id,
    });

    setIsLoading(true);
    setIsProcessingPurchase(true);

    // Get platform-specific product ID (declare outside try for error handling)
    const productId = Platform.select({
      ios: plan.originalPlan.apple_product_id,
      android: plan.originalPlan.google_product_id,
    });

    try {
      console.log('[SubscriptionModal] Platform detection:', {
        platform: Platform.OS,
        selectedProductId: productId,
        allProductIds: {
          apple: plan.originalPlan.apple_product_id,
          google: plan.originalPlan.google_product_id,
        },
      });

      if (!productId) {
        const errorMsg = `Product ID not configured for ${Platform.OS}`;
        console.error('[SubscriptionModal]', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[SubscriptionModal] Initiating purchase for product:', productId);
      console.log('[SubscriptionModal] Purchase configuration:', {
        productId,
        platform: Platform.OS,
        planId: plan.originalPlan.id,
        productIdType: typeof productId,
        productIdLength: productId?.length,
      });

      // Validate productId is not empty
      if (!productId || productId.trim() === '') {
        throw new Error(`Product ID is empty or invalid for ${Platform.OS}`);
      }

      // Fetch subscriptions first to ensure products are loaded in the store
      // This is required for the store to recognize the product IDs
      console.log('[SubscriptionModal] Fetching subscription products before purchase...');
      const productIds = [productId];

      let subscriptions: any[] = [];
      try {
        if ((RNIap as any).getSubscriptions) {
          subscriptions = await (RNIap as any).getSubscriptions(productIds);
          console.log('[SubscriptionModal] Fetched subscriptions:', subscriptions);

          if (!subscriptions || subscriptions.length === 0) {
            throw new Error(
              `Product "${productId}" not found in store. Please verify it's configured in ${
                Platform.OS === 'android' ? 'Google Play Console' : 'App Store Connect'
              }`
            );
          }
        }
      } catch (fetchError: any) {
        console.error('[SubscriptionModal] Failed to fetch subscriptions:', fetchError);
        throw new Error(
          `Unable to load subscription product. Please check your internet connection and try again.`
        );
      }

      console.log(subscriptions, 'subscriptions');

      // This triggers the native payment modal
      // react-native-iap v14+ - use requestPurchase with proper structure for subscriptions
      console.log('[SubscriptionModal] Calling requestPurchase with productId:', productId);

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

      console.log('[SubscriptionModal] Purchase params:', JSON.stringify(purchaseParams, null, 2));
      console.log('[SubscriptionModal] Android skus array:', {
        length: Platform.OS === 'android' ? skusArray.length : 'N/A',
        skus: Platform.OS === 'android' ? skusArray : 'N/A',
        isEmpty: Platform.OS === 'android' ? skusArray.length === 0 : 'N/A',
      });

      await requestPurchase(purchaseParams);

      console.log(
        '[SubscriptionModal] requestSubscription called successfully, waiting for purchase update...'
      );

      // Note: The purchase result will come through the purchaseUpdatedListener
      // We don't set loading to false here because the listener will handle it
    } catch (error: any) {
      setIsLoading(false);
      setIsProcessingPurchase(false);

      console.error('[SubscriptionModal] Purchase initiation error:', {
        code: error.code,
        message: error.message,
        error: error,
      });

      // Check if user cancelled
      if (error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_CANCELED') {
        console.log('[SubscriptionModal] Purchase cancelled by user');
        return;
      }

      // Handle other errors
      let errorMessage = 'Failed to start purchase process.';
      if (error.code === 'E_ITEM_UNAVAILABLE') {
        errorMessage = 'This subscription is not available at the moment.';
        console.error('[SubscriptionModal] Product unavailable:', productId);
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
        console.error('[SubscriptionModal] Network error during purchase');
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Purchase Failed', errorMessage);
    }
  }, [plan, iapInitialized, iapError]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: any) => {
      console.log('[SubscriptionModal] Purchase update received:', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        purchaseStateAndroid: purchase.purchaseStateAndroid,
        transactionStateIOS: purchase.transactionStateIOS,
        fullPurchase: purchase,
      });

      // Check if purchase is successful
      const isPurchaseSuccessful =
        (Platform.OS === 'android' && purchase.purchaseStateAndroid === 1) ||
        (Platform.OS === 'ios' && purchase.transactionStateIOS === 1);

      console.log('[SubscriptionModal] Purchase success check:', {
        isPurchaseSuccessful,
        platform: Platform.OS,
        androidState: purchase.purchaseStateAndroid,
        iosState: purchase.transactionStateIOS,
      });

      if (!isPurchaseSuccessful) {
        console.warn('[SubscriptionModal] Purchase was not successful, state:', {
          androidState: purchase.purchaseStateAndroid,
          iosState: purchase.transactionStateIOS,
          productId: purchase.productId,
        });
        setIsProcessingPurchase(false);
        return;
      }

      console.log('[SubscriptionModal] Purchase successful, processing...');

      try {
        // Get user data and token for backend verification
        const [userData, token] = await Promise.all([storage.getUserData(), storage.getToken()]);

        if (!userData?.id) {
          throw new Error('User not authenticated');
        }

        if (!token) {
          throw new Error('Authentication token missing');
        }

        // Extract purchase data for backend
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

        // Comprehensive console log of all data being sent to backend
        console.log('========================================');
        console.log('[SubscriptionModal] 📤 SENDING SUBSCRIPTION DATA TO BACKEND');
        console.log('========================================');
        console.log(
          '[SubscriptionModal] Endpoint:',
          `${BASE_URL}/api/subscriptions/verify-purchase`
        );
        console.log('[SubscriptionModal] Method: POST');
        console.log('[SubscriptionModal] Platform:', Platform.OS);
        console.log('----------------------------------------');
        console.log('[SubscriptionModal] 📋 COMPLETE PURCHASE DATA:');
        console.log(JSON.stringify(purchaseDataForBackend, null, 2));
        console.log('----------------------------------------');
        console.log('[SubscriptionModal] 🔑 Core Fields:');
        console.log('  - userId:', purchaseDataForBackend.userId);
        console.log('  - planId:', purchaseDataForBackend.planId);
        console.log('  - platform:', purchaseDataForBackend.platform);
        console.log('  - transactionId:', purchaseDataForBackend.transactionId);
        console.log('  - productId:', purchaseDataForBackend.productId);
        console.log('  - purchaseDate:', purchaseDataForBackend.purchaseDate);
        console.log('  - purchaseTime:', purchaseDataForBackend.purchaseTime);
        console.log('  - planName:', purchaseDataForBackend.planName);
        console.log('  - planPrice:', purchaseDataForBackend.planPrice);
        console.log('----------------------------------------');
        if (Platform.OS === 'android') {
          console.log('[SubscriptionModal] 🤖 Android-Specific Fields:');
          console.log(
            '  - purchaseToken:',
            (purchaseDataForBackend as any).purchaseToken || 'MISSING'
          );
          console.log('  - orderId:', (purchaseDataForBackend as any).orderId || 'MISSING');
          console.log('  - dataAndroid:', (purchaseDataForBackend as any).dataAndroid || 'MISSING');
          console.log(
            '  - autoRenewing:',
            (purchaseDataForBackend as any).autoRenewing || 'MISSING'
          );
          console.log('  - packageName:', (purchaseDataForBackend as any).packageName || 'MISSING');
        } else {
          console.log('[SubscriptionModal] 🍎 iOS-Specific Fields:');
          console.log(
            '  - originalTransactionId:',
            (purchaseDataForBackend as any).originalTransactionId || 'MISSING'
          );
          console.log(
            '  - transactionReceipt:',
            (purchaseDataForBackend as any).transactionReceipt
              ? 'PRESENT (length: ' +
                  (purchaseDataForBackend as any).transactionReceipt.length +
                  ')'
              : 'MISSING'
          );
        }
        console.log('----------------------------------------');
        console.log('[SubscriptionModal] 📦 Raw Purchase Object (for reference):');
        console.log(JSON.stringify(purchase, null, 2));
        console.log('========================================');

        // Send to your backend for verification
        console.log('[SubscriptionModal] Sending purchase to backend for verification...');
        const verificationResult = await sendPurchaseToBackend(purchaseDataForBackend);
        console.log('[SubscriptionModal] Backend verification result:', verificationResult);

        if (verificationResult.success) {
          console.log(
            '[SubscriptionModal] Backend verification successful, finishing transaction...'
          );

          // Finish the transaction (MANDATORY)
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
        console.error('[SubscriptionModal] Error processing purchase:', {
          error: error,
          message: error.message,
          stack: error.stack,
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
        console.log('[SubscriptionModal] Initializing IAP connection...');
        console.log('[SubscriptionModal] Platform:', Platform.OS);
        console.log('[SubscriptionModal] Plan available:', !!plan);

        // Initialize connection to App Store/Google Play
        await initConnection();
        console.log('[SubscriptionModal] IAP connection initialized');

        if (!isMounted) return;

        // Clear any pending transactions (important for Android)
        if (Platform.OS === 'android') {
          console.log('[SubscriptionModal] Clearing pending Android transactions...');
          // @ts-ignore - some versions of react-native-iap don't expose this in types
          if ((RNIap as any).flushFailedPurchasesCachedAsPendingAndroid) {
            // @ts-ignore
            await (RNIap as any).flushFailedPurchasesCachedAsPendingAndroid();
            console.log('[SubscriptionModal] Pending Android transactions cleared');
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

          console.log('[SubscriptionModal] Fetching subscription products:', productIds);
          try {
            // Try to get subscriptions to verify they're available
            if ((RNIap as any).getSubscriptions) {
              const subscriptions = await (RNIap as any).getSubscriptions(productIds);
              console.log('[SubscriptionModal] Available subscriptions:', subscriptions);
            }
          } catch (fetchError: any) {
            console.warn(
              '[SubscriptionModal] Could not fetch subscriptions (this is OK if products are configured):',
              fetchError.message
            );
          }
        }

        if (!isMounted) return;

        // Set up purchase success listener
        console.log('[SubscriptionModal] Setting up purchase update listener...');
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: any) => {
          console.log('[SubscriptionModal] Purchase update listener triggered');
          await handlePurchaseUpdate(purchase);
        });

        // Set up purchase error listener
        console.log('[SubscriptionModal] Setting up purchase error listener...');
        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
          console.error('[SubscriptionModal] Purchase error listener triggered:', {
            code: error.code,
            message: error.message,
            error: error,
          });

          setIsLoading(false);
          setIsProcessingPurchase(false);

          // Don't show alert for user cancellation
          const errorCode = (error as any)?.code;
          if (errorCode !== 'E_USER_CANCELLED' && errorCode !== 'E_USER_CANCELED') {
            console.error('[SubscriptionModal] Non-cancellation error, showing alert');
            Alert.alert('Purchase Error', error.message || 'An error occurred during purchase');
          } else {
            console.log('[SubscriptionModal] User cancelled purchase');
          }
        });

        if (!isMounted) return;

        console.log('[SubscriptionModal] IAP initialized successfully, listeners set up');
        setIapInitialized(true);
        setIapError(null);
      } catch (error: any) {
        console.error('[SubscriptionModal] Failed to initialize IAP:', {
          error: error,
          message: error.message,
          code: error.code,
          responseCode: error.responseCode,
          debugMessage: error.debugMessage,
          stack: error.stack,
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
    try {
      console.log('[SubscriptionModal] 🔄 sendPurchaseToBackend called');
      console.log(
        '[SubscriptionModal] Backend endpoint:',
        `${BASE_URL}/api/subscriptions/verify-purchase`
      );

      // Get auth token for backend request
      const token = await storage.getToken();
      if (!token) {
        throw new Error('Authentication token missing');
      }

      console.log('[SubscriptionModal] 🔐 Auth token present:', token ? 'YES' : 'NO');
      console.log('[SubscriptionModal] 📡 Making HTTP POST request...');

      // Send purchase verification to backend
      const response = await fetch(`${BASE_URL}/api/subscriptions/verify-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(purchaseData),
      });

      console.log('[SubscriptionModal] 📥 Backend response received');
      console.log('[SubscriptionModal] Response Status Code:', response.status);
      console.log('[SubscriptionModal] Response Status Text:', response.statusText);
      console.log(
        '[SubscriptionModal] Response Headers:',
        JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('========================================');
        console.error('[SubscriptionModal] ❌ BACKEND ERROR RESPONSE');
        console.error('========================================');
        console.error('[SubscriptionModal] Status Code:', response.status);
        console.error('[SubscriptionModal] Error Response:', errorText);
        console.error('========================================');
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[SubscriptionModal] ✅ Backend verification successful');
      return result;
    } catch (error: any) {
      console.error('========================================');
      console.error('[SubscriptionModal] ❌ BACKEND REQUEST FAILED');
      console.error('========================================');
      console.error('[SubscriptionModal] Error Type:', error.name);
      console.error('[SubscriptionModal] Error Message:', error.message);
      console.error('[SubscriptionModal] Error Stack:', error.stack);
      if (error.response) {
        console.error('[SubscriptionModal] Error Response:', error.response);
      }
      console.error('========================================');
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
