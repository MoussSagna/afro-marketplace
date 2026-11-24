import { Image, type ImageProps } from 'expo-image';
import { cssInterop } from 'nativewind';

// expo-image ne connaît pas `className` : on dit à NativeWind de le traduire en `style`.
cssInterop(Image, { className: 'style' });

type PhotoProps = Omit<ImageProps, 'source'> & {
  /** Adresse de la photo (celles du jeu de démo viennent de picsum.photos). */
  uri?: string;
  /** Texte lu par VoiceOver / TalkBack. Sans lui, la photo est décorative. */
  alt?: string;
  className?: string;
};

/**
 * Une photo venue d'internet, avec expo-image : mise en cache sur le téléphone
 * (pas retéléchargée à chaque écran) et apparition en fondu.
 * Sans adresse, on garde un fond sable à la place de la photo.
 */
export function Photo({ uri, alt, className, ...props }: PhotoProps) {
  return (
    <Image
      source={uri ? { uri } : undefined}
      cachePolicy="memory-disk"
      transition={200}
      contentFit="cover"
      accessible={Boolean(alt)}
      accessibilityLabel={alt}
      accessibilityRole={alt ? 'image' : undefined}
      className={className}
      style={{ backgroundColor: '#F3E6D8' }}
      {...props}
    />
  );
}
