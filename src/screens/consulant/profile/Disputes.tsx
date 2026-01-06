import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@react-native-vector-icons/ionicons';
import { FlashList } from '@shopify/flash-list';

import { useGetConsultantDisputes } from '@/api/consultant/useGetDisputes';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { ConsultantDispute } from '@/common/types';
import { DisputeListSkeleton } from '@/common/components/skeletons/DisputeItemSkeleton';

type FilterType = 'all' | 'open' | 'resolved';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_progress':
      return '#FFF3CD'; // Yellow for Open
    case 'closed':
    case 'resolved':
      return '#D4EDDA'; // Light green for Resolved
    default:
      return '#FFF3CD';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'in_progress':
      return '#856404'; // Yellow for Open
    case 'closed':
    case 'resolved':
      return '#155724'; // Light green for Resolved
    default:
      return '#856404';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'Open';
    case 'closed':
    case 'resolved':
      return 'Resolved';
    default:
      return status.replace('_', ' ').toUpperCase();
  }
};

interface Props {
  navigation: StackNavigationProp<any>;
}

const Disputes: React.FC<Props> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { data, isLoading, error, refetch, isRefetching } = useGetConsultantDisputes();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const disputes: ConsultantDispute[] = data?.data?.disputes || [];
  const filteredDisputes = useMemo(() => {
    if (activeFilter === 'all') return disputes;
    if (activeFilter === 'open') {
      return disputes.filter((d) => d.status === 'in_progress');
    }
    if (activeFilter === 'resolved') {
      return disputes.filter((d) => d.status === 'closed' || d.status === 'resolved');
    }
    return disputes;
  }, [disputes, activeFilter]);

  const handleBack = () => {
    navigation.goBack();
  };

  const renderDisputeItem = ({ item }: { item: ConsultantDispute }) => {
    const statusBgColor = getStatusColor(item.status);
    const statusTextColor = getStatusTextColor(item.status);
    const statusLabel = getStatusLabel(item.status);
    const consultationIdFormatted = `#CONS-${String(item.consultation_id).padStart(3, '0')}`;

    // Get update message
    const getUpdateMessage = () => {
      if (item.status === 'closed' || item.status === 'resolved') {
        if (item.resolution) {
          const resolvedDate = formatDate(item.resolution.resolved_at);
          if (item.resolution.penalty_amount) {
            return `Resolved on ${resolvedDate} - Penalty: $${item.resolution.penalty_amount}`;
          }
          return `Resolved on ${resolvedDate}`;
        }
        return `Resolved on ${formatDate(item.created_at)}`;
      }
      return 'Dispute in progress';
    };

    return (
      <View
        className={`rounded-xl p-4 mb-3 border ${
          isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
        }`}
      >
        {/* Header Row with Dispute ID and Status */}
        <View>
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-poppins-semibold mb-1" style={{ color: '#36D399' }}>
                {consultationIdFormatted}
              </Text>
              <Text
                className={`text-base font-poppins-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Dispute #{item.id}
              </Text>
              {/* Date */}
              <Text
                className={`text-xs font-urbanist-semibold ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} mb-3`}
              >
                Created: {formatDate(item.created_at)}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-[10px]" style={{ backgroundColor: statusBgColor }}>
              <Text className="text-xs font-urbanist-semibold" style={{ color: statusTextColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
        <View
          className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
        />

        {/* Dispute Details */}
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text
              className={`text-xs font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
            >
              Consultation {consultationIdFormatted}
            </Text>
            {item.status === 'closed' || item.status === 'resolved' ? (
              <View className="flex-row items-center mb-2 mt-2">
                <Ionicons name="checkmark-circle" size={16} color="#36D399" />
                <Text className="text-xs font-urbanist-semibold ml-2" style={{ color: '#36D399' }}>
                  {getUpdateMessage()}
                </Text>
              </View>
            ) : (
              <Text
                className={`text-xs font-urbanist-semibold mb-2 mt-2 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
              >
                {getUpdateMessage()}
              </Text>
            )}
            {item.resolution?.resolved_by && (
              <Text
                className={`text-xs font-poppins-regular mb-2 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
              >
                Resolved by: {item.resolution.resolved_by}
              </Text>
            )}
            {item.resolution?.resolution_notes && (
              <Text
                className={`text-xs font-poppins-regular mb-2 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
              >
                Notes: {item.resolution.resolution_notes}
              </Text>
            )}
          </View>

          <View className="">
            <Image
              source={
                isDark
                  ? require('@/assets/icons/dark-logo.png')
                  : require('@/assets/icons/colored_logo.png')
              }
              className="w-10 h-10"
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
      {/* Header */}
      <View className="px-6 pt-5 pb-5 rounded-b-2xl " style={{ backgroundColor: '#27B07D' }}>
        <View className="">
          <View className="flex-row gap-3 items-center mb-2">
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-urbanist-bold">My Disputes</Text>
          </View>
          <Text className="text-white font-poppins-regular">
            View and manage disputes against you
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6 pb-5 w-full">
        {/* Filter Tabs */}
        <View className="flex-row gap-2 justify-between w-full mb-4">
          {(['all', 'open', 'resolved'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl flex-1 border ${
                isDark ? 'border-commonGradientStop7' : 'border-[#DADADA]'
              } ${activeFilter === filter ? 'bg-buttonPrimaryBg' : 'bg-transparent'}`}
              style={{
                backgroundColor:
                  activeFilter === filter ? '#36D399' : isDark ? '#273F36' : '#ffffff',
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`font-poppins-semibold text-sm text-center ${
                  activeFilter === filter ? 'text-white' : isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'open' ? 'Open' : 'Resolved'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {isLoading && !data ? (
          <View className="flex-1">
            <DisputeListSkeleton />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={isDark ? '#8AA897' : '#94A3B8'}
            />
            <Text
              className={`text-base font-poppins-regular mt-4 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Failed to load disputes
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 px-6 py-2 bg-buttonPrimaryBg rounded-xl"
            >
              <Text className="text-white font-poppins-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : disputes.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons
              name="document-text-outline"
              size={64}
              color={isDark ? '#8AA897' : '#94A3B8'}
            />
            <Text
              className={`text-lg font-poppins-semibold mt-4 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              No Disputes Yet
            </Text>
            <Text
              className={`text-sm font-poppins-regular mt-2 text-center px-8 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              You don't have any disputes or reports against you at the moment.
            </Text>
          </View>
        ) : (
          <FlashList
            data={filteredDisputes}
            renderItem={renderDisputeItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#27B07D" />
            }
          />
        )}
      </View>
    </GradientBackground>
  );
};

export default Disputes;
