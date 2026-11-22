import { react } from '@afro/config/eslint';

export default [
  ...react,
  {
    // common n'est pas une app Vite : la règle « fast refresh » ne s'applique pas ici.
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
