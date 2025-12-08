import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';

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
  const disabledBgClass = 'bg-gray-300';
  const lightDefaultBgClass = 'bg-[#DAE7E0]';
  const lightDefaultTextClass = 'text-textDark';
  const gradientDefaultTextClass = 'text-white';
  const disabledTextClass = 'text-white';

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
      className={`${isGradient ? className : `${nonGradientDefaultContainer} ${className}`.trim()} ${effectiveDisabled ? `${nonGradientDisabledContainer} rounded-[14px]` : ''}`.trim()}
      style={effectiveDisabled ? { borderRadius: 14, overflow: 'hidden' } : undefined}
    >
      {isGradient ? (
        <View
          style={{
            borderRadius: 14,
            paddingVertical: Platform.OS === 'ios' ? 6 : 3,
            paddingHorizontal: 12,
            overflow: 'hidden',
            backgroundColor: effectiveDisabled ? '#D1D5DB' : gradientColors[0],
          }}
        >
          {/* Gradient effect using overlay for both platforms */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {/* Diagonal gradient simulation - 135deg from top-left to bottom-right */}
            <View
              style={{
                position: 'absolute',
                top: -100,
                left: -20,
                width: 400,
                height: 400,
                backgroundColor: effectiveDisabled ? '#D1D5DB' : gradientColors[1],
                transform: [{ rotate: '45deg' }],
                opacity: 0.7,
              }}
            />
          </View>
          <View
            className="flex-row items-center justify-center gap-2 py-2"
            style={{ paddingVertical: 12, zIndex: 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                {icon}
                {text && (
                  <Text className={`text-base font-urbanist-bold ${labelClass} ${textClassName}`}>
                    {text}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      ) : (
        // Light variant OR Disabled (render using TouchableOpacity wrapper above)
        <View className={`p-3 `} style={{ borderRadius: 14 }}>
          <View className="flex-row items-center justify-center gap-2">
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                {icon}
                {text && (
                  <Text
                    className={`text-base font-urbanist-bold text-textDark ${labelClass} ${textClassName}`}
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
