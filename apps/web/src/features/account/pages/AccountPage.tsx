import type { User } from '@afro/common';
import { useSearchParams } from 'react-router';
import { SpaceBanner } from '@/components/layout/SpaceBanner';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSessionStore } from '@/stores/session';
import { AccountNavigation } from '../components/AccountNavigation';
import { AccountPreferences } from '../components/AccountPreferences';
import { NotificationSettings } from '../components/NotificationSettings';
import { PersonalInformation } from '../components/PersonalInformation';
import { SecuritySettings } from '../components/SecuritySettings';
import { accountSectionFrom, type AccountSectionId } from '../lib/accountSections';

/**
 * C8 « Mon compte » : bannière, menu des rubriques (colonne à gauche sur ordinateur, pastilles
 * défilantes en dessous de 1024 px), puis la rubrique choisie (`?rubrique=`, « Informations
 * personnelles » par défaut). Chaque rubrique enregistre ses propres champs.
 */
export function AccountPage() {
  const user = useSessionStore((state) => state.user);
  const [params] = useSearchParams();
  const section = accountSectionFrom(params.get('rubrique'));
  usePageMeta(section.id === 'informations' ? 'Mon compte' : `${section.title} · Mon compte`);
  // <RequireAuth> garantit un utilisateur ; ce cas ne se produit qu'à la déconnexion.
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <SpaceBanner
        as="h1"
        title="Mon compte"
        description="Gérez vos informations personnelles, vos préférences et la sécurité de votre compte."
        image="/images/categories/decoration.webp"
        imagePosition="50% 40%"
        testId="account-banner"
      />

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <AccountNavigation active={section.id} />

        <section
          key={section.id}
          aria-labelledby="account-section-title"
          className="flex min-w-0 animate-in flex-col gap-5 duration-300 fade-in motion-reduce:animate-none"
        >
          <header className="flex flex-col gap-1">
            <h2
              id="account-section-title"
              className="font-display text-2xl font-semibold sm:text-[28px] lg:text-[32px]"
            >
              {section.title}
            </h2>
            <p className="text-base text-muted-foreground sm:text-[17px]">{section.description}</p>
          </header>
          <SectionContent id={section.id} user={user} />
        </section>
      </div>
    </div>
  );
}

function SectionContent({ id, user }: { id: AccountSectionId; user: User }) {
  switch (id) {
    case 'informations':
      return <PersonalInformation user={user} />;
    case 'notifications':
      return <NotificationSettings user={user} />;
    case 'securite':
      return <SecuritySettings user={user} />;
    case 'preferences':
      return <AccountPreferences />;
  }
}
