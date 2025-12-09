import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const { data: profile } = useGetProfile();

  const user = profile as any;

  const { paddingBottom } = useTabBarSafePadding();

  const goToEditProfile = () => navigation.navigate('EditProfile');
  const goToSettings = () => navigation.navigate('Settings');

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
            className={`rounded-2xl border p-4 mb-3 shadow-sm ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
          >
            <View className="items-start mb-4">
              {/* Avatar + Name + Badge + Theme Switch */}
              <View className="flex-row items-start">
                {/* Avatar */}
                <View
                  style={{
                    borderRadius: 28,
                    height: 56,
                    width: 56,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    backgroundColor: '#2CCB91',
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
                </View>

                {/* Name, Badge and Theme Switch */}
                <View className="flex-1 ml-3">
                  <Text
                    className={`text-2xl font-urbanist-bold mb-2 ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    {user?.name}
                  </Text>

                  <View style={{ alignSelf: 'flex-start' }}>
                    <View
                      style={{
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        marginTop: 4,
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 28,
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
                        {user?.role}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity
                onPress={goToEditProfile}
                className="w-full bg-[#DAE7E0] py-3 rounded-xl mt-4"
                activeOpacity={0.8}
              >
                <Text className="text-textDark text-center font-urbanist-bold">Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Information */}
          <View
            className={`rounded-xl border p-6 mb-6 shadow-sm ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
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
            className={`rounded-xl p-6 mb-6 shadow-sm ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
          >
            <Text
              className={`text-xl font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Performance Overview
            </Text>
            <Text
              className={`text-sm font-poppins-regular mb-4 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Pro Plan - $19.99/month
            </Text>

            {/* Stats Row */}
            <View className="flex-row justify-between mb-4">
              {/* Total Earnings */}
              <View
                className={`flex-1 items-center  border  rounded-xl p-4 mr-2 ${isDark ? 'border-commonGradientStop7 bg-transparent' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
              >
                <Ionicons name="trending-up-outline" size={24} color="#10b981" />
                <Text
                  className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  $2,340
                </Text>
                <Text
                  className={`text-xs font-poppins-regular mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Total Earnings
                </Text>
              </View>

              {/* Total Sessions */}
              <View
                className={`flex-1 items-center border rounded-xl p-4 ml-2 ${isDark ? 'border-commonGradientStop7 bg-transparent' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#10b981" />
                <Text
                  className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  156
                </Text>
                <Text
                  className={`text-xs font-poppins-regular mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Total Sessions
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View
              className={`items-center  border rounded-xl p-4 ${isDark ? 'border-commonGradientStop7' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
            >
              <Ionicons name="star" size={28} color="#fbbf24" />
              <Text
                className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                4.8
              </Text>
              <Text
                className={`text-sm text-textMuted font-poppins-regular mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Average Rating
              </Text>
            </View>
          </View>

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
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#FFFFFF' : '#162721'} />
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
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default Profile;
