import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Pressable } from 'react-native';
import { Input } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useThemeColors } from '@/theme/useTheme';

type FormInputProps<T extends FieldValues, TOut> = Omit<
  ComponentProps<typeof Input>,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T, unknown, TOut>;
  name: Path<T>;
  /** Un mot de passe : masqué, avec le bouton « œil » pour l'afficher. */
  password?: boolean;
};

/**
 * Un champ relié à React Hook Form (comme les formulaires du site).
 * Le message d'erreur du schéma Zod s'affiche dessous, tout seul.
 * Ex. : <FormInput control={control} name="email" label="Email" keyboardType="email-address" />
 */
export function FormInput<T extends FieldValues, TOut>({
  control,
  name,
  password = false,
  ...props
}: FormInputProps<T, TOut>) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldError(fieldState.error?.message)}
          secureTextEntry={password && !visible}
          autoCapitalize={password ? 'none' : props.autoCapitalize}
          autoCorrect={password ? false : props.autoCorrect}
          trailing={
            password ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
                hitSlop={10}
                onPress={() => setVisible((v) => !v)}
              >
                <Icon size={20} color={colors['muted-foreground']} />
              </Pressable>
            ) : undefined
          }
          {...props}
        />
      )}
    />
  );
}
