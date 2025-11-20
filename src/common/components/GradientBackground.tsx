import React, { ReactNode } from 'react';
import LinearGradient, { LinearGradientProps } from 'react-native-linear-gradient';
import { tokens } from '@/constants/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientBackgroundProps extends Omit<LinearGradientProps, 'colors'> {
  children: ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style, ...rest }) => {
  const { isDark } = useTheme();

  const colors = isDark ? tokens.colors.darkBg : tokens.colors.lightBg;

  return (
    <LinearGradient colors={colors} style={[{ flex: 1 }, style]} {...rest}>
      {children}
    </LinearGradient>
  );
};

export default GradientBackground;
