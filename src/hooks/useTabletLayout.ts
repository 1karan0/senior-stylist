import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 500;
const MIN_SIDE_PADDING = 60;
const PHONE_PADDING = 17;

/**
 * Returns layout values for responsive tablet/phone screens.
 * On tablet: content is centered with horizontal padding so it doesn't stretch too wide.
 * On phone: standard horizontal padding (24px).
 */
export function useTabletLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const horizontalPadding = isTablet
    ? Math.max((width - MAX_CONTENT_WIDTH) / 2, MIN_SIDE_PADDING)
    : PHONE_PADDING;

  return {
    isTablet,
    horizontalPadding,
    maxContentWidth: MAX_CONTENT_WIDTH,
    /** Use for ScrollView contentContainerStyle or View style to get responsive horizontal padding */
    screenContentStyle: {
      paddingHorizontal: horizontalPadding,
      ...(isTablet && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const }),
    },
  };
}
