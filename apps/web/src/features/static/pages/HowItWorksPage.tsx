import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { HowItWorks } from '@/features/search/components/HowItWorks';
import { StaticPage, StaticSection } from '../components/StaticPage';

/** P7 : comment ça marche, côté client et côté prestataire. */
export function HowItWorksPage() {
  return (
    <>
      <StaticPage
        title="Comment ça marche"
        description="Trouvez un prestataire afro, demandez un devis gratuit et réservez en quelques minutes. Prestataires : inscription gratuite."
      >
        <p className="text-lg text-muted-foreground">
          Wenzee met en relation les organisateurs d’événements et les prestataires afro
          d’Île-de-France : traiteurs, danseurs, DJ, coiffeuses, speakers…
        </p>
      </StaticPage>
      <HowItWorks />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
        <StaticSection title="Vous organisez un événement">
          <ul className="list-disc space-y-1 pl-5">
            <li>La recherche et les devis sont gratuits, sans engagement.</li>
            <li>Chaque profil est vérifié par notre équipe avant d’être publié.</li>
            <li>
              Le paiement se règle directement avec le prestataire, selon les conditions de son
              devis.
            </li>
            <li>Après l’événement, votre avis aide toute la communauté.</li>
          </ul>
          <Button asChild variant="cta" className="mt-2 w-fit">
            <Link to="/recherche">Trouver un prestataire</Link>
          </Button>
        </StaticSection>
        <StaticSection title="Vous êtes prestataire">
          <ul className="list-disc space-y-1 pl-5">
            <li>L’inscription est gratuite au lancement, sans commission.</li>
            <li>Créez votre profil, vos formules et vos photos en une quinzaine de minutes.</li>
            <li>Recevez des demandes qualifiées (date, lieu, budget) et répondez par devis.</li>
            <li>Gérez votre agenda : une date réservée est bloquée automatiquement.</li>
          </ul>
          <Button asChild variant="outline" className="mt-2 w-fit">
            <Link to="/devenir-prestataire">Devenir prestataire</Link>
          </Button>
        </StaticSection>
      </div>
    </>
  );
}
