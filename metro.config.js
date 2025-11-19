const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);

const config = mergeConfig(defaultConfig, {
  resolver: {
    alias: {
      '@': `${__dirname}/src`,
      '@/common': `${__dirname}/src/common`,
      '@/components': `${__dirname}/src/components`,
      '@/contexts': `${__dirname}/src/contexts`,
      '@/screens': `${__dirname}/src/screens`,
      '@/utils': `${__dirname}/src/utils`,
      '@/constants': `${__dirname}/src/constants`,
    },
    extraNodeModules: {
      '@': `${__dirname}/src`,
    },
  },
});

module.exports = withNativeWind(config, { input: './global.css' });
