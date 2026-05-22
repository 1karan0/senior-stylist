import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { deepLinkToSubscriptions, initConnection, finishTransaction } from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { useIsFocused } from '@react-navigation/native';

import { useSendEmailVerification } from '@/api/auth/useSendEmailVerification';
import { useVerifyEmailApi } from '@/api/auth/useVerifyEmail';
import { useVerifyExistingPhone } from '@/api/auth/useVerifyExistingPhone';
import { restorePurchase, type RestorePurchasePayload } from '@/api/subscription/verifyPurchase';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useGetQuestionnaireStatus } from '@/api/user/questionnaire/useGetQuestionnaire';

import Button from '@/common/components/Button';
import InfoModal from '@/common/components/modals/InfoModal';
import GradientBackground from '@/common/components/GradientBackground';
import { CancelSubscriptionModal } from '@/common/components/modals/CancelSubscriptionModal';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { ProfileStackParamList, ProfileUser } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ActiveStylist from '@/common/components/ActiveStylists';
import PhoneVerificationPrompt from '@/common/components/PhoneVerificationPrompt';
import CompleteQuestions from '@/common/components/CompleteQuestions';
import { useTabletLayout } from '@/hooks/useTabletLayout';
type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

interface Props {
  navigation: ProfileNavigationProp;
}

