import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  deepLinkToSubscriptions,
  initConnection,
  finishTransaction,
  type Purchase,
} from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { useIsFocused } from '@react-navigation/native';

import { useGetProfile } from '@/api/user/profile/useGetProfile';
import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { CancelSubscriptionModal } from '@/common/components/modals/CancelSubscriptionModal';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { ProfileStackParamList, ProfileUser } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { verifyPurchase, type VerifyPurchasePayload } from '@/api/subscription/verifyPurchase';
import { useGetSubscriptionPlans } from '@/api/subscription/useGetSubscriptionPlans';
import { storage } from '@/services/storage';

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

interface Props {
  navigation: ProfileNavigationProp;
}

const IOS_SUBSCRIPTION_ID = 'starter';
const ANDROID_SUBSCRIPTION_ID = 'senior_stylist_subscription_v2';

const Profile: React.FC<Props> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { data: profileData } = useGetProfile({
    // Poll every 5s while this screen is visible so subscription/profile updates show live
    refetchInterval: isFocused ? 5_000 : false,
    refetchIntervalInBackground: false,
  });
  // console.log('profileData', profileData);
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  const [isCopied, setIsCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  const user = profileData?.user as ProfileUser;
  const subscription = profileData?.subscription;
  const hasSubscription = !!subscription;

  // Check if subscription platform doesn't match current device
  const subscriptionPlatform = subscription?.platform?.toLowerCase();
  const currentPlatform = Platform.OS === 'ios' ? 'apple' : 'google';
  const isPlatformMismatch =
    !!subscription && !!subscriptionPlatform && subscriptionPlatform !== currentPlatform;

  // Format next billing date
  const formatBillingDate = (dateString: string | number | null | undefined): string => {
    if (!dateString) return 'N/A';

    try {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : new Date(Number(dateString));
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const handleCopyCode = () => {
    const code = user?.referral_code;
    if (code) {
      Clipboard.setString(code);
      setIsCopied(true);

      // Scale animation for button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade in/out animation for "Copied!" text
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setIsCopied(false));
    }
  };
  const handleEditProfile = () => {
    if (user) {
      navigation.navigate('EditProfile', { profile: user });
    }
  };

  const handleManageSubscription = () => {
    // Navigate to Pricing screen in AppStack (parent navigator)
    // ProfileStack is nested in UserTabs, which is in AppStack
    // We need to navigate to the AppStack level to access Pricing
    // Pass fromProfile: true to indicate this is from Profile/Manage Subscription
    const tabNavigator = navigation.getParent?.(); // ProfileStack -> UserTabs (Tab)
    const appStackNavigator = tabNavigator?.getParent?.(); // UserTabs (Tab) -> AppStack (Stack)

    if (appStackNavigator) {
      console.log('[Profile] Navigating to Pricing screen via AppStack navigator');
      // @ts-ignore - Pricing is defined in AppStack
      appStackNavigator.navigate('Pricing', { fromProfile: true });
      return;
    }

    if (tabNavigator) {
      console.log('[Profile] AppStack navigator not found, trying tab navigator');
      // @ts-ignore - might work in alternative navigator setups
      tabNavigator.navigate('Pricing', { fromProfile: true });
      return;
    }

    console.log('[Profile] Parent navigator not found, trying direct navigation');
    // @ts-ignore
    navigation.navigate('Pricing', { fromProfile: true });
  };

  const handleRestorePurchase = async () => {
    try {
      setIsRestoring(true);

      await RNIap.initConnection();

      const availablePurchases = await RNIap.getAvailablePurchases();
      const activeSubscriptions = await RNIap.getActiveSubscriptions();

      console.log('activeSubscriptions', activeSubscriptions);
      console.log('availablePurchases', availablePurchases);

      // if (!availablePurchases || availablePurchases.length === 0) {
      //   Alert.alert('No Purchases Found', 'No active subscriptions were found for this account.');
      //   return;
      // }

      // // 🔐 STRICT filtering
      // const validPurchases = availablePurchases.filter((purchase: Purchase) => {
      //   if (Platform.OS === 'ios') {
      //     return purchase.productId === IOS_SUBSCRIPTION_ID;
      //   }

      //   if (Platform.OS === 'android') {
      //     return purchase.productId === ANDROID_SUBSCRIPTION_ID;
      //   }

      //   return false;
      // });

      // if (validPurchases.length === 0) {
      //   Alert.alert('No Purchases Found', 'No valid subscriptions for this app were found.');
      //   return;
      // }

      // // Pick most recent purchase
      // const latestPurchase = validPurchases.sort(
      //   (a: Purchase, b: Purchase) =>
      //     Number(b.transactionDate || 0) - Number(a.transactionDate || 0)
      // )[0];

      // // Find planId from productId by matching with subscription plans
      // const matchingPlan = subscriptionPlans?.find(
      //   (plan: { apple_product_id: string; google_product_id: string }) =>
      //     (Platform.OS === 'ios' && plan.apple_product_id === latestPurchase.productId) ||
      //     (Platform.OS === 'android' && plan.google_product_id === latestPurchase.productId)
      // );

      // if (!matchingPlan) {
      //   Alert.alert(
      //     'Restore Failed',
      //     'Could not find matching subscription plan. Please contact support.'
      //   );
      //   return;
      // }

      // // Get user data for userId
      // const userData = await storage.getUserData();
      // if (!userData?.id) {
      //   Alert.alert('Restore Failed', 'User authentication failed. Please try again.');
      //   return;
      // }

      // // Prepare payload for verifyPurchase API
      // const purchaseAny = latestPurchase as any;
      // const purchasePayload: VerifyPurchasePayload = {
      //   userId: userData.id,
      //   planId: matchingPlan.id,
      //   platform: Platform.OS === 'ios' ? 'ios' : 'android',
      //   transactionId:
      //     Platform.OS === 'android'
      //       ? purchaseAny.orderId || latestPurchase.transactionId || ''
      //       : latestPurchase.transactionId || '',
      //   productId: latestPurchase.productId,
      //   base_plan_id: matchingPlan.base_plan_product_id || null,
      //   purchaseDate: latestPurchase.transactionDate || Date.now(),

      //   // Android-specific
      //   purchaseToken: Platform.OS === 'android' ? purchaseAny.purchaseToken || null : null,
      //   orderId: Platform.OS === 'android' ? purchaseAny.orderId || null : null,
      //   packageName: Platform.OS === 'android' ? purchaseAny.packageNameAndroid || null : null,
      //   autoRenewing: Platform.OS === 'android' ? (purchaseAny.autoRenewingAndroid ?? null) : null,

      //   // iOS-specific
      //   transactionReceipt: Platform.OS === 'ios' ? purchaseAny.transactionReceipt || null : null,
      //   originalTransactionId:
      //     Platform.OS === 'ios' ? purchaseAny.originalTransactionIdentifierIOS || null : null,
      // };

      // // 🚀 Send to backend for verification
      // const result = await verifyPurchase(purchasePayload);

      // if (result.status === 'success') {
      //   // ✅ Finish transaction ONLY on iOS
      //   if (Platform.OS === 'ios') {
      //     await finishTransaction({
      //       purchase: latestPurchase,
      //       isConsumable: false,
      //     });
      //   }

      //   Alert.alert('Subscription Restored', 'Your subscription has been restored successfully.');
      // } else {
      //   Alert.alert(
      //     'Restore Failed',
      //     result.message || 'Unable to restore purchases at this time.'
      //   );
      // }
    } catch (error: any) {
      console.error('[RestorePurchase]', error);

      Alert.alert('Restore Failed', error?.message || 'Unable to restore purchases at this time.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);

      // Close the modal first
      setShowCancelModal(false);

      // Initialize react-native-iap connection
      try {
        await initConnection();
      } catch (err) {
        // Connection might already be initialized, continue anyway
        console.log('[Profile] Connection check:', err);
      }

      // Use react-native-iap's deep link to open platform subscription management
      try {
        await deepLinkToSubscriptions();
        console.log('[Profile] Successfully opened subscription management');
      } catch (error: any) {
        console.warn('[Profile] Deep link failed, using fallback:', {
          code: error.code,
          message: error.message,
        });

        // Fallback to web URLs for older devices or unexpected errors
        const url =
          Platform.OS === 'android'
            ? 'https://play.google.com/store/account/subscriptions'
            : 'https://apps.apple.com/account/subscriptions';

        Linking.openURL(url).catch((err) => {
          console.error('[Profile] Fallback URL also failed:', err);
          Alert.alert(
            'Error',
            `Could not open ${Platform.OS === 'android' ? 'Google Play' : 'App Store'} subscription settings. Please visit the link manually.`,
            [{ text: 'OK' }]
          );
        });
      }
    } catch (error: any) {
      console.error('[Profile] Cancel subscription error:', error);
      Alert.alert(
        'Error',
        'Failed to open subscription management. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <GradientBackground>
      <View className="flex-1 pb-10 ">
        {/* Header */}
        <View className="px-5 py-5">
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Profile
          </Text>
        </View>
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          {/* ---------- Profile Card ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}  rounded-2xl p-4 border`}
          >
            <View className="flex-row items-center gap-4 mb-4">
              {/* Avatar */}
              <LinearGradient
                colors={['#2CCB91', '#23A76F']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 28,
                  height: 56,
                  width: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {user?.profile_picture_url ? (
                  <Image
                    source={{ uri: user.profile_picture_url }}
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 28,
                    }}
                  />
                ) : (
                  <Text className="text-white text-xl font-urbanist-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </Text>
                )}
              </LinearGradient>

              {/* Name + Role */}
              <View className="flex-1">
                <Text
                  className={`text-2xl ${isDark ? 'text-white' : 'text-textDark'} font-urbanist-bold`}
                >
                  {user?.name}
                </Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 4,
                    borderRadius: 10,
                    paddingVertical: 4,
                    paddingHorizontal: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#2CCB91',
                  }}
                >
                  <Text
                    className="text-white text-xs font-urbanist-bold"
                    style={{
                      textAlignVertical: 'center',
                      includeFontPadding: false,
                      lineHeight: 14,
                    }}
                  >
                    {user?.role || 'Member'}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              text="Edit Profile"
              variant="light"
              onPress={handleEditProfile}
              className={` bg-[#DAE7E0] rounded-[10px]`}
            />
          </View>

          {/* ---------- Account Information ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
          >
            <Text
              className={`text-[22px] ${isDark ? 'text-white' : 'text-textDark'} font-urbanist-semibold mb-2`}
            >
              Account Information
            </Text>

            {/* Email */}
            <View className="flex-row items-start gap-3 mb-3">
              <Image
                source={require('@/assets/icons/green-email.png')}
                resizeMode="contain"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
              >
                {user?.email}
              </Text>
            </View>

            {/* Phone */}
            <View className="flex-row items-start gap-3 mb-3">
              <Image
                source={require('@/assets/icons/green-phone.png')}
                resizeMode="contain"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
              >
                {user?.phone}
              </Text>
            </View>

            {/* Member Since */}
            <View className="flex-row items-start gap-3">
              <Image
                source={require('@/assets/icons/calendar.png')}
                resizeMode="contain"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
              >
                Member since {user?.created_at?.split('T')[0]}
              </Text>
            </View>
          </View>

          {/* ---------- Subscription ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
          >
            <Text
              className={`text-[22px] ${isDark ? 'text-white' : 'text-textDark'} font-urbanist-semibold mb-2`}
            >
              Subscription
            </Text>

            {subscription ? (
              <>
                <Text
                  className={` ${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular mb-1`}
                >
                  {subscription.plan_name || 'Subscription Plan'}
                  {subscription.consultations_allowed
                    ? ` – ${subscription.consultations_allowed} consultations/month`
                    : ''}
                </Text>

                <Text
                  className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular text-sm mb-1`}
                >
                  Status:{' '}
                  {subscription.status === 'active' ? 'Active' : subscription.status || 'Unknown'}
                </Text>

                {subscription.consultations_remaining !== undefined && (
                  <Text
                    className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular text-sm mb-1`}
                  >
                    Consultations remaining: {subscription.consultations_remaining} /{' '}
                    {subscription.consultations_allowed}
                  </Text>
                )}

                {(() => {
                  const autoRenew = !!subscription.auto_renew;
                  const dateValue = autoRenew
                    ? subscription.next_billing_date
                    : subscription.expires_at || subscription.next_billing_date;

                  if (!dateValue) return null;

                  return (
                    <Text
                      className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular text-sm mb-1`}
                    >
                      {autoRenew ? 'Next billing date' : 'Active till date'}:{' '}
                      {formatBillingDate(dateValue)}
                    </Text>
                  );
                })()}

                {subscription.scheduled_change && (
                  <Text
                    className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'} font-poppins-regular text-sm mb-4`}
                  >
                    Plan change scheduled: {subscription.scheduled_change?.plan_name || 'Change'}{' '}
                    will start on{' '}
                    {formatBillingDate(
                      subscription.scheduled_change?.start_date ||
                        subscription.scheduled_change?.effective_date
                    )}
                  </Text>
                )}

                {!subscription.scheduled_change && <View className="mb-4" />}

                {/* Platform Mismatch Warning */}
                {isPlatformMismatch && (
                  <View
                    className={`mb-4 p-3 rounded-lg border ${
                      isDark
                        ? 'bg-yellow-900/20 border-yellow-700'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <View className="flex-row items-start mb-1">
                      <Ionicons
                        name="warning"
                        size={20}
                        color={isDark ? '#FCD34D' : '#D97706'}
                        style={{ marginRight: 8, marginTop: 2 }}
                      />
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-semibold mb-1 ${
                            isDark ? 'text-yellow-300' : 'text-yellow-800'
                          }`}
                        >
                          Platform Mismatch
                        </Text>
                        <Text
                          className={`text-xs ${isDark ? 'text-yellow-200' : 'text-yellow-700'}`}
                        >
                          {subscriptionPlatform === 'google'
                            ? 'To change or cancel this subscription, please use the Android device where you purchased it.'
                            : 'To change or cancel this subscription, please use the iOS device where you purchased it.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <Button
                  text="Manage Subscription"
                  variant="light"
                  onPress={handleManageSubscription}
                  disabled={isPlatformMismatch}
                  className={` bg-[#DAE7E0] rounded-[10px] mb-3 ${
                    isPlatformMismatch ? 'opacity-50' : ''
                  }`}
                />
                <Button
                  text="Restore Purchase"
                  variant="light"
                  onPress={handleRestorePurchase}
                  loading={isRestoring}
                  className="bg-white border border-[#DAE7E0] rounded-[10px] mb-3"
                />
                {!!subscription.auto_renew && (
                  <Button
                    text="Cancel Subscription"
                    variant="light"
                    onPress={() => setShowCancelModal(true)}
                    disabled={isPlatformMismatch}
                    icon={<Ionicons name="close-circle" size={20} color="#F22D2D" />}
                    className={`bg-white border border-[#DAE7E0] rounded-[10px] ${
                      isPlatformMismatch ? 'opacity-50' : ''
                    }`}
                    textClassName="text-error"
                  />
                )}
              </>
            ) : (
              <>
                <Text
                  className={` ${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular mb-4`}
                >
                  No active subscription
                </Text>

                <Button
                  text="Subscribe Now"
                  variant="light"
                  onPress={handleManageSubscription}
                  className={` bg-[#DAE7E0] rounded-[10px] mb-3`}
                />
                <Button
                  text="Restore Purchase"
                  variant="light"
                  onPress={handleRestorePurchase}
                  loading={isRestoring}
                  className="bg-white border border-[#DAE7E0] rounded-[10px] mb-3"
                />
                {hasSubscription && (
                  <Button
                    text="Cancel Subscription"
                    variant="light"
                    onPress={() => setShowCancelModal(true)}
                    icon={<Ionicons name="close-circle" size={20} color="#F22D2D" />}
                    className="bg-white border border-[#DAE7E0] rounded-[10px]"
                    textClassName="text-error"
                  />
                )}
              </>
            )}
          </View>

          {/* ---------- Rewards ---------- */}
          <View
            className="p-4 mt-5"
            style={{
              borderRadius: 12,
              backgroundColor: '#2CCB91',
            }}
          >
            <View className=" flex-col gap-3">
              <View className="flex-row gap-2">
                <Image source={require('@/assets/icons/gift.png')} />
                <Text className="text-white text-xl font-urbanist-semibold mb-4">Your Rewards</Text>
              </View>

              <View className="flex-row items-center justify-center ">
                <View className="items-center  w-[50%]">
                  <Text className="text-white text-[40px] font-urbanist-bold">
                    {user?.referral_stats?.total_rewards_earned ?? 0}
                  </Text>
                  <Text
                    style={{
                      width: Platform.OS === 'ios' ? '80%' : '100%',
                    }}
                    className="text-white font-poppins-medium text-center text-sm"
                  >
                    Free Consultation Sessions
                  </Text>
                </View>
                <View className="items-center  w-[50%] h-full">
                  <Text className="text-white text-[40px] font-urbanist-bold">
                    {user?.referral_stats?.total_referrals ?? 0}
                  </Text>
                  <Text className="text-white font-poppins-medium text-sm">Referrals</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ---------- Referral Program ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
          >
            <View>
              <View className="flex-row gap-2 items-baseline">
                <Image
                  source={
                    isDark
                      ? require('@/assets/icons/users-white.png')
                      : require('@/assets/icons/users.png')
                  }
                  className=""
                />
                <Text
                  className={`text-[22px] ${isDark ? 'text-white' : 'text-textDark'} font-urbanist-semibold mb-2`}
                >
                  Referral Program
                </Text>
              </View>
              <Text
                className={` ${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular text-sm mb-2 w-[90%]`}
              >
                Share your code with friends and earn free sessions
              </Text>
            </View>

            {/* Code Box */}
            <View className="flex-row justify-between mb-3 relative">
              <View
                className={` w-[80%] items-center text-center bg-[#F5F9F7] border-[#DAE7E0] border rounded-lg py-3 `}
              >
                <Text className="text-black text-base font-urbanist-bold">
                  {user?.referral_code ?? '------'}
                </Text>
              </View>
              <View>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <LinearGradient
                    colors={['#2CCB91', '#23A76F']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 12,
                      width: 48,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <TouchableOpacity
                      onPress={handleCopyCode}
                      style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={
                          isCopied
                            ? require('@/assets/icons/white-check.png')
                            : require('@/assets/icons/copy.png')
                        }
                        style={{
                          width: 24,
                          height: 24,
                        }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              </View>
            </View>
          </View>

          <View
            className={` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} rounded-xl p-4 mt-5 border`}
          >
            <TouchableOpacity
              className="flex-row gap-2 items-center"
              onPress={() => navigation.navigate('DisputeList')}
            >
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/white-report.png')
                    : require('@/assets/icons/report.png')
                }
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text
                className={`${isDark ? 'text-white' : 'text-textDark'} font-urbanist-semibold text-[15px]`}
              >
                Report a Problem
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Settings ---------- */}
          <View
            className={` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} rounded-xl p-4 mt-5 border`}
          >
            <TouchableOpacity
              className="flex-row gap-2 items-center"
              onPress={() => navigation.navigate('Settings')}
            >
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/gear-white.png')
                    : require('@/assets/icons/gear.png')
                }
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text
                className={`${isDark ? 'text-white' : 'text-textDark'} font-urbanist-semibold text-[15px]`}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Logout Button ---------- */}
          <View
            className={` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} rounded-xl p-4 mt-5 border `}
          >
            <TouchableOpacity onPress={logout} className="flex-row items-center gap-2">
              <Image source={require('@/assets/icons/sign-out.png')} />
              <Text className="text-error text-lg font-semibold">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <CancelSubscriptionModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        isLoading={isCancelling}
      />
    </GradientBackground>
  );
};

export default Profile;
