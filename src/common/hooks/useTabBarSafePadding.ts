import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Returns paddingBottom that keeps screen content above an absolute tab bar.
 * Keep TAB_BAR_HEIGHT in sync with your navigator's tabBarStyle.height.
 */
export const useTabBarSafePadding = () => {
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 32; // <-- keep this in sync with your navigator
  const baseBottom = Platform.OS === 'ios' ? 4 : 2;
  const bottomOffset = baseBottom + Math.max(0, insets.bottom - 6);
  const EXTRA_GAP = 8; // breathing room so content doesn't butt up to the bar

  const paddingBottom = TAB_BAR_HEIGHT + bottomOffset + EXTRA_GAP;

  return { paddingBottom, TAB_BAR_HEIGHT, bottomOffset };
};
