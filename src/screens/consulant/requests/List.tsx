import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { AppButton } from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';

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
  // optional style passed down from screens (e.g. paddingBottom to avoid tab)
  contentContainerStyle?: ViewStyle | ViewStyle[];
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
  contentContainerStyle,
}) => {
  const { isDark } = useTheme();

  // default bottom spacing — screens can override by passing contentContainerStyle
  const defaultContainerStyle: ViewStyle = { paddingBottom: 32, flexGrow: 1 };

  // merge default with any incoming style(s)
  const mergedContentContainerStyle = Array.isArray(contentContainerStyle)
    ? [defaultContainerStyle, ...contentContainerStyle]
    : [defaultContainerStyle, contentContainerStyle as ViewStyle | undefined];

  return (
    <ScrollView
      className="flex-1 pt-4"
      contentContainerStyle={mergedContentContainerStyle}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#27B07D" />
      }
    >
      {requests.length === 0 ? (
        <View className="flex-1 items-center justify-start pt-20">
          <Text
            className={`font-urbanist text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            No pending requests
          </Text>
          <Text
            className={`font-poppins text-sm text-center px-10 ${isDark ? 'text-[#8AA897]' : 'text-textMuted'}`}
          >
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
            <View
              key={request.id}
              className={`rounded-xl border p-4 mb-4 ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
            >
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
                    <View className="bg-[#DAE7E0] py-1 rounded-full self-start flex-row items-center">
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
                  <Text
                    className={`text-xl font-urbanist font-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {request.customerName}
                  </Text>
                  <Text
                    className={`font-poppins text-sm ${isDark ? 'text-[#8AA897]' : 'text-textMuted'}`}
                  >
                    {timeAgo}
                  </Text>

                  <TouchableOpacity
                    className={`flex flex-row items-center px-2 py-1 border rounded-lg self-start mt-2 ${
                      isDark ? 'border-[#273F36]' : 'border-[#DAE7E0]'
                    }`}
                    onPress={() => onViewDetails(request)}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={isDark ? 'white' : 'black'}
                      style={{ marginRight: 4 }}
                    />

                    <Text
                      className={`font-poppins text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    >
                      Requirements
                    </Text>

                    <Ionicons
                      name="chevron-forward-outline"
                      size={14}
                      color={isDark ? 'white' : 'black'}
                      style={{ marginLeft: 4 }}
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
