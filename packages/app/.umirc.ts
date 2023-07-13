import { defineConfig } from '@umijs/max';
import { theme } from 'antd';
import SentryPlugin from '@sentry/webpack-plugin';
import { DeleteSourceMapsPlugin } from 'webpack-delete-sourcemaps-plugin';
import routes from './src/routes';

const PRIMARY_COLOR = '#1e53f5';
const { defaultAlgorithm, defaultSeed } = theme;
const mapToken = defaultAlgorithm({
  ...defaultSeed,
  colorPrimary: PRIMARY_COLOR,
});

export default defineConfig({
  antd: {
    configProvider: {
      theme: {
        token: {
          colorLink: PRIMARY_COLOR,
          colorPrimary: PRIMARY_COLOR,
        },
      },
    },
    style: 'less',
  },
  lessLoader: {
    modifyVars: {
      // add token primary vars to less, theme color as '@colorPrimary'
      // reference: https://ant.design/docs/react/customize-theme-cn#maptoken
      ...mapToken,
    },
    javascriptEnabled: true,
  },
  locale: {
    antd: true,
    default: 'en-US',
    title: false,
    // useLocalStorage: true,
  },
  layout: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  clientLoader: {},
  hash: true,
  metas: [
    { name: 'keywords', content: 'cv' },
    { name: 'description', content: 'cvr' },
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0',
    },
  ],
  base: '/page/',
  publicPath: process.env.PUBLIC_PATH || '/static/',
  npmClient: 'pnpm',
  routes,
  mfsu: {
    strategy: 'normal',
  },
  monorepoRedirect: {
    srcDir: ['src', 'libs', 'dist'],
    peerDeps: true,
  },
  devtool: process.env.SENTRY_DSN ? 'source-map' : 'cheap-module-source-map',
  chainWebpack(config) {
    if (process.env.SENTRY_DSN) {
      // upload sourcemaps to sentry
      config.plugin('sentry').use(SentryPlugin, [
        {
          project: 'dds-app',
          release: process.env.TAG_VERSION,
          authToken: process.env.SENTRY_TOKEN,
          url: process.env.SENTRY_URL,
          org: process.env.SENTRY_ORG,
          ignore: ['node_modules'],
          include: './dist', // dist path
          cleanArtifacts: true,
          // urlPrefix: '~/static/', //cdn prefix
          errorHandler(err, invokeErr) {
            console.error('upload error:', err);
            invokeErr();
            process.exit(1);
          },
        },
      ]);
      // delete source-map after upload
      config.plugin('deleteSourceMaps').use(DeleteSourceMapsPlugin);
    }
  },
  define: {
    'process.env.UMI_ENV': process.env.UMI_ENV,
    'process.env.TAG_VERSION': process.env.TAG_VERSION || '0.0.1',
    'process.env.API_PATH': process.env.API_PATH,
    'process.env.MODEL_API_PATH': process.env.MODEL_API_PATH,
    'process.env.MODEL_API_TOKEN': process.env.MODEL_API_TOKEN,
    'process.env.SENTRY_DSN': process.env.SENTRY_DSN,
    'process.env.GA_KEY': process.env.GA_KEY,
    'process.env.BAIDU_KEY': process.env.BAIDU_KEY,
  },
});
