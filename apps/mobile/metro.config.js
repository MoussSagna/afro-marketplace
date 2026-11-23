// Metro est le « Vite » d'Expo : il assemble le code de l'app.
// Depuis le SDK 52, getDefaultConfig détecte tout seul le monorepo pnpm
// (il surveille la racine du dépôt et suit les liens vers packages/common).
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// Un seul exemplaire de React dans l'app. packages/common déclare React et TanStack Query
// en « peer dependencies » : sans ce réglage, Metro pourrait prendre la copie installée
// pour les tests de common au lieu de celle de l'app, et les hooks planteraient
// (« Invalid hook call »).
const singletons = ['react', 'react-native', '@tanstack/react-query'];
const defaultResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const name = singletons.find((pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`));
  const resolve = defaultResolve ?? context.resolveRequest;
  if (name) {
    // On résout comme si l'import venait de apps/mobile.
    return resolve(
      { ...context, originModulePath: path.join(__dirname, 'package.json') },
      moduleName,
      platform,
    );
  }
  return resolve(context, moduleName, platform);
};

// NativeWind lit global.css et le thème Tailwind pour générer les styles.
module.exports = withNativeWind(config, { input: './global.css' });
