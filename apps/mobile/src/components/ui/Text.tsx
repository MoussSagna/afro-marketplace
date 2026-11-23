import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '@/lib/cn';

export const textVariants = cva('text-foreground', {
  variants: {
    size: {
      body: 'text-body',
      sm: 'text-sm',
      xs: 'text-xs',
      caption: 'text-caption',
    },
    weight: {
      regular: 'font-sans',
      medium: 'font-sans-medium',
      semibold: 'font-sans-semibold',
      bold: 'font-sans-bold',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
      inverse: 'text-primary-foreground',
    },
  },
  defaultVariants: { size: 'body', weight: 'regular', tone: 'default' },
});

type TextProps = ComponentProps<typeof RNText> & VariantProps<typeof textVariants>;

/** Le texte courant (Inter). Ex. : <Text size="sm" tone="muted">Paris 18e</Text> */
export function Text({ className, size, weight, tone, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ size, weight, tone }), className)} {...props} />;
}

export const headingVariants = cva('font-display text-foreground', {
  variants: {
    level: { 1: 'text-h1', 2: 'text-h2', 3: 'text-h3' },
  },
  defaultVariants: { level: 1 },
});

type HeadingProps = ComponentProps<typeof RNText> & {
  level?: 1 | 2 | 3;
  children: ReactNode;
};

/**
 * Un titre en Playfair Display. Annoncé comme titre par les lecteurs d'écran.
 * Mot accent comme sur le site : <Heading>Explore nos <Accent>catégories</Accent></Heading>
 */
export function Heading({ className, level = 1, ...props }: HeadingProps) {
  return (
    <RNText
      accessibilityRole="header"
      className={cn(headingVariants({ level }), className)}
      {...props}
    />
  );
}

/** Le mot mis en avant dans un grand titre (rouille, réservé aux titres). */
export function Accent({ className, ...props }: ComponentProps<typeof RNText>) {
  return <RNText className={cn('text-title-accent', className)} {...props} />;
}
