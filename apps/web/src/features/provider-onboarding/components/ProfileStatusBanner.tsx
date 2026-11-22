import { useMyProviderProfile, type ProviderStatus } from '@afro/common';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

const MESSAGES: Partial<Record<ProviderStatus, { text: string; cta: string; to: string }>> = {
  draft: {
    text: 'Ton profil n’est pas encore en ligne : termine ton inscription pour recevoir des demandes.',
    cta: 'Terminer mon inscription',
    to: '/pro/onboarding',
  },
  changes_requested: {
    text: 'Notre équipe a demandé quelques corrections avant de publier ton profil.',
    cta: 'Voir les corrections',
    to: '/pro/onboarding',
  },
  pending_review: {
    text: 'Ton profil est en cours de validation (en général sous 48 h).',
    cta: 'Voir mon profil',
    to: '/pro/profil',
  },
  paused: {
    text: 'Ton profil est en pause : il n’apparaît plus dans la recherche.',
    cta: 'Le réactiver',
    to: '/pro/profil',
  },
};

/** Sur le tableau de bord : rappelle où en est le profil tant qu'il n'est pas en ligne. */
export function ProfileStatusBanner() {
  const details = useMyProviderProfile();
  const message = details.data && MESSAGES[details.data.profile.status];
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ochre/40 bg-warning-muted p-4"
    >
      <p>{message.text}</p>
      <Button asChild variant="cta" size="sm">
        <Link to={message.to}>{message.cta}</Link>
      </Button>
    </div>
  );
}
