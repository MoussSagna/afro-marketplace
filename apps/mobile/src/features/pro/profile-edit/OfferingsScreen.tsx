import {
  useCategories,
  useDeleteOffering,
  useMyProviderProfile,
  type Offering,
} from '@afro/common';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { BackHeader, Badge, Button, Card, EmptyState, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useCategoryName } from '@/i18n/useCategoryName';
import { guestsLabel, offeringPrice } from '../../provider-profile/profileText';
import { offeringHref } from './profileEdit';

/**
 * « Formules et prix » (lot M15c), ouvert depuis « Mon profil » : la liste des formules,
 * pour en ajouter, en modifier ou en supprimer (avec une confirmation).
 */
export function OfferingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const details = useMyProviderProfile();
  const offerings = details.data?.offerings ?? [];
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('proProfile.offerings')} />
      <QueryState
        isPending={details.isPending}
        isError={details.isError}
        onRetry={() => void details.refetch()}
        loadingLabel={t('proProfile.loading')}
      >
        {offerings.length === 0 ? (
          <EmptyState
            className="flex-1"
            title={t('proEdit.offeringsEmpty')}
            description={t('proEdit.offeringsEmptyHint')}
          />
        ) : (
          <ScrollView contentContainerClassName="gap-3 px-5 pb-6 pt-1">
            {offerings.map((offering) => (
              <OfferingItem key={offering.id} offering={offering} />
            ))}
          </ScrollView>
        )}
        <View className="border-t border-border bg-background px-5 pb-2 pt-3">
          <Button fullWidth onPress={() => router.push(offeringHref())}>
            {t('proEdit.addOffering')}
          </Button>
        </View>
      </QueryState>
    </SafeAreaView>
  );
}

function OfferingItem({ offering }: { offering: Offering }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { apiError } = useErrorText();
  const categoryName = useCategoryName();
  const categories = useCategories();
  const remove = useDeleteOffering();
  const [confirming, setConfirming] = useState(false);
  const category = categories.data?.find((c) => c.id === offering.categoryId);
  const details = [category ? categoryName(category) : undefined, guestsLabel(offering)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="gap-2 p-3.5" accessibilityLabel={offering.title}>
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-0.5">
          <Text size="sm" weight="bold">
            {offering.title}
          </Text>
          {details ? (
            <Text size="xs" tone="muted">
              {details}
            </Text>
          ) : null}
        </View>
        <Text size="sm" weight="semibold">
          {offeringPrice(offering)}
        </Text>
      </View>
      {!offering.isActive ? <Badge className="self-start">{t('proEdit.inactive')}</Badge> : null}
      {remove.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(remove.error)}
        </Text>
      ) : null}
      {confirming ? (
        <View className="gap-2 rounded-xl bg-muted p-3" accessibilityRole="alert">
          <Text size="sm">{t('proEdit.confirmDelete', { title: offering.title })}</Text>
          <View className="flex-row gap-2">
            <Button size="sm" variant="ghost" onPress={() => setConfirming(false)}>
              {t('proEdit.cancel')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              loading={remove.isPending}
              onPress={() => remove.mutate(offering.id)}
            >
              {t('proEdit.confirmDeleteYes')}
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-row justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            accessibilityLabel={t('proEdit.delete', { title: offering.title })}
            onPress={() => setConfirming(true)}
          >
            {t('proEdit.deleteShort')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            accessibilityLabel={t('proEdit.edit', { title: offering.title })}
            onPress={() => router.push(offeringHref(offering.id))}
          >
            {t('proEdit.editShort')}
          </Button>
        </View>
      )}
    </Card>
  );
}
