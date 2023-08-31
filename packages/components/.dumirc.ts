import { defineConfig } from 'dumi';

export default defineConfig({
  outputPath: 'docs-dist',
  favicons: ['/favicon.png'],
  themeConfig: {
    name: 'dds-components',
    logo: '/favicon.png',
    nav: [
      { title: 'Guide', link: '/guide' },
      { title: 'Components', link: '/components/global-loading' },
    ],
  },
  styles: [
    `
      .dumi-default-header-left {
        width: auto !important;
      }
      .dumi-default-header-right {
        justify-content: flex-end !important;
      }
      .dumi-default-navbar {
        margin-right: 40px !important;
      }
    `,
  ],
  monorepoRedirect: {
    srcDir: ['src', 'libs', 'dist'],
    peerDeps: true,
  },
  esbuildMinifyIIFE: true,
});
