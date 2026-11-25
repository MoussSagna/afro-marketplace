import {
  areaDefaults,
  areaFormSchema,
  availabilityFormSchema,
  cancellationPolicySchema,
  categoriesDefaults,
  categoriesFormSchema,
  identityDefaults,
  identityFormSchema,
  LANGUAGE_LABELS,
  legalTypeSchema,
  presentationFormSchema,
  toAreaInput,
  toIdentityInput,
  useCategories,
  useCulturalOrigins,
  useMyProviderProfile,
  useUpdateMyProviderProfile,
  type CancellationPolicy,
  type MyProviderDetails,
  type UpdateProviderProfileInput,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { BackHeader, Chip, EmptyState, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useCategoryName } from '@/i18n/useCategoryName';
import { cn } from '@/lib/cn';
import { cancellationLines, languageName } from '../../provider-profile/profileText';
import { errorsOf } from './formErrors';
import { PROFILE_SECTIONS, isProfileSection, toggle, type ProfileSection } from './profileEdit';
import { ChipField, SectionForm } from './SectionForm';

/**
 * Modifier une section du profil (lot M15c), ouverte depuis « Mon profil ».
 * Les formulaires sont ceux du site (`profileForms` dans common) : mêmes règles, mêmes messages.
 * Une fois enregistré, on revient à « Mon profil », qui montre déjà la nouvelle version.
 */
export function EditProfileSectionScreen() {
  const { t } = useTranslation();
  const { section = '' } = useLocalSearchParams<{ section: string }>();
  const details = useMyProviderProfile();
  const known = isProfileSection(section);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={known ? t(PROFILE_SECTIONS[section]) : ''} />
      <QueryState
        isPending={details.isPending}
        isError={details.isError}
        onRetry={() => void details.refetch()}
        loadingLabel={t('proProfile.loading')}
      >
        {known && details.data ? (
          // Monté une fois le profil chargé : les valeurs de départ en dépendent.
          <SectionBody section={section} details={details.data} />
        ) : (
          <EmptyState className="flex-1" title={t('requests.notFound')} />
        )}
      </QueryState>
    </SafeAreaView>
  );
}

function SectionBody({
  section,
  details,
}: {
  section: ProfileSection;
  details: MyProviderDetails;
}) {
  switch (section) {
    case 'presentation':
      return <PresentationForm details={details} />;
    case 'zone':
      return <ZoneForm details={details} />;
    case 'annulation':
      return <CancellationForm details={details} />;
    case 'legal':
      return <LegalForm details={details} />;
  }
}

/** Enregistre la section, puis revient à « Mon profil ». */
function useSaveSection() {
  const router = useRouter();
  const update = useUpdateMyProviderProfile();
  const save = (input: UpdateProviderProfileInput) =>
    update.mutate(input, { onSuccess: () => router.back() });
  return { save, saving: update.isPending, error: update.isError ? update.error : undefined };
}

// --------------------------------------------------- Présentation et catégories

const presentationSchema = identityFormSchema
  .pick({ displayName: true })
  .extend({ ...presentationFormSchema.shape, ...categoriesFormSchema.shape });

function PresentationForm({ details }: { details: MyProviderDetails }) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const categoryName = useCategoryName();
  const categories = useCategories();
  const origins = useCulturalOrigins();
  const { save, saving, error } = useSaveSection();
  const { profile } = details;
  const [values, setValues] = useState(() => ({
    displayName: profile.displayName,
    bio: profile.bio,
    ...categoriesDefaults(profile),
  }));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? errorsOf(presentationSchema, values) : {};
  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  const submit = () => {
    setSubmitted(true);
    const parsed = presentationSchema.safeParse(values);
    if (parsed.success) save(parsed.data);
  };

  return (
    <SectionForm onSubmit={submit} saving={saving} error={error}>
      <Input
        label={t('proEdit.displayName')}
        value={values.displayName}
        onChangeText={(displayName) => set({ displayName })}
        maxLength={80}
        autoComplete="organization"
        hint={t('proEdit.displayNameHint')}
        error={fieldError(errors.displayName)}
      />
      <Input
        label={t('proEdit.bio')}
        value={values.bio}
        onChangeText={(bio) => set({ bio })}
        multiline
        maxLength={3000}
        className="min-h-[140px]"
        textAlignVertical="top"
        placeholder={t('proEdit.bioPlaceholder')}
        hint={t('proEdit.bioCount', { count: values.bio.length })}
        error={fieldError(errors.bio)}
      />
      <ChipField label={t('proEdit.categories')} error={fieldError(errors.categoryIds)}>
        {(categories.data ?? []).map((category) => (
          <Chip
            key={category.id}
            selected={values.categoryIds.includes(category.id)}
            onPress={() => set({ categoryIds: toggle(values.categoryIds, category.id, 5) })}
          >
            {categoryName(category)}
          </Chip>
        ))}
      </ChipField>
      <ChipField label={t('proEdit.origins')} error={fieldError(errors.culturalOriginIds)}>
        {(origins.data ?? []).map((origin) => (
          <Chip
            key={origin.id}
            selected={values.culturalOriginIds.includes(origin.id)}
            onPress={() =>
              set({ culturalOriginIds: toggle(values.culturalOriginIds, origin.id, 5) })
            }
          >
            {origin.name}
          </Chip>
        ))}
      </ChipField>
      <ChipField label={t('proEdit.languages')} error={fieldError(errors.languages)}>
        {Object.keys(LANGUAGE_LABELS).map((code) => (
          <Chip
            key={code}
            selected={values.languages.includes(code)}
            onPress={() => set({ languages: toggle(values.languages, code) })}
          >
            {languageName(code)}
          </Chip>
        ))}
      </ChipField>
    </SectionForm>
  );
}

