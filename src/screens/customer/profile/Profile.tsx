import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useAuth } from '@/contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList, ProfileUser } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

interface Props {
  navigation: ProfileNavigationProp;
}

const Profile: React.FC<Props> = ({ navigation }) => {
  const { data: profile } = useGetProfile();
  const { logout } = useAuth();
  const { isDark } = useTheme();

  const [isCopied, setIsCopied] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  const user = profile as ProfileUser;

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

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 pb-20">
        <ScrollView
          className=""
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* ---------- Header ---------- */}
          <View className="w-full flex-row justify-between items-center ">
            <Text className={` ${isDark ? 'text-white' : 'text-black'} text-2xl font-semibold`}>
              Profile
            </Text>
          </View>

          {/* ---------- Profile Card ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} mt-5 rounded-2xl p-4 border`}
          >
            <View className="flex-row items-center gap-4">
              {/* Avatar */}
              <LinearGradient
                colors={['#2CCB91', '#23A76F']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 100 }}
                className=" h-14 justify-center items-center w-14 px-3 py-1 "
              >
                <View>
                  {user?.profile_picture_url ? (
                    <Image
                      source={{ uri: user.profile_picture_url }}
                      className="h-14 w-14 rounded-full"
                    />
                  ) : (
                    <Text className="text-white text-xl">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </Text>
                  )}
                </View>
              </LinearGradient>

              {/* Name + Role */}
              <View className="flex-1">
                <Text
                  className={`text-2xl ${isDark ? 'text-white' : 'text-textDark'} font-urbanist-bold`}
                >
                  {user?.name}
                </Text>
                <LinearGradient
                  colors={['#2CCB91', '#23A76F']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 10 }}
                  className=" h-6 justify-center items-center text-center  mt-1 w-24 px-3 "
                >
                  <Text className={`text-white text-sm font-urbanist-bold `}>
                    {user?.role || 'Member'}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => {
                if (profile) {
                  navigation.navigate('EditProfile', { profile });
                }
              }}
              className={`mt-4 bg-[#DAE7E0] py-2 px-3 rounded-[10px]`}
            >
              <Text className="text-black text-center font-medium">Edit Profile</Text>
            </TouchableOpacity>
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
            <View className="flex-row items-start gap-3 mb-4">
              <Image source={require('@/assets/icons/green-email.png')} />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-[#6A6B6E]'}`}
              >
                {user?.email}
              </Text>
            </View>

            {/* Phone */}
            <View className="flex-row items-start gap-3 mb-4">
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

            <Text
              className={` ${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular mb-1`}
            >
              Pro Plan – $19.99/month
            </Text>

            <Text
              className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins-regular text-sm mb-4`}
            >
              Next billing date: 25 Dec 2025
            </Text>

            <TouchableOpacity className={`mt-4 bg-[#DAE7E0] py-2 px-3 rounded-[10px]`}>
              <Text className="text-black text-center font-medium">Manage Subscription</Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Rewards ---------- */}
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12 }}
            className=" p-4 mt-5 "
          >
            <View className=" flex-col gap-3">
              <View className="flex-row gap-2">
                <Image source={require('@/assets/icons/gift.png')} />
                <Text className="text-white text-xl font-urbanist-semibold mb-4">Your Rewards</Text>
              </View>

              <View className="flex-row items-center justify-center ">
                <View className="items-center  w-[50%]">
                  <Text className="text-white text-[40px] font-urbanist-bold">1</Text>
                  <Text className="text-white font-poppins-medium text-center text-sm w-[70%]">
                    Free Consultation Sessions
                  </Text>
                </View>
                <View className="items-center  w-[50%] h-full">
                  <Text className="text-white text-[40px] font-urbanist-bold">4</Text>
                  <Text className="text-white font-poppins-medium text-sm">Referrals</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

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
                    style={{ borderRadius: 12 }}
                    className=" p-3 "
                  >
                    <TouchableOpacity onPress={handleCopyCode}>
                      <Image
                        source={
                          isCopied
                            ? require('@/assets/icons/white-check.png')
                            : require('@/assets/icons/copy.png')
                        }
                        className=""
                      />
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              </View>
            </View>
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
    </GradientBackground>
  );
};

export default Profile;
