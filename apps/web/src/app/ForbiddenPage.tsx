import { ShieldX } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

/** Affichée quand on est connecté mais sans le droit de voir la page. */
export function ForbiddenPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24">
      <EmptyState
        icon={ShieldX}
        title="Accès refusé"
        description="Ton compte n’a pas accès à cette page."
        action={
          <Button asChild>
            <Link to="/">Retour à l’accueil</Link>
          </Button>
        }
      />
    </section>
  );
}
