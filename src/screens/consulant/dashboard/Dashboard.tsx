import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import EarningsModal from './EarningsModal';

const Dashboard: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-gradient-to-b from-[hsl(146,25%,97%)] to-[hsl(158,64%,95%)]">
      {/* Header */}
      <View className="pt-12 px-6 pb-4">
        <Text className="text-2xl font-bold text-gray-800">Dashboard</Text>
        <Text className="text-gray-600 mt-1">Overview of your consulting performance</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {/* Total Sessions */}
          <View className="bg-white rounded-2xl p-4 w-[48%] mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-green-500 text-sm font-semibold">+12%</Text>
              <Text className="text-2xl font-bold text-gray-800">156</Text>
            </View>
            <Text className="text-gray-500 text-sm">Total Sessions</Text>
          </View>

          {/* Active Clients */}
          <View className="bg-white rounded-2xl p-4 w-[48%] mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-green-500 text-sm font-semibold">+5%</Text>
              <Text className="text-2xl font-bold text-gray-800">23</Text>
            </View>
            <Text className="text-gray-500 text-sm">Active Clients</Text>
          </View>

          {/* Avg Rating */}
          <View className="bg-white rounded-2xl p-4 w-[48%] shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-green-500 text-sm font-semibold">+0.2</Text>
              <Text className="text-2xl font-bold text-gray-800">4.8</Text>
            </View>
            <Text className="text-gray-500 text-sm">Avg Rating</Text>
          </View>

          {/* This Month */}
          <View className="bg-white rounded-2xl p-4 w-[48%] shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-green-500 text-sm font-semibold">+18%</Text>
              <Text className="text-2xl font-bold text-gray-800">$2,340</Text>
            </View>
            <Text className="text-gray-500 text-sm">This Month</Text>
          </View>
        </View>

        {/* About Earnings Button */}
        <View className="mb-6">
          <TouchableOpacity
            className="bg-white rounded-2xl p-6 shadow-sm"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-lg font-bold text-gray-800 mb-2">About Earnings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4">Recent Activity</Text>
          <Text className="text-gray-600 mb-3">Your latest consultations</Text>

          {/* Activity Items */}
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {['Alice T.', 'Bob W.', 'Alice T.'].map((name, index) => (
              <View
                key={index}
                className={`flex-row justify-between items-center py-3 ${index < 2 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">{name}</Text>
                  <Text className="text-gray-500 text-sm">
                    {index === 0 || index === 2 ? 'Marketing Strategy' : 'Business Plan'}
                  </Text>
                </View>
                <Text className="text-gray-400 text-sm">
                  {index === 0 || index === 2 ? '2 hours ago' : '5 hours ago'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <EarningsModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

export default Dashboard;
