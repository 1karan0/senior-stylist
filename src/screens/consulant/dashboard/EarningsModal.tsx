import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

interface EarningsModalProps {
  visible: boolean;
  onClose: () => void;
}

const EarningsModal: React.FC<EarningsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        {/* Modal Container */}
        <View className="bg-white rounded-3xl mx-6 w-11/12 max-h-[85%]">
          {/* Header with Close Button */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">Earnings</Text>
              <Text className="text-gray-600 mt-1">Track your consultation revenue</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            {/* Total Earnings */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-4">Total Earnings</Text>
              <View className="bg-gray-50 rounded-2xl p-5">
                <Text className="text-3xl font-bold text-gray-800 mb-2">$8,542</Text>
                <View className="flex-row items-center">
                  <Text className="text-green-500 font-semibold mr-1">+13%</Text>
                  <Text className="text-gray-500">from last month</Text>
                </View>
              </View>
            </View>

            {/* This Month & Pending */}
            <View className="flex-row justify-between mb-8">
              <View className="bg-white rounded-2xl p-5 w-[48%] shadow-sm border border-gray-100">
                <Text className="text-2xl font-bold text-gray-800">$2,340</Text>
                <Text className="text-gray-500 text-sm mt-2">This Month</Text>
              </View>
              <View className="bg-white rounded-2xl p-5 w-[48%] shadow-sm border border-gray-100">
                <Text className="text-2xl font-bold text-gray-800">$1,200</Text>
                <Text className="text-gray-500 text-sm mt-2">Pending</Text>
              </View>
            </View>

            {/* Recent Transactions */}
            <View className="mb-8">
              <Text className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</Text>
              <Text className="text-gray-600 mb-4">Your latest payouts</Text>

              {/* Transaction Items */}
              <View className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <View key={index} className="bg-gray-50 rounded-2xl p-4">
                    <Text className="font-semibold text-gray-800 text-base mb-1">Jan 15, 2024</Text>
                    <Text className="text-green-500 font-medium">Completed</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Download Statement Button */}
            <TouchableOpacity className="bg-gray-800 rounded-2xl py-4">
              <Text className="text-white text-center font-semibold text-lg">
                Download Statement
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EarningsModal;
