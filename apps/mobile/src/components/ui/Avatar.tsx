import { Image, View } from 'react-native';
import { cn, initials } from '@/lib/cn';
import { Text } from './Text';

const sizes = { sm: 36, md: 44, lg: 64 } as const;

type AvatarProps = {
  /** Le nom de la personne : sert aux initiales et à VoiceOver. */
  name: string;
  uri?: string | null;
  size?: keyof typeof sizes;
  className?: string;
};

/** Photo ronde, ou initiales sur fond sable quand il n'y a pas de photo. */
export function Avatar({ name, uri, size = 'md', className }: AvatarProps) {
  const dimension = sizes[size];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-secondary',
        className,
      )}
      style={{ width: dimension, height: dimension }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: dimension, height: dimension }} />
      ) : (
        <Text
          weight="bold"
          size={size === 'lg' ? 'body' : 'xs'}
          tone="primary"
          importantForAccessibility="no"
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
