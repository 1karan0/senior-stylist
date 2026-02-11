import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';
import SearchBar from './SearchBar';
import { useTabletLayout } from '@/hooks/useTabletLayout';
type NavParamList = AppStackParamList & ConsultationStackParamList;

interface ChatHomeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRealtimeConnected: boolean;
}

const ChatHomeHeader: React.FC<ChatHomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  isRealtimeConnected,
}) => {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NavParamList>>();
  const { horizontalPadding } = useTabletLayout();
  return (
    <View className="pt-6" style={[{ paddingHorizontal: horizontalPadding }]}>
      <View className="flex-row justify-between items-center">
        <Text
          className={`${isDark ? 'text-white' : 'text-textDark'} text-2xl font-urbanist font-bold`}
        >
          Consultations
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('NewConsultant')}
          className="bg-yellow-300 px-4 py-2 rounded-full"
        >
          <Text className="font-semibold text-green-700">+ New</Text>
        </TouchableOpacity>
      </View>

      <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />

      <Text className={`mt-2 text-[11px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
        {isRealtimeConnected ? 'Connected to live updates' : 'Showing last synced conversations'}
      </Text>
    </View>
  );
};

export default ChatHomeHeader;
