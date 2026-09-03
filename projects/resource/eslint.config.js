// @ts-check
const eslint = require('@eslint/js');
const importPlugin = require('eslint-plugin-import');
const tseslint = require('typescript-eslint');

// The client is framework-neutral: no Angular presets, no Angular imports.
module.exports = tseslint.config({
  files: ['**/*.ts'],
  plugins: {
    import: importPlugin,
  },
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic],
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: __dirname,
    },
  },
  rules: {
    'import/no-cycle': ['error', { maxDepth: 1 }],
    '@typescript-eslint/no-namespace': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@angular/*', 'rxjs', 'rxjs/*', '@cccteam/ccc-lib', '@cccteam/ccc-lib/*'],
            message: '@cccteam/resource is framework-neutral: it must not depend on Angular, RxJS, or ccc-lib.',
          },
        ],
      },
    ],
  },
});
