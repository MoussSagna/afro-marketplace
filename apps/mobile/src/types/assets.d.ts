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
