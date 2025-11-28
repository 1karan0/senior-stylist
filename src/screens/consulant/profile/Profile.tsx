import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Switch, ScrollView, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const Profile: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  const { logout } = useAuth();

  return (
    <GradientBackground>
      <View className="flex-1 px-5 py-6">
        {/* Header */}
        <View className="">
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-[#162721]'}`}
          >
            Profile
          </Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 pt-3">
          {/* Profile Card */}
          <View
            className={`rounded-2xl border p-4 mb-3 shadow-sm ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <View className="items-start mb-4">
              <View className="flex-row items-start">
                {/* Avatar */}

                <View className="w-14 h-14 rounded-full items-center justify-center mr-3 overflow-hidden">
                  <LinearGradient
                    colors={['#27B07D', '#36D399']}
                    className="w-full h-full items-center justify-center rounded-full"
                  >
                    <Text className="text-white font-urbanist-semibold text-xl">SJ</Text>
                  </LinearGradient>
                </View>

                {/* Name and Badge */}
                <View className="flex-col justify-start">
                  <Text
                    className={`text-2xl font-urbanist-bold  mb-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                  >
                    John Doe
                  </Text>
                  <LinearGradient
                    colors={['#27B07D', '#36D399']}
                    style={{ borderRadius: 9999 }} // <-- this is required
                    className="px-4 py-1 mb-4"
                  >
                    <Text className="text-white text-xs font-urbanist-bold">Expert Consultant</Text>
                  </LinearGradient>
                </View>
              </View>
              {/* Edit Profile Button */}
              <TouchableOpacity className="w-full bg-[#DAE7E0] py-3 rounded-xl">
                <Text className="text-[#162721] text-center font-urbanist-bold">Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Information */}
          <View
            className={`rounded-xl border p-6 mb-6 shadow-sm ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <Text
              className={`text-xl font-urbanist-semibold mb-4 ${isDark ? 'text-white' : 'text-[#162721]'}`}
            >
              Account Information
            </Text>

            <View className="space-y-3">
              {/* Email */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="mail-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-[#8AA897]' : 'text-[#6A6B6E]'}`}
                >
                  john.doe@example.com
                </Text>
              </View>

              {/* Phone */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="call-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-[#8AA897]' : 'text-[#6A6B6E]'}`}
                >
                  +1 (555) 123-4567
                </Text>
              </View>

              {/* Member Since */}
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text
                  className={`font-poppins-regular ml-3 ${isDark ? 'text-[#8AA897]' : 'text-[#6A6B6E]'}`}
                >
                  Member since January 2024
                </Text>
              </View>
            </View>
          </View>

          {/* Performance Overview */}
          <View
            className={`rounded-xl p-6 mb-6 shadow-sm ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <Text
              className={`text-xl font-urbanist-semibold ${isDark ? 'text-white' : 'text-[#162721]'}`}
            >
              Performance Overview
            </Text>
            <Text
              className={`text-sm font-poppins-regular mb-4 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
            >
              Pro Plan - $19.99/month
            </Text>

            {/* Stats Row */}
            <View className="flex-row justify-between mb-4">
              {/* Total Earnings */}
              <View
                className={`flex-1 items-center  border  rounded-xl p-4 mr-2 ${isDark ? 'border-[#273F36] bg-transparent' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
              >
                <Ionicons name="trending-up-outline" size={24} color="#10b981" />
                <Text
                  className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                >
                  $2,340
                </Text>
                <Text
                  className={`text-xs font-poppins-regular mt-1 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                >
                  Total Earnings
                </Text>
              </View>

              {/* Total Sessions */}
              <View
                className={`flex-1 items-center border rounded-xl p-4 ml-2 ${isDark ? 'border-[#273F36] bg-transparent' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#10b981" />
                <Text
                  className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                >
                  156
                </Text>
                <Text
                  className={`text-xs font-poppins-regular mt-1 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                >
                  Total Sessions
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View
              className={`items-center  border rounded-xl p-4 ${isDark ? 'border-[#273F36]' : 'border-[#DAE7E0] bg-[#F5F9F7]'}`}
            >
              <Ionicons name="star" size={28} color="#fbbf24" />
              <Text
                className={`text-xl font-urbanist-bold mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
              >
                4.8
              </Text>
              <Text
                className={`text-sm text-[#658176] font-poppins-regular mt-1 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
              >
                Average Rating
              </Text>
            </View>
          </View>

          {/* Settings */}
          <TouchableOpacity
            className={`rounded-xl p-4 mb-4 shadow-sm flex-row items-center justify-between border ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={24} color={isDark ? '#FFFFFF' : '#162721'} />
              <Text
                className={`font-urbanist-semibold ml-3 ${isDark ? 'text-white' : 'text-[#162721]'}`}
              >
                Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#FFFFFF' : '#162721'} />
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            onPress={() => logout()}
            className={`border rounded-xl p-4 mb-8 shadow-sm flex-row items-center justify-between ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={24} color="#F22D2D" />
              <Text className="text-[#F22D2D] font-urbanist-semibold ml-3">Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default Profile;
