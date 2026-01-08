import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/contexts/ThemeContext';

interface SelectFieldProps {
  label: string;
  valueLabel: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
  testId?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  valueLabel,
  options,
  onSelect,
  testId,
}) => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const bgClass = isDark
    ? 'bg-[#0E1B16] border border-[#273F36]'
    : 'bg-white border border-[#DAE7E0]';
  const modalBg = isDark ? 'bg-[#0E1B16]' : 'bg-white';
  const muted = isDark ? 'text-[#8AA897]' : 'text-[#658176]';
  const textMain = isDark ? 'text-white' : 'text-black';
  const optionBg = (selected: boolean) =>
    selected ? 'bg-[#27B07D]/15 border border-[#27B07D]' : isDark ? 'bg-[#162721]' : 'bg-[#F7FAF8]';

  return (
    <>
      <Text
        className={`text-sm font-urbanist-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
      >
        {label}
      </Text>
      <TouchableOpacity
        testID={testId}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        className={`rounded-xl px-4 py-3 flex-row items-center justify-between ${bgClass}`}
      >
        <Text className={`${muted} text-sm font-urbanist-regular`} numberOfLines={1}>
          {valueLabel}
        </Text>
        <Ionicons name="chevron-down" size={18} color={isDark ? '#8AA897' : '#658176'} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => undefined}
            className={`rounded-t-3xl p-5 ${modalBg}`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${textMain} text-base font-urbanist-bold`}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>
            <View className="gap-2">
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  className={`rounded-xl px-4 py-3 ${optionBg(opt.label === valueLabel)}`}
                >
                  <Text className={`${textMain} text-sm font-urbanist-semibold`} numberOfLines={2}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SelectField;
