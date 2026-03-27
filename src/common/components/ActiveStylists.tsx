import { Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { useGetAvailableStylists } from '@/api/user/consultation/useGetAvailableStylists';
const ActiveStylist = () => {
  const { data: availableStylists } = useGetAvailableStylists();
  const activeStylistCount = availableStylists?.total_online_consultants || 0;
  const message = availableStylists?.message || '';
  const { isDark } = useTheme();
  return (
    <View>
      <View className="flex-row">
        <View
          className={`mb-4 flex-row items-center justify-start gap-2 ${!activeStylistCount ? `${isDark ? 'bg-[#222a26]' : 'bg-[#e7e7e7]'}` : `${isDark ? 'bg-[#254c37]' : 'bg-[#cadaca]'}`} rounded-full px-4 py-2`}
        >
          <View
            className={`w-3 h-3 ${!activeStylistCount ? 'bg-[#7d8a86]' : 'bg-[#66cb76]'} rounded-full`}
          />
          <Text className={`font-semibold  ${isDark ? 'text-white' : 'text-textDark'}`}>
            {activeStylistCount && activeStylistCount > 0
              ? `${activeStylistCount} ${message}`
              : message}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ActiveStylist;
