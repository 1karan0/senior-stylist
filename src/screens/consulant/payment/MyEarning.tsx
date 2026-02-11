import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/common/components/Button';
import { useGetMyEarning } from '@/api/consultant/earning/useGetMyEarning';
import { useCreateStripAccount } from '@/api/consultant/strip-express/useCreateStripAccount';
import StripeWebViewModal from '@/screens/consulant/payment/components/StripeWebViewModal';
import { useGetStripAccount } from '@/api/consultant/strip-express/useGetStripAccount';
import { useGetOnboardingLink } from '@/api/consultant/strip-express/useGetOnboardingLink';
import { useGetRecentEarnings } from '@/api/consultant/earning/useGetrecentEarnings';
import { useTabletLayout } from '@/hooks/useTabletLayout';

interface RecentEarningItem {
  id: number;
  consultation_id: number;
  date: string;
  amount: number;
  status: string;
  hold_until: string;
}

const MyEarning = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding } = useTabletLayout();
  const { data: myEarning, isLoading: isMyEarningLoading } = useGetMyEarning();
  const {
    data: stripAccount,
    isLoading: isStripAccountLoading,
    isFetching: isStripAccountFetching,
    refetch: refetchStripAccount,
  } = useGetStripAccount();
  const { mutateAsync: createStripAccount, isPending: isCreateStripAccountPending } =
    useCreateStripAccount();
  const { refetch: refetchOnboardingLink, isFetching: isOnboardingLinkFetching } =
    useGetOnboardingLink({
      enabled: false,
    });
  const { data: recentEarnings, isLoading: isRecentEarningsLoading } = useGetRecentEarnings();
  const [stripeUrl, setStripeUrl] = useState<string>('');
  const [stripeVisible, setStripeVisible] = useState(false);
  const [isStripeActionLoading, setIsStripeActionLoading] = useState(false);
  const currencySymbol = '£';

  // Limit recent earnings to 3-4 items
  const displayedRecentEarnings: RecentEarningItem[] = useMemo(() => {
    if (!recentEarnings || !Array.isArray(recentEarnings)) return [];
    return recentEarnings.slice(0, 3);
  }, [recentEarnings]);

  const extractStripeUrl = (payload: any): string | undefined => {
    if (!payload) return undefined;
    if (typeof payload === 'string') return payload;
    return payload?.onboarding_url ?? payload?.onboardingUrl ?? payload?.url ?? payload?.link;
  };

  const formatMoney = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') {
      const asNumber = Number(value);
      if (Number.isFinite(asNumber)) return `${currencySymbol}${asNumber.toFixed(2)}`;
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value))
      return `${currencySymbol}${value.toFixed(2)}`;
    return '—';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const availableBalance = isMyEarningLoading ? '...' : formatMoney(myEarning?.available_balance);
  const totalPayouts = isMyEarningLoading ? '...' : formatMoney(myEarning?.withdrawn_amount);
  const totalEarnings = isMyEarningLoading
    ? '...'
    : formatMoney(
        (Number(myEarning?.available_balance || 0) || 0) +
          (Number(myEarning?.pending_balance || 0) || 0) +
          (Number(myEarning?.withdrawn_amount || 0) || 0)
      );
  const thisMonth = myEarning?.this_month_consultations ?? 0;
  const totalConsultations = myEarning?.total_consultations ?? 0;
  const isStripeVerified = Boolean(
    stripAccount?.has_account && stripAccount?.charges_enabled && stripAccount?.payouts_enabled
  );

  const handleRequestWithdrawal = () => {
    navigation.navigate('WithdrawFunds');
  };

  const handleViewStatements = () => {
    navigation.navigate('EarningStatement');
  };

  const handlePayoutHistory = () => {
    // Navigate to tax information screen
    navigation.navigate('PayOutHistory');
  };

  const handleManagePayoutDetails = async () => {
    try {
      setIsStripeActionLoading(true);

      // Always refetch on click to get a fresh onboarding URL (Stripe links can be single-use)
      const refetched = await refetchStripAccount();
      const acct: any = refetched?.data;

      if (acct?.has_account) {
        const urlFromAccount = extractStripeUrl(acct);
        const url = urlFromAccount || extractStripeUrl((await refetchOnboardingLink())?.data);
        if (!url) {
          Alert.alert('Stripe', 'Onboarding link not available right now. Please try again.');
          return;
        }
        setStripeUrl(url);
        setStripeVisible(true);
        return;
      }

      // No account → create then open onboarding URL
      const res: any = await createStripAccount();
      const url = extractStripeUrl(res);
      if (!url) {
        Alert.alert('Stripe', 'Unable to start onboarding. Please try again.');
        return;
      }
      setStripeUrl(url);
      setStripeVisible(true);

      // Keep local state in sync for future presses
      refetchStripAccount();
    } catch (err: any) {
      Alert.alert('Stripe', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsStripeActionLoading(false);
    }
  };

  const handleRecentEarning = () => {
    navigation.navigate('RecentEarning');
  };

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <View className="flex-1 ">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        {/* Header */}
        <View className="px-5  pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0" />

        {/* Content */}
        <ScrollView
          className="flex-1 absolute top-5 left-0 right-0 bottom-5 z-10 "
          style={{ paddingHorizontal: horizontalPadding }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          {/* Available Balance Card */}
          <View className="mb-5">
            <Text className={`text-2xl font-urbanist-bold mb-1 text-white`}>My Earnings</Text>
            <Text className={`text-sm font-poppins-regular  text-white`}>
              Track your consultations and payouts
            </Text>
          </View>
          <View
            className={`rounded-xl p-5 mb-4 ${
              isDark
                ? 'bg-[#162721] border border-[#273F36]'
                : 'bg-[#FFFFFF] border border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-sm font-poppins-regular mb-2`}
            >
              Available Balance
            </Text>
            <Text
              className={`${isDark ? 'text-white' : 'text-black'} text-4xl font-urbanist-semibold mb-3`}
            >
              {availableBalance}
            </Text>
            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-poppins-regular `}
            >
              Total Earnings: {totalEarnings} | Total Payouts: {totalPayouts}
            </Text>
          </View>

          {/* Summary Cards */}
          <View className="flex-row gap-3 mb-4">
            {/* This Month Card */}
            <View
              className={`flex-1 rounded-2xl items-center justify-center p-4 ${
                isDark
                  ? 'bg-[#162721] border border-[#273F36]'
                  : 'bg-[#FFFFFF] border border-[#DAE7E0]'
              }`}
            >
              <Ionicons name="trending-up" size={24} color="#36D399" style={{ marginBottom: 8 }} />
              <Text
                className={`${isDark ? 'text-white' : 'text-black'} text-xl font-urbanist-bold mb-1`}
              >
                {thisMonth}
              </Text>
              <Text
                className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-poppins-regular `}
              >
                This Month
              </Text>
            </View>

            {/* Total Consultations Card */}
            <View
              className={`flex-1 rounded-2xl items-center justify-center p-4 ${
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
                className={`${isDark ? 'text-white' : 'text-black'} text-xl font-urbanist-bold mb-1`}
              >
                {totalConsultations}
              </Text>
              <Text
                className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-poppins-regular `}
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
              className={`${isDark ? 'text-white' : 'text-black'} text-lg font-urbanist-semibold mb-3`}
            >
              Payout Status
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className={`${isDark ? 'text-[#ffffff]' : 'text-[#000000]'} text-base font-poppins-semibold`}
              >
                Stripe Account
              </Text>
              {isStripeVerified && (
                <View className="bg-[#D4EDDA] px-3 py-1 rounded-full">
                  <Text className="text-[#155724] text-xs font-urbanist-bold">Verified</Text>
                </View>
              )}
            </View>
            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-xs font-urbanist-regular opacity-80 mb-4`}
            >
              Bank details and verification
            </Text>
            <Button
              text="Manage Payout Details"
              onPress={handleManagePayoutDetails}
              loading={
                isStripeActionLoading ||
                isCreateStripAccountPending ||
                isOnboardingLinkFetching ||
                isStripAccountLoading ||
                isStripAccountFetching
              }
              variant="light"
              textClassName="text-[#162721]"
              icon={
                <Image source={require('@/assets/icons/payment-black.png')} className="w-6 h-6" />
              }
              className="w-full rounded-[10px]"
            />
            <View className="mt-2">
              {stripAccount?.requirements &&
                stripAccount.requirements.map((requirement: any, index: number) => (
                  <View key={index} className="flex-row items-center gap-2 mt-1">
                    <Image source={require('@/assets/icons/yellow-info.png')} className="w-4 h-4" />
                    <Text
                      className={`${isDark ? 'text-white' : 'text-black'} text-xs font-poppins-regular`}
                    >
                      {requirement}
                    </Text>
                  </View>
                ))}
            </View>
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
                text="Payout History"
                onPress={handlePayoutHistory}
                variant="light"
                textClassName="text-[#162721]"
                className="w-full rounded-[10px]"
              />
            </View>
          </View>

          {/* Recent Earnings Section */}
          <View className="mb-4">
            {isRecentEarningsLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#27B07D" />
              </View>
            ) : displayedRecentEarnings.length > 0 ? (
              <View
                className={`bg-[#162721] border border-[#273F36] rounded-[10px] px-5 py-4 ${isDark ? 'bg-[#162721] border border-[#273F36]' : 'bg-[#FFFFFF] border border-[#DAE7E0]'}`}
              >
                <Text
                  className={`text-lg mb-2 font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  Recent Earnings
                </Text>
                {displayedRecentEarnings.map((item) => {
                  const textMuted = isDark ? 'text-[#8AA897]' : 'text-[#658176]';

                  return (
                    <View key={item.id} className={`mb-2`}>
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text
                              className={`${isDark ? 'text-white' : 'text-textDark'} text-sm font-urbanist-bold`}
                            >
                              consultaion #{item.consultation_id}
                            </Text>
                            <Text className={`text-[#27B07D] text-sm font-poppins-semibold`}>
                              {formatMoney(item.amount)}
                            </Text>
                          </View>
                          <Text className={`${textMuted} text-sm font-poppins-regular`}>
                            {formatDate(item.date)}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-3`}
                      />
                    </View>
                  );
                })}

                <View className="flex-row items-center justify-center mb-2">
                  <TouchableOpacity onPress={handleRecentEarning}>
                    <Text
                      className={`${isDark ? 'text-white' : 'text-textDark'} text-sm font-poppins-semibold`}
                    >
                      See More
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                className={`rounded-[10px] p-6 items-center justify-center ${isDark ? 'bg-[#162721] border border-[#273F36]' : 'bg-[#FFFFFF] border border-[#DAE7E0]'}`}
              >
                <Ionicons
                  name="cash-outline"
                  size={48}
                  color={isDark ? '#8AA897' : '#658176'}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-sm font-poppins-regular`}
                >
                  No recent earnings found
                </Text>
              </View>
            )}
          </View>

          {/* Note Section */}
          <View className="bg-[#FFF3CD] rounded-xl p-4 mb-6 border border-[#DAE7E0]">
            <View className="flex-row gap-3 items-center">
              <Image source={require('@/assets/icons/yellow-info.png')} className="w-6 h-6" />
              <Text className="text-[#856404] text-xs font-urbanist-regular flex-1">
                <Text className="font-urbanist-bold">Note:</Text> Minimum withdrawal amount is £100.
                Stripe fees 0.25% + £0.10 will be deducted from your payout. Monthly account fee
                (£2) is charged separately.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
      <StripeWebViewModal
        visible={stripeVisible}
        url={stripeUrl}
        title="Stripe Onboarding"
        onClose={() => {
          setStripeVisible(false);
          setStripeUrl('');
        }}
      />
    </GradientBackground>
  );
};

export default MyEarning;
