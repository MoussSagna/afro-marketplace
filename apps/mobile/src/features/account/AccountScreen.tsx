import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Heading, Text } from '@/components/ui';
import { useLanguageStore, type LanguagePreference } from '@/i18n/languageStore';
import { cn } from '@/lib/cn';
import { resetDemoData } from '@/lib/demoData';
import { SITE_PAGES, siteUrl } from '@/lib/site';
import { useSessionStore } from '@/stores/session';
import { useThemeStore, type ThemePreference } from '@/theme/themeStore';
import { useThemeColors } from '@/theme/useTheme';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useSwitchMode } from '../pro/useSwitchMode';
import { ChoiceSheet } from './ChoiceSheet';

const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGES: readonly LanguagePreference[] = ['system', 'fr', 'en'];
type Sheet = 'theme' | 'language' | 'legal' | null;

/**
 * L'onglet Compte, connecté (C8, lot M12b) :
 * - qui je suis, et l'encart brun : « Devenir pro » (l'inscription pro se fait sur le site),
 *   ou « Passer en mode pro » pour un prestataire (lot M13) ;
 * - mes informations, notifications, apparence, langue, aide ;
 * - pages légales, « Réinitialiser les données de démo », « Se déconnecter ».
 */
export function AccountScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const signOut = useSessionStore((s) => s.signOut);
  const queryClient = useQueryClient();
  const theme = useThemeStore((s) => s.preference);
  const setTheme = useThemeStore((s) => s.setPreference);
  const language = useLanguageStore((s) => s.preference);
  const setLanguage = useLanguageStore((s) => s.setPreference);
  const { toPro } = useSwitchMode();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  if (!user) return null;
  const name =
    user.lastName && user.lastName !== '-' ? `${user.firstName} ${user.lastName}` : user.firstName;
  const isProvider = user.roles.includes('provider');
  const themeLabel = (value: ThemePreference) => t(`account.themes.${value}`);
  const languageLabel = (value: LanguagePreference) =>
    value === 'system' ? t('account.themes.system') : t(`account.languages.${value}`);
  const open = (path: string) => void Linking.openURL(siteUrl(path));

  function onSignOut() {
    signOut();
    // Les données en cache étaient celles de ce compte.
    queryClient.clear();
  }

  function onReset() {
    const stillHere = resetDemoData();
    setResetting(false);
    if (!stillHere) {
      onSignOut();
      return;
    }
    void queryClient.invalidateQueries();
    setResetDone(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
      >
        <Heading>{t('tabs.account')}</Heading>
        <View className="flex-row items-center gap-4">
          <Avatar name={name} uri={user.avatarUrl} size="lg" />
          <View className="flex-1 gap-0.5">
            <Heading level={2}>{name}</Heading>
            <Text size="sm" tone="muted">
              {user.email}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl bg-sidebar p-4">
          <View className="flex-1 gap-1">
            <Text weight="bold" className="text-white">
              {t(isProvider ? 'account.proModeTitle' : 'account.proTitle')}
            </Text>
            <Text size="xs" className="text-sidebar-foreground opacity-90">
              {t(isProvider ? 'account.proModeHint' : 'account.proHint')}
            </Text>
          </View>
          {isProvider ? (
            <Button size="sm" onPress={toPro}>
              {t('account.switchToPro')}
            </Button>
          ) : (
            <Button size="sm" onPress={() => open(SITE_PAGES.becomeProvider)}>
              {t('account.becomePro')}
            </Button>
          )}
        </View>

        <Card className="px-3.5 py-0">
          {/* « Mes demandes » n'est plus un onglet (27/11/2026) : on y va d'ici. */}
          <Row label={t('account.myRequests')} onPress={() => router.push('/demandes')} />
          <Row label={t('account.info')} onPress={() => router.push('/mon-compte/informations')} />
          <Row
            label={t('account.notifications')}
            onPress={() => router.push('/mon-compte/notifications')}
          />
          <Row
            label={t('account.appearance')}
            value={themeLabel(theme)}
            onPress={() => setSheet('theme')}
          />
          <Row
            label={t('account.language')}
            value={languageLabel(language)}
            onPress={() => setSheet('language')}
          />
          <Row label={t('account.help')} onPress={() => open(SITE_PAGES.faq)} last />
        </Card>

        <Card className="px-3.5 py-0">
          <Row label={t('account.legal')} onPress={() => setSheet('legal')} />
          <Row
            label={t('account.resetDemo')}
            onPress={() => {
              setResetDone(false);
              setResetting(true);
            }}
          />
          <Row
            label={t('account.signOut')}
            onPress={onSignOut}
            tone="destructive"
            icon={<LogOut size={18} color={colors.destructive} />}
            last
          />
        </Card>

        {resetting ? (
          <Card className="gap-3 p-4">
            <Text weight="bold">{t('account.resetTitle')}</Text>
            <Text size="sm" tone="muted">
              {t('account.resetHint')}
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button variant="outline" size="md" fullWidth onPress={() => setResetting(false)}>
                  {t('account.resetKeep')}
                </Button>
              </View>
              <View className="flex-1">
                <Button variant="destructive" size="md" fullWidth onPress={onReset}>
                  {t('account.resetConfirm')}
                </Button>
              </View>
            </View>
          </Card>
        ) : null}
        {resetDone ? (
          <View accessibilityRole="alert" className="rounded-2xl bg-success-muted p-3">
            <Text size="sm" tone="success">
              {t('account.resetDone')}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <ChoiceSheet
        visible={sheet === 'theme'}
        onClose={() => setSheet(null)}
        title={t('account.appearance')}
        closeLabel={t('account.close')}
        options={THEMES.map((value) => ({ value, label: themeLabel(value) }))}
        value={theme}
        onChange={setTheme}
      />
      <ChoiceSheet
        visible={sheet === 'language'}
        onClose={() => setSheet(null)}
        title={t('account.language')}
        closeLabel={t('account.close')}
        options={LANGUAGES.map((value) => ({ value, label: languageLabel(value) }))}
        value={language}
        onChange={setLanguage}
      />
      <ChoiceSheet
        visible={sheet === 'legal'}
        onClose={() => setSheet(null)}
        title={t('account.legal')}
        closeLabel={t('account.close')}
        options={[
          { value: SITE_PAGES.terms, label: t('account.legalPages.terms') },
          { value: SITE_PAGES.privacy, label: t('account.legalPages.privacy') },
          { value: SITE_PAGES.legalNotice, label: t('account.legalPages.legalNotice') },
        ]}
        value=""
        onChange={open}
      />
    </SafeAreaView>
  );
}

/** Une ligne de réglage : libellé, valeur actuelle éventuelle, et chevron. */
function Row({
  label,
  value,
  onPress,
  tone,
  icon,
  last,
}: {
  label: string;
  value?: string;
  onPress(): void;
  tone?: 'destructive';
  icon?: ReactNode;
  last?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      className={cn(
        'min-h-touch flex-row items-center gap-3 py-3.5 active:opacity-70',
        !last && 'border-b border-border',
      )}
    >
      {icon}
      <Text size="sm" weight={tone ? 'semibold' : 'regular'} tone={tone} className="flex-1">
        {label}
      </Text>
      {value ? (
        <Text size="xs" tone="muted">
          {value}
        </Text>
      ) : null}
      {tone ? null : <ChevronRight size={18} color={colors['muted-foreground']} />}
    </Pressable>
  );
}
