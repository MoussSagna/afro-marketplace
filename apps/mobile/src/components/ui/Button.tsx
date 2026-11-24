import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

/** Mêmes variantes que le bouton du site. Toutes en pilule (maquette v2). */
export const buttonVariants = cva('flex-row items-center justify-center gap-2 rounded-full', {
  variants: {
    variant: {
      // L'action principale d'un écran : soleil orangé, texte brun.
      cta: 'bg-cta',
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      outline: 'border-[1.5px] border-primary bg-transparent',
      ghost: 'bg-muted',
      destructive: 'bg-destructive',
    },
    size: {
      lg: 'min-h-[50px] px-6',
      md: 'min-h-touch px-5',
      sm: 'min-h-[38px] px-4',
    },
    fullWidth: { true: 'w-full', false: 'self-start' },
  },
  defaultVariants: { variant: 'cta', size: 'lg', fullWidth: false },
});

export const buttonTextVariants = cva('font-sans-semibold', {
  variants: {
    variant: {
      cta: 'text-cta-foreground',
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-primary',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
    size: { lg: 'text-body', md: 'text-body', sm: 'text-sm' },
  },
  defaultVariants: { variant: 'cta', size: 'lg' },
});

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    /** Icône à gauche du texte (ex. une icône lucide). */
    icon?: ReactNode;
    /** Affiche une roue de chargement et désactive le bouton. */
    loading?: boolean;
  };

/**
 * Un bouton. Ex. : <Button onPress={send}>Demander un devis</Button>
 * Variantes : cta (par défaut), primary, secondary, outline, ghost, destructive.
 */
export function Button({
  variant,
  size,
  fullWidth,
  icon,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = Boolean(disabled) || loading;
  const textClass = buttonTextVariants({ variant, size });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        isDisabled && 'opacity-50',
        'active:opacity-80',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-loading"
          color={
            variant === 'primary' || variant === 'destructive'
              ? colors['primary-foreground']
              : variant === 'cta' || variant === undefined || variant === null
                ? colors['cta-foreground']
                : colors.foreground
          }
        />
      ) : (
        icon
      )}
      {typeof children === 'string' ? <Text className={textClass}>{children}</Text> : children}
    </Pressable>
  );
}