const Profile: React.FC<Props> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { logout, user, exitGuest } = useAuth();
  const { data: profileData, refetch: refetchProfile } = useGetProfile({
    // Poll every 5s while this screen is visible so subscription/profile updates show live
    refetchInterval: isFocused && !!user ? 5_000 : false,
    refetchIntervalInBackground: false,
    enabled: !!user,
  });
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding } = useTabletLayout();
  const [isCopied, setIsCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoreModalVariant, setRestoreModalVariant] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');
  const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [verifyTimer, setVerifyTimer] = useState(30);
  const [isVerifyTimerActive, setIsVerifyTimerActive] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [emailVerificationVariant, setEmailVerificationVariant] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');
  const emailOtpRefs = React.useRef<Array<TextInput | null>>([]);
  const { data: questionnaireStatus } = useGetQuestionnaireStatus({
    enabled: !!user,
    refetchOnMount: 'always',
  });
  const shouldShowCompleteQuestions =
    (questionnaireStatus?.missingRequiredQuestionIds?.length ?? 0) > 0 ||
    (questionnaireStatus?.unansweredQuestionIds?.length ?? 0) > 0 ||
    questionnaireStatus?.setupComplete === false ||
    (questionnaireStatus == null && user?.has_new_questionnaire_questions === true);
  const sendEmailVerificationMutation = useSendEmailVerification();
  const verifyEmailMutation = useVerifyEmailApi();
  const verifyExistingPhoneMutation = useVerifyExistingPhone();

  const dismissRestoreModal = () => {
    setRestoreMessage('');
    setRestoreModalVariant('info');
  };

  const dismissEmailVerificationModal = () => {
    setEmailVerificationMessage('');
    setEmailVerificationVariant('info');
  };

  console.log('user========', user);
  console.log('profileData========', profileData);

  useEffect(() => {
    if (!isVerifyTimerActive) return;

    const timer = setInterval(() => {
      setVerifyTimer((prev) => {
        if (prev <= 1) {
          setIsVerifyTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerifyTimerActive]);

  const profileuser = profileData?.user as ProfileUser;
  const subscription = profileData?.subscription;
  const hasSubscription = !!subscription;
  const emailStatus = profileuser?.email_status;
  const phoneStatus = profileuser?.phone_status;
  const shouldVerifyPhone = phoneStatus === true;

  if (!user) {
    return (
      <GradientBackground>
        <View className="flex-1 pb-10" style={{ paddingHorizontal: horizontalPadding }}>
          <View className="px-5 py-5">
            <Text
              className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Profile
            </Text>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Text
              className={`text-base text-center mb-4 ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }`}
            >
              Please log in to access your profile.
            </Text>
            <Button text="Login" variant="gradient" onPress={exitGuest} className="w-4/5" />
          </View>
        </View>
      </GradientBackground>
    );
  }

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
    const code = profileuser?.referral_code;
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
    if (profileuser) {
      navigation.navigate('EditProfile', { profile: profileuser });
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
      // @ts-ignore - Pricing is defined in AppStack
      appStackNavigator.navigate('Pricing', { fromProfile: true });
      return;
    }

    if (tabNavigator) {
      // @ts-ignore - might work in alternative navigator setups
      tabNavigator.navigate('Pricing', { fromProfile: true });
      return;
    }
    // @ts-ignore
    navigation.navigate('Pricing', { fromProfile: true });
  };

  const handleRestorePurchase = async () => {
    try {
      setIsRestoring(true);
      await RNIap.initConnection();

      const availablePurchases = await RNIap.getAvailablePurchases();

      if (!availablePurchases || availablePurchases.length === 0) {
        setRestoreModalVariant('info');
        setRestoreMessage("We couldn't find any previous purchases for this account.");
        return;
      }

      for (const purchase of availablePurchases) {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        const restorePayload: RestorePurchasePayload = {
          // iOS uses transactionId; Android uses purchaseToken (critical for Google)
          purchaseToken: purchase.purchaseToken,
          transactionId: purchase.transactionId || '',
          platform,
        };

        const result = await restorePurchase(restorePayload);

        if (result.status === 'success') {
          // ✅ MUST finish transaction on BOTH platforms in 2026
          await finishTransaction({ purchase, isConsumable: false });

          setRestoreModalVariant('success');
          setRestoreMessage('Your subscription has been successfully restored.');
          return;
        } else {
          setRestoreModalVariant('error');
          setRestoreMessage('Failed to restore subscription. Please try again.');
          return;
        }
      }
    } catch (error: any) {
      if (error.code !== 'E_USER_CANCELLED') {
        setRestoreModalVariant('error');
        setRestoreMessage(
          typeof error?.message === 'string'
            ? error.message
            : 'Something went wrong. Please try again.'
        );
      }
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

  const handleOtpChange = (value: string, index: number) => {
    const nextValue = value.replace(/[^0-9]/g, '').slice(0, 1);
    const updated = [...emailOtp];
    updated[index] = nextValue;
    setEmailOtp(updated);

    if (nextValue && index < updated.length - 1) {
      emailOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleSendEmailCode = async (openModal = false) => {
    try {
      const response = await sendEmailVerificationMutation.mutateAsync();
      setVerifyTimer(30);
      setIsVerifyTimerActive(true);
      setEmailOtp(['', '', '', '', '', '']);
      if (openModal) {
        setShowVerifyEmailModal(true);
      }
    } catch (error: any) {
      console.log('error====', error);
      setEmailVerificationVariant('error');
      setEmailVerificationMessage(
        typeof error?.message === 'string'
          ? error.message
          : 'Failed to send verification code. Please try again.'
      );
    }
  };

  const handleOpenVerifyEmailModal = async () => {
    await handleSendEmailCode(true);
  };

  const handleVerifyEmailCode = async () => {
    const code = emailOtp.join('');
    if (!profileuser?.email || code.length !== 6) return;

    try {
      await verifyEmailMutation.mutateAsync({
        email: profileuser.email,
        code,
      });
      setShowVerifyEmailModal(false);
      setEmailVerificationVariant('success');
      setEmailVerificationMessage('Your email has been verified successfully.');
      refetchProfile();
    } catch (error: any) {
      setEmailVerificationVariant('error');
      setEmailVerificationMessage(
        typeof error?.message === 'string'
          ? error.message
          : 'Invalid verification code. Please try again.'
      );
    }
  };

  const handleResendEmailCode = async () => {
    if (isVerifyTimerActive || sendEmailVerificationMutation.isPending) return;
    await handleSendEmailCode(false);
  };

  const isEmailOtpComplete = emailOtp.every((digit) => digit !== '');
  const androidVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);
  const isAndroid13 = androidVersion <= 33;
  const phoneDisplay = [profileuser?.phone_country_code, user?.phone]
    .filter(Boolean)
    .join(' ')
    .trim();
  const phoneE164 =
    profileuser?.phone_e164 || `${profileuser?.phone_country_code || ''}${user?.phone || ''}`;
  const handleVerifyExistingPhone = async (firebaseIdToken: string) => {
    const response = await verifyExistingPhoneMutation.mutateAsync(firebaseIdToken);
    console.log('response========', response);
    await refetchProfile();
  };

  return (
    <GradientBackground>
      <View className="flex-1 pb-10 ">
        {/* Header */}
        <View className="mt-6" style={[{ paddingHorizontal: horizontalPadding }]}>
          {shouldShowCompleteQuestions && <CompleteQuestions />}
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Profile
          </Text>
        </View>
        <ScrollView
          className="flex-1"
          style={[{ paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          <View className="mb-4 mt-2">
            <ActiveStylist />
          </View>
          {shouldVerifyPhone ? (
            <PhoneVerificationPrompt
              phoneE164={phoneE164}
              phoneDisplay={phoneDisplay}
              isSubmitting={verifyExistingPhoneMutation.isPending}
              onVerifyToken={handleVerifyExistingPhone}
              autoOpenIntro={false}
            />
          ) : null}
          {/* ---------- Profile Card ---------- */}
          <View
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}  rounded-2xl p-4 border`}
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
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
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
                className={` font-poppins-regular text-sm ${isDark ? ` ${emailStatus === true ? 'text-error' : 'text-textSecondary'}` : ` ${emailStatus === true ? 'text-error' : 'text-[#6A6B6E]'}`}`}
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
                {profileuser?.phone_country_code} {profileuser?.phone}
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
            {emailStatus === true && (
              <View className="mt-4">
                <Button
                  text="Verify Email"
                  variant="gradient"
                  onPress={handleOpenVerifyEmailModal}
                  loading={sendEmailVerificationMutation.isPending && !showVerifyEmailModal}
                />
              </View>
            )}
          </View>

          {/* ---------- Subscription ---------- */}
          <View
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
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
                    {subscription.scheduled_change?.type === 'downgrade' &&
                    subscription.scheduled_change?.to_plan_name
                      ? `From the next billing cycle (${formatBillingDate(
                          subscription.scheduled_change?.effective_at
                        )}), your plan will downgrade to ${subscription.scheduled_change.to_plan_name} after next billing date.`
                      : `Plan change scheduled: ${
                          subscription.scheduled_change?.plan_name || 'Change'
                        } will start on ${formatBillingDate(
                          subscription.scheduled_change?.start_date ||
                            subscription.scheduled_change?.effective_date
                        )}`}
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
                <Pressable
                  onPress={handleRestorePurchase}
                  disabled={isRestoring}
                  className="mb-3 items-center"
                >
                  {isRestoring ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#27B07D" />
                      <Text style={{ color: '#27B07D' }} className="text-base font-poppins-regular">
                        Restore Purchase
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#27B07D' }} className="text-base font-poppins-regular">
                      Restore Purchase
                    </Text>
                  )}
                </Pressable>
                {!!subscription.auto_renew && (
                  <Pressable
                    onPress={() => setShowCancelModal(true)}
                    disabled={isPlatformMismatch}
                    className={`mb-3 items-center ${isPlatformMismatch ? 'opacity-50' : ''}`}
                  >
                    <Text className="text-error text-base font-poppins-regular underline">
                      Cancel Subscription
                    </Text>
                  </Pressable>
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
                <Pressable
                  onPress={handleRestorePurchase}
                  disabled={isRestoring}
                  className="mb-3 items-center"
                >
                  {isRestoring ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#27B07D" />
                      <Text style={{ color: '#27B07D' }} className="text-base font-poppins-regular">
                        Restore Purchase
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#27B07D' }} className="text-base font-poppins-regular">
                      Restore Purchase
                    </Text>
                  )}
                </Pressable>
                {hasSubscription && (
                  <Pressable onPress={() => setShowCancelModal(true)} className="items-center">
                    <Text className="text-error text-base font-poppins-regular underline">
                      Cancel Subscription
                    </Text>
                  </Pressable>
                )}
              </>
            )}
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
      <InfoModal
        visible={!!restoreMessage}
        onClose={dismissRestoreModal}
        onConfirm={dismissRestoreModal}
        title="Restore Purchase"
        message={restoreMessage}
        variant={restoreModalVariant}
      />
      <InfoModal
        visible={!!emailVerificationMessage}
        onClose={dismissEmailVerificationModal}
        onConfirm={dismissEmailVerificationModal}
        title="Email Verification"
        message={emailVerificationMessage}
        variant={emailVerificationVariant}
      />
      <Modal
        visible={showVerifyEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyEmailModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-5">
          <View
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`text-[22px] font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Enter OTP Verification Code
            </Text>
            <Text
              className={`text-[13px] mt-2 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Verification code has been sent to
            </Text>
            <Text
              className={`text-[14px] font-semibold mt-1 ${isDark ? 'text-[#2CCB91]' : 'text-textPrimary'}`}
            >
              {user?.email}
            </Text>

            <View className="flex-row justify-center gap-2 mt-6 mb-4">
              {emailOtp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    emailOtpRefs.current[index] = el;
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && emailOtp[index] === '' && index > 0) {
                      emailOtpRefs.current[index - 1]?.focus();
                      const updated = [...emailOtp];
                      updated[index - 1] = '';
                      setEmailOtp(updated);
                    }
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  className={`${isAndroid13 ? 'w-10 h-12 text-[16px]' : 'w-12 h-14 text-[20px]'}  border border-textPrimary rounded-md mx-1 text-center  ${
                    isDark ? 'bg-commonGradientStop6 text-white' : 'bg-white text-black'
                  }`}
                />
              ))}
            </View>

            <View className="flex-row mb-6 justify-center">
              <Text className={`text-[13px] ${isDark ? 'text-textSecondary' : 'text-[#6B6B6B]'}`}>
                Didn&apos;t receive the code?{' '}
              </Text>
              {isVerifyTimerActive ? (
                <Text className="text-[#2CCB91] font-semibold text-[13px]">
                  {`Resend in ${verifyTimer}s`}
                </Text>
              ) : (
                <Pressable
                  onPress={handleResendEmailCode}
                  disabled={sendEmailVerificationMutation.isPending}
                >
                  {sendEmailVerificationMutation.isPending ? (
                    <ActivityIndicator size="small" color="#2CCB91" />
                  ) : (
                    <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
                  )}
                </Pressable>
              )}
            </View>

            <Button
              text="Verify"
              onPress={handleVerifyEmailCode}
              disabled={!isEmailOtpComplete}
              loading={verifyEmailMutation.isPending}
              variant="gradient"
            />
            <View className="mt-4">
              <Button
                text="Go Back"
                onPress={() => setShowVerifyEmailModal(false)}
                variant="light"
                className={`rounded-[10px] ${
                  isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'
                } border`}
                textClassName={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} text-base font-urbanist-bold`}
              />
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
};

export default Profile;
