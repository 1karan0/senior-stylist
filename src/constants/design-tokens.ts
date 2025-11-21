// src/design-tokens.ts

export const tokens = {
  fonts: {
    urbanistRegular: 'Urbanist-Regular',
    urbanistMedium: 'Urbanist-Medium',
    urbanistSemibold: 'Urbanist-SemiBold',
    urbanistBold: 'Urbanist-Bold',
    poppinsRegular: 'Poppins-Regular',
    poppinsMedium: 'Poppins-Medium',
    poppinsSemibold: 'Poppins-SemiBold',
    poppinsBold: 'Poppins-Bold',
  },

  colors: {
    lightBg: ['hsl(146 25% 97%)', 'hsl(158 64% 95%)'],
    darkBg: ['hsl(158 32% 8%)', 'hsl(158 32% 12%)'],

    text: {
      dark: '#162721',
      muted: '#658176',
      white: '#FFFFFF',
      primary: '#27B07D',
      secondary: '#8AA897',
    },

    commonGradient: [
      '#27B07D',
      '#36D399',
      '#FFFFFF',
      '#8AA897',
      '#27B07D',
      '#0E1B16',
      '#273F36',
      '#162721',
      '#658176',
      '#E7B008',
      '#DADADA',
    ],
  },

  buttons: {
    primary: {
      bg: '#27B07D',
      text: '#FFFFFF',
    },
    secondary: {
      bg: '#8AA897',
      text: '#162721',
    },
  },

  shadows: {
    sm: {
      shadowColor: '#162721',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#162721',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  },
};
