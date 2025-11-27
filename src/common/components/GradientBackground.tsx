// src/common/components/GradientBackground.tsx
import React, { ReactNode } from 'react';
import LinearGradient, { LinearGradientProps } from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientBackgroundProps extends Omit<LinearGradientProps, 'colors'> {
  children: ReactNode;
  variant?: 'light' | 'dark';
  colors?: string[];
}
const LIGHT_BG = ['hsl(146 25% 97%)', 'hsl(158 64% 95%)'];
const DARK_BG = ['hsl(158 32% 8%)', 'hsl(158 32% 12%)'];

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  style,
  variant,
  colors: colorsOverride,
  ...rest
}) => {
  const { isDark } = useTheme();

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

  return (
    <LinearGradient colors={colors} style={[{ flex: 1 }, style]} {...rest}>
      {children}
    </LinearGradient>
  );
};

export default GradientBackground;
