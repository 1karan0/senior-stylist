import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform, Animated } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Button from '@/common/components/Button';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import Clipboard from '@react-native-clipboard/clipboard';
import ActiveStylist from '@/common/components/ActiveStylists';
import PhoneVerificationPrompt from '@/common/components/PhoneVerificationPrompt';
import { useVerifyExistingPhone } from '@/api/auth/useVerifyExistingPhone';

const Profile: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];
  const { isDark } = useTheme();
  const { logout, user } = useAuth();
  const navigation = useNavigation<any>();
  const { data: profileData } = useGetProfile();
  console.log('profileData', profileData);
  console.log('user======', user);

  const ProfileUser = profileData?.user as any;
  const totalSessions = ProfileUser?.consultant_details?.total_sessions ?? 0;
  const averageRating = ProfileUser?.consultant_details?.average_rating ?? 0;
  const phoneStatus = ProfileUser?.phone_status;
  const shouldVerifyPhone = phoneStatus === true;
  const phoneE164 =
    ProfileUser?.phone_e164 ||
    `${ProfileUser?.phone_country_code || ''}${ProfileUser?.phone || ''}`;
  const phoneDisplay = [ProfileUser?.phone_country_code, ProfileUser?.phone]
    .filter(Boolean)
    .join(' ')
    .trim();
  console.log('profileData', profileData);
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding } = useTabletLayout();
  const goToEditProfile = () => navigation.navigate('EditProfile');
  const goToSettings = () => navigation.navigate('Settings');
  const goToMyEarning = () => navigation.navigate('MyEarning');
  const goToDisputes = () => navigation.navigate('Disputes');
  const verifyExistingPhoneMutation = useVerifyExistingPhone();
  const handleCopyCode = () => {
    const code = ProfileUser?.referral_code;
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
  const handleVerifyExistingPhone = async (firebaseIdToken: string) => {
    const response = await verifyExistingPhoneMutation.mutateAsync(firebaseIdToken);
    console.log('response======', response);
  };
  return (
    <GradientBackground>
      <View className="flex-1 ">
        {/* Header */}
        <View className="py-6" style={{ paddingHorizontal: horizontalPadding }}>
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Profile
          </Text>
          <View className="mt-4 ">
            <ActiveStylist />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: horizontalPadding }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }} // allow last items to scroll above tab bar
        >
          <View className="">
            {/* {shouldVerifyPhone ? (
            <PhoneVerificationPrompt
              phoneE164={phoneE164}
              phoneDisplay={phoneDisplay}
              isSubmitting={verifyExistingPhoneMutation.isPending}
              onVerifyToken={handleVerifyExistingPhone}
              autoOpenIntro={false}
            />
          ) : null} */}
          </View>
          {/* Profile Card */}
          <View
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}  rounded-xl p-4 border mb-5`}
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
                {ProfileUser?.profile_picture_url ? (
                  <Image
                    source={{ uri: ProfileUser.profile_picture_url }}
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 28,
                    }}
                  />
                ) : (
                  <Text className="text-white text-xl font-urbanist-bold">
                    {ProfileUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </Text>
                )}
              </LinearGradient>

              {/* Name + Role */}
              <View className="flex-1">
                <Text
                  className={`text-2xl ${isDark ? 'text-white' : 'text-textDark'} font-urbanist-bold`}
                >
                  {ProfileUser?.name}
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
                    {ProfileUser?.role || 'Member'}
                  </Text>
                </View>
              </View>
            </View>

            <Button
              text="Edit Profile"
              variant="light"
              onPress={goToEditProfile}
              className={` bg-[#DAE7E0] rounded-[10px]`}
            />
          </View>

          {/* Account Information */}
          <View
            className={`rounded-xl border p-6 mb-5 shadow-sm ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <Text
              className={`text-xl font-urbanist-semibold mb-4 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Account Information
            </Text>

            <View className="space-y-3">
              {/* Email */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="mail-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
                >
                  {ProfileUser?.email}
                </Text>
              </View>

              {/* Phone */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="call-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
                >
                  {ProfileUser?.phone_country_code} {ProfileUser?.phone}
                </Text>
              </View>

              {/* Member Since */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
                >
                  Member since {ProfileUser?.created_at?.split('T')[0]}
                </Text>
              </View>
              {ProfileUser?.consultant_details?.salon_name ? (
                <View className="flex-row items-center">
                  <Ionicons name="business-outline" size={18} color="#10b981" />
                  <Text
                    className={`font-poppins-regular ml-3 ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
                  >
                    {ProfileUser.consultant_details.salon_name}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Performance Overview */}
          <View
            className={`rounded-xl p-6 mb-5 border shadow-sm ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <Text
              className={`text-xl font-urbanist-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Performance Overview
            </Text>
            {/* Stats Row */}
            <View className="flex-row mb-4">
              {/* Total Sessions */}
              <View
                className={`flex-1 items-center border rounded-xl p-4 mr-1.5 ${isDark ? 'border-commonGradientStop7 bg-transparent' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#10b981" />
                <Text
                  className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  {totalSessions}
                </Text>
                <Text
                  className={`text-xs font-poppins-regular mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Total Sessions
                </Text>
              </View>

              {/* Rating */}
              <View
                className={`flex-1 items-center border rounded-xl p-4 ml-1.5 ${isDark ? 'border-commonGradientStop7' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
              >
                <Image
                  source={require('@/assets/icons/Star.png')}
                  className="w-6 h-6"
                  resizeMode="contain"
                />
                <Text
                  className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  {averageRating.toFixed ? averageRating.toFixed(1) : averageRating}
                </Text>
                <Text
                  className={`text-sm text-textMuted font-poppins-regular mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Average Rating
                </Text>
              </View>
            </View>
          </View>

          {/* ---------- Referral Program ---------- */}
          <View
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mb-5`}
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
                Share your code with friends and earn rewards
              </Text>
            </View>

            {/* Code Box */}
            <View className="flex-row justify-between mb-3 relative">
              <View
                className={` w-[80%] items-center text-center bg-[#F5F9F7] border-[#DAE7E0] border rounded-lg py-3 `}
              >
                <Text className="text-black text-base font-urbanist-bold">
                  {ProfileUser?.referral_code ?? '------'}
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
          <TouchableOpacity
            onPress={goToMyEarning}
            className={`rounded-xl p-4 mb-4 shadow-sm flex-row items-center justify-between border ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/payment-white.png')
                    : require('@/assets/icons/payment-black.png')
                }
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text
                className={`font-urbanist-semibold ml-3 ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Payments
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToDisputes}
            className={`rounded-xl p-4 mb-4 shadow-sm flex-row items-center justify-between border ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
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
                className={`font-urbanist-semibold ml-3 ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Reports
              </Text>
            </View>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            onPress={goToSettings}
            className={`rounded-xl p-4 mb-4 shadow-sm flex-row items-center justify-between border ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={24} color={isDark ? '#FFFFFF' : '#162721'} />
              <Text
                className={`font-urbanist-semibold ml-3 ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Settings
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            onPress={() => logout()}
            className={`border rounded-xl p-4 mb-8 shadow-sm flex-row items-center justify-between ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={24} color="#F22D2D" />
              <Text className="text-error font-urbanist-semibold ml-3">Sign Out</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default Profile;
