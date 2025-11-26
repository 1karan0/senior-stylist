import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl } from 'react-native';
import { AppButton } from '@/common/components/Button';
import LinearGradient from 'react-native-linear-gradient';

export interface RequestItem {
  id: number;
  customerName: string;
  problemDescription: string;
  hasImage: boolean;
  requestedAt: number;
  expiresAt?: number;
}

export interface ListProps {
  requests: RequestItem[];
  onAcceptRequest: (requestId: number) => void;
  onViewDetails: (request: RequestItem) => void;
  refreshing: boolean;
  onRefresh: () => void;
  acceptingId: number | null;
}

const formatTimeAgo = (timestamp: number) => {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);

const List: React.FC<ListProps> = ({
  requests,
  onAcceptRequest,
  onViewDetails,
  refreshing,
  onRefresh,
  acceptingId,
}) => {
  return (
    <ScrollView
      className="flex-1 pt-4 px-2"
      contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#27B07D" />
      }
    >
      {requests.length === 0 ? (
        <View className="flex-1 items-center justify-center py-10">
          <Text className="font-urbanist text-lg font-semibold text-[#162721] mb-2">
            No pending requests
          </Text>
          <Text className="font-poppins text-sm text-[#658176] text-center px-10">
            Pull down to refresh. New consultation requests will appear here as soon as they arrive.
          </Text>
        </View>
      ) : (
        requests.map((request) => {
          const initials = getInitials(request.customerName);
          const timeAgo = formatTimeAgo(request.requestedAt);
          const buttonLabel =
            acceptingId && acceptingId === request.id ? 'Accepting…' : 'Accept Request';

          return (
            <View key={request.id} className="bg-white rounded-xl border border-[#DAE7E0] p-4 mb-4">
              <View className="flex-row items-start mb-4">
                <View className="w-14 h-14 rounded-full items-center justify-center mr-3 overflow-hidden">
                  <LinearGradient
                    colors={['#27B07D', '#36D399']}
                    className="w-full h-full items-center justify-center"
                  >
                    <Text className="text-white font-urbanist font-semibold text-xl">
                      {initials}
                    </Text>
                  </LinearGradient>
                </View>
                <View className="flex-1">
                  {request.hasImage && (
                    <View className="bg-[#DAE7E0] px-2 py-1 rounded-full self-start flex-row items-center">
                      <Image
                        source={require('@/assets/icons/photo.png')}
                        className="w-3 h-3 mr-1"
                        resizeMode="contain"
                      />
                      <Text className="font-urbanist font-bold text-[#161616] text-xs">
                        Photo Attached
                      </Text>
                    </View>
                  )}
                  <Text className="text-[#162721] text-xl font-urbanist font-semibold">
                    {request.customerName}
                  </Text>
                  <Text className="text-[#658176] font-poppins text-sm">{timeAgo}</Text>

                  <TouchableOpacity
                    className="flex flex-row items-center px-2 py-1 border border-[#DAE7E0] rounded-lg self-start mt-2"
                    onPress={() => onViewDetails(request)}
                  >
                    <Image
                      source={require('@/assets/icons/dark-note.png')}
                      className="w-3 h-3 mr-1"
                      resizeMode="contain"
                    />
                    <Text className="font-poppins text-black text-sm">Requirements</Text>
                    <Image
                      source={require('@/assets/icons/right-arrow.png')}
                      className="w-3 h-3 ml-1"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <AppButton
                text={buttonLabel}
                onPress={() => onAcceptRequest(request.id)}
                variant="gradient"
                className="w-full"
              />
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default List;