// ------------------------------------------------------------ Zone et capacité

const zoneSchema = areaFormSchema.extend(availabilityFormSchema.shape);

function ZoneForm({ details }: { details: MyProviderDetails }) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const { save, saving, error } = useSaveSection();
  const [values, setValues] = useState(() => ({
    ...areaDefaults(details.profile),
    maxBookingsPerDay: String(details.profile.maxBookingsPerDay),
  }));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? errorsOf(zoneSchema, values) : {};
  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  const submit = () => {
    setSubmitted(true);
    if (!zoneSchema.safeParse(values).success) return;
    save({ ...toAreaInput(values), maxBookingsPerDay: Number(values.maxBookingsPerDay) });
  };

  return (
    <SectionForm onSubmit={submit} saving={saving} error={error}>
      <Input
        label={t('proEdit.city')}
        value={values.city}
        onChangeText={(city) => set({ city })}
        maxLength={80}
        autoComplete="postal-address-locality"
        error={fieldError(errors.city)}
      />
      <Input
        label={t('proEdit.postalCode')}
        value={values.postalCode}
        onChangeText={(postalCode) => set({ postalCode })}
        keyboardType="number-pad"
        maxLength={5}
        autoComplete="postal-code"
        error={fieldError(errors.postalCode)}
      />
      <Input
        label={t('proEdit.travelRadius')}
        value={values.travelRadiusKm}
        onChangeText={(travelRadiusKm) => set({ travelRadiusKm })}
        keyboardType="number-pad"
        maxLength={4}
        hint={t('proEdit.travelRadiusHint')}
        error={fieldError(errors.travelRadiusKm)}
      />
      <Input
        label={t('proEdit.maxPerDay')}
        value={values.maxBookingsPerDay}
        onChangeText={(maxBookingsPerDay) => set({ maxBookingsPerDay })}
        keyboardType="number-pad"
        maxLength={2}
        hint={t('proEdit.maxPerDayHint')}
        error={fieldError(errors.maxBookingsPerDay)}
      />
    </SectionForm>
  );
}

// ------------------------------------------------------------------ Annulation

function CancellationForm({ details }: { details: MyProviderDetails }) {
  const { t } = useTranslation();
  const { save, saving, error } = useSaveSection();
  const [policy, setPolicy] = useState<CancellationPolicy>(details.profile.cancellationPolicy);
  return (
    <SectionForm
      onSubmit={() => save({ cancellationPolicy: policy })}
      saving={saving}
      error={error}
    >
      <Text size="sm" tone="muted">
        {t('proEdit.policyHint')}
      </Text>
      <View accessibilityRole="radiogroup" className="gap-3">
        {cancellationPolicySchema.options.map((option) => {
          const name = t('proEdit.policyName', {
            policy: t(`profile.cancellation.${option}`),
          });
          const lines = cancellationLines(option);
          return (
            <RadioCard
              key={option}
              label={[name, ...lines].join(', ')}
              selected={policy === option}
              onPress={() => setPolicy(option)}
            >
              <Text size="sm" weight="bold">
                {name}
              </Text>
              {lines.map((line) => (
                <Text key={line} size="xs" tone="muted">
                  {`• ${line}`}
                </Text>
              ))}
            </RadioCard>
          );
        })}
      </View>
    </SectionForm>
  );
}

/** Un choix unique, en carte (politique d'annulation, statut). */
function RadioCard({
  label,
  selected,
  onPress,
  children,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={cn(
        'gap-1 rounded-2xl border bg-card p-4 active:opacity-80',
        selected ? 'border-[1.5px] border-primary bg-secondary' : 'border-border',
      )}
    >
      {children}
    </Pressable>
  );
}

// ----------------------------------------------------------- Infos légales

function LegalForm({ details }: { details: MyProviderDetails }) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const { save, saving, error } = useSaveSection();
  const [values, setValues] = useState(() => identityDefaults(details.profile));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? errorsOf(identityFormSchema, values) : {};

  const submit = () => {
    setSubmitted(true);
    if (identityFormSchema.safeParse(values).success) save(toIdentityInput(values));
  };

  return (
    <SectionForm onSubmit={submit} saving={saving} error={error}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('proEdit.legalType')}
        className="gap-2"
      >
        <Text size="xs" weight="semibold">
          {t('proEdit.legalType')}
        </Text>
        {legalTypeSchema.options.map((type) => (
          <RadioCard
            key={type}
            label={t(`profile.legal.${type}`)}
            selected={values.legalType === type}
            onPress={() => setValues((v) => ({ ...v, legalType: type }))}
          >
            <Text size="sm" weight="semibold">
              {t(`profile.legal.${type}`)}
            </Text>
          </RadioCard>
        ))}
      </View>
      <Input
        label={t('proEdit.siret')}
        value={values.siret}
        onChangeText={(siret) => setValues((v) => ({ ...v, siret }))}
        keyboardType="number-pad"
        maxLength={17}
        placeholder="123 456 789 00012"
        hint={t('proEdit.siretHint')}
        error={fieldError(errors.siret)}
      />
    </SectionForm>
  );
}
