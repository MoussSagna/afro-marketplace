// Configuration ESLint partagée par toutes les apps et tous les paquets.
// Chaque projet l'importe dans son propre eslint.config.js.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Règles de base : JavaScript + TypeScript. */
export const base = tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Toujours en dernier : désactive les règles de mise en forme, gérées par Prettier.
  prettier,
);

/** Règles pour le code React (web, et plus tard mobile). */
export const react = tseslint.config(...base, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: { globals: globals.browser },
  plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
});
