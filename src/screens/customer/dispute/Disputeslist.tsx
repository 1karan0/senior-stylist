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

import { useGetDisputes } from '@/api/user/dispute/useGetDisputes';
import GradientBackground from '@/common/components/GradientBackground';
import { ProfileStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { DisputeListSkeleton } from '@/common/components/skeletons/DisputeItemSkeleton';

type DisputeListNavigationProp = StackNavigationProp<ProfileStackParamList, 'DisputeList'>;

interface Props {
  navigation: DisputeListNavigationProp;
}

type FilterType = 'all' | 'open' | 'resolved';

interface Dispute {
  id: number;
  status: string;
  consultation_id: number;
  consultation_id_formatted?: string; // May be at root level
  created_at: string;
  consultant: {
    id: number;
    name: string;
    profile_picture_url: string | null;
  };
  consultation?: {
    id: number;
    consultation_id_formatted: string;
    problem_description?: string;
    completed_at?: string;
  };
  message_count: number;
  latest_message: {
    message: string;
    created_at: string;
  } | null;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return initials || '??';
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

const formatRelativeTime = (iso: string) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return iso;
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
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
  } // Dark text for all status badges
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

const DisputeList: React.FC<Props> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { data, isLoading, error, refetch, isRefetching } = useGetDisputes();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const disputes: Dispute[] = data?.data?.disputes || [];
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

  const handleCreateDispute = () => {
    navigation.navigate('CreateDispute');
  };

  const handleViewDetails = (disputeId: number) => {
    navigation.navigate('DisputeDetails', { disputeId });
  };

  const renderDisputeItem = ({ item }: { item: Dispute }) => {
    const statusBgColor = getStatusColor(item.status);
    const statusTextColor = getStatusTextColor(item.status);
    const statusLabel = getStatusLabel(item.status);
    const DisputeMessage = item.latest_message;

    // Get consultation_id_formatted from nested consultation object or root level
    const consultationIdFormatted =
      item.consultation?.consultation_id_formatted ||
      item.consultation_id_formatted ||
      `#CONS-${item.consultation_id}`;

    // Get update message
    const getUpdateMessage = () => {
      if (item.status === 'closed' || item.status === 'resolved') {
        return `Refunded on ${formatDate(item.created_at)}`;
      }
      if (item.latest_message) {
        const daysAgo = Math.floor(
          (Date.now() - new Date(item.latest_message.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysAgo === 0) return 'Admin responded today';
        if (daysAgo === 1) return 'Admin responded 1 day ago';
        return `Admin responded ${daysAgo} days ago`;
      }
      return 'Waiting for admin response';
    };

    return (
      <View
        className={`rounded-xl p-4 mb-3 border ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white  border-[#DAE7E0]'}`}
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
                {DisputeMessage?.message.slice(0, 20) + '...'}
              </Text>
              {/* Date */}
              <Text
                className={`text-xs font-urbanist-semibold ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} mb-3`}
              >
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-[10px]" style={{ backgroundColor: statusBgColor }}>
              <Text className="text-xs font-urbanist-semibold " style={{ color: statusTextColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
        <View
          className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
        />

        {/* Consultation Details */}

        {/* Update Message */}
        <View className="flex-row justify-between ">
          <View className="">
            <Text
              className={`text-xs font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
            >
              Consultation {consultationIdFormatted}
            </Text>
            <Text
              className={`text-xs font-poppins-regular mb-2 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
            >
              Stylist: {item.consultant?.name || 'Unknown'}
            </Text>
            {item.status === 'closed' || item.status === 'resolved' ? (
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#36D399" />
                <Text className="text-xs font-urbanist-semibold ml-2" style={{ color: '#36D399' }}>
                  {getUpdateMessage()}
                </Text>
              </View>
            ) : (
              <Text
                className={`text-xs font-urbanist-semibold mb-2 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
              >
                {getUpdateMessage()}
              </Text>
            )}
            <View className="flex-row justify-start">
              <TouchableOpacity
                onPress={() => handleViewDetails(item.id)}
                className="px-4 py-2 rounded-[10px]"
                style={{ backgroundColor: '#36D399' }}
                activeOpacity={0.7}
              >
                <Text className="text-white font-urbanist-bold text-xs">View Details</Text>
              </TouchableOpacity>
            </View>
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
    <GradientBackground>
      <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />

      {/* Header */}
      <View className="px-6 pt-10 pb-5 rounded-b-2xl" style={{ backgroundColor: '#27B07D' }}>
        <View className="">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-white text-2xl font-urbanist-bold mb-1">My Disputes</Text>
            </View>
            <TouchableOpacity
              onPress={handleCreateDispute}
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: '#E7B008' }}
              activeOpacity={0.7}
            >
              <Text className="text-white font-poppins-semibold">+ Create Dispute</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-white font-poppins-regular ">View and manage your disputes</Text>
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
              className={`px-4 py-2 rounded-xl flex-1 border ${isDark ? 'border-commonGradientStop7' : 'border-[#DADADA]'} ${activeFilter === filter ? 'bg-buttonPrimaryBg' : 'bg-transparent'}`}
              style={{
                backgroundColor:
                  activeFilter === filter ? '#36D399' : isDark ? '#273F36' : '#ffffff',
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`font-poppins-semibold text-sm  text-center ${activeFilter === filter ? 'text-white' : isDark ? 'text-white' : 'text-textDark'}`}
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
              You haven't created any disputes. Tap the "New" button to create one.
            </Text>
            <TouchableOpacity
              onPress={handleCreateDispute}
              className="mt-6 px-6 py-3 bg-buttonPrimaryBg rounded-xl"
            >
              <Text className="text-white font-poppins-semibold">Create Dispute</Text>
            </TouchableOpacity>
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

export default DisputeList;
