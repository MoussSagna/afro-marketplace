// Tests de l'app mobile : jest-expo simule un téléphone (iOS) dans Node.
// (Vitest ne sait pas faire tourner React Native ; les tests de packages/common restent en Vitest.)
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Par défaut Jest ne transforme pas node_modules. Il faut pourtant traduire React Native,
  // Expo et nos paquets du monorepo (du TypeScript brut). Le motif tient compte du dossier .pnpm.
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|standard-navigation|@afro/.*|zod))',
  ],
  // Même raccourci que dans tsconfig.json : « @/theme » = « src/theme ».
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/'],
  // La CI est plus lente que nos postes (même réglage que le web).
  testTimeout: 20000,
};
