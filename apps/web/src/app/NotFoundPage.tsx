import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">Cette page n’existe pas ou plus.</p>
      <Button asChild>
        <Link to="/">Retour à l’accueil</Link>
      </Button>
    </section>
  );
}
