import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { StaticPage } from '../components/StaticPage';

interface ComingSoonProps {
  title: string;
  description: string;
}

/** Une page annoncée dans la navbar mais pas encore construite (hors du périmètre du MVP). */
function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <StaticPage title={title} description={description}>
      <p className="text-lg text-muted-foreground">{description}</p>
      <p>Cette rubrique arrive bientôt sur Wenzee. En attendant, trouvez votre prestataire :</p>
      <Button asChild variant="cta" size="lg" className="self-start">
        <Link to="/recherche">Voir les prestataires</Link>
      </Button>
    </StaticPage>
  );
}

export function EventsPage() {
  return (
    <ComingSoon
      title="Événements"
      description="Les événements de la communauté afro et caribéenne en Île-de-France."
    />
  );
}

export function DealsPage() {
  return (
    <ComingSoon
      title="Offres & Deals"
      description="Les offres du moment proposées par les prestataires Wenzee."
    />
  );
}

export function FavoritesPage() {
  return (
    <ComingSoon
      title="Favoris"
      description="Retrouvez ici les prestataires que vous avez mis de côté."
    />
  );
}

export function ContactPage() {
  return (
    <ComingSoon
      title="Contactez-nous"
      description="Une question, une suggestion ? Le formulaire de contact arrive bientôt."
    />
  );
}
