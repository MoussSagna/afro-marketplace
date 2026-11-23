import { configure } from '@testing-library/react-native';

// Comme pour le web : les findBy… attendent jusqu'à 5 s, la CI est plus lente que nos postes.
configure({ asyncUtilTimeout: 5000 });
