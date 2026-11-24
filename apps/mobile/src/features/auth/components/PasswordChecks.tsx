import { passwordRules, passwordStrength } from '@afro/common';
import { Check, Circle } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';

const STRENGTH = [
  { label: '', bars: 0, className: 'bg-border' },
  { label: 'Mot de passe faible', bars: 1, className: 'bg-destructive' },
  { label: 'Mot de passe correct', bars: 2, className: 'bg-cta' },
  { label: 'Bon mot de passe', bars: 3, className: 'bg-success' },
] as const;

/** La jauge de force de l'inscription : 3 barres qui se remplissent, et un mot. */
export function StrengthMeter({ value }: { value: string }) {
  const strength = STRENGTH[passwordStrength(value)];
  if (!value) return null;
  return (
    <View className="gap-1.5" accessible accessibilityLabel={strength.label}>
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
        {strength.label}
      </Text>
    </View>
  );
}

/** Les règles du mot de passe (schéma Zod partagé), cochées en vert au fur et à mesure. */
export function PasswordRulesList({ value }: { value: string }) {
  return (
    <View className="gap-1">
      {passwordRules.map((rule) => (
        <RuleLine key={rule.id} ok={rule.test(value)} label={rule.label} />
      ))}
    </View>
  );
}

/** Une ligne cochée (vert) ou non (gris). */
export function RuleLine({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? Check : Circle;
  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityLabel={`${label} : ${ok ? 'oui' : 'pas encore'}`}
    >
      <Icon size={14} color={ok ? '#2E6B3F' : '#6B4A36'} strokeWidth={ok ? 3 : 2} />
      <Text size="caption" tone={ok ? 'success' : 'muted'}>
        {label}
      </Text>
    </View>
  );
}
