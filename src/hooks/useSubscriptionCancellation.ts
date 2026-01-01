import { useState } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as RNIap from 'react-native-iap';
import { initConnection, deepLinkToSubscriptions } from 'react-native-iap';
import { cancelSubscription as cancelSubscriptionAPI } from '@/api/subscription/subscriptionManagement';
import { storage } from '@/services/storage';

interface SubscriptionStatus {
  exists: boolean;
  isActive: boolean;
  autoRenewing?: boolean;
  purchaseToken?: string;
  transactionId?: string;
}

export const useSubscriptionCancellation = () => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Check subscription status using react-native-iap
   * This verifies if a subscription exists and is active
   */
  const checkSubscriptionStatus = async (productId: string): Promise<SubscriptionStatus> => {
    try {
      setIsChecking(true);

      // Initialize connection if not already initialized
      try {
        await RNIap.initConnection();
      } catch (err) {
        // Connection might already be initialized, ignore error
        console.log('[useSubscriptionCancellation] Connection already initialized or failed:', err);
      }

      // Get available purchases
      const purchases = await RNIap.getAvailablePurchases();
      const currentPurchase = purchases.find((p) => p.productId === productId);

      if (!currentPurchase) {
        console.log('[useSubscriptionCancellation] No purchase found for product:', productId);
        return { exists: false, isActive: false };
      }

      const purchaseAny = currentPurchase as any;

      const status: SubscriptionStatus = {
        exists: true,
        isActive:
          Platform.OS === 'android'
            ? purchaseAny.purchaseState === 'purchased'
            : purchaseAny.transactionStateIOS === 1,
        purchaseToken: purchaseAny.purchaseToken,
        transactionId: currentPurchase.transactionId,
      };

      // Android-specific: Check auto-renewal status
      if (Platform.OS === 'android') {
        status.autoRenewing = purchaseAny.autoRenewingAndroid ?? true;
      }

      console.log('[useSubscriptionCancellation] Subscription status:', {
        productId,
        ...status,
      });

      return status;
    } catch (error: any) {
      console.error('[useSubscriptionCancellation] Error checking subscription:', error);
      return { exists: false, isActive: false };
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Cancel subscription via backend API
   * This is the recommended approach as it:
   * - Updates the database
   * - Calls platform APIs (Google Play/Apple)
   * - Provides proper logging and audit trail
   */
  const cancelViaBackend = async (productId?: string) => {
    try {
      setIsCancelling(true);

      // Optional: Verify subscription exists using react-native-iap
      if (productId) {
        const status = await checkSubscriptionStatus(productId);
        if (!status.exists || !status.isActive) {
          throw new Error('No active subscription found. Please verify your subscription status.');
        }
        console.log(
          '[useSubscriptionCancellation] Verified subscription exists before cancellation'
        );
      }

      // Cancel via backend API
      const response = await cancelSubscriptionAPI();

      if (response.status === 'success' && response.data?.subscription) {
        // Update AsyncStorage with cancelled subscription
        await storage.setUserSubscription(response.data.subscription);

        Alert.alert(
          'Subscription Cancelled',
          'Your subscription has been cancelled successfully. Your current subscription will remain active until the end of the current billing cycle and will not auto-renew.',
          [{ text: 'OK' }]
        );

        return response;
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('[useSubscriptionCancellation] Cancellation error:', error);
      Alert.alert(
        'Cancellation Failed',
        error?.message || 'Failed to cancel subscription. Please try again or contact support.',
        [{ text: 'OK' }]
      );
      throw error;
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Redirect user to platform subscription management page using react-native-iap
   * This uses deepLinkToSubscriptions() which provides a better native experience
   * Falls back to web URLs if deep link fails
   */
  const redirectToPlatformSettings = async () => {
    try {
      // Ensure connection is initialized before using deep link
      try {
        await initConnection();
      } catch (err) {
        // Connection might already be initialized, continue anyway
        console.log('[useSubscriptionCancellation] Connection check:', err);
      }

      // Use react-native-iap's deep link function for better native experience
      await deepLinkToSubscriptions();
      console.log('[useSubscriptionCancellation] Successfully opened subscription management');
    } catch (error: any) {
      console.warn('[useSubscriptionCancellation] Deep link failed, using fallback:', {
        code: error.code,
        message: error.message,
      });

      // Fallback to web URLs for older devices or unexpected errors
      const url =
        Platform.OS === 'android'
          ? 'https://play.google.com/store/account/subscriptions'
          : 'https://apps.apple.com/account/subscriptions';

      Linking.openURL(url).catch((err) => {
        console.error('[useSubscriptionCancellation] Fallback URL also failed:', err);
        Alert.alert(
          'Error',
          `Could not open ${Platform.OS === 'android' ? 'Google Play' : 'App Store'} subscription settings. Please visit the link manually.`,
          [{ text: 'OK' }]
        );
      });
    }
  };

  /**
   * Show cancellation options to user
   * Gives user choice between backend cancellation or platform settings
   */
  const showCancellationOptions = (onBackendCancel: () => void) => {
    Alert.alert('Cancel Subscription', 'How would you like to cancel your subscription?', [
      {
        text: 'Cancel via App',
        onPress: onBackendCancel,
        style: 'default',
      },
      {
        text: 'Open Platform Settings',
        onPress: () => redirectToPlatformSettings(),
        style: 'default',
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return {
    checkSubscriptionStatus,
    cancelViaBackend,
    redirectToPlatformSettings,
    showCancellationOptions,
    isCancelling,
    isChecking,
  };
};
