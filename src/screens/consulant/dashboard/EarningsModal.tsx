import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { Button } from '@/common/components/Button';

interface EarningsModalProps {
  visible: boolean;
  onClose: () => void;
}

const EarningsModal: React.FC<EarningsModalProps> = ({ visible, onClose }) => {
  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      dismissOnBackdropPress={true}
      containerClassName="max-h-[90%]"
    >
      {/* Header with Close Button - MOVED OUTSIDE SCROLLVIEW */}
      <View className="">
        {/* Close button at top right */}
        <View className="flex-row justify-end">
          <TouchableOpacity onPress={onClose} className="">
            <Ionicons name="close" size={24} color="#162721" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="-mx-6 px-6">
        {/* Content below */}
        <View className="flex-1 mb-3">
          <Text className="text-xl font-poppins-semibold text-textDark">Earnings</Text>
          <Text className="font-poppins-regular text-textMuted text-sm">
            Track your consultation revenue
          </Text>
        </View>
        {/* Total Earnings Card */}
        <View
          className="rounded-xl p-5 mb-5"
          style={{
            borderRadius: 12,
            backgroundColor: '#27B07D',
          }}
        >
          <View className="flex-row items-center mb-2 self-start">
            <Ionicons name="logo-usd" size={20} color="white" />
            <Text className="text-white text-xl font-urbanist-bold ml-2">Total Earnings</Text>
          </View>
          <View className="items-center justify-center mt-2">
            <Text className="text-white text-4xl font-urbanist-bold mb-2">$8,542</Text>
            <View className="flex-row items-center">
              <Ionicons name="trending-up" size={16} color="white" />
              <Text className="text-white text-sm font-poppins-regular ml-1">
                +18% from last month
              </Text>
            </View>
          </View>
        </View>

        {/* This Month & Pending */}
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 mr-2 bg-white border border-[#DAE7E0] rounded-xl items-center justify-center py-4 shadow-sm">
            <Text className="text-2xl font-urbanist-bold mb-1">$2,340</Text>
            <Text className="text-textMuted text-sm font-poppins-regular">This Month</Text>
          </View>
          <View className="flex-1 ml-2 items-center justify-center bg-white border border-[#DAE7E0] rounded-xl py-4 shadow-sm">
            <Text className="text-2xl font-urbanist-bold mb-1">$1,200</Text>
            <Text className="text-textMuted text-sm font-poppins-regular">Pending</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="mb-2">
          <Text className="text-xl font-urbanist-semibold text-textDark">Recent Transactions</Text>
          <Text className="font-poppins-regular text-textMuted mb-3 text-sm">
            Your latest payouts
          </Text>

          {/* Transaction Items */}
          <View>
            {[
              { date: 'Jan 15, 2024', status: 'Completed', amount: '$1,850' },
              { date: 'Jan 15, 2024', status: 'Completed', amount: '$1,850' },
              { date: 'Jan 15, 2024', status: 'Completed', amount: '$1,850' },
            ].map((transaction, index) => (
              <View
                key={index}
                className="bg-[#F5F9F7] border border-[#DAE7E0] rounded-xl p-4 mb-3 flex-row justify-between items-center"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-teal-50 rounded-full items-center justify-center mr-1">
                    <Ionicons name="calendar-outline" size={20} color="#27B07D" />
                  </View>
                  <View>
                    <Text className="font-urbanist-semibold text-textDark text-base">
                      {transaction.date}
                    </Text>
                    <Text className="text-textMuted text-sm font-poppins-regular">
                      {transaction.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-textPrimary font-poppins-semibold text-base">
                  {transaction.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Download Statement Button with Download Icon */}
        <View className="mb-4">
          <Button
            text="Download Statement"
            icon={<Ionicons name="download-outline" size={20} color="white" />}
            variant="gradient"
            onPress={() => console.log('Download statement')}
          />
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

export default EarningsModal;
