// Babel traduit le TypeScript et le JSX pour React Native (utilisé par Metro et par Jest).
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
