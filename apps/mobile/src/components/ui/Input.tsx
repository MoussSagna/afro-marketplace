import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './Text';

type InputProps = ComponentProps<typeof TextInput> & {
  /** Le libellé au-dessus du champ (obligatoire : c'est aussi ce que lit VoiceOver). */
  label: string;
  /** Message d'erreur sous le champ (bordure rouge). */
  error?: string;
  /** Aide sous le champ, quand il n'y a pas d'erreur. */
  hint?: string;
  /** Icône à gauche, dans le champ. */
  icon?: ReactNode;
  /** Élément à droite, dans le champ (ex. bouton « afficher le mot de passe »). */
  trailing?: ReactNode;
  containerClassName?: string;
};

/**
 * Un champ de saisie avec son libellé, son aide et son erreur.
 * Ex. : <Input label="Email" keyboardType="email-address" error={errors.email?.message} />
 */
export function Input({
  label,
  error,
  hint,
  icon,
  trailing,
  editable = true,
  className,
  containerClassName,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const messageId = useId();
  const message = error ?? hint;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      <Text size="xs" weight="semibold">
        {label}
      </Text>
      <View
        className={cn(
          'min-h-[48px] flex-row items-center gap-2.5 rounded-md border bg-card px-3.5',
          error ? 'border-[1.5px] border-destructive' : focused ? 'border-ring' : 'border-input',
          !editable && 'bg-muted opacity-60',
        )}
      >
        {icon}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={message}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          editable={editable}
          placeholderTextColor="#6B4A36"
          className={cn('flex-1 py-3 font-sans text-body text-foreground', className)}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {trailing}
      </View>
      {message ? (
        <Text
          nativeID={messageId}
          size="caption"
          weight={error ? 'medium' : 'regular'}
          tone={error ? 'destructive' : 'muted'}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
