import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EmptyMessageListProps {
  offlineError: string | null;
  hasMessages: boolean;
  loading: boolean;
  onRetry?: () => void;
  realtimeEnabled: boolean;
}

const EmptyMessageList: React.FC<EmptyMessageListProps> = ({
  offlineError,
  hasMessages,
  loading,
  onRetry,
  realtimeEnabled,
}) => {
  if (offlineError && !hasMessages) {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <Text className="text-[#FF4433] text-base text-center mb-4">{offlineError}</Text>
        {onRetry && (
          <TouchableOpacity
            className="bg-buttonPrimaryBg px-6 py-3 rounded-lg"
            onPress={() => {
              if (!realtimeEnabled) {
                onRetry();
              }
            }}
          >
            <Text className="text-white text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!hasMessages && !loading) {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <Text className="text-[#A1A09A] text-base text-center">
          No messages yet. Start the conversation!
        </Text>
      </View>
    );
  }

  return null;
};

export default EmptyMessageList;
