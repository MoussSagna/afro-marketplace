import { interpolate } from 'react-native-reanimated';

/** 0 avant `start`, 1 après `end`, et entre les deux ça progresse (comme dans le splash). */
function between(t: number, start: number, end: number) {
  'worklet';
  return interpolate(t, [start, end], [0, 1], 'clamp');
}

/** Le moment de la boucle où le logo est entier (utilisé si les animations sont réduites). */
export const LOADER_FULL_LOGO = 0.7;

/**
 * Où en est chaque morceau du logo au moment `t` du tour (0 → 1), comme les @keyframes de la maquette :
 * la boucle se trace (0 → 32 %), le lien orange s'y noue (18 → 50 %), le losange apparaît (46 → 60 %),
 * puis tout s'efface (80 → 94 %). Pour un trait, 0 = pas encore dessiné, 1 = dessiné.
 */
export function loaderFrame(t: number) {
  'worklet';
  const fade = between(t, 0.8, 0.94);
  return {
    arch: between(t, 0, 0.32),
    weave: between(t, 0.18, 0.5),
    tail: between(t, 0.49, 0.5),
    diamond: between(t, 0.46, 0.6),
    opacity: 1 - fade,
    scale: 1 - 0.08 * fade,
  };
}
