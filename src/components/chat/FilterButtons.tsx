import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type FilterKey = 'all' | 'unread';

interface FilterButtonsProps {
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ activeFilter, onFilterChange }) => {
  const { isDark } = useTheme();

  return (
    <View className="flex-row gap-3 mt-4">
      {(['all', 'unread'] as FilterKey[]).map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-full border ${
              isDark ? 'border-commonGradientStop7' : 'border-commonGradientStop11'
            } ${isActive && 'bg-buttonPrimaryBg'}`}
          >
            <Text
              className={`text-sm font-urbanist-semibold ${isActive && 'text-white'} ${
                isDark ? 'text-white' : ''
              }`}
            >
              {filter === 'all' ? 'All' : 'Unread'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default FilterButtons;
