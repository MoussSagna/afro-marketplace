import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, LogOut, RotateCcw, Settings, Shield, User } from 'lucide-react';
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

/** Le menu du compte connecté : changer d'espace, réinitialiser la démo, se déconnecter. */
export function UserMenu() {
  const user = useSessionStore((state) => state.user);
  const queryClient = useQueryClient();

  if (!user) return null;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2" aria-label={`Menu de ${user.firstName}`}>
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.firstName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
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
