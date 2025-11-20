const { tokens } = require('./src/constants/design-tokens');

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      fontFamily: {
        urbanist: [
          tokens.fonts.urbanistRegular,
          tokens.fonts.urbanistMedium,
          tokens.fonts.urbanistBold,
        ],
        poppins: [
          tokens.fonts.poppinsRegular,
          tokens.fonts.poppinsMedium,
          tokens.fonts.poppinsBold,
        ],
      },
      colors: {
        textDark: tokens.colors.text.dark,
        textMuted: tokens.colors.text.muted,
        textWhite: tokens.colors.text.white,
        primary: tokens.colors.text.primary,
        secondary: tokens.colors.text.secondary,

        // Backgrounds
        bgLight: tokens.colors.lightBg[0],
        bgDark: tokens.colors.darkBg[0],
        white: '#FFFFFF',

        // Buttons
        disabled: tokens.colors.disabled,
      },

      backgroundImage: {
        lightBg: `linear-gradient(180deg, ${tokens.colors.lightBg[0]}, ${tokens.colors.lightBg[1]})`,
        darkBg: `linear-gradient(180deg, ${tokens.colors.darkBg[0]}, ${tokens.colors.darkBg[1]})`,
        commonGradient: `linear-gradient(135deg, ${tokens.colors.commonGradient.join(', ')})`,
        buttonGradient: `linear-gradient(135deg, #27B07D 0%, #36D399 100%)`,
      },
    },
  },
  plugins: [],
};
