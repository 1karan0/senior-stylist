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

type DisputeListNavigationProp = StackNavigationProp<ProfileStackParamList, 'DisputeList'>;

interface Props {
  navigation: DisputeListNavigationProp;
}

type FilterType = 'all' | 'open' | 'resolved';

interface Dispute {
  id: number;
  status: string;
  consultation_id: number;
  consultation_id_formatted: string;
  created_at: string;
  consultant: {
    id: number;
    name: string;
    profile_picture_url: string | null;
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
      return 'bg-yellow-100 border-yellow-400';
    case 'closed':
    case 'resolved':
      return 'bg-green-100 border-green-400';
    default:
      return 'bg-gray-100 border-gray-400';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'text-yellow-700';
    case 'closed':
    case 'resolved':
      return 'text-green-700';
    default:
      return 'text-gray-700';
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

const DisputeList: React.FC<Props> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { data, isLoading, error, refetch, isRefetching } = useGetDisputes();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const disputes: Dispute[] = data?.data?.disputes || [];
  console.log('disputes', disputes);
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
    const statusColor = getStatusColor(item.status);
    const statusTextColor = getStatusTextColor(item.status);
    const statusLabel = getStatusLabel(item.status);

    // Format dispute ID like #DIS-001
    const disputeId = `#DIS-${String(item.id).padStart(3, '0')}`;

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
      <View className="bg-white rounded-xl p-4 mb-3 border border-[#DAE7E0]">
        {/* Header Row with Dispute ID and Status */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-base font-poppins-semibold text-textDark mb-1">
              {disputeId} Consultation Quality Issue
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full border ${statusColor}`}>
            <Text className={`text-xs font-urbanist-semibold ${statusTextColor}`}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Date */}
        <Text className="text-xs font-urbanist-regular text-textMuted mb-3">
          {formatDate(item.created_at)}
        </Text>

        {/* Consultation Details */}
        <View className="mb-3">
          <Text className="text-sm font-poppins-regular text-textDark">
            Consultation {item.consultation_id_formatted}
          </Text>
          <Text className="text-sm font-poppins-regular text-textDark">
            Stylist: {item.consultant?.name || 'Unknown'}
          </Text>
        </View>

        {/* Update Message */}
        <View className="flex-row items-center mb-4">
          {item.status === 'closed' || item.status === 'resolved' ? (
            <>
              <Ionicons name="checkmark-circle" size={16} color="#27B07D" />
              <Text className="text-xs font-urbanist-regular text-green-700 ml-2">
                {getUpdateMessage()}
              </Text>
            </>
          ) : (
            <Text className="text-xs font-urbanist-regular text-textMuted">
              {getUpdateMessage()}
            </Text>
          )}
        </View>

        {/* Footer with Logo and View Details Button */}
        <View className="flex-row items-center justify-between">
          {/* Logo placeholder - you can replace with actual logo */}
          <View className="w-8 h-8 bg-buttonPrimaryBg rounded-full justify-center items-center">
            <Text className="text-white font-urbanist-bold text-xs">S</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleViewDetails(item.id)}
            className="bg-buttonPrimaryBg px-4 py-2 rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-white font-poppins-semibold text-sm">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />

      {/* Header */}
      <View className="px-6 pt-10 pb-5 bg-buttonPrimaryBg rounded-b-2xl">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-white text-2xl font-urbanist-bold mb-1">My Disputes</Text>
            <Text className="text-white font-poppins-regular opacity-90">
              View and manage your disputes
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateDispute}
            className="bg-yellow-300 px-4 py-2 rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-green-700 font-poppins-semibold">+ Create Dispute</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2">
          {(['all', 'open', 'resolved'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl ${
                activeFilter === filter ? 'bg-white' : 'bg-white/20'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-poppins-semibold text-sm ${
                  activeFilter === filter ? 'text-buttonPrimaryBg' : 'text-white'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'open' ? 'Open' : 'Resolved'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6 pb-5">
        {isLoading && !data ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#27B07D" />
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
