import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useAuth } from '@/contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';
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

  const user = profile as any;

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 pb-20">
        <ScrollView className="">
          {/* ---------- Header ---------- */}
          <View className="w-full flex-row justify-between items-center mb-4">
            <Text className={` ${isDark ? 'text-white' : 'text-black'} text-2xl font-semibold`}>
              Profile
            </Text>
          </View>

          {/* ---------- Profile Card ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border`}
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
                  className={`text-2xl ${isDark ? 'text-white' : 'text-[#162721]'} font-urbanist-bold`}
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
            className={` ${isDark ? 'bg-[#11211c] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
          >
            <Text
              className={`text-[22px] ${isDark ? 'text-white' : 'text-[#162721]'} font-urbanist-semibold mb-2`}
            >
              Account Information
            </Text>

            {/* Email */}
            <View className="flex-row items-start gap-3 mb-4">
              <Image source={require('@/assets/icons/Email.png')} />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#6A6B6E]'}`}
              >
                {user?.email}
              </Text>
            </View>

            {/* Phone */}
            <View className="flex-row items-start gap-3 mb-4">
              <Image source={require('@/assets/icons/Phone.png')} />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#6A6B6E]'}`}
              >
                {user?.phone}
              </Text>
            </View>

            {/* Member Since */}
            <View className="flex-row items-start gap-3">
              <Image source={require('@/assets/icons/Calendar.png')} />
              <Text
                className={` font-poppins-regular text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#6A6B6E]'}`}
              >
                Member since {user?.created_at?.split('T')[0]}
              </Text>
            </View>
          </View>

          {/* ---------- Subscription ---------- */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
          >
            <Text
              className={`text-[22px] ${isDark ? 'text-white' : 'text-[#162721]'} font-urbanist-semibold mb-2`}
            >
              Subscription
            </Text>

            <Text
              className={` ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} font-poppins-regular mb-1`}
            >
              Pro Plan – $19.99/month
            </Text>

            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} font-poppins-regular text-sm mb-4`}
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
                <Image source={require('@/assets/icons/Gift.png')} />
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
            className={` ${isDark ? 'bg-[#11211c] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border mt-5`}
          >
            <View>
              <View className="flex-row gap-2 items-baseline">
                <Image
                  source={
                    isDark
                      ? require('@/assets/icons/UsersWhite.png')
                      : require('@/assets/icons/Users.png')
                  }
                  className=""
                />
                <Text
                  className={`text-[22px] ${isDark ? 'text-white' : 'text-[#162721]'} font-urbanist-semibold mb-2`}
                >
                  Referral Program
                </Text>
              </View>
              <Text
                className={` ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} font-poppins-regular text-sm mb-2 w-[90%]`}
              >
                Share your code with friends and earn free sessions
              </Text>
            </View>

            {/* Code Box */}
            <View className="flex-row justify-between mb-3">
              <View
                className={` w-[80%] items-center text-center bg-[#F5F9F7] border-[#DAE7E0] border rounded-lg py-3 `}
              >
                <Text className="text-black text-base font-urbanist-bold">
                  {user?.referral_code}
                </Text>
              </View>
              <View>
                <LinearGradient
                  colors={['#2CCB91', '#23A76F']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12 }}
                  className=" p-3 "
                >
                  <TouchableOpacity>
                    {/* <Ionicons name="copy-outline" size={20} color="white" /> */}
                    <Image source={require('@/assets/icons/Copy.png')} className="" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>

            {/* Share Button */}
            <LinearGradient
              colors={['#2CCB91', '#23A76F']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10 }}
              className=" py-2 px-3 "
            >
              <TouchableOpacity className=" rounded-lg">
                <Text className="text-white font-urbanist-bold text-base text-center">
                  Share Referral Link
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ---------- Settings ---------- */}
          <View
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-xl py-[8px] px-[20px] mt-5 border`}
          >
            <TouchableOpacity
              className="flex-row gap-2"
              onPress={() => navigation.navigate('Settings')}
            >
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/GearWhite.png')
                    : require('@/assets/icons/Gear.png')
                }
                className=""
                resizeMode="contain"
              />
              <Text
                className={`${isDark ? 'text-white' : 'text-[#162721]'} font-urbanist-semibold text-[15px]`}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Logout Button ---------- */}
          <View
            className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-xl py-[8px] px-[20px] mt-5 border mb-10`}
          >
            <TouchableOpacity onPress={logout} className="flex-row items-center gap-2">
              <Image source={require('@/assets/icons/SignOut.png')} />
              <Text className="text-[#F22D2D] text-lg font-semibold">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default Profile;
