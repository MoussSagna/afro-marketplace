// Babel traduit le TypeScript et le JSX pour React Native (utilisé par Metro et par Jest).
// NativeWind s'y branche pour transformer les className en styles.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
