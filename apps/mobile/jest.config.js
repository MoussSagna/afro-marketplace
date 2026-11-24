// Tests de l'app mobile : jest-expo simule un téléphone (iOS) dans Node.
// (Vitest ne sait pas faire tourner React Native ; les tests de packages/common restent en Vitest.)
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Par défaut Jest ne transforme pas node_modules. Il faut pourtant traduire React Native,
  // Expo et nos paquets du monorepo (du TypeScript brut). Le motif tient compte du dossier .pnpm.
  // msw dépend de paquets publiés seulement en ESM (fichiers .mjs, « until-async ») : on les compile aussi.
  transform: { '\\.mjs$': 'babel-jest' },
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|standard-navigation|lucide-react-native|nativewind|@afro/.*|zod|until-async)|.*\\.mjs$)',
  ],
  // Même raccourci que dans tsconfig.json : « @/theme » = « src/theme ».
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Reanimated : notre faux (src/test/reanimatedMock.tsx), partout. Même « react-native-reanimated/mock »,
    // que `expo-router/testing-library` charge à son import (sous Jest, son faux à lui finit vide : {}).
    '^react-native-reanimated$': '<rootDir>/src/test/reanimatedJest.js',
    // (un autre fichier, sinon Jest prend les deux pour le même module et le faux se rappelle lui-même)
    '^react-native-reanimated/mock$': '<rootDir>/src/test/reanimatedJestMock.js',
    // Pour React Native, lucide pointe vers des fichiers .mjs que Jest ne sait pas lire :
    // dans les tests, on prend sa version CommonJS (identique).
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/'],
  // La CI est plus lente que nos postes (même réglage que le web).
  testTimeout: 20000,
};
