import { react } from '@afro/config/eslint';
import globals from 'globals';

export default [
  { ignores: ['.expo', 'android', 'ios', 'expo-env.d.ts', 'nativewind-env.d.ts'] },
  ...react,
  {
    // Les écrans d'Expo Router exportent aussi des réglages (options, unstable_settings) : c'est voulu.
    // Idem pour les composants de base, qui exportent aussi leurs variantes (comme shadcn sur le site).
    files: ['app/**/*.tsx', 'src/components/ui/**/*.tsx'],
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
