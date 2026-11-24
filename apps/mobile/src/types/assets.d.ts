// Les images importées dans le code (Metro les transforme en identifiant numérique).
declare module '*.webp' {
  const source: number;
  export default source;
}
declare module '*.png' {
  const source: number;
  export default source;
}

// La configuration Tailwind (fichier JavaScript), lue par le test du preset.
declare module '*/tailwind.config' {
  import type { Config } from 'tailwindcss';
  const config: Config;
  export default config;
}

// Les couleurs des thèmes clair et sombre (packages/config/tailwind/palette.cjs).
declare module '@afro/config/tailwind/palette.cjs' {
  const palette: {
    light: Record<string, string>;
    dark: Record<string, string>;
    names: string[];
    toRgbChannels(hex: string): string;
  };
  export default palette;
}
