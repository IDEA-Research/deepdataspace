import { Config, configUmiAlias, createConfig } from '@umijs/max/test';

export default async () => {
  const config = createConfig({
    target: 'browser',
    jsTransformer: 'esbuild',
    // config opts for esbuild , it will pass to esbuild directly
    jsTransformerOpts: { jsx: 'automatic' },
  });
  return (await configUmiAlias({
    ...config,
    transform: {
      ...(config.transform || {}),
      '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        require.resolve('.//tests/file-transform'),
    },
    setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx,js,jsx}',
      '!src/.umi/**',
      '!src/.umi-test/**',
      '!src/.umi-production/**',
    ],
    // if you require some es-module npm package, please uncomment below line and insert your package name
    // transformIgnorePatterns: ['node_modules/(?!.*(lodash-es|your-es-pkg-name)/)']
    coverageThreshold: {
      global: {
        lines: 1,
      },
    },
    forceExit: true,
  })) as Config.InitialOptions;
};
