import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import GradientBackground from '@/common/components/GradientBackground';
import Button from '@/common/components/Button';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetMyEarning } from '@/api/consultant/earning/useGetMyEarning';
import { useWithdrawFunds } from '@/api/consultant/earning/useWithdrawFunds';

const CURRENCY_SYMBOL = '£';
const MIN_WITHDRAWAL = 100;
const STRIPE_FEE_PERCENT = 0.0025; // 0.25%
const STRIPE_FEE_FIXED = 0.1;
const STEP_AMOUNT = 1;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const sanitizeAmountInput = (text: string) => {
  // allow digits and a single decimal point
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 2) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`;
};

const toNumberOrZero = (value: unknown) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number) => `${CURRENCY_SYMBOL}${value.toFixed(2)}`;

const WithdrawFunds = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  const { data: myEarning, isLoading: isMyEarningLoading } = useGetMyEarning();
  const { mutateAsync: withdrawFunds, isPending: isWithdrawPending } = useWithdrawFunds();

  const availableBalanceNumber = useMemo(
    () => toNumberOrZero(myEarning?.available_balance),
    [myEarning?.available_balance]
  );

  const [amountText, setAmountText] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'all' | '100' | '200' | null>(null);

  useEffect(() => {
    // Initialize amount with available balance (once) when data loads
    if (!isMyEarningLoading && availableBalanceNumber > 0 && amountText.trim() === '') {
      setAmountText(availableBalanceNumber.toFixed(2));
      setActivePreset('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyEarningLoading, availableBalanceNumber]);

  const amountNumber = useMemo(() => {
    const n = Number(amountText);
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const stripeFee = useMemo(() => {
    const fee = amountNumber * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED;
    return amountNumber > 0 ? fee : 0;
  }, [amountNumber]);

  const willReceive = useMemo(() => {
    const net = amountNumber - stripeFee;
    return amountNumber > 0 ? Math.max(0, net) : 0;
  }, [amountNumber, stripeFee]);

  const maxWithdraw = availableBalanceNumber;
  const isAmountValid =
    amountNumber >= MIN_WITHDRAWAL &&
    amountNumber > 0 &&
    amountNumber <= maxWithdraw &&
    willReceive > 0;

  const handleSetAmount = (value: number, preset: 'all' | '100' | '200' | null) => {
    const clamped = clamp(value, 0, maxWithdraw);
    setAmountText(clamped ? clamped.toFixed(2) : '');
    setActivePreset(preset);
  };

  const handleIncrement = (delta: number) => {
    const next = clamp((Number(amountText) || 0) + delta, 0, maxWithdraw);
    setAmountText(next ? next.toFixed(2) : '');
    setActivePreset(null);
  };

  const onSubmit = async () => {
    if (isMyEarningLoading) return;
    if (maxWithdraw <= 0) {
      Alert.alert('Withdraw Funds', 'No available balance to withdraw.');
      return;
    }

    if (!isAmountValid) {
      if (amountNumber < MIN_WITHDRAWAL) {
        Alert.alert('Withdraw Funds', `Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}.`);
        return;
      }
      if (amountNumber > maxWithdraw) {
        Alert.alert(
          'Withdraw Funds',
          `Amount cannot exceed your available balance (${formatMoney(maxWithdraw)}).`
        );
        return;
      }
      Alert.alert('Withdraw Funds', 'Please enter a valid withdrawal amount.');
      return;
    }

    try {
      await withdrawFunds(amountNumber);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['get-my-earning'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-earning'] }),
        queryClient.invalidateQueries({ queryKey: ['earning-history'] }),
      ]);
      Alert.alert('Withdraw Funds', 'Your withdrawal request has been submitted.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Withdraw Funds', err?.message ?? 'Something went wrong. Please try again.');
    }
  };

  const availableBalanceLabel = isMyEarningLoading ? '...' : formatMoney(availableBalanceNumber);

  const inputBg = isDark
    ? 'bg-[#0E1B16] border border-[#273F36]'
    : 'bg-[#FFFFFF] border border-[#DADADA]';
  const cardBg = isDark
    ? 'bg-[#162721] border border-[#273F36]'
    : 'bg-[#FFFFFF] border border-[#DAE7E0]';
  const mutedText = isDark ? 'text-[#8AA897]' : 'text-[#658176]';
  const primaryText = isDark ? 'text-white' : 'text-black';

  const presetButtonClass = (selected: boolean) =>
    `flex-1 items-center justify-center py-3 rounded-[12px] border ${
      selected
        ? 'bg-[#27B07D] border-[#27B07D]'
        : isDark
          ? 'bg-[#0E1B16] border-[#273F36]'
          : 'bg-[#FFFFFF] border-[#DADADA]'
    }`;

  const presetTextClass = (selected: boolean) =>
    `${selected ? 'text-white' : isDark ? 'text-white' : 'text-textDark'} text-sm font-urbanist-semibold`;

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <View className="flex-1">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        <View className="px-5 pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0" />

        <ScrollView
          className="flex-1 px-5 absolute top-5 left-0 right-0 bottom-5 z-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom }}
        >
          {/* Title */}
          <View className="mb-5">
            <Text className="text-2xl font-urbanist-bold mb-1 text-white">Withdraw Funds</Text>
            <Text className="text-sm font-poppins-regular text-white opacity-80">
              Transfer money to your bank account
            </Text>
          </View>

          {/* Available Balance */}
          <View className={`rounded-xl p-5 mb-4 ${cardBg}`}>
            <Text className={`${mutedText} text-base font-poppins-regular mb-2`}>
              Available Balance
            </Text>
            <Text className={`${primaryText} text-4xl font-urbanist-semibold`}>
              {availableBalanceLabel}
            </Text>
          </View>

          {/* Withdrawal Amount */}
          <View className="mb-4">
            <Text
              className={`${isDark ? 'text-white' : 'text-textDark'} text-base font-poppins-medium mb-2`}
            >
              Withdrawal Amount
            </Text>

            <View className={`rounded-2xl px-4 py-2 flex-row items-center ${inputBg}`}>
              <TextInput
                value={amountText}
                onChangeText={(t) => {
                  const cleaned = sanitizeAmountInput(t);
                  setAmountText(cleaned);
                  setActivePreset(null);
                }}
                placeholder={availableBalanceNumber ? availableBalanceNumber.toFixed(2) : '0.00'}
                placeholderTextColor={isDark ? '#ffffff' : '#9CA3AF'}
                keyboardType="decimal-pad"
                className={`${isDark ? 'text-[#8AA897]' : 'text-textDark'} text-base font-urbanist-medium flex-1`}
                returnKeyType="done"
              />

              {/* Stepper */}
              <View className="">
                <TouchableOpacity
                  onPress={() => handleIncrement(STEP_AMOUNT)}
                  className="w-10 items-center justify-center"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="caret-up" size={18} color={isDark ? '#8AA897' : '#658176'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleIncrement(-STEP_AMOUNT)}
                  className="w-10  items-center justify-center"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="caret-down" size={18} color={isDark ? '#8AA897' : '#658176'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick buttons */}
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className={presetButtonClass(activePreset === 'all')}
                onPress={() => handleSetAmount(maxWithdraw, 'all')}
                disabled={isMyEarningLoading}
              >
                <Text className={presetTextClass(activePreset === 'all')}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={presetButtonClass(activePreset === '100')}
                onPress={() => handleSetAmount(100, '100')}
                disabled={isMyEarningLoading}
              >
                <Text className={presetTextClass(activePreset === '100')}>{formatMoney(100)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={presetButtonClass(activePreset === '200')}
                onPress={() => handleSetAmount(200, '200')}
                disabled={isMyEarningLoading}
              >
                <Text className={presetTextClass(activePreset === '200')}>{formatMoney(200)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fee Breakdown */}
          <View className={`rounded-2xl p-5 mb-4 ${cardBg}`}>
            <Text className={`${primaryText} text-base font-urbanist-semibold mb-4`}>
              Fee Breakdown
            </Text>

            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${mutedText} text-sm font-urbanist-medium`}>
                Withdrawal Amount:
              </Text>
              <Text className="text-[#27B07D] text-sm font-poppins-semibold">
                {isMyEarningLoading ? '...' : formatMoney(amountNumber)}
              </Text>
            </View>

            <View
              className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-3`}
            />

            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${mutedText} text-sm font-urbanist-medium`}>
                Stripe Fee (0.25% + {CURRENCY_SYMBOL}0.10):
              </Text>
              <Text className="text-red-500 text-sm font-poppins-semibold">
                -{formatMoney(stripeFee)}
              </Text>
            </View>
            <View
              className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-3`}
            />

            <View className="flex-row items-center justify-between ">
              <Text className={`${primaryText} text-lg font-urbanist-semibold mt-2`}>
                You'll Receive:
              </Text>
              <Text className="text-[#27B07D] text-sm font-poppins-semibold">
                {formatMoney(willReceive)}
              </Text>
            </View>
          </View>

          {/* Note */}
          <View className="bg-[#FFF3CD] rounded-xl p-4 mb-4 border border-[#DAE7E0]">
            <View className="flex-row items-center gap-3">
              <Image
                source={require('@/assets/icons/warn.png')}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-[#856404] text-xs font-urbanist-regular flex-1">
                Minimum Withdrawal: {CURRENCY_SYMBOL}
                {MIN_WITHDRAWAL.toFixed(2)}
                {'\n'}
                Processing Time: 2-5 business days{'\n'}
                Monthly Account Fee: {CURRENCY_SYMBOL}2.00 (charged separately by Stripe)
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3 mb-2">
            <Button
              text="Request Withdrawal"
              onPress={onSubmit}
              loading={isWithdrawPending}
              disabled={!isAmountValid || isMyEarningLoading || isWithdrawPending}
              variant="gradient"
              className="w-full rounded-[10px]"
            />
            <Button
              text="Cancel"
              onPress={() => navigation.goBack()}
              variant="light"
              textClassName="text-[#162721]"
              className="w-full rounded-[10px]"
            />
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default WithdrawFunds;
