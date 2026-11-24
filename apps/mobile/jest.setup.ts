import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { configure } from '@testing-library/react-native';

// Comme pour le web : les findBy… attendent jusqu'à 5 s, la CI est plus lente que nos postes.
configure({ asyncUtilTimeout: 5000 });

// AsyncStorage n'existe pas dans Node : on prend le faux fourni par la bibliothèque (en mémoire).
// (Le préfixe « mock » permet à Jest d'utiliser la variable dans jest.mock.)
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Reanimated (animations) a besoin du moteur natif « worklets », absent de Node : on le remplace
// par un petit faux (src/test/reanimatedMock.tsx), branché dans jest.config.js (moduleNameMapper).

// Les textes de l'app (i18next). Les tests sont écrits en français : on fixe le français
// avant chaque test, quelle que soit la langue de la machine (un test peut passer en anglais).
import { i18n } from './src/i18n';

beforeEach(async () => {
  await i18n.changeLanguage('fr');
});
