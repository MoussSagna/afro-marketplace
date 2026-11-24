import { passwordRules, passwordStrength } from '@afro/common';
import { Check, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

const STRENGTH = [
  { key: null, bars: 0, className: 'bg-border' },
  { key: 'weak', bars: 1, className: 'bg-destructive' },
  { key: 'fair', bars: 2, className: 'bg-cta' },
  { key: 'good', bars: 3, className: 'bg-success' },
] as const;

/** La jauge de force de l'inscription : 3 barres qui se remplissent, et un mot. */
export function StrengthMeter({ value }: { value: string }) {
  const { t } = useTranslation();
  const strength = STRENGTH[passwordStrength(value)];
  if (!value) return null;
  const label = strength.key ? t(`auth.strength.${strength.key}`) : '';
  return (
    <View className="gap-1.5" accessible accessibilityLabel={label}>
      <View className="flex-row gap-1.5">
        {[1, 2, 3].map((bar) => (
          <View
            key={bar}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              bar <= strength.bars ? strength.className : 'bg-border',
            )}
          />
        ))}
      </View>
      <Text size="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

/** Les règles du mot de passe (schéma Zod partagé), cochées en vert au fur et à mesure. */
export function PasswordRulesList({ value }: { value: string }) {
  const { t } = useTranslation();
  return (
    <View className="gap-1">
      {passwordRules.map((rule) => (
        <RuleLine key={rule.id} ok={rule.test(value)} label={t(`auth.passwordRules.${rule.id}`)} />
      ))}
    </View>
  );
}

/** Une ligne cochée (vert) ou non (gris). */
export function RuleLine({ ok, label }: { ok: boolean; label: string }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const Icon = ok ? Check : Circle;
  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityLabel={t('auth.ruleState', {
        label,
        state: t(ok ? 'auth.ruleOk' : 'auth.ruleNotYet'),
      })}
    >
      <Icon
        size={14}
        color={ok ? colors.success : colors['muted-foreground']}
        strokeWidth={ok ? 3 : 2}
      />
      <Text size="caption" tone={ok ? 'success' : 'muted'}>
        {label}
      </Text>
    </View>
  );
}
