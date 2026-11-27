import Svg, { G, Path } from 'react-native-svg';
import { ARCH_LEFT, ARCH_RIGHT, WEAVE } from './logoPaths';

/** Le carré du repère du symbole qui entoure les tracés (240 x 156 environ), centré sur le W. */
const VIEW_BOX = { x: 15, y: -17, size: 210 } as const;

type WenzeeSymbolIconProps = {
  size?: number;
  /** La couleur du trait : celle que donne la barre (onglet actif ou non, thème clair ou sombre). */
  color?: string;
  /** Épaisseur du trait en pixels À L'ÉCRAN, comme les icônes Lucide (2 par défaut, 2,4 si actif). */
  strokeWidth?: number;
  testID?: string;
};

/**
 * Le symbole du logo Wenzee (le W tissé) en icône au trait, pour l'onglet Événements.
 * Mêmes tracés que le splash et le loader (logoPaths.ts, tirés de marque-wenzee), d'une seule couleur ;
 * le point au bout du lien est retiré : trop petit à 24 px. Il se comporte comme une icône Lucide
 * (`size`, `color`, `strokeWidth`), pour se ranger avec les autres icônes de la barre d'onglets.
 */
export function WenzeeSymbolIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  testID,
}: WenzeeSymbolIconProps) {
  // L'épaisseur est donnée en pixels à l'écran : on la ramène au repère du tracé.
  const stroke = (strokeWidth * VIEW_BOX.size) / size;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.size} ${VIEW_BOX.size}`}
      testID={testID}
    >
      <G
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d={ARCH_LEFT} />
        <Path d={ARCH_RIGHT} />
        <Path d={WEAVE} />
      </G>
    </Svg>
  );
}
