import { Bell, ChevronRight, Heart, HeartOff, Languages, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useResultsView, type ResultsView } from '@/features/search/lib/resultsView';
import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/stores/favorites';
import { toast } from '@/stores/toasts';
import { accountSectionHref } from '../lib/accountSections';
import { AccountCard, AccountCardTitle } from './AccountPanel';

const VIEWS: readonly { value: ResultsView; label: string; icon: typeof List }[] = [
  { value: 'grid', label: 'Grille', icon: LayoutGrid },
  { value: 'list', label: 'Liste', icon: List },
];

/**
 * « Préférences » : seulement des réglages qui ont un effet réel aujourd'hui.
 * Affichage des résultats et favoris sont gardés dans ce navigateur (stores existants) ;
 * la langue est indiquée (le site n'est pas encore traduit), sans faux sélecteur.
 */
export function AccountPreferences() {
  const view = useResultsView((state) => state.view);
  const setView = useResultsView((state) => state.setView);
  const favoritesCount = useFavoritesStore((state) => state.ids.length);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <AccountCard>
      <div className="flex flex-col divide-y">
        <PreferenceRow
          id="pref-view"
          icon={LayoutGrid}
          title="Affichage des résultats"
          description="La présentation des prestataires dans la recherche. Gardée sur cet appareil."
        >
          <div
            role="radiogroup"
            aria-labelledby="pref-view"
            className="inline-flex rounded-full border bg-background p-1"
          >
            {VIEWS.map(({ value, label, icon: Icon }) => {
              const selected = view === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setView(value)}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </PreferenceRow>

        <PreferenceRow
          id="pref-favorites"
          icon={Heart}
          title="Mes favoris"
          description={
            favoritesCount === 0
              ? 'Aucun prestataire en favori. Touchez le cœur d’une carte pour en ajouter.'
              : `${favoritesCount} prestataire${favoritesCount > 1 ? 's' : ''} en favori sur cet appareil.`
          }
        >
          <Button
            type="button"
            variant="outline"
            disabled={favoritesCount === 0}
            onClick={() => setConfirmClear(true)}
            className="h-10 rounded-full px-4 has-[>svg]:px-4"
          >
            <HeartOff aria-hidden />
            Vider mes favoris
          </Button>
        </PreferenceRow>

        <PreferenceRow
          id="pref-communication"
          icon={Bell}
          title="Préférences de communication"
          description="E-mails, notifications de l’application et SMS : choisissez sujet par sujet."
        >
          <Button asChild variant="outline" className="h-10 rounded-full px-4 has-[>svg]:px-4">
            <Link to={accountSectionHref('notifications')}>
              Gérer mes notifications
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        </PreferenceRow>

        <PreferenceRow
          id="pref-language"
          icon={Languages}
          title="Langue"
          description="Le site est disponible en français uniquement pour l’instant."
        >
          <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">Français</span>
        </PreferenceRow>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        icon={HeartOff}
        title="Vider vos favoris ?"
        description="Les prestataires mis en favori sur cet appareil seront retirés de la liste."
        confirmLabel="Vider"
        onConfirm={() => {
          clearFavorites();
          setConfirmClear(false);
          toast({ title: 'Favoris vidés' });
        }}
      />
    </AccountCard>
  );
}

function PreferenceRow({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: typeof List;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-8">
      <AccountCardTitle id={id} icon={icon} title={title} description={description} />
      <div className="shrink-0 pl-13 md:pl-0">{children}</div>
    </div>
  );
}
