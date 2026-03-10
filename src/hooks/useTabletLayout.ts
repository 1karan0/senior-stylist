import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH_PORTRAIT = 500;
const MAX_CONTENT_WIDTH_LANDSCAPE = 640;
const MIN_SIDE_PADDING = 60;
const PHONE_PADDING_PORTRAIT = 17;
const PHONE_PADDING_LANDSCAPE = 24;

/**
 * Returns layout values for responsive tablet/phone screens and orientation.
 * On tablet: content is centered with horizontal padding so it doesn't stretch too wide.
 * On phone: standard horizontal padding that slightly increases in landscape.
 */
export function useTabletLayout() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  // Use the shortest side so phones in landscape are not treated as tablets
  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= TABLET_BREAKPOINT;

  const maxContentWidth = isLandscape ? MAX_CONTENT_WIDTH_LANDSCAPE : MAX_CONTENT_WIDTH_PORTRAIT;

  const phonePadding = isLandscape ? PHONE_PADDING_LANDSCAPE : PHONE_PADDING_PORTRAIT;

  const horizontalPadding = isTablet
    ? Math.max((width - maxContentWidth) / 2, MIN_SIDE_PADDING)
    : phonePadding;

  return {
    isTablet,
    isLandscape,
    isPortrait,
    horizontalPadding,
    maxContentWidth,
    /** Use for ScrollView contentContainerStyle or View style to get responsive horizontal padding */
    screenContentStyle: {
      paddingHorizontal: horizontalPadding,
      ...(isTablet && { maxWidth: maxContentWidth, alignSelf: 'center' as const }),
    },
  };
}
