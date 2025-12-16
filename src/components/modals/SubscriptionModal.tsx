import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  purchaseUpdatedListener,
  purchaseErrorListener,
  initConnection,
  finishTransaction,
} from 'react-native-iap';
import * as RNIap from 'react-native-iap';

interface SubscriptionModalProps {
  plan: {
    key: string;
    title: string;
    price: string;
    priceSub: string;
    desc: string;
    features: string[];
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

  // 2. Initiating the Purchase
  const handleSubscribe = useCallback(async () => {
    if (!plan?.originalPlan) {
      Alert.alert('Error', 'Plan information is missing.');
      return;
    }

    setIsLoading(true);
    setIsProcessingPurchase(true);

    try {
      // Get platform-specific product ID
      const productId = Platform.select({
        ios: plan.originalPlan.apple_product_id,
        android: plan.originalPlan.google_product_id,
      });

      if (!productId) {
        throw new Error(`Product ID not configured for ${Platform.OS}`);
      }

      console.log('Initiating purchase for product:', productId);

      // This triggers the native payment modal
      // @ts-ignore - requestSubscription may not be typed in this version
      await (RNIap as any).requestSubscription({
        sku: productId,

        // Android specific configuration
        ...(Platform.OS === 'android' && {
          // Only pass Android-specific options if supported by the installed IAP version
          subscriptionOffers: [
            {
              sku: productId,
              offerToken: '', // Add offer token if you have promotional offers
            },
          ],
        }),

        // iOS specific configuration
        ...(Platform.OS === 'ios' && {
          andDangerouslyFinishTransactionAutomaticallyIOS: false, // We'll finish manually
        }),
      });

      // Note: The purchase result will come through the purchaseUpdatedListener
      // We don't set loading to false here because the listener will handle it
    } catch (error: any) {
      setIsLoading(false);
      setIsProcessingPurchase(false);

      // Check if user cancelled
      if (error.code === 'E_USER_CANCELLED') {
        console.log('Purchase cancelled by user');
        return;
      }

      // Handle other errors
      console.error('Purchase initiation failed:', error);

      let errorMessage = 'Failed to start purchase process.';
      if (error.code === 'E_ITEM_UNAVAILABLE') {
        errorMessage = 'This subscription is not available at the moment.';
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Purchase Failed', errorMessage);
    }
  }, [plan]);

  // 3. Handling the Purchase Result
  const handlePurchaseUpdate = useCallback(
    async (purchase: any) => {
      console.log('Purchase update received:', purchase);

      // Check if purchase is successful
      const isPurchaseSuccessful =
        (Platform.OS === 'android' && purchase.purchaseStateAndroid === 1) ||
        (Platform.OS === 'ios' && purchase.transactionStateIOS === 1);

      if (!isPurchaseSuccessful) {
        console.log('Purchase was not successful, state:', {
          androidState: purchase.purchaseStateAndroid,
          iosState: purchase.transactionStateIOS,
        });
        setIsProcessingPurchase(false);
        return;
      }

      try {
        // Extract purchase data for backend
        const purchaseDataForBackend = {
          userId: 'current_user_id', // TODO: Replace with actual user ID from your auth
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

        console.log('Sending purchase data to backend:', purchaseDataForBackend);

        // Send to your backend for verification
        const verificationResult = await sendPurchaseToBackend(purchaseDataForBackend);

        if (verificationResult.success) {
          // Finish the transaction (MANDATORY)
          await finishTransaction({ purchase, isConsumable: false });

          Alert.alert('Success!', 'Your subscription has been activated successfully.', [
            { text: 'OK', onPress: () => onClose?.() },
          ]);

          // Optionally, you can trigger a callback to refresh user subscription status
          // onPurchaseSuccess?.(purchaseDataForBackend);
        } else {
          throw new Error('Backend verification failed');
        }
      } catch (error: any) {
        console.error('Error processing purchase:', error);
        Alert.alert(
          'Verification Failed',
          'Purchase was made but could not be verified. Please contact support.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
        setIsProcessingPurchase(false);
      }
    },
    [plan, onClose]
  );

  // 1. Preparation: Initialize IAP and set up listeners
  useEffect(() => {
    let purchaseUpdateSubscription: any = null;
    let purchaseErrorSubscription: any = null;

    const initializeIAP = async () => {
      try {
        // Initialize connection to App Store/Google Play
        await initConnection();

        // Clear any pending transactions (important for Android)
        if (Platform.OS === 'android') {
          // Clear any pending transactions (important for Android)
          // @ts-ignore - some versions of react-native-iap don't expose this in types
          if ((RNIap as any).flushFailedPurchasesCachedAsPendingAndroid) {
            // @ts-ignore
            await (RNIap as any).flushFailedPurchasesCachedAsPendingAndroid();
          }
        }

        // Set up purchase success listener
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: any) => {
          await handlePurchaseUpdate(purchase);
        });

        // Set up purchase error listener
        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
          setIsLoading(false);
          setIsProcessingPurchase(false);

          // Don't show alert for user cancellation
          const errorCode = (error as any)?.code;
          if (errorCode !== 'E_USER_CANCELLED') {
            Alert.alert('Purchase Error', error.message || 'An error occurred during purchase');
          }
        });

        console.log('IAP initialized successfully');
      } catch (error: any) {
        console.error('Failed to initialize IAP:', error);
        Alert.alert('Initialization Error', 'Failed to initialize payment system');
      }
    };

    initializeIAP();

    // Cleanup listeners when component unmounts
    return () => {
      if (purchaseUpdateSubscription?.remove) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription?.remove) {
        purchaseErrorSubscription.remove();
      }
    };
  }, [handlePurchaseUpdate]);

  // Function to send purchase data to your backend
  const sendPurchaseToBackend = async (purchaseData: any) => {
    try {
      // TODO: Replace with your actual backend endpoint
      const response = await fetch('https://your-api.com/api/subscriptions/verify-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_AUTH_TOKEN', // Add auth if needed
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send purchase to backend:', error);
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
          <Text className="text-2xl text-gray-500">×</Text>
        </Pressable>

        {/* PLAN TITLE */}
        <Text className="text-[22px] font-bold text-textPrimary mb-2">{plan.title}</Text>

        {/* PRICES */}
        <View className="flex-row items-baseline gap-1">
          <Text className="text-[24px] font-bold text-textDark">{plan.price}</Text>
          <Text className="text-textDark">{plan.priceSub}</Text>
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
          disabled={isLoading || isProcessingPurchase}
          className={`mt-5 rounded-xl overflow-hidden ${isLoading || isProcessingPurchase ? 'opacity-70' : ''}`}
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
