import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from './SearchBar';
import FilterButtons from './FilterButtons';

type FilterKey = 'all' | 'unread';

interface ConsultantChatHomeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  isRealtimeConnected: boolean;
}

const ConsultantChatHomeHeader: React.FC<ConsultantChatHomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  isRealtimeConnected,
}) => {
  const { isDark } = useTheme();

  return (
    <View className="mb-4">
      <Text
        className={`text-2xl font-urbanist-bold mb-1 ${isDark ? 'text-textWhite' : 'text-textDark'}`}
      >
        Client Consultations
      </Text>
      <Text className={`text-xs font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}>
        {isRealtimeConnected ? 'Connected to live updates' : 'Showing last synced conversations'}
      </Text>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="Search clients or topics..."
      />

      <FilterButtons activeFilter={activeFilter} onFilterChange={onFilterChange} />
    </View>
  );
};

export default ConsultantChatHomeHeader;
