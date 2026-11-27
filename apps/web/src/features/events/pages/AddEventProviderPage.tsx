import {
  ApiError,
  useAddEventProvider,
  useCategories,
  useEvent,
  useProviderSearch,
  type ProviderCard,
} from '@afro/common';
import { ArrowLeft, Check, MapPin, Plus, Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Rating } from '@/components/Rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { toast } from '@/stores/toasts';
import { VerifiedIcon } from '../components/VerifiedIcon';
import { plural } from '../lib/eventDisplay';

const PAGE_SIZE = 24;

/**
 * Ajouter un prestataire à un événement : la recherche du site (texte, famille, ville) et un
 * bouton « Ajouter » par résultat. Un prestataire déjà dans l'événement affiche « Ajouté ».
 */
export function AddEventProviderPage() {
  const { eventId = '' } = useParams();
  const details = useEvent(eventId);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('categorie') ?? '';
  const city = params.get('ville') ?? '';
  const [text, setText] = useState(q);
  const [cityText, setCityText] = useState(city);
  const categories = useCategories();
  const groups = categories.data?.filter((c) => !c.parentId) ?? [];
  const search = useProviderSearch({
    ...(q && { q }),
    ...(category && { category }),
    ...(city && { city }),
    pageSize: PAGE_SIZE,
  });
  const add = useAddEventProvider();
  const searchId = useId();
  const categoryId = useId();
  const cityId = useId();
  usePageMeta('Ajouter un prestataire');

  // Le texte et la ville passent dans l'adresse 300 ms après la dernière frappe.
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(
        (p) => {
          for (const [key, value] of [
            ['q', text.trim()],
            ['ville', cityText.trim()],
          ] as const) {
            if (value) p.set(key, value);
            else p.delete(key);
          }
          return p;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [text, cityText, setParams]);

  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
        Impossible de charger cet événement.
      </p>
    );
  }
  const event = details.data?.event;
  const linked = new Set(details.data?.providers.map((p) => p.provider.id));

  function addProvider(provider: ProviderCard) {
    add.mutate(
      { eventId, providerId: provider.id },
      {
        onSuccess: () =>
          toast({
            title: 'Prestataire ajouté',
            description: `« ${provider.displayName} » a été ajouté à « ${event?.name ?? 'votre événement'} ».`,
          }),
        onError: (error) =>
          toast({
            tone: 'info',
            title: 'Ajout impossible',
            description: error instanceof ApiError ? error.message : 'Réessayez dans un instant.',
          }),
      },
    );
  }

  return (
    <section aria-labelledby="add-title" className="flex flex-col gap-5">
      <Link
        to={`/evenements/${eventId}`}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à l’événement
      </Link>
      <header>
        <h1 id="add-title" className="text-[26px] leading-tight font-bold sm:text-4xl">
          Ajouter un prestataire
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {event
            ? `Recherchez et ajoutez un prestataire à « ${event.name} ».`
            : 'Recherchez et ajoutez un prestataire à votre événement.'}
        </p>
      </header>

      <div
        role="search"
        className="grid gap-3 rounded-2xl border bg-card p-3.5 shadow-card sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,1fr)_260px_220px]"
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor={searchId}>Rechercher</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={searchId}
              type="search"
              placeholder="Rechercher un prestataire…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-12 pl-10 text-[15px]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={categoryId}>Catégorie</Label>
          <NativeSelect
            // Réaffichée une fois les catégories chargées : la valeur venue de l'adresse
            // (« Découvrir ») est alors bien sélectionnée.
            key={groups.length}
            id={categoryId}
            value={category}
            onChange={(e) =>
              setParams((p) => {
                if (e.target.value) p.set('categorie', e.target.value);
                else p.delete('categorie');
                return p;
              })
            }
            className="h-12 text-[15px]"
          >
            <option value="">Toutes les catégories</option>
            {groups.map((group) => (
              <option key={group.id} value={group.slug}>
                {group.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={cityId}>Ville</Label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={cityId}
              placeholder="Toutes les villes"
              value={cityText}
              onChange={(e) => setCityText(e.target.value)}
              className="h-12 pl-10 text-[15px]"
            />
          </div>
        </div>
      </div>

      {search.isPending && (
        <div
          role="status"
          aria-label="Chargement"
          className="grid grid-cols-1 gap-3.5 md:grid-cols-2"
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}
      {search.isError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
          Impossible de charger les prestataires.
        </p>
      )}
      {search.isSuccess && (
        <>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {plural(search.data.total, 'prestataire')}
            {search.data.total > search.data.items.length &&
              ` (les ${search.data.items.length} premiers affichés : précisez la recherche)`}
          </p>
          {search.data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-10 text-center shadow-card">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-primary">
                <Search className="size-6" aria-hidden />
              </span>
              <h2 className="text-lg font-bold">Aucun prestataire trouvé</h2>
              <p className="text-muted-foreground">
                Essayez une autre catégorie ou une autre ville.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setText('');
                  setCityText('');
                  setParams({}, { replace: true });
                }}
              >
                Effacer les filtres
              </Button>
            </div>
          ) : (
            <ul aria-label="Prestataires" className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {search.data.items.map((provider) => {
                const already = linked.has(provider.id);
                const sub = categories.data?.find((c) => c.id === provider.categoryIds[0]);
                return (
                  <li
                    key={provider.id}
                    className="flex items-center gap-3.5 rounded-2xl border bg-card p-3 shadow-card sm:p-3.5"
                  >
                    <img
                      src={provider.coverUrl}
                      alt=""
                      loading="lazy"
                      className="size-16 shrink-0 rounded-xl bg-muted object-cover sm:size-[72px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-bold">
                        <Link
                          to={`/prestataires/${provider.slug}`}
                          className="line-clamp-2 hover:text-primary hover:underline"
                        >
                          {provider.displayName}
                        </Link>
                        {provider.isProVerified && <VerifiedIcon />}
                      </p>
                      <p className="truncate text-[13.5px] text-muted-foreground">
                        {[sub?.name, provider.city].filter(Boolean).join(' · ')}
                      </p>
                      {provider.ratingCount > 0 && (
                        <Rating
                          value={provider.ratingAverage}
                          count={provider.ratingCount}
                          variant="compact"
                          className="mt-0.5 text-[13.5px]"
                        />
                      )}
                    </div>
                    {already ? (
                      <Button
                        size="sm"
                        disabled
                        className="h-9 bg-success-muted text-success opacity-100 has-[>svg]:px-3"
                      >
                        <Check aria-hidden />
                        Ajouté
                      </Button>
                    ) : (
                      <Button
                        variant="cta"
                        size="sm"
                        className="h-9 has-[>svg]:px-3.5"
                        disabled={add.isPending || !details.isSuccess}
                        aria-label={`Ajouter ${provider.displayName}`}
                        onClick={() => addProvider(provider)}
                      >
                        <Plus aria-hidden />
                        Ajouter
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
