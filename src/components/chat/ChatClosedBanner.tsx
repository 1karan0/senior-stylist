import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const ChatClosedBanner: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View
      className={`${isDark ? 'bg-[#1A1A1A] border-[#152821]' : 'border-commonGradientStop11'} p-2 border-t`}
    >
      <Text className="text-[#A1A09A] text-xs text-center">
        This chat is closed for new messages.
      </Text>
    </View>
  );
};

export default ChatClosedBanner;
