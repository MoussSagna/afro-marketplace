// Les couleurs de l'app mobile, en deux thèmes : clair (celui du site) et sombre (lot M6c).
// Une seule liste de noms (« primary-foreground »…), les mêmes que les variables de theme.css.
// - preset.cjs s'en sert pour que `bg-primary` lise une variable CSS (--color-primary).
// - L'app s'en sert pour donner une valeur à ces variables selon le thème (src/theme/).
const tokens = require('./tokens.json');

const c = tokens.color;

/** Thème clair : les couleurs du site (tokens.json, section « color »). */
const light = {
  background: c.background.value,
  foreground: c.foreground.value,
  card: c.card.value,
  'card-foreground': c.foreground.value,
  primary: c.primary.value,
  'primary-hover': c.primaryHover.value,
  'primary-foreground': c.primaryForeground.value,
  secondary: c.secondary.value,
  'secondary-foreground': c.secondaryForeground.value,
  muted: c.muted.value,
  'muted-foreground': c.mutedForeground.value,
  accent: c.accent.value,
  'accent-foreground': c.accentForeground.value,
  cta: c.cta.value,
  'cta-hover': c.ctaHover.value,
  'cta-foreground': c.cta.foreground,
  'title-accent': c.titleAccent.value,
  ochre: c.ochre.value,
  clay: c.clay.value,
  border: c.border.value,
  input: c.input.value,
  ring: c.ring.value,
  destructive: c.destructive.value,
  'destructive-foreground': c.primaryForeground.value,
  success: c.success.value,
  'success-muted': c.success.background,
  warning: c.warning.value,
  'warning-muted': c.warning.background,
  sidebar: c.sidebar.value,
  'sidebar-foreground': c.sidebar.foreground,
  'sidebar-primary': c.sidebar.activeBackground,
  'sidebar-primary-foreground': c.sidebar.activeForeground,
};

/** Thème sombre : tokens.json, section « colorDark » (même noms). */
const dark = Object.fromEntries(Object.keys(light).map((name) => [name, tokens.colorDark[name]]));

/** « #7A1F0E » → « 122 31 14 » : le format des variables CSS lu par NativeWind. */
function toRgbChannels(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

module.exports = { light, dark, names: Object.keys(light), toRgbChannels };
