import type { LucideIcon } from 'lucide-react';
import { FileText, Images, Layers, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROFILE_TABS, type ProfileTab } from '../lib/profileTabs';

const TAB_LABELS: Record<ProfileTab, { label: string; icon: LucideIcon }> = {
  presentation: { label: 'Présentation', icon: FileText },
  prestations: { label: 'Prestations', icon: Layers },
  galerie: { label: 'Galerie', icon: Images },
  avis: { label: 'Avis', icon: Star },
};

interface ProfileTabsProps {
  /** L'onglet affiché : un état React de la page (pas d'ancre, pas de défilement). */
  value: ProfileTab;
  onValueChange(tab: ProfileTab): void;
  /** Le contenu de chaque onglet : seul celui de l'onglet actif est rendu. */
  panels: Record<ProfileTab, ReactNode>;
  /** Placé entre la barre d'onglets et le contenu (le panneau de contact, à droite sur ordinateur). */
  aside: ReactNode;
}

/**
 * Les 4 onglets de la fiche : Présentation, Prestations, Galerie, Avis.
 *
 * De vrais onglets accessibles (Tabs de Radix, via shadcn/ui) : `role="tablist"`, `role="tab"`,
 * `role="tabpanel"`, `aria-selected`, `aria-controls`, flèches ← → (et Début / Fin) pour passer
 * d'un onglet à l'autre, Tab pour entrer dans le contenu.
 * Changer d'onglet remplace le contenu sur place : la page ne défile pas.
 *
 * Mise en page : la barre d'onglets en haut, puis deux colonnes sur ordinateur (contenu | contact,
 * le contact collant au défilement) ; une seule colonne sur téléphone, le contact sous le contenu.
 */
export function ProfileTabs({ value, onValueChange, panels, aside }: ProfileTabsProps) {
  return (
    <Tabs value={value} onValueChange={(tab) => onValueChange(tab as ProfileTab)} className="gap-0">
      {/* Même grille que le contenu : la barre a exactement la largeur de la carte en dessous. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_344px]">
        <TabsList
          aria-label="Sections du profil"
          className="flex h-auto w-full min-w-0 gap-0.5 rounded-full border bg-card p-1 text-foreground shadow-card sm:gap-1"
        >
          {PROFILE_TABS.map((tab) => {
            const { label, icon: Icon } = TAB_LABELS[tab];
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="h-11 min-w-0 flex-auto gap-2 rounded-full border-0 px-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs data-[state=active]:hover:bg-primary sm:flex-1 sm:px-4 sm:text-base [&_svg:not([class*='size-'])]:size-5 [&>svg]:hidden sm:[&>svg]:block"
              >
                <Icon aria-hidden />
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_344px]">
        <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-card sm:p-7 lg:p-8">
          {PROFILE_TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className="focus-visible:ring-0">
              {panels[tab]}
            </TabsContent>
          ))}
        </div>
        <div className="relative">
          {/* Collant dans sa cellule de grille : il ne peut pas descendre sur le pied de page. */}
          <div className="lg:sticky lg:top-24">{aside}</div>
        </div>
      </div>
    </Tabs>
  );
}
