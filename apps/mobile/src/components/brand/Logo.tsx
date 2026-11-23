import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  logoLightSvg,
  logoLightSvgRatio,
  logoSvg,
  logoSvgRatio,
  symbolSvg,
  symbolSvgRatio,
} from './svgs';

const variants = {
  /** Logo horizontal, texte terre : sur fond clair. */
  default: { xml: logoSvg, ratio: logoSvgRatio },
  /** Logo horizontal clair : sur photo ou fond terre (splash, bannière). */
  light: { xml: logoLightSvg, ratio: logoLightSvgRatio },
  /** Le symbole seul (W + losange), sans le nom. */
  symbol: { xml: symbolSvg, ratio: symbolSvgRatio },
} as const;

type LogoProps = {
  variant?: keyof typeof variants;
  /** Hauteur en points ; la largeur suit les proportions du logo. */
  height?: number;
};

/** Le logo Wenzee (piste 3 « Le lien »), dessiné en vectoriel. */
export function Logo({ variant = 'default', height = 32 }: LogoProps) {
  const { xml, ratio } = variants[variant];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Wenzee">
      <SvgXml xml={xml} height={height} width={height * ratio} />
    </View>
  );
}
