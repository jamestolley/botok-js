import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const commonConfig = {
  input: 'src/index.ts',
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: !isProduction,
      inlineSources: !isProduction
    }),
    ...(isProduction ? [terser()] : [])
  ],
  external: ['fs', 'path', 'util']
};

export default [
  // Node.js/CommonJS build
  {
    ...commonConfig,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: !isProduction
    }
  },
  // ES Module build
  {
    ...commonConfig,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: !isProduction
    }
  },
  // Browser build (UMD)
  {
    ...commonConfig,
    output: {
      file: 'dist/index.browser.js',
      format: 'umd',
      name: 'BotokJS',
      sourcemap: !isProduction
    },
    external: [] // Include everything for browser
  },
  // CLI build
  {
    input: 'src/cli.ts',
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: !isProduction,
        inlineSources: !isProduction
      })
    ],
    output: {
      file: 'dist/cli.js',
      format: 'cjs',
      sourcemap: !isProduction,
      banner: '#!/usr/bin/env node'
    },
    external: ['fs', 'path', 'util', 'process']
  }
];