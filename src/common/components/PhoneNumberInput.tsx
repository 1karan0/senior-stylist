import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import CountryPicker, { type CountryCode } from 'react-native-country-picker-modal';
import { verticalScale, moderateScale } from '@/utils/utility';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  label?: string;
  value?: string;
  error?: string;
  initialCountry?: {
    cca2: CountryCode;
    callingCode: string;
  };
  onPhoneChange?: (country: any, value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function PhoneNumberInput({
  label,
  value,
  error,
  initialCountry,
  onPhoneChange,
  onFocus,
  onBlur,
}: Props) {
  const { isDark } = useTheme();

  const [country, setCountry] = useState<{ cca2: CountryCode; callingCode: string }>({
    cca2: initialCountry?.cca2 || 'GB',
    callingCode: initialCountry?.callingCode || '+44',
  });

  const [visible, setVisible] = useState(false);

  const handleSelect = (c: any) => {
    const updated = {
      cca2: c.cca2,
      callingCode: `+${c.callingCode[0]}`,
    };
    setCountry(updated);
    onPhoneChange?.(updated, value || '');
  };

  const handleChange = (text: string) => {
    onPhoneChange?.(country, text);
  };

  return (
    <View style={{ marginTop: verticalScale(0) }}>
      {/* Label from props */}
      {label && (
        <Text className={`mb-1 text-[14px] font-medium ${isDark ? 'text-white' : 'text-textDark'}`}>
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center border ${
          error
            ? 'border-red-500'
            : isDark
              ? 'bg-commonGradientStop6 border-commonGradientStop7'
              : 'bg-[#F5F9F7] border-commonGradientStop11'
        } rounded-xl px-4 h-[52px] mb-1`}
      >
        {/* Country picker */}
        <Pressable
          onPress={() => setVisible(true)}
          className="flex-row items-center"
          style={{ width: '24%' }}
        >
          <Text className={`${isDark ? 'text-white' : 'text-textDark'} text-[14px]`}>
            {country.callingCode}
          </Text>
        </Pressable>

        <CountryPicker
          withFilter
          withCallingCode
          withFlag
          withFlagButton={false}
          withCallingCodeButton={false}
          countryCode={country.cca2}
          visible={visible}
          onSelect={handleSelect}
          onClose={() => setVisible(false)}
        />

        {/* Divider */}
        <View className="h-[60%] w-[1px] bg-[#666] mx-2" />

        {/* Input */}
        <TextInput
          className={`flex-1 text-[14px] ${isDark ? 'text-white' : 'text-textDark'}`}
          placeholder="Enter number"
          placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
          keyboardType="number-pad"
          maxLength={15}
          value={value}
          onChangeText={handleChange}
          onFocus={() => {
            onFocus?.();
          }}
          onBlur={() => {
            onBlur?.();
          }}
          style={{
            height: verticalScale(48),
            paddingHorizontal: moderateScale(12),
          }}
        />
      </View>

      {error && <Text className="text-red-500 text-[12px] mt-1 ml-1">{error}</Text>}
    </View>
  );
}
