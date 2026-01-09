import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetPayouts } from '@/api/consultant/earning/useGetPayouts';
import { PayoutItem } from '@/common/types';
import { PayoutListSkeleton } from '@/common/components/skeletons/PayoutItemSkeleton';

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
    case 'completed':
    case 'paid':
      return {
        bg: 'bg-[#D4EDDA]',
        text: 'text-[#155724]',
        label: 'Completed',
      };
    case 'pending':
    case 'processing':
      return {
        bg: 'bg-[#E7D5FF]',
        text: 'text-[#6B21A8]',
        label: status?.toLowerCase() === 'processing' ? 'Processing' : 'Pending',
      };
    case 'failed':
      return {
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#991B1B]',
        label: 'Failed',
      };
    default:
      return {
        bg: 'bg-[#E7D5FF]',
        text: 'text-[#6B21A8]',
        label: status || 'Pending',
      };
  }
};

const PayOutHistory = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const [page, setPage] = useState(1);
  const [allPayouts, setAllPayouts] = useState<PayoutItem[]>([]);
  const perPage = 10;

  const {
    data: payoutsData,
    isLoading,
    isFetching,
    refetch,
    isRefetching,
  } = useGetPayouts({
    page,
    per_page: perPage,
  });

  // Extract payouts from current page response
  const currentPagePayouts: PayoutItem[] = useMemo(() => {
    if (!payoutsData) return [];
    // Handle Laravel pagination structure (data.data is the array)
    if (payoutsData?.data && Array.isArray(payoutsData.data)) {
      return payoutsData.data;
    }
    // Handle direct data array
    if (Array.isArray(payoutsData)) return payoutsData;
    if (payoutsData?.payouts && Array.isArray(payoutsData.payouts)) return payoutsData.payouts;
    return [];
  }, [payoutsData]);

  // Accumulate payouts across pages
  useEffect(() => {
    if (currentPagePayouts.length > 0) {
      if (page === 1) {
        // Reset on first page or refresh
        setAllPayouts(currentPagePayouts);
      } else {
        // Append new page data
        setAllPayouts((prev) => {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(prev.map((p) => p.id || p.transfer_id || p.transferId));
          const newPayouts = currentPagePayouts.filter(
            (p) => !existingIds.has(p.id || p.transfer_id || p.transferId)
          );
          return [...prev, ...newPayouts];
        });
      }
    }
  }, [currentPagePayouts, page]);

  const pagination = useMemo(() => {
    if (!payoutsData) return null;
    // Handle Laravel pagination structure
    if (payoutsData?.current_page !== undefined) {
      return {
        current_page: payoutsData.current_page,
        last_page: payoutsData.last_page,
        per_page: payoutsData.per_page,
        total: payoutsData.total,
        from: payoutsData.from,
        to: payoutsData.to,
        has_more: payoutsData.next_page_url !== null,
      };
    }
    // Handle flat structure
    if (Array.isArray(payoutsData)) return null;
    return payoutsData?.pagination || payoutsData?.meta || null;
  }, [payoutsData]);

  const hasMore = pagination
    ? pagination.current_page < pagination.last_page || pagination.has_more
    : false;

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching, isLoading]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const renderPayoutItem = ({ item }: { item: PayoutItem }) => {
    const statusStyle = getStatusBadgeStyle(item.status || 'pending');
    // Map API fields to display fields
    const amount = item.requested_amount || item.amount || 0;
    const netAmount = item.net_amount || item.netAmount || amount;
    const fees = item.stripe_fee_amount || item.fees || 0;
    const transferId = item.stripe_payout_id || item.transfer_id || item.transferId || '—';
    // Use processed_at if available, otherwise created_at
    const date = item.processed_at || item.created_at || item.createdAt || item.date || '';

    const cardBg = isDark
      ? 'bg-[#162721] border border-[#273F36]'
      : 'bg-[#FFFFFF] border border-[#DAE7E0]';
    const textMain = isDark ? 'text-white' : 'text-black';
    const textMuted = isDark ? 'text-[#8AA897]' : 'text-[#658176]';

    return (
      <View className={`rounded-[10px] p-5 mb-4 ${cardBg}`}>
        {/* Header with amount and status */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className={`text-[#27B07D] text-xl font-poppins-semibold mb-1`}>
              {formatMoney(amount)}
            </Text>
            <Text className={`${textMuted} text-sm font-urbanist-regular`}>{formatDate(date)}</Text>
          </View>
          <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
            <Text className={`${statusStyle.text} text-xs font-urbanist-bold`}>
              {statusStyle.label}
            </Text>
          </View>
        </View>
        <View
          className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-3`}
        />

        {/* Details */}
        <View className="flex-row mb-3">
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-urbanist-regular mb-1`}>Amount</Text>
            <Text className={`${textMain} text-sm font-urbanist-semibold`}>
              {formatMoney(amount)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-urbanist-regular mb-1`}>Fees</Text>
            <Text className={`${textMain} text-sm font-urbanist-semibold`}>
              {formatMoney(-Math.abs(Number(fees)))}
            </Text>
          </View>
        </View>

        <View className="flex-row ">
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-urbanist-regular mb-1`}>Net Amount</Text>
            <Text className={`${textMain} text-sm font-urbanist-semibold`}>
              {formatMoney(netAmount)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`${textMuted} text-xs font-urbanist-regular mb-1`}>Transfer ID</Text>
            <Text className={`${textMain} text-xs font-urbanist-regular`} numberOfLines={1}>
              {transferId}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View className="items-center justify-center py-20 px-8">
        <Ionicons
          name="wallet-outline"
          size={64}
          color={isDark ? '#8AA897' : '#658176'}
          style={{ marginBottom: 16 }}
        />
        <Text
          className={`text-xl font-urbanist-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
        >
          No payouts found
        </Text>
        <Text
          className={`text-center text-sm font-urbanist-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
        >
          You don't have any payouts yet.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    if (isFetching && page > 1) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#27B07D" />
        </View>
      );
    }
    return null;
  };

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <View className="flex-1">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />

        {/* Header */}
        <View className="px-5 pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0" />

        {/* Content */}
        <View className="flex-1 px-5 absolute top-5 left-0 right-0 bottom-5 z-10">
          {isLoading && allPayouts.length === 0 ? (
            <View>
              {/* Header Text */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-1">
                  <Text className="text-3xl font-urbanist-bold mb-1 text-white">
                    Payout History
                  </Text>
                  <Text className="text-sm font-urbanist-regular text-white opacity-80">
                    All your payouts and transfers
                  </Text>
                </View>
              </View>
              <PayoutListSkeleton />
            </View>
          ) : (
            <FlashList
              data={allPayouts}
              keyExtractor={(item, index) =>
                String(item.id || item.transfer_id || item.transferId || index)
              }
              renderItem={renderPayoutItem}
              ListHeaderComponent={
                <>
                  {/* Header Text */}
                  <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-1">
                      <Text className="text-3xl font-urbanist-bold mb-1 text-white">
                        Payout History
                      </Text>
                      <Text className="text-sm font-urbanist-regular text-white opacity-80">
                        All your payouts and transfers
                      </Text>
                    </View>
                  </View>
                </>
              }
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={handleRefresh}
                  tintColor="#27B07D"
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
};

export default PayOutHistory;
