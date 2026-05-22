module.exports = {
  presets: ['module:@react-native/babel-preset','nativewind/babel'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': './src',
        },
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-transform-export-namespace-from',
    'react-native-reanimated/plugin', // must be last; includes worklets plugin
  ],
};
