import { react } from '@afro/config/eslint';

export default [
  ...react,
  {
    // Les composants shadcn/ui exportent aussi leurs variantes (buttonVariants…) : c'est voulu.
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
