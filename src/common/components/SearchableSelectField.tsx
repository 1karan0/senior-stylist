import React, { useState, useMemo } from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/contexts/ThemeContext';

export interface SearchableSelectOption {
  label: string;
  value: string;
}

interface SearchableSelectFieldProps {
  label: string;
  placeholder?: string;
  options: SearchableSelectOption[];
  value: string;
  onSelect: (value: string) => void;
  error?: string;
  testId?: string;
}

const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  label,
  placeholder = 'Search and select...',
  options,
  value,
  onSelect,
  error,
  testId,
}) => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const valueLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value]
  );

  const bgClass = isDark
    ? 'bg-[#0E1B16] border border-[#273F36]'
    : 'bg-white border border-[#DAE7E0]';
  const modalBg = isDark ? 'bg-[#0E1B16]' : 'bg-white';
  const muted = isDark ? 'text-[#8AA897]' : 'text-[#658176]';
  const textMain = isDark ? 'text-white' : 'text-black';
  const optionBg = (selected: boolean) =>
    selected ? 'bg-[#27B07D]/15 border border-[#27B07D]' : isDark ? 'bg-[#162721]' : 'bg-[#F7FAF8]';
  const inputBg = isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-[#F7FAF8] border-[#DAE7E0]';

  const closeModal = () => {
    setSearch('');
    Keyboard.dismiss();
    // Let keyboard dismiss before closing so no white strip is left behind
    setTimeout(() => setOpen(false), 50);
  };

  const handleSelect = (optValue: string) => {
    onSelect(optValue);
    closeModal();
  };

  const handleClose = () => {
    closeModal();
  };

  return (
    <>
      <Text
        className={`text-sm font-urbanist-semibold mb-3 mt-3 ${isDark ? 'text-white' : 'text-textDark'} mb-2`}
      >
        {label}
      </Text>
      <TouchableOpacity
        testID={testId}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        className={`rounded-xl px-4 py-5 flex-row items-center justify-between border ${
          error ? 'border-red-500' : ''
        } ${bgClass}`}
      >
        <Text
          className={`${valueLabel ? textMain : muted} text-sm font-urbanist-regular`}
          numberOfLines={1}
        >
          {valueLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={isDark ? '#8AA897' : '#658176'} />
      </TouchableOpacity>
      {error ? <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <TouchableOpacity activeOpacity={1} onPress={handleClose} className="flex-1  justify-end">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => undefined}
              className={`rounded-t-3xl p-5 max-h-[80%] ${modalBg}`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className={`${textMain} text-base font-urbanist-bold`}>{label}</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={22} color={isDark ? '#ffffff' : '#000000'} />
                </TouchableOpacity>
              </View>

              <View className={`rounded-xl px-3 py-2 mb-3 border ${inputBg}`}>
                <View className="flex-row items-center">
                  <Ionicons
                    name="search"
                    size={18}
                    color={isDark ? '#8AA897' : '#658176'}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search..."
                    placeholderTextColor={isDark ? '#8AA897' : '#658176'}
                    className={`flex-1 py-2 text-sm font-urbanist-regular ${textMain}`}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {search.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={isDark ? '#8AA897' : '#658176'}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 280 }}
                ListEmptyComponent={
                  <Text className={`${muted} text-sm text-center py-4`}>No matches found</Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    className={`rounded-xl px-4 py-3 mt-1 ${optionBg(item.value === value)}`}
                  >
                    <Text
                      className={`${textMain} text-sm font-urbanist-semibold`}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                    {item.value !== item.label ? (
                      <Text className={`${muted} text-xs mt-0.5`}>{item.value}</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default SearchableSelectField;
