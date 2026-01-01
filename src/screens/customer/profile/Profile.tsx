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
import { deepLinkToSubscriptions, initConnection } from 'react-native-iap';

import { useGetProfile } from '@/api/user/profile/useGetProfile';
import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { CancelSubscriptionModal } from '@/common/components/modals/CancelSubscriptionModal';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { ProfileStackParamList, ProfileUser } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

interface Props {
  navigation: ProfileNavigationProp;
}

const Profile: React.FC<Props> = ({ navigation }) => {
  const { data: profileData } = useGetProfile();
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  console.log('profileData', profileData);

  const [isCopied, setIsCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  const user = profileData?.user as ProfileUser;
  const subscription = profileData?.subscription;

  console.log('subscription', subscription);

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
    const parentNavigator = navigation.getParent?.();
    if (parentNavigator) {
      console.log('[Profile] Navigating to Pricing screen via parent navigator');
      // @ts-ignore - parent navigator has Pricing route in AppStack
      parentNavigator.navigate('Pricing', { fromProfile: true });
    } else {
      console.log('[Profile] Parent navigator not found, trying direct navigation');
      // Fallback: try direct navigation (might work if navigation structure allows)
      // @ts-ignore
      navigation.navigate('Pricing', { fromProfile: true });
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
              <Image source={require('@/assets/icons/green-email.png')} />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
              >
                {user?.email}
              </Text>
            </View>

            {/* Phone */}
            <View className="flex-row items-start gap-3 mb-3">
              <Image source={require('@/assets/icons/green-phone.png')} />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
              >
                {user?.phone}
              </Text>
            </View>

            {/* Member Since */}
            <View className="flex-row items-start gap-3">
              <Image source={require('@/assets/icons/calendar.png')} />
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

                {subscription.next_billing_date && (
                  <Text
                    className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular text-sm mb-1`}
                  >
                    Next billing date: {formatBillingDate(subscription.next_billing_date)}
                  </Text>
                )}

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

                <Button
                  text="Manage Subscription"
                  variant="light"
                  onPress={handleManageSubscription}
                  className={` bg-[#DAE7E0] rounded-[10px]`}
                />
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
                  className={` bg-[#DAE7E0] rounded-[10px]`}
                />
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
              className="flex-row gap-2"
              onPress={() => navigation.navigate('DisputeList')}
            >
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/white-report.png')
                    : require('@/assets/icons/report.png')
                }
                className=""
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
              className="flex-row gap-2"
              onPress={() => navigation.navigate('Settings')}
            >
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/gear-white.png')
                    : require('@/assets/icons/gear.png')
                }
                className=""
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
        onConfirm={handleManageSubscription}
        isLoading={isCancelling}
      />
    </GradientBackground>
  );
};

export default Profile;
