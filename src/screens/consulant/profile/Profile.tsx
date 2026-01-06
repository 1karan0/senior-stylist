import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Button from '@/common/components/Button';

const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const { data: profileData } = useGetProfile();

  const user = profileData?.user as any;
  const totalSessions = user?.consultant_details?.total_sessions ?? 0;
  const averageRating = user?.consultant_details?.average_rating ?? 0;

  const { paddingBottom } = useTabBarSafePadding();

  const goToEditProfile = () => navigation.navigate('EditProfile');
  const goToSettings = () => navigation.navigate('Settings');
  const goToMyEarning = () => navigation.navigate('MyEarning');
  const goToDisputes = () => navigation.navigate('Disputes');
  return (
    <GradientBackground>
      <View className="flex-1 ">
        {/* Header */}
        <View className="px-5 py-6">
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Profile
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }} // allow last items to scroll above tab bar
        >
          {/* Profile Card */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}  rounded-xl p-4 border mb-5`}
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
              onPress={goToEditProfile}
              className={` bg-[#DAE7E0] rounded-[10px]`}
            />
          </View>

          {/* Account Information */}
          <View
            className={`rounded-xl border p-6 mb-5 shadow-sm ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
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
                  {user?.email}
                </Text>
              </View>

              {/* Phone */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="call-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
                >
                  {user?.phone}
                </Text>
              </View>

              {/* Member Since */}
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
                >
                  Member since {user?.created_at?.split('T')[0]}
                </Text>
              </View>
            </View>
          </View>

          {/* Performance Overview */}
          <View
            className={`rounded-xl p-6 mb-5 shadow-sm ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
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
