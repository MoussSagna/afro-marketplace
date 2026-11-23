import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './Text';

/** Les pastilles d'état de la maquette (« Vérifié », « Devis reçu », « Expire dans 2 j »…). */
export const badgeVariants = cva(
  'flex-row items-center gap-1 self-start rounded-full px-2.5 py-0.5',
  {
    variants: {
      variant: {
        muted: 'bg-muted',
        success: 'bg-success-muted',
        warning: 'bg-warning-muted',
        sun: 'bg-accent',
        destructive: 'bg-[#FBE4E1]',
        primary: 'bg-primary',
      },
    },
    defaultVariants: { variant: 'muted' },
  },
);

const textClass = {
  muted: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  sun: 'text-accent-foreground',
  destructive: 'text-destructive',
  primary: 'text-primary-foreground',
} as const;

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: string;
  icon?: ReactNode;
  className?: string;
};

export function Badge({ variant, icon, className, children }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      {icon}
      <Text size="caption" weight="semibold" className={textClass[variant ?? 'muted']}>
        {children}
      </Text>
    </View>
  );
}
