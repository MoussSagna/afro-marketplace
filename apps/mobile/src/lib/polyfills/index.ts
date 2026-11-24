/**
 * Ce qui manque au moteur JavaScript du téléphone (Hermes) pour faire tourner
 * le code partagé. Importé tout en haut de app/_layout.tsx et de lib/api/client.ts.
 *
 * - URL : celle de React Native est incomplète, MSW a besoin de la vraie
 *   (MSW le recommande lui-même pour React Native).
 * - crypto.randomUUID : la base de démo s'en sert pour créer des identifiants
 *   (« qr-3f9a1c2b »). Hermes ne l'a pas : on prend celui d'expo-crypto.
 * - EventTarget, MessageEvent, BroadcastChannel… : lus par MSW au chargement (voir webEvents.ts).
 */
import 'react-native-url-polyfill/auto';
import { randomUUID } from 'expo-crypto';
import { installWebEventPolyfills } from './webEvents';

installWebEventPolyfills();

const globalCrypto = (globalThis.crypto ?? {}) as Crypto;
if (typeof globalCrypto.randomUUID !== 'function') {
  Object.defineProperty(globalCrypto, 'randomUUID', { value: randomUUID, configurable: true });
}
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: globalCrypto, configurable: true });
}
