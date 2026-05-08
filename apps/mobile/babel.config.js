module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@whereami/core': '../../src/core/index.ts',
            '@/adapters': './src/adapters',
            '@/screens': './src/screens',
            '@/components': './src/components',
            '@/navigation': './src/navigation',
            '@/constants': './src/constants.ts',
          },
        },
      ],
    ],
  };
};
