import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import EarningsModal from './EarningsModal';
import { AppButton } from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

const Dashboard: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDark } = useTheme();

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 py-6">
          <Text
            className={`text-2xl font-urbanist-bold  ${isDark ? 'text-white' : 'text-[#162721]'}`}
          >
            Dashboard
          </Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <View className="px-5">
            <View className="flex-row justify-between mb-4">
              {/* Total Sessions */}
              <View
                className={`rounded-xl p-4 flex-1 mr-2 shadow-sm border ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <View className="flex-1" /> {/* Spacer to balance the layout */}
                    <View className="w-10 h-10 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                      <Ionicons name="chatbubble-outline" size={20} color="#14B8A6" />
                    </View>
                    <Text className="text-[#27B07D] text-sm font-poppins-medium">+12%</Text>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                  >
                    156
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                  >
                    Total Sessions
                  </Text>
                </View>
              </View>

              {/* Active Clients */}
              <View
                className={`rounded-xl p-4 flex-1 mr-2 shadow-sm border ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <View className="flex-1" /> {/* Spacer to balance the layout */}
                    <View className="w-10 h-10 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                      <Ionicons name="people-outline" size={20} color="#14B8A6" />
                    </View>
                    <Text className="text-[#27B07D] text-sm font-poppins-medium">+5%</Text>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                  >
                    23
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                  >
                    Active Clients
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between mb-5">
              {/* Avg Rating */}
              <View
                className={`rounded-xl p-4 flex-1 mr-2 shadow-sm border ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <View className="flex-1" /> {/* Spacer to balance the layout */}
                    <View className="w-10 h-10 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                      <Ionicons name="star-outline" size={20} color="#14B8A6" />
                    </View>
                    <Text className="text-[#27B07D] text-sm font-poppins-medium">+0.2</Text>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                  >
                    4.8
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                  >
                    Avg Rating
                  </Text>
                </View>
              </View>

              {/* This Month */}
              <View
                className={`rounded-xl p-4 flex-1 mr-2 shadow-sm border ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <View className="flex-1" /> {/* Spacer to balance the layout */}
                    <View className="w-10 h-10 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                      <Ionicons name="trending-up-outline" size={20} color="#14B8A6" />
                    </View>
                    <Text className="text-[#27B07D] text-sm font-poppins-medium">+18%</Text>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-[#162721]'}`}
                  >
                    $2,340
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                  >
                    This Month
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* About Earnings Button */}
          <View className="px-5 mb-5">
            <AppButton
              text="About Earnings"
              icon={<Text className="text-white text-xl font-bold">$</Text>}
              onPress={() => setModalVisible(true)}
              variant="gradient"
              className="shadow-sm"
            />
          </View>

          {/* Recent Activity Section */}
          <View
            className={` border  p-4 mb-8 mx-5 rounded-xl ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
          >
            <Text
              className={`text-xl font-urbanist-semibold ${isDark ? 'text-white' : 'text-[#162721] '}`}
            >
              Recent Activity
            </Text>
            <Text
              className={`font-poppins-regular mb-4 text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
            >
              Your latest consultations
            </Text>

            {/* Activity Items */}
            {[
              { name: 'Alice T.', service: 'Marketing Strategy', time: '2 hours ago', rating: 5 },
              { name: 'Bob W.', service: 'Business Plan', time: '5 hours ago', rating: 5 },
              { name: 'Alice T.', service: 'Marketing Strategy', time: '2 hours ago', rating: 5 },
              { name: 'Alice T.', service: 'Marketing Strategy', time: '2 hours ago', rating: 5 },
              { name: 'Bob W.', service: 'Business Plan', time: '5 hours ago', rating: 5 },
              { name: 'Alice T.', service: 'Marketing Strategy', time: '2 hours ago', rating: 5 },
            ].map((item, index) => (
              <View
                key={index}
                className={`rounded-xl p-4 mb-3 border ${isDark ? 'bg-[#233931] border-[#445E54]' : 'bg-[#F5F9F7] border-[#DAE7E0]'}`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text
                      className={`font-urbanist-semibold text-base ${isDark ? 'text-white' : 'text-[#162721]'}`}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className={`font-poppins-regular text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                    >
                      {item.service}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center">
                      <Text className="text-yellow-400 text-base mr-1">⭐</Text>
                      <Text
                        className={`font-poppins-medium  ${isDark ? 'text-white' : 'text-[#161616]'}`}
                      >
                        {item.rating}
                      </Text>
                    </View>
                    <Text
                      className={`font-poppins-regular text-xs ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                    >
                      {item.time}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal */}
        <EarningsModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      </View>
    </GradientBackground>
  );
};

export default Dashboard;
