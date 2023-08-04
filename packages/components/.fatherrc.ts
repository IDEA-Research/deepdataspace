import { defineConfig } from 'father';

export default defineConfig({
  // more father config: https://github.com/umijs/father/blob/master/docs/config.md
  esm: {
    output: 'dist',
    ignores: [
      'src/**/demo.**', // Avoid packaging demo files into the npm package.
    ],
  },
});
