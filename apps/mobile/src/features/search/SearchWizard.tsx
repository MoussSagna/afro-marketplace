import { useCategories, useProviderSearch, type ProviderSearchFilters } from '@afro/common';
import { Image } from 'expo-image';
import { MapPin, Minus, Plus, Search, X } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutAnimation, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Heading, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useLanguage } from '@/i18n/useLanguage';
import { mainCategories } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';
import { Calendar } from './Calendar';
import { CATEGORY_PHOTOS } from './categoryPhotos';
import { shortDay } from './searchDates';

/** Ce que remplit la recherche plein écran (les autres filtres sont dans le panneau Filtres). */
export type SearchDraft = Pick<
  ProviderSearchFilters,
  'q' | 'category' | 'city' | 'date' | 'guests'
>;
type Step = 'what' | 'where' | 'when' | 'guests';
const STEPS: Step[] = ['what', 'where', 'when', 'guests'];

/** On compte les invités de 10 en 10, jusqu'à 1 000. */
export const GUESTS_STEP = 10;
const GUESTS_MAX = 1000;

type SearchWizardProps = {
  visible: boolean;
  filters: ProviderSearchFilters;
  onClose(): void;
  onSubmit(draft: SearchDraft): void;
};

/**
 * La recherche ouverte en plein écran (maquette section 8, façon Airbnb) : quatre étapes
 * qui se replient l'une après l'autre. Quoi ? → Où ? → Quand ? → Combien d'invités ?
 * Chaque choix ferme son étape et ouvre la suivante ; on peut rouvrir une étape en la touchant.
 * Rien n'est appliqué avant « Rechercher ».
 */
export function SearchWizard({ visible, onClose, ...props }: SearchWizardProps) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Monté à chaque ouverture : on repart de la recherche actuelle, sur l'étape « Quoi ? ». */}
      {visible ? <WizardBody onClose={onClose} {...props} /> : null}
    </Modal>
  );
}

