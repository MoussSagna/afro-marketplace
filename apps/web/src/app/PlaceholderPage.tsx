import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface PlaceholderPageProps {
  title: string;
  /** Le lot du découpage MVP qui construira cette page. */
  lot: number;
}

/**
 * Une page « en construction ». Le routeur est complet dès le lot 2 : chaque
 * page future a déjà son adresse et ses gardes ; son contenu arrive avec son lot.
 */
export function PlaceholderPage({ title, lot }: PlaceholderPageProps) {
  return (
    <section className="py-6">
      <h1 className="mb-6 font-display text-3xl font-semibold">{title}</h1>
      <EmptyState
        icon={Construction}
        title="Bientôt disponible"
        description={`Cette page arrive avec le lot ${lot} du MVP.`}
      />
    </section>
  );
}
