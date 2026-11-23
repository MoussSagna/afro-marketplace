import type { ComponentProps, ReactNode } from 'react';
import { Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './Text';

type ChipProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: string;
  /** Pastille choisie (fond terre, texte ivoire). */
  selected?: boolean;
  icon?: ReactNode;
};

/** Une pastille qu'on touche pour filtrer (origines, note…). */
export function Chip({ selected = false, icon, className, children, ...props }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'min-h-[34px] flex-row items-center gap-1.5 self-start rounded-full border px-3.5 active:opacity-80',
        selected ? 'border-primary bg-primary' : 'border-input bg-card',
        className,
      )}
      {...props}
    >
      {icon}
      <Text
        size="xs"
        weight="medium"
        className={selected ? 'text-primary-foreground' : 'text-foreground'}
      >
        {children}
      </Text>
    </Pressable>
  );
}