function WizardBody({ filters, onClose, onSubmit }: Omit<SearchWizardProps, 'visible'>) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const categories = useCategories();
  const categoryName = useCategoryName();
  const [draft, setDraft] = useState<SearchDraft>(() => ({
    q: filters.q,
    category: filters.category,
    city: filters.city,
    date: filters.date,
    guests: filters.guests,
  }));
  const [step, setStep] = useState<Step>('what');

  const open = (next: Step) => {
    // L'étape qui se replie et la suivante qui s'ouvre glissent en douceur.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(next);
  };
  const nextStep = () => open(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]!);
  const change = (changes: SearchDraft) => setDraft((d) => ({ ...d, ...changes }));

  const category = categories.data?.find((c) => c.slug === draft.category);
  const values: Record<Step, string> = {
    what: draft.q || (category ? categoryName(category) : t('search.anything')),
    where: draft.city || t('search.anywhere'),
    when: draft.date ? shortDay(draft.date, locale) : t('search.addDate'),
    guests: draft.guests ? t('search.guests', { count: draft.guests }) : t('search.addGuests'),
  };
  const labels: Record<Step, string> = {
    what: t('search.stepWhat'),
    where: t('search.stepWhere'),
    when: t('search.stepWhen'),
    guests: t('search.stepGuests'),
  };

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top', 'bottom']}>
      <View className="h-14 flex-row items-center justify-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.close')}
          onPress={onClose}
          className="absolute left-4 h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <X size={18} color={colors.foreground} />
        </Pressable>
        <Text weight="bold">{t('search.wizardTitle')}</Text>
      </View>

      <ScrollView contentContainerClassName="gap-2.5 px-3 pb-6" keyboardShouldPersistTaps="handled">
        {STEPS.map((name) =>
          name === step ? (
            <StepCard key={name}>
              {name === 'what' ? (
                <>
                  <Heading level={2}>{t('search.whatQuestion')}</Heading>
                  <SearchField
                    label={t('search.whatQuestion')}
                    placeholder={t('search.whatPlaceholder')}
                    value={draft.q ?? ''}
                    onChangeText={(q) => change({ q: q || undefined })}
                    onSubmitEditing={nextStep}
                    icon={<Search size={18} color={colors.foreground} />}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="mt-4 gap-3"
                  >
                    {mainCategories(categories.data ?? []).map((c) => {
                      const on = c.slug === draft.category;
                      return (
                        <Pressable
                          key={c.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          accessibilityLabel={categoryName(c)}
                          onPress={() => {
                            change({ category: on ? undefined : c.slug });
                            if (!on) nextStep();
                          }}
                          className="w-[104px] gap-1.5"
                        >
                          <Image
                            source={CATEGORY_PHOTOS[c.slug]}
                            style={{ width: 104, height: 104, borderRadius: 14 }}
                            className={cn(
                              'border',
                              on ? 'border-2 border-foreground' : 'border-border',
                            )}
                          />
                          <Text size="xs" weight="semibold">
                            {categoryName(c)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}
              {name === 'where' ? (
                <WhereStep
                  value={draft.city}
                  onChange={(city) => change({ city })}
                  onDone={nextStep}
                />
              ) : null}
              {name === 'when' ? (
                <>
                  <Heading level={2}>{t('search.whenQuestion')}</Heading>
                  <Text size="sm" tone="muted">
                    {t('search.whenHint')}
                  </Text>
                  <Calendar value={draft.date} onChange={(date) => change({ date })} />
                </>
              ) : null}
              {name === 'guests' ? (
                <GuestsStep value={draft.guests} onChange={(guests) => change({ guests })} />
              ) : null}
            </StepCard>
          ) : (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`${labels[name]} : ${values[name]}`}
              onPress={() => open(name)}
              className="h-[58px] flex-row items-center justify-between rounded-3xl bg-card px-5 active:opacity-80"
              style={{ boxShadow: '0 4px 18px rgba(43, 26, 18, 0.10)' }}
            >
              <Text size="sm" weight="medium" tone="muted">
                {labels[name]}
              </Text>
              <Text size="sm" weight="semibold">
                {values[name]}
              </Text>
            </Pressable>
          ),
        )}
      </ScrollView>

      <View className="flex-row items-center justify-between border-t border-border bg-card px-5 pb-2 pt-3.5">
        {step === 'when' ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                change({ date: undefined });
                nextStep();
              }}
            >
              <Text weight="semibold" className="underline">
                {t('search.skip')}
              </Text>
            </Pressable>
            <Button variant="primary" onPress={nextStep}>
              {t('search.next')}
            </Button>
          </>
        ) : (
          <>
            <Pressable accessibilityRole="button" onPress={() => setDraft({})}>
              <Text weight="semibold" className="underline">
                {t('search.clearAll')}
              </Text>
            </Pressable>
            <Button
              icon={<Search size={18} color={colors['cta-foreground']} />}
              onPress={() => onSubmit(draft)}
            >
              {t('search.submit')}
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/** Une étape ouverte : une carte blanche aux grands coins arrondis. */
function StepCard({ children }: { children: ReactNode }) {
  return (
    <View
      className="rounded-3xl bg-card px-5 pb-5 pt-6"
      style={{ boxShadow: '0 4px 18px rgba(43, 26, 18, 0.10)' }}
    >
      {children}
    </View>
  );
}

/** Un champ de recherche arrondi, avec son icône. */
function SearchField({
  label,
  icon,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; icon: ReactNode }) {
  const colors = useThemeColors();
  return (
    <View className="mt-3.5 h-[54px] flex-row items-center gap-2.5 rounded-2xl border border-input px-4">
      {icon}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors['muted-foreground']}
        returnKeyType="next"
        className="flex-1 font-sans text-body text-foreground"
        {...props}
      />
    </View>
  );
}

/**
 * « Où ? » : une ville tapée à la main, ou une des villes où il y a des prestataires
 * (les plus fournies d'abord, filtrées par ce qu'on tape).
 */
function WhereStep({
  value,
  onChange,
  onDone,
}: {
  value?: string;
  onChange(city: string | undefined): void;
  onDone(): void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  // Tous les prestataires (une page de 50) : de quoi lister les villes. Le vrai serveur aura sa liste.
  const all = useProviderSearch({ pageSize: 50 });
  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of all.data?.items ?? []) {
      if (p.city) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
    }
    const typed = (value ?? '').trim().toLowerCase();
    return [...counts]
      .filter(([city]) => !typed || city.toLowerCase().includes(typed))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5);
  }, [all.data, value]);

  return (
    <>
      <Heading level={2}>{t('search.whereQuestion')}</Heading>
      <SearchField
        label={t('search.whereQuestion')}
        placeholder={t('search.wherePlaceholder')}
        value={value ?? ''}
        onChangeText={(city) => onChange(city || undefined)}
        onSubmitEditing={onDone}
        autoCapitalize="words"
        icon={<Search size={18} color={colors.foreground} />}
      />
      <View className="mt-2.5">
        {cities.map(([city, count]) => (
          <Pressable
            key={city}
            accessibilityRole="button"
            accessibilityLabel={`${city}, ${t('search.results', { count })}`}
            onPress={() => {
              onChange(city);
              onDone();
            }}
            className="flex-row items-center gap-3 py-1.5 active:opacity-70"
          >
            <View className="h-[46px] w-[46px] items-center justify-center rounded-xl bg-secondary">
              <MapPin size={20} color={colors.primary} />
            </View>
            <View>
              <Text size="sm" weight="semibold">
                {city}
              </Text>
              <Text size="xs" tone="muted">
                {t('search.results', { count })}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/** « Combien d'invités ? » : un compteur, de 10 en 10. */
function GuestsStep({
  value,
  onChange,
}: {
  value?: number;
  onChange(guests: number | undefined): void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const guests = value ?? 0;
  return (
    <>
      <Heading level={2}>{t('search.guestsQuestion')}</Heading>
      <View className="mt-4 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text size="sm" weight="semibold">
            {t('search.guestsLabel')}
          </Text>
          <Text size="xs" tone="muted">
            {t('search.guestsHint')}
          </Text>
        </View>
        <View
          className="flex-row items-center gap-3.5"
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t('search.guestsLabel')}
          accessibilityValue={{ text: guests ? t('search.guests', { count: guests }) : '0' }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) =>
            onChange(event.nativeEvent.actionName === 'increment' ? more(guests) : less(guests))
          }
        >
          <RoundButton
            label={t('search.fewerGuests')}
            disabled={guests === 0}
            onPress={() => onChange(less(guests))}
          >
            <Minus size={18} color={colors.foreground} />
          </RoundButton>
          <Text weight="bold" className="min-w-[36px] text-center">
            {String(guests)}
          </Text>
          <RoundButton
            label={t('search.moreGuests')}
            disabled={guests >= GUESTS_MAX}
            onPress={() => onChange(more(guests))}
          >
            <Plus size={18} color={colors.foreground} />
          </RoundButton>
        </View>
      </View>
    </>
  );
}

const more = (guests: number) => Math.min(guests + GUESTS_STEP, GUESTS_MAX);
const less = (guests: number) => (guests - GUESTS_STEP > 0 ? guests - GUESTS_STEP : undefined);

function RoundButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress(): void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-9 w-9 items-center justify-center rounded-full border border-input',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </Pressable>
  );
}
