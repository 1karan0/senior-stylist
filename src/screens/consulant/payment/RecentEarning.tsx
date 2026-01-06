import React, { useMemo } from 'react';
import {
  StatusBar,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetEarningHistory } from '@/api/consultant/earning/useGetEarningHistory';
import { EarningItem, EarningHistoryResponse } from '@/common/types';

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const formatMoney = (value: unknown) => {
  const currencySymbol = '£';
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

const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'available':
      return {
        bg: 'bg-[#D4EDDA]',
        text: 'text-[#155724]',
        label: 'Available',
      };
    case 'refunded':
      return {
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#991B1B]',
        label: 'Refunded',
      };
    case 'pending':
    case 'on_hold':
      return {
        bg: 'bg-[#FFF3CD]',
        text: 'text-[#856404]',
        label: status?.toLowerCase() === 'on_hold' ? 'On Hold' : 'Pending',
      };
    case 'disputed':
      return {
        bg: 'bg-[#E7D5FF]',
        text: 'text-[#6B21A8]',
        label: 'Disputed',
      };
    default:
      return {
        bg: 'bg-[#E7D5FF]',
        text: 'text-[#6B21A8]',
        label: status || 'Unknown',
      };
  }
};

const RecentEarning = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const {
    data: earningHistoryData,
    isLoading,
    refetch,
    isRefetching,
  } = useGetEarningHistory() as {
    data: EarningHistoryResponse | EarningItem[] | undefined;
    isLoading: boolean;
    refetch: () => void;
    isRefetching: boolean;
  };

  // Extract earnings array from API response
  const earnings: EarningItem[] = useMemo(() => {
    if (!earningHistoryData) return [];

    // Case 1: Hook returned a flat array of earnings
    if (Array.isArray(earningHistoryData)) {
      return earningHistoryData as EarningItem[];
    }

    const innerData = earningHistoryData.data;

    // Case 2: API like { status, code, message, data: { current_page, data: [...] } }
    if (innerData && !Array.isArray(innerData) && Array.isArray((innerData as any).data)) {
      return (innerData as any).data as EarningItem[];
    }

    // Case 3: API like { status, code, message, data: [...] }
    if (Array.isArray(innerData)) {
      return innerData as EarningItem[];
    }

    return [];
  }, [earningHistoryData]);

  const handleRefresh = () => {
    refetch();
  };

  const renderEarningItem = ({ item }: { item: EarningItem }) => {
    const statusStyle = getStatusBadgeStyle(item.status);
    const cardBg = isDark
      ? 'bg-[#162721] border border-[#273F36]'
      : 'bg-[#FFFFFF] border border-[#DAE7E0]';
    const textMain = isDark ? 'text-white' : 'text-black';
    const textMuted = isDark ? 'text-[#8AA897]' : 'text-[#658176]';

    const consultation = item.consultation_request;
    const problemDescription = consultation?.problem_description || 'No description available';
    const hasImage = Boolean(consultation?.image_public_url);

    return (
      <View className={`rounded-[10px] p-5 mb-4 ${cardBg}`}>
        {/* Header with amount and status */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className={`text-[#27B07D] text-xl font-poppins-semibold mb-1`}>
              {formatMoney(item.net_amount)}
            </Text>
            <Text className={`${textMuted} text-sm font-poppins-regular`}>
              {formatDate(item.earned_at)}
            </Text>
          </View>
          <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
            <Text className={`${statusStyle.text} text-xs font-urbanist-bold`}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Consultation Request Info */}
        {consultation && (
          <View className="mb-3">
            <Text className={`${textMuted} text-xs font-poppins-regular mb-1`}>
              Consultation Request #{consultation.id}
            </Text>
            <Text className={`${textMain} text-sm font-poppins-regular mb-2`} numberOfLines={2}>
              {problemDescription}
            </Text>

            {consultation.rating && (
              <View className="flex-row items-center gap-1 mt-1">
                <Image
                  source={require('@/assets/icons/Star.png')}
                  className="w-4 h-4"
                  resizeMode="contain"
                />
                <Text className={`${textMuted} text-xs font-poppins-regular`}>
                  {consultation.rating}/5
                </Text>
              </View>
            )}
          </View>
        )}
        <View
          className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-3`}
        />

        {/* Amount Details */}
        <View className="flex-row mb-3">
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-poppins-regular mb-1`}>Gross Amount</Text>
            <Text className={`${textMain} text-sm font-urbanist-bold`}>
              {formatMoney(item.gross_amount)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-poppins-regular mb-1`}>Platform Fee</Text>
            <Text className={`${textMain} text-sm font-urbanist-bold`}>
              {formatMoney(item.platform_fee)}
            </Text>
          </View>
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-poppins-regular mb-1`}>Net Amount</Text>
            <Text className={`${textMain} text-sm font-urbanist-bold`}>
              {formatMoney(item.net_amount)}
            </Text>
          </View>
          {item.monthly_pot && (
            <View className="flex-1">
              <Text className={`${textMuted} text-xs font-poppins-regular mb-1`}>Strike Price</Text>
              <Text className={`${textMain} text-sm font-urbanist-bold`}>
                {formatMoney(item.monthly_pot.strike_price)}
              </Text>
            </View>
          )}
        </View>
        <View
          className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-3`}
        />

        {/* Refund Information */}
        {item.status === 'refunded' && item.refund_amount && (
          <View className={`rounded-lg p-3 mb-3  bg-[#F8D7DA] border border-[#f4cbcf]`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="arrow-undo" size={16} color="#721C24" />
              <Text className={`text-[#721C24] text-xs font-poppins-bold`}>Refunded</Text>
            </View>
            <Text className={`text-[#721C24] text-sm font-poppins-bold mb-1`}>
              {formatMoney(item.refund_amount)}
            </Text>
            {item.refunded_at && (
              <Text className={`text-[#721C24] text-xs font-poppins-regular`}>
                {formatDate(item.refunded_at)}
              </Text>
            )}
            {item.refund_notes && (
              <Text className={`text-[#721C24] text-xs font-poppins-regular mt-1`}>
                Notes: {item.refund_notes}
              </Text>
            )}
          </View>
        )}

        {/* Dispute Information */}
        {item.dispute_id && (
          <View
            className={`rounded-lg p-3 mb-3 bg-[#CFE2FF] border border-[#a8c4ed]
            `}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={16} color="#084298" />
              <Text className={`text-[#084298] text-xs font-poppins-bold`}>
                Dispute ID: {item.dispute_id}
              </Text>
            </View>
            {item.dispute_until && (
              <Text className={`text-[#084298] text-xs font-poppins-regular mt-1`}>
                Dispute until: {formatDate(item.dispute_until)}
              </Text>
            )}
          </View>
        )}

        {/* Hold Information */}
        {item.hold_until && item.status !== 'refunded' && (
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="time-outline" size={14} color={isDark ? '#8AA897' : '#658176'} />
            <Text className={`${textMuted} text-xs font-poppins-regular`}>
              Hold until: {formatDate(item.hold_until)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#27B07D" />
          <Text
            className={`${isDark ? 'text-white' : 'text-textDark'} text-sm font-urbanist-regular mt-3`}
          >
            Loading earnings...
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center justify-center py-20 px-8">
        <Ionicons
          name="cash-outline"
          size={64}
          color={isDark ? '#8AA897' : '#658176'}
          style={{ marginBottom: 16 }}
        />
        <Text
          className={`text-xl font-urbanist-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
        >
          No earnings found
        </Text>
        <Text
          className={`text-center text-sm font-urbanist-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
        >
          You don't have any earnings yet.
        </Text>
      </View>
    );
  };

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <View className="flex-1">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />

        {/* Header */}
        <View className="px-5 pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0" />

        {/* Content */}
        <View className="flex-1 px-5 absolute top-5 left-0 right-0 bottom-5 z-10">
          <FlatList
            data={earnings}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEarningItem}
            ListHeaderComponent={
              <View className="mb-5">
                <Text className="text-2xl font-urbanist-bold mb-1 text-white">Recent Earnings</Text>
                <Text className="text-sm font-poppins-regular text-white">
                  Your recent consultation earnings
                </Text>
              </View>
            }
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor="#27B07D"
              />
            }
          />
        </View>
      </View>
    </GradientBackground>
  );
};

export default RecentEarning;
