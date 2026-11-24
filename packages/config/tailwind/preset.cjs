// Preset Tailwind (v3) pour l'app mobile (NativeWind), construit à partir de tokens.json (via palette.cjs).
// Le site (Tailwind v4) lit les mêmes valeurs dans theme.css. Un test de l'app mobile
// (apps/mobile/src/theme/preset.test.ts) vérifie que les deux restent identiques.
const tokens = require('./tokens.json');

const c = tokens.color;
const px = (value) => value; // NativeWind comprend les valeurs en px.

/**
 * Mêmes noms de couleurs que le site : bg-primary, text-muted-foreground, bg-success-muted…
 * Chaque couleur lit une variable CSS (« --color-primary »), dont la valeur dépend du thème
 * clair ou sombre (voir palette.cjs et apps/mobile/src/theme/). `<alpha-value>` garde `bg-primary/10`.
 */
const v = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;
const colors = {
  background: v('background'),
  foreground: v('foreground'),
  card: { DEFAULT: v('card'), foreground: v('card-foreground') },
  primary: {
    DEFAULT: v('primary'),
    hover: v('primary-hover'),
    foreground: v('primary-foreground'),
  },
  secondary: { DEFAULT: v('secondary'), foreground: v('secondary-foreground') },
  muted: { DEFAULT: v('muted'), foreground: v('muted-foreground') },
  accent: { DEFAULT: v('accent'), foreground: v('accent-foreground') },
  cta: { DEFAULT: v('cta'), hover: v('cta-hover'), foreground: v('cta-foreground') },
  'title-accent': v('title-accent'),
  ochre: v('ochre'),
  clay: v('clay'),
  border: v('border'),
  input: v('input'),
  ring: v('ring'),
  destructive: { DEFAULT: v('destructive'), foreground: v('destructive-foreground') },
  success: { DEFAULT: v('success'), muted: v('success-muted') },
  warning: { DEFAULT: v('warning'), muted: v('warning-muted') },
  sidebar: {
    DEFAULT: v('sidebar'),
    foreground: v('sidebar-foreground'),
    primary: v('sidebar-primary'),
    'primary-foreground': v('sidebar-primary-foreground'),
    accent: v('accent'),
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
