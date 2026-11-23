// Preset Tailwind (v3) pour l'app mobile (NativeWind), construit à partir de tokens.json.
// Le site (Tailwind v4) lit les mêmes valeurs dans theme.css. Un test de l'app mobile
// (apps/mobile/src/theme/preset.test.ts) vérifie que les deux restent identiques.
const tokens = require('./tokens.json');

const c = tokens.color;
const px = (value) => value; // NativeWind comprend les valeurs en px.

/** Mêmes noms de couleurs que le site : bg-primary, text-muted-foreground, bg-success-muted… */
const colors = {
  background: c.background.value,
  foreground: c.foreground.value,
  card: { DEFAULT: c.card.value, foreground: c.foreground.value },
  primary: {
    DEFAULT: c.primary.value,
    hover: c.primaryHover.value,
    foreground: c.primaryForeground.value,
  },
  secondary: { DEFAULT: c.secondary.value, foreground: c.secondaryForeground.value },
  muted: { DEFAULT: c.muted.value, foreground: c.mutedForeground.value },
  accent: { DEFAULT: c.accent.value, foreground: c.accentForeground.value },
  cta: { DEFAULT: c.cta.value, hover: c.ctaHover.value, foreground: c.cta.foreground },
  'title-accent': c.titleAccent.value,
  ochre: c.ochre.value,
  clay: c.clay.value,
  border: c.border.value,
  input: c.input.value,
  ring: c.ring.value,
  destructive: { DEFAULT: c.destructive.value, foreground: c.primaryForeground.value },
  success: { DEFAULT: c.success.value, muted: c.success.background },
  warning: { DEFAULT: c.warning.value, muted: c.warning.background },
  sidebar: {
    DEFAULT: c.sidebar.value,
    foreground: c.sidebar.foreground,
    primary: c.sidebar.activeBackground,
    'primary-foreground': c.sidebar.activeForeground,
    accent: c.accent.value,
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors,
      borderRadius: {
        sm: px(tokens.radius.sm),
        md: px(tokens.radius.md),
        lg: px(tokens.radius.lg),
        xl: px(tokens.radius.xl),
        '2xl': px(tokens.radius['2xl']),
      },
      // Sur téléphone, chaque graisse d'une police est une police à part (chargée par expo-font).
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        display: ['PlayfairDisplay_700Bold'],
        'display-semibold': ['PlayfairDisplay_600SemiBold'],
      },
      fontSize: {
        h1: ['28px', { lineHeight: '34px' }],
        h2: ['22px', { lineHeight: '28px' }],
        h3: ['18px', { lineHeight: '24px' }],
        body: ['16px', { lineHeight: '24px' }],
        sm: ['14px', { lineHeight: '20px' }],
        xs: ['13px', { lineHeight: '18px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      minHeight: { touch: tokens.layout.minTouchTarget },
      minWidth: { touch: tokens.layout.minTouchTarget },
    },
  },
};
