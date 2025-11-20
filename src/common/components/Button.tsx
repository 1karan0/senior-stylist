import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export type ButtonVariant = 'gradient' | 'light';

export interface AppButtonProps {
  text?: string;
  icon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
  textClassName?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  text,
  icon,
  onPress,
  disabled = false,
  variant = 'gradient',
  className = '',
  textClassName = '',
}) => {
  const isGradient = variant === 'gradient';
  const gradientColors = ['#27B07D', '#36D399'];
  const disabledColors = ['#DADADA', '#DADADA'];

  const labelClass = disabled ? 'text-textMuted' : isGradient ? 'text-white' : 'text-primary';

  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={0.8}>
      {/* Gradient Variant (when NOT disabled) */}
      {isGradient && !disabled ? (
        <LinearGradient colors={gradientColors} className={`py-3 px-4 rounded-xl ${className}`}>
          <View className="flex-row items-center justify-center gap-2">
            {icon}
            {text && (
              <Text className={`text-base font-semibold ${labelClass} ${textClassName}`}>
                {text}
              </Text>
            )}
          </View>
        </LinearGradient>
      ) : (
        // Light variant OR Disabled (solid background)
        <View
          className={`
            py-3 px-4 rounded-xl
            ${disabled ? 'bg-disabled' : 'bg-white'}
            ${className}
          `}
        >
          <View className="flex-row items-center justify-center gap-2">
            {icon}
            {text && (
              <Text className={`text-base font-semibold ${labelClass} ${textClassName}`}>
                {text}
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
