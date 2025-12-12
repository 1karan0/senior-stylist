import React from 'react';
import { Image, TextInput, View, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search conversations...',
}) => {
  const { isDark } = useTheme();

  return (
    <View
      className={`flex-row items-center border mt-3 rounded-xl ${
        isDark
          ? 'bg-commonGradientStop6 border-commonGradientStop7'
          : 'bg-[#FAFAFA] border-[#E6E6E6]'
      }`}
      style={{
        paddingHorizontal: 12,
        minHeight: Platform.OS === 'ios' ? 32 : 48,
        paddingVertical: Platform.OS === 'ios' ? 8 : 0,
      }}
    >
      <Image source={require('../../assets/icons/search-icon.png')} className="w-5 h-5 mr-3" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6D837A"
        value={searchQuery}
        onChangeText={onSearchChange}
        className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-black'}`}
        style={{
          paddingVertical: Platform.OS === 'ios' ? 8 : 0,
          fontSize: 15,
          includeFontPadding: false,
        }}
      />
    </View>
  );
};

export default SearchBar;
