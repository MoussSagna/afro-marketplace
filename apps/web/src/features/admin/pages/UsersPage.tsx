import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  useAdminUsers,
  useSetUserStatus,
  type User,
} from '@afro/common';
import { Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { AdminTable, StatusPill } from '../components/AdminTable';
import { ReasonDialog } from '../components/ReasonDialog';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeZone: 'Europe/Paris',
});

/** A4 : rechercher un compte, le suspendre ou le réactiver (avec motif). */
export function UsersPage() {
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const users = useAdminUsers({ q, page });
  const searchId = useId();
  usePageMeta('Utilisateurs');

  // On attend 300 ms après la dernière frappe avant de chercher.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(text.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  const pageCount = users.data ? Math.max(1, Math.ceil(users.data.total / users.data.pageSize)) : 1;

  return (
    <section aria-labelledby="users-title" className="flex flex-col gap-6">
      <h1 id="users-title" className="text-3xl font-semibold">
        Utilisateurs
      </h1>
      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor={searchId}>Rechercher (nom ou email)</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            type="search"
            className="pl-9"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
      </div>
      {users.isPending && (
        <Skeleton className="h-40 rounded-xl" role="status" aria-label="Chargement" />
      )}
      {users.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les comptes.
        </p>
      )}
      {users.isSuccess && (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {users.data.total} compte{users.data.total > 1 ? 's' : ''}
          </p>
          <AdminTable
            caption="Comptes"
            head={['Nom', 'Email', 'Rôles', 'Inscrit le', 'Statut', 'Action']}
          >
            {users.data.items.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </AdminTable>
          {pageCount > 1 && (
            <nav aria-label="Pages" className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              <span className="text-sm">
                Page {page} sur {pageCount}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function UserRow({ user }: { user: User }) {
  const setStatus = useSetUserStatus(user.id);
  const name = `${user.firstName} ${user.lastName}`;
  const isAdmin = user.roles.includes('admin');

  return (
    <tr>
      <td className="px-4 py-3 font-medium whitespace-nowrap">{name}</td>
      <td className="px-4 py-3">{user.email}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {user.roles.map((r) => USER_ROLE_LABELS[r]).join(', ')}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {dateFormatter.format(new Date(user.createdAt))}
      </td>
      <td className="px-4 py-3">
        <StatusPill tone={user.status === 'active' ? 'success' : 'danger'}>
          {USER_STATUS_LABELS[user.status]}
        </StatusPill>
      </td>
      <td className="px-4 py-3">
        {isAdmin ? null : user.status === 'active' ? (
          <ReasonDialog
            trigger={
              <Button size="sm" variant="outline" aria-label={`Suspendre ${name}`}>
                Suspendre
              </Button>
            }
            title={`Suspendre ${name}`}
            description="Le compte ne pourra plus se connecter ; son profil prestataire sortira de la recherche."
            confirmLabel="Suspendre le compte"
            minLength={3}
            destructive
            onConfirm={(note) => setStatus.mutateAsync({ status: 'suspended', note })}
          />
        ) : (
          <ReasonDialog
            trigger={
              <Button size="sm" variant="outline" aria-label={`Réactiver ${name}`}>
                Réactiver
              </Button>
            }
            title={`Réactiver ${name}`}
            description="Le compte pourra de nouveau se connecter ; son profil prestataire revient en ligne."
            confirmLabel="Réactiver le compte"
            minLength={3}
            onConfirm={(note) => setStatus.mutateAsync({ status: 'active', note })}
          />
        )}
      </td>
    </tr>
  );
}
