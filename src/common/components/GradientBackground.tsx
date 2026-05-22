import React, { ReactNode } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientBackgroundProps {
  children: ReactNode;
  variant?: 'light' | 'dark';
  colors?: string[];
  edges?: Edge[];
  className?: string;
  style?: StyleProp<ViewStyle>;
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
  className,
  topOverlayColor,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const colors = colorsOverride
    ? colorsOverride
    : variant === 'light'
      ? LIGHT_BG
      : variant === 'dark'
        ? DARK_BG
        : isDark
          ? DARK_BG
          : LIGHT_BG;

  const topInset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : (insets.top ?? 0);

  return (
    <View className={className} style={[styles.container, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="backgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1] ?? colors[0]} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#backgroundGradient)" />
      </Svg>

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

      <SafeAreaView style={styles.content} edges={edges ?? ['top', 'bottom', 'left', 'right']}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default GradientBackground;
