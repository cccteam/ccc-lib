// @ts-check
const tseslint = require('typescript-eslint');
const rootConfig = require('../../eslint.config.js');

module.exports = tseslint.config(
  ...rootConfig,
  {
    files: ['**/*.ts'],
  },
  {
    files: ['**/zz_gen_*.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
);
