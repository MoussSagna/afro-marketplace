import type { ReactNode } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { cn } from '@/lib/cn';
import { Heading, Text } from './Text';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Illustration de la maquette (aucun résultat, aucun message…). */
  image?: ImageSourcePropType;
  /** Un bouton pour s'en sortir (« Retirer les filtres »). */
  action?: ReactNode;
  className?: string;
};

/** L'écran « rien à afficher » : illustration, titre, explication, action. */
export function EmptyState({ title, description, image, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center gap-2 px-9 py-10', className)}>
      {image ? (
        <Image
          source={image}
          accessibilityIgnoresInvertColors
          importantForAccessibility="no"
          className="mb-3 h-[220px] w-[220px] rounded-2xl"
        />
      ) : null}
      <Heading level={2} className="text-center">
        {title}
      </Heading>
      {description ? (
        <Text size="sm" tone="muted" className="text-center">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-3">{action}</View> : null}
    </View>
  );
}
