import {
  offeringDefaults,
  offeringFormSchema,
  pricingTypeSchema,
  toOfferingInput,
  useCategories,
  useMyProviderProfile,
  useSaveOffering,
  type MyProviderDetails,
  type OfferingFormValues,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { BackHeader, Chip, EmptyState, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useThemeColors } from '@/theme/useTheme';
import { errorsOf } from './formErrors';
import { ChipField, SectionForm } from './SectionForm';

/**
 * Ajouter (`/pro/formules/nouvelle`) ou modifier une formule (lot M15c).
 * Même formulaire que le site (`offeringFormSchema`) : le prix est saisi en euros
 * (« 28,50 ») et enregistré en centimes ; pas de prix pour une formule « sur devis ».
 */
export function OfferingFormScreen() {
  const { t } = useTranslation();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const details = useMyProviderProfile();
  const isNew = id === 'nouvelle';
  const offering = details.data?.offerings.find((o) => o.id === id);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={isNew ? t('proEdit.newOffering') : t('proEdit.editOffering')} />
      <QueryState
        isPending={details.isPending}
        isError={details.isError}
        onRetry={() => void details.refetch()}
        loadingLabel={t('proProfile.loading')}
      >
        {details.data && (isNew || offering) ? (
          <OfferingForm details={details.data} offeringId={isNew ? undefined : id} />
        ) : (
          <EmptyState className="flex-1" title={t('requests.notFound')} />
        )}
      </QueryState>
    </SafeAreaView>
  );
}

function OfferingForm({
  details,
  offeringId,
}: {
  details: MyProviderDetails;
  offeringId?: string;
}) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const colors = useThemeColors();
  const router = useRouter();
  const categoryName = useCategoryName();
  const categories = useCategories();
  const save = useSaveOffering();
  // On propose d'abord les catégories du profil ; toutes si le profil n'en a pas encore.
  const mine = (categories.data ?? []).filter((c) => details.profile.categoryIds.includes(c.id));
  const options = mine.length > 0 ? mine : (categories.data ?? []);
  const offering = details.offerings.find((o) => o.id === offeringId);
  const [values, setValues] = useState<OfferingFormValues>(() =>
    offeringDefaults(details.profile.categoryIds[0] ?? '', offering),
  );
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? errorsOf(offeringFormSchema, values) : {};
  const set = (patch: Partial<OfferingFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const submit = () => {
    setSubmitted(true);
    if (!offeringFormSchema.safeParse(values).success) return;
    save.mutate(
      { id: offeringId, input: toOfferingInput(values) },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <SectionForm
      onSubmit={submit}
      saving={save.isPending}
      error={save.isError ? save.error : undefined}
      submitLabel={t('proEdit.saveOffering')}
    >
      <ChipField label={t('proEdit.offeringCategory')} error={fieldError(errors.categoryId)}>
        {options.map((category) => (
          <Chip
            key={category.id}
            selected={values.categoryId === category.id}
            onPress={() => set({ categoryId: category.id })}
          >
            {categoryName(category)}
          </Chip>
        ))}
      </ChipField>
      <Input
        label={t('proEdit.offeringTitle')}
        value={values.title}
        onChangeText={(title) => set({ title })}
        maxLength={100}
        placeholder={t('proEdit.offeringTitlePlaceholder')}
        error={fieldError(errors.title)}
      />
      <Input
        label={t('proEdit.offeringDescription')}
        value={values.description}
        onChangeText={(description) => set({ description })}
        multiline
        maxLength={2000}
        className="min-h-[100px]"
        textAlignVertical="top"
        error={fieldError(errors.description)}
      />
      <ChipField label={t('proEdit.pricingType')}>
        {pricingTypeSchema.options.map((type) => (
          <Chip
            key={type}
            selected={values.pricingType === type}
            onPress={() => set({ pricingType: type })}
          >
            {t(`proEdit.pricing.${type}`)}
          </Chip>
        ))}
      </ChipField>
      {values.pricingType !== 'on_quote' ? (
        <Input
          label={t('proEdit.price')}
          value={values.price}
          onChangeText={(price) => set({ price })}
          keyboardType="decimal-pad"
          placeholder="28,50"
          error={fieldError(errors.price)}
        />
      ) : null}
      <View className="flex-row gap-3">
        <Input
          containerClassName="flex-1"
          label={t('proEdit.minGuests')}
          value={values.minGuests}
          onChangeText={(minGuests) => set({ minGuests })}
          keyboardType="number-pad"
          maxLength={5}
          hint={t('proEdit.guestsHint')}
          error={fieldError(errors.minGuests)}
        />
        <Input
          containerClassName="flex-1"
          label={t('proEdit.maxGuests')}
          value={values.maxGuests}
          onChangeText={(maxGuests) => set({ maxGuests })}
          keyboardType="number-pad"
          maxLength={5}
          hint={t('proEdit.guestsHint')}
          error={fieldError(errors.maxGuests)}
        />
      </View>
      <View className="min-h-touch flex-row items-center gap-3">
        <Text size="sm" weight="semibold" className="flex-1">
          {t('proEdit.active')}
        </Text>
        <Switch
          accessibilityLabel={t('proEdit.active')}
          value={values.isActive}
          onValueChange={(isActive) => set({ isActive })}
          trackColor={{ true: colors.primary, false: colors.input }}
        />
      </View>
    </SectionForm>
  );
}
