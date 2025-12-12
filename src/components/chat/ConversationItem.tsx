import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { ConversationPreview } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { getInitials, getRelativeTime } from '@/utils/consultationUtils';

interface ConversationItemProps {
  item: ConversationPreview;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ item, onPress }) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={`${
        isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'
      } shadow-sm border rounded-xl px-4 py-4 mb-2 flex-row items-center`}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} className="w-12 h-12 rounded-full mr-4" />
      ) : (
        <View className="w-12 h-12 rounded-full bg-buttonPrimaryBg items-center justify-center mr-4">
          <Text className="text-white text-lg font-semibold">{getInitials(item.title)}</Text>
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className={`font-semibold text-base ${isDark ? 'text-white' : 'text-textDark'} capitalize`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
        <Text className={`${isDark ? 'text-textMuted' : 'text-textSecondary'}`} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View className="items-end ml-2">
        <Text className={`${isDark ? 'text-textSecondary' : 'text-[#9EA3AE]'} font-medium text-xs`}>
          {getRelativeTime(item.lastMessageAt)}
        </Text>
        {item.unreadCount > 0 && (
          <View className="bg-buttonPrimaryBg w-6 h-6 rounded-full justify-center items-center mt-2">
            <Text className="text-white text-xs font-semibold">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ConversationItem;
