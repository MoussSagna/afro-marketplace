import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';

/** Une carte blanche à bord sable, coins de 16 px (comme le site). */
export function Card({ className, ...props }: ComponentProps<typeof View>) {
  return (
    <View
      className={cn('rounded-xl border border-border bg-card', className)}
      style={{ boxShadow: '0 8px 24px rgba(43, 26, 18, 0.08)' }}
      {...props}
    />
  );
}
