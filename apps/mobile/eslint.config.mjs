import { react } from '@afro/config/eslint';
import globals from 'globals';

export default [
  { ignores: ['.expo', 'android', 'ios', 'expo-env.d.ts'] },
  ...react,
  {
    // Les écrans d'Expo Router exportent aussi des réglages (options, unstable_settings) : c'est voulu.
    files: ['app/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Fichiers de configuration en CommonJS, lus par Node (Metro, Babel, Jest).
    files: ['*.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.test.tsx', 'jest.setup.ts'],
    languageOptions: { globals: globals.jest },
  },
];
