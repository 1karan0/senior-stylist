// src/common/components/GradientBackground.tsx
import React, { ReactNode } from 'react';
import LinearGradient, { LinearGradientProps } from 'react-native-linear-gradient';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, StatusBar, View } from 'react-native';

interface GradientBackgroundProps extends Omit<LinearGradientProps, 'colors'> {
  children: ReactNode;
  variant?: 'light' | 'dark';
  colors?: string[];
  edges?: Edge[];
  /**
   * Optional solid overlay behind the status bar area.
   * Useful when using a translucent StatusBar and you want a specific color
   * instead of the gradient showing through.
   */
  topOverlayColor?: string;
}
const LIGHT_BG = ['hsl(146 25% 97%)', 'hsl(158 64% 95%)'];
const DARK_BG = ['hsl(158 32% 8%)', 'hsl(158 32% 12%)'];

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  style,
  variant,
  colors: colorsOverride,
  edges,
  topOverlayColor,
  ...rest
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Priority: colorsOverride > explicit variant prop > theme (isDark)
  const colors = colorsOverride
    ? colorsOverride
    : variant === 'light'
      ? LIGHT_BG
      : variant === 'dark'
        ? DARK_BG
        : isDark
          ? DARK_BG
          : LIGHT_BG;

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : (insets.top ?? 0);

  return (
    <LinearGradient colors={colors} style={[{ flex: 1 }, style]} {...rest}>
      {topOverlayColor ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: topInset,
            backgroundColor: topOverlayColor,
          }}
        />
      ) : null}
      <SafeAreaView style={{ flex: 1 }} edges={edges || ['top', 'bottom', 'left', 'right']}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default GradientBackground;
