import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export type ButtonVariant = 'gradient' | 'light';

export interface ButtonProps {
  text?: string;
  icon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean; // new
  variant?: ButtonVariant;
  className?: string;
  textClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  icon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'gradient',
  className = '',
  textClassName = '',
}) => {
  const isGradient = variant === 'gradient';
  const gradientColors = ['#27B07D', '#36D399'];

  // Default visual tokens
  const disabledBgClass = 'bg-disabled';
  const lightDefaultBgClass = 'border-[#DAE7E0]';
  const lightDefaultTextClass = 'text-textDark';
  const gradientDefaultTextClass = 'text-white';
  const disabledTextClass = 'text-textMuted';

  // Determine label color
  const defaultLabelClass = isGradient ? gradientDefaultTextClass : lightDefaultTextClass;
  const labelClass = disabled ? disabledTextClass : defaultLabelClass;

  // Determine container defaults for non-gradient (light) when not disabled.
  const nonGradientDefaultContainer = !isGradient && !disabled ? lightDefaultBgClass : '';
  const nonGradientDisabledContainer = disabled ? disabledBgClass : '';

  // If loading, treat button as disabled for interaction
  const effectiveDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={effectiveDisabled}
      className={`${isGradient ? '' : nonGradientDefaultContainer} ${effectiveDisabled ? nonGradientDisabledContainer : ''} ${className}`}
    >
      {isGradient && !effectiveDisabled ? (
        <LinearGradient
          colors={gradientColors}
          className={`py-3 px-4 rounded-[10px] ${className}`}
          style={{ borderRadius: 10 }}
        >
          <View className="flex-row items-center justify-center gap-2">
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                {icon}
                {text && (
                  <Text
                    className={`text-base font-urbanist font-bold ${labelClass} ${textClassName}`}
                  >
                    {text}
                  </Text>
                )}
              </>
            )}
          </View>
        </LinearGradient>
      ) : (
        // Light variant OR Disabled (render using TouchableOpacity wrapper above)
        <View
          className={`py-3 px-4 ${className} border border-[#DAE7E0] rounded-xl`}
          style={{ borderRadius: 10 }}
        >
          <View className="flex-row items-center justify-center gap-2">
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                {icon}
                {text && (
                  <Text
                    className={`text-base font-urbanist-semibold text-textDark ${labelClass} ${textClassName}`}
                  >
                    {text}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
