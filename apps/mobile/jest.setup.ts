import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { configure } from '@testing-library/react-native';

// Comme pour le web : les findBy… attendent jusqu'à 5 s, la CI est plus lente que nos postes.
configure({ asyncUtilTimeout: 5000 });

// AsyncStorage n'existe pas dans Node : on prend le faux fourni par la bibliothèque (en mémoire).
// (Le préfixe « mock » permet à Jest d'utiliser la variable dans jest.mock.)
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
