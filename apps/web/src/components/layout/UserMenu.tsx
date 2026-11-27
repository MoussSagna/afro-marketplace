import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, ChevronDown, LogOut, RotateCcw, Settings, Shield, User } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { resetDemoData, USES_MOCKS } from '@/lib/resetDemoData';
import { useSessionStore } from '@/stores/session';

/**
 * Le menu du compte connecté : changer d'espace, réinitialiser la démo, se déconnecter.
 * `label` (back-office : « Admin ») remplace le prénom, affiché dès 640 px avec une flèche.
 */
export function UserMenu({ label }: { label?: string } = {}) {
  const user = useSessionStore((state) => state.user);
  const queryClient = useQueryClient();

  if (!user) return null;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    // Non modal, comme le menu « Prestataires » : un menu modal bloque le défilement de la page et retire la
    // barre de défilement, ce qui décalait la page (et la navbar) à l'ouverture.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2" aria-label={`Menu de ${user.firstName}`}>
          <Avatar className={label ? 'size-10 sm:size-11' : undefined}>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback
              className={label ? 'bg-background font-semibold text-foreground' : undefined}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {label ? (
            <>
              <span className="hidden text-lg font-semibold sm:inline">{label}</span>
              <ChevronDown className="hidden size-5 opacity-90 sm:block" aria-hidden />
            </>
          ) : (
            // Le prénom à partir de 1280 px : la navbar tient sur une ligne même dans les espaces.
            <span className="hidden xl:inline">{user.firstName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* 18 px : l'avatar est à 18 px du bas de la navbar (72 px) sur ordinateur, 14 px sur mobile (64 px) ;
          le panneau s'ouvre donc toujours sous la navbar, sans la chevaucher. */}
      <DropdownMenuContent
        align="end"
        sideOffset={18}
        collisionPadding={12}
        className="w-60 rounded-xl p-2"
      >
        <DropdownMenuLabel>
          {user.firstName} {user.lastName}
          <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/espace/demandes">
              <User /> Mon espace client
            </Link>
          </DropdownMenuItem>
          {user.roles.includes('provider') && (
            <DropdownMenuItem asChild>
              <Link to="/pro">
                <Briefcase /> Mon espace prestataire
              </Link>
            </DropdownMenuItem>
          )}
          {user.roles.includes('admin') && (
            <DropdownMenuItem asChild>
              <Link to="/admin">
                <Shield /> Administration
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/espace/compte">
              <Settings /> Mon compte
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {USES_MOCKS && (
          <DropdownMenuItem onSelect={() => void resetDemoData(queryClient)}>
            <RotateCcw /> Réinitialiser les données de démo
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/deconnexion">
            <LogOut /> Se déconnecter
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
