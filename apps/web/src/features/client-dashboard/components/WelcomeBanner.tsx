import { SpaceBanner } from '@/components/layout/SpaceBanner';

/**
 * La bannière d'accueil de l'espace client : « Bonjour Aïssatou 👋 » à gauche,
 * une photo de réception à droite qui se fond dans le dégradé sable.
 * Le prénom vient de la session (profil de l'utilisateur), jamais inventé.
 */
export function WelcomeBanner({ firstName }: { firstName?: string }) {
  return (
    <SpaceBanner
      testId="welcome-banner"
      image="/images/hero/celebration.webp"
      imagePosition="50% 22%"
      title={
        <>
          Bonjour{firstName && <span className="text-title-accent"> {firstName}</span>}{' '}
          <span aria-hidden>👋</span>
        </>
      }
      description="Suivez vos demandes et l’organisation de vos événements."
    />
  );
}
