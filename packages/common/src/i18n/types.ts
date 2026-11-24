import type { fr } from './fr';

/** Même forme que fr.ts, avec des textes quelconques : la forme imposée aux autres langues. */
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

export type Translations = DeepStrings<typeof fr>;
