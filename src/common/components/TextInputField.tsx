import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  Image,
  Pressable,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TextInputFieldProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  icon?: any;
  error?: string;
  isPassword?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  placeholder,
  icon,
  error,
  isPassword = false,
  value,
  onChangeText,
  containerClassName,
  inputClassName,
  labelClassName,
  ...props
}) => {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const defaultContainerClassName = `flex-row items-center border ${
    error
      ? 'border-red-500'
      : isDark
        ? 'bg-[#0E1B16] border-[#273F36]'
        : 'bg-[#F5F9F7] border-[#DADADA]'
  } rounded-xl px-4 h-[52px] mb-1`;

  const defaultInputClassName = `flex-1 font-normal ${isDark ? 'text-white' : 'text-black'}`;

  const defaultLabelClassName = `font-poppins-medium text-sm ${
    isDark ? 'text-white' : 'text-black'
  } mb-1`;

  return (
    <View>
      {label && <Text className={labelClassName || defaultLabelClassName}>{label}</Text>}

      <View className={containerClassName || defaultContainerClassName}>
        {icon && <Image source={icon} className="w-5 h-5 mr-3" resizeMode="contain" />}

        <RNTextInput
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
          className={inputClassName || defaultInputClassName}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={
                showPassword
                  ? require('@/assets/icons/eye-open.png')
                  : require('@/assets/icons/eye-closed.png')
              }
              className="w-5 h-5 ml-2"
              resizeMode="contain"
            />
          </Pressable>
        )}
      </View>

      {error && <Text className="text-red-500 text-[12px] mb-3 ml-1">{error}</Text>}
    </View>
  );
};

export default TextInputField;
