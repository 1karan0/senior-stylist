// tailwind.config.js
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      /**
       * Fonts
       * Ensure the font files are present in ./assets/icons and names match
       * (e.g. Urbanist-Regular.ttf -> 'Urbanist-Regular').
       *
       * Use classes like: font-urbanist-regular, font-poppins-medium, etc.
       */
      fontFamily: {
        // Urbanist weights (family names must match native font names)
        'urbanist-regular': ['Urbanist-Regular'],
        'urbanist-medium': ['Urbanist-Medium'],
        'urbanist-semibold': ['Urbanist-SemiBold'],
        'urbanist-bold': ['Urbanist-Bold'],

        // Poppins weights
        'poppins-regular': ['Poppins-Regular'],
        'poppins-medium': ['Poppins-Medium'],
        'poppins-semibold': ['Poppins-SemiBold'],
        'poppins-bold': ['Poppins-Bold'],
      },

      /**
       * Colors - inlined from your design tokens
       * Use classes like: text-textDark, bg-bgLight0, bg-buttonPrimaryBg, etc.
       */
      colors: {
        // Text colors
        textDark: '#162721',
        textMuted: '#658176',
        textWhite: '#FFFFFF',
        textPrimary: '#27B07D',
        textSecondary: '#8AA897',

        // Light and dark background gradient stops
        bgLight0: 'hsl(146 25% 97%)',
        bgLight1: 'hsl(158 64% 95%)',
        bgDark0: 'hsl(158 32% 8%)',
        bgDark1: 'hsl(158 32% 12%)',

        // Buttons
        buttonPrimaryBg: '#27B07D',
        buttonPrimaryText: '#FFFFFF',
        buttonSecondaryBg: '#8AA897',
        buttonSecondaryText: '#162721',

        // Common utility colors
        white: '#FFFFFF',

        // Common gradient stops (copied exactly from tokens.commonGradient)
        commonGradientStop1: '#27B07D',
        commonGradientStop2: '#36D399',
        commonGradientStop3: '#FFFFFF',
        commonGradientStop4: '#8AA897',
        commonGradientStop5: '#27B07D',
        commonGradientStop6: '#0E1B16',
        commonGradientStop7: '#273F36',
        commonGradientStop8: '#162721',
        commonGradientStop9: '#658176',
        commonGradientStop10: '#E7B008',
        commonGradientStop11: '#DADADA',
      },

      /**
       * Background images / gradients
       * (Useful for web builds or components that accept gradient strings)
       */
      backgroundImage: {
        lightBg: `linear-gradient(180deg, hsl(146 25% 97%), hsl(158 64% 95%))`,
        darkBg: `linear-gradient(180deg, hsl(158 32% 8%), hsl(158 32% 12%))`,
        commonGradient: `linear-gradient(135deg, #27B07D, #36D399, #FFFFFF, #8AA897, #27B07D, #0E1B16, #273F36, #162721, #658176, #E7B008, #DADADA)`,
        buttonGradient: `linear-gradient(135deg, #27B07D 0%, #36D399 100%)`,
      },

      /**
       * Shadows (note: React Native uses shadow props — Tailwind utilities may be limited.
       * Keep these keys for convenience but apply RN shadow props where exact values are needed)
       */
      boxShadow: {
        sm: '0 2px 4px rgba(22,39,33,0.1)', // approximated from tokens
        md: '0 4px 8px rgba(22,39,33,0.15)',
      },
    },
  },
  plugins: [],
};
