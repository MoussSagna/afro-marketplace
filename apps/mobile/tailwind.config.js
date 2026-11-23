// NativeWind = Tailwind pour React Native. On écrit className="bg-primary rounded-xl"
// comme sur le site. Les couleurs viennent du preset partagé (packages/config/tailwind).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), require('@afro/config/tailwind/preset.cjs')],
};
