const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['dist/**', 'coverage/**', '.vscode-test/**', 'node_modules/**', '_track2-saas/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.webview.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'prefer-const': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'node:http', message: 'Outbound HTTP is forbidden outside update-check.' },
            { name: 'node:https', message: 'Outbound HTTP is forbidden outside update-check.' },
            { name: 'http', message: 'Outbound HTTP is forbidden outside update-check.' },
            { name: 'https', message: 'Outbound HTTP is forbidden outside update-check.' },
            { name: 'axios', message: 'No HTTP client dependencies in Track 1.' },
            { name: 'undici', message: 'No HTTP client dependencies in Track 1.' },
            { name: 'stripe', message: 'Payments are forbidden in Track 1.' },
            { name: 'node-machine-id', message: 'Machine fingerprinting is forbidden.' }
          ]
        }
      ]
    },
  },
];
