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

  // Default visual tokens
  const disabledBgClass = 'bg-disabled';
  const lightDefaultBgClass = 'bg-white border-[#DAE7E0]';
  const lightDefaultTextClass = 'text-textDark';
  const gradientDefaultTextClass = 'text-white';
  const disabledTextClass = 'text-textMuted';

  // Determine label color
  const defaultLabelClass = isGradient ? gradientDefaultTextClass : lightDefaultTextClass;
  const labelClass = disabled ? disabledTextClass : defaultLabelClass;

  // Determine container defaults for non-gradient (light) when not disabled.
  // Caller `className` is appended afterwards and will override these if present.
  const nonGradientDefaultContainer = !isGradient && !disabled ? lightDefaultBgClass : '';
  const nonGradientDisabledContainer = disabled ? disabledBgClass : '';

  console.log(isGradient, variant, text);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      // Order: defaults first, then caller className so overrides work.
      className={`${isGradient ? '' : nonGradientDefaultContainer} ${disabled ? nonGradientDisabledContainer : ''} ${className}`}
    >
      {isGradient && !disabled ? (
        <LinearGradient
          colors={gradientColors}
          className={`py-3 px-4 rounded-[10px] ${className}`}
          style={{ borderRadius: 10 }}
        >
          <View className="flex-row items-center justify-center gap-2">
            {icon}
            {text && (
              <Text className={`text-base font-urbanist font-bold ${labelClass} ${textClassName}`}>
                {text}
              </Text>
            )}
          </View>
        </LinearGradient>
      ) : (
        // Light variant OR Disabled (render using TouchableOpacity wrapper above)
        <View
          className={`py-3 px-4  bg-white  ${className} border border-[#DAE7E0] rounded-xl`}
          style={{ borderRadius: 10 }}
        >
          <View className="flex-row items-center justify-center gap-2">
            {icon}
            {text && (
              <Text
                className={`text-base font-urbanist-semibold text-textDark ${labelClass} ${textClassName}`}
              >
                {text}
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
