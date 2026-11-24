import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from '@/components/ui';

type TextLinkProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: string;
  textClassName?: string;
};

/** Un lien en texte (« Se connecter », « Mot de passe oublié ? »), assez grand pour le doigt. */
export function TextLink({ children, className, textClassName, ...props }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={8}
      className={cn('min-h-touch justify-center', className)}
      {...props}
    >
      <Text weight="semibold" tone="primary" className={textClassName}>
        {children}
      </Text>
    </Pressable>
  );
}
