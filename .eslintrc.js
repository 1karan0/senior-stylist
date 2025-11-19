module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  plugins: ['prettier'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // React Hooks
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',

    // React Native specific enhancements
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',

    // Custom rules
    'no-console': 'warn', // Warn about console statements
  },
};
