import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/common/components/Button';

const MyEarning = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  // Mock data - replace with actual data from API
  const availableBalance = '$245.50';
  const totalEarnings = '$1,245.50';
  const totalPayouts = '$1,000.00';
  const thisMonth = 12;
  const totalConsultations = 156;
  const isStripeVerified = true;

  const recentEarnings = [
    {
      id: '1',
      type: 'consultation',
      description: 'Consultation #CONS-12345',
      date: 'Feb 5, 2026',
      amount: '+£1.20',
      isPositive: true,
    },
    {
      id: '2',
      type: 'consultation',
      description: 'Consultation #CONS-12344',
      date: 'Feb 4, 2026',
      amount: '+£1.20',
      isPositive: true,
    },
    {
      id: '3',
      type: 'payout',
      description: 'Payout',
      date: 'Jan 31, 2028',
      amount: '-£200.00',
      isPositive: false,
    },
  ];

  const handleRequestWithdrawal = () => {
    navigation.navigate('WithdrawFunds');
  };

  const handleViewStatements = () => {
    navigation.navigate('EarningStatement');
  };

  const handleTaxInformation = () => {
    // Navigate to tax information screen
  };

  const handleManagePayoutDetails = () => {
    navigation.navigate('SetupPayout');
  };

  return (
    <GradientBackground>
      <View className="flex-1 ">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        {/* Header */}
        <View className="px-5  pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0" />

        {/* Content */}
        <ScrollView
          className="flex-1 px-5 absolute top-5 left-0 right-0 bottom-5 z-10 "
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          {/* Available Balance Card */}
          <View className="mb-5">
            <Text className={`text-3xl font-urbanist-bold mb-1 text-white`}>My Earnings</Text>
            <Text className={`text-sm font-urbanist-regular  text-white`}>
              Track your consultations and payouts
            </Text>
          </View>
          <View
            className={`rounded-2xl p-6 mb-4 ${
              isDark
                ? 'bg-[#162721] border border-[#273F36]'
                : 'bg-[#FFFFFF] border border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-sm font-urbanist-regular mb-2`}
            >
              Available Balance
            </Text>
            <Text
              className={`${isDark ? 'text-white' : 'text-black'} text-4xl font-urbanist-bold mb-3`}
            >
              {availableBalance}
            </Text>
            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-urbanist-regular opacity-80`}
            >
              Total Earnings: {totalEarnings} | Total Payouts: {totalPayouts}
            </Text>
          </View>

          {/* Summary Cards */}
          <View className="flex-row gap-3 mb-4">
            {/* This Month Card */}
            <View
              className={`flex-1 rounded-2xl p-4 ${
                isDark
                  ? 'bg-[#162721] border border-[#273F36]'
                  : 'bg-[#FFFFFF] border border-[#DAE7E0]'
              }`}
            >
              <Ionicons name="trending-up" size={24} color="#36D399" style={{ marginBottom: 8 }} />
              <Text
                className={`${isDark ? 'text-white' : 'text-black'} text-3xl font-urbanist-bold mb-1`}
              >
                {thisMonth}
              </Text>
              <Text
                className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-urbanist-regular opacity-80`}
              >
                This Month
              </Text>
            </View>

            {/* Total Consultations Card */}
            <View
              className={`flex-1 rounded-2xl p-4 ${
                isDark
                  ? 'bg-[#162721] border border-[#273F36]'
                  : 'bg-[#FFFFFF] border border-[#DAE7E0]'
              }`}
            >
              <Ionicons
                name="chatbubble-outline"
                size={24}
                color="#36D399"
                style={{ marginBottom: 8 }}
              />
              <Text
                className={`${isDark ? 'text-white' : 'text-black'} text-3xl font-urbanist-bold mb-1`}
              >
                {totalConsultations}
              </Text>
              <Text
                className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-urbanist-regular opacity-80`}
              >
                Total Consultations
              </Text>
            </View>
          </View>

          {/* Payout Status - Stripe Account Card */}
          <View
            className={`rounded-2xl p-4 mb-4 ${
              isDark
                ? 'bg-[#162721] border border-[#273F36]'
                : 'bg-[#FFFFFF] border border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`${isDark ? 'text-white' : 'text-black'} text-base font-urbanist-bold mb-3`}
            >
              Payout Status
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-sm font-urbanist-regular`}
              >
                Stripe Account
              </Text>
              {isStripeVerified && (
                <View className="bg-[#36D399] px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-urbanist-bold">Verified</Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xs font-urbanist-regular opacity-80 mb-4">
              Bank details and verification
            </Text>
            <Button
              text="Manage Payout Details"
              onPress={handleManagePayoutDetails}
              variant="light"
              textClassName="text-[#162721]"
              icon={
                <Image source={require('@/assets/icons/payment-black.png')} className="w-6 h-6" />
              }
              className="w-full rounded-[10px]"
            />
          </View>

          {/* Payout Status - Actions */}
          <View className="mb-4">
            <Text
              className={`text-base font-urbanist-bold mb-3 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Payout Status
            </Text>
            <View className="gap-3">
              <Button
                text="Request Withdrawal"
                onPress={handleRequestWithdrawal}
                variant="gradient"
                className="w-full rounded-[5px]"
              />
              <Button
                text="View Statements"
                onPress={handleViewStatements}
                variant="light"
                textClassName="text-[#162721]"
                className="w-full rounded-[10px]"
              />
              <Button
                text="Tax Information"
                onPress={handleTaxInformation}
                variant="light"
                textClassName="text-[#162721]"
                className="w-full rounded-[10px]"
              />
            </View>
          </View>

          {/* Recent Earnings */}
          <View className="mb-4">
            <Text
              className={`text-base font-urbanist-bold mb-3 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Recent Earnings
            </Text>
            <View className="gap-2">
              {recentEarnings.map((earning) => (
                <View
                  key={earning.id}
                  className={`flex-row items-center justify-between py-3 px-4 rounded-xl ${
                    isDark
                      ? 'bg-[#162721] border border-[#273F36]'
                      : 'bg-[#FFFFFF] border border-[#DAE7E0]'
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`${isDark ? 'text-white' : 'text-black'} text-sm font-urbanist-semibold mb-1`}
                    >
                      {earning.description}
                    </Text>
                    <Text
                      className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-urbanist-regular opacity-70`}
                    >
                      {earning.date}
                    </Text>
                  </View>
                  <Text
                    className={`${isDark ? 'text-white' : 'text-black'} text-base font-urbanist-bold ${
                      earning.isPositive ? 'text-textPrimary' : 'text-error'
                    }`}
                  >
                    {earning.amount}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Note Section */}
          <View className="bg-[#FEF3C7] rounded-xl p-4 mb-6 border border-[#FCD34D]">
            <View className="flex-row items-start gap-3">
              <Image source={require('@/assets/icons/yellow-info.png')} className="w-6 h-6" />
              <Text className="text-[#162721] text-xs font-urbanist-regular flex-1">
                Note: Minimum withdrawal amount is £100. Stripe fees 10.25% + £0.10 will be deducted
                from your payout. Monthly account fee (£2) is charged separately.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default MyEarning;
