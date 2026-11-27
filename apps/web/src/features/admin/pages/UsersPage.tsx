import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  useAdminUsers,
  useSetUserStatus,
  type User,
} from '@afro/common';
import { ChevronLeft, ChevronRight, CircleCheck, Search, Users } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { AdminPageHeader } from '../components/AdminPageHeader';
import {
  AdminCell,
  AdminFeedback,
  AdminRow,
  AdminTable,
  StatusPill,
} from '../components/AdminTable';
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
  const [feedback, setFeedback] = useState<string | null>(null);
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
    <section aria-labelledby="users-title" className="flex flex-col gap-6 sm:gap-7">
      <AdminPageHeader
        id="users-title"
        title="Utilisateurs"
        description="Retrouvez un compte, suspendez-le ou réactivez-le."
      />
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="flex w-full max-w-md flex-col gap-2">
          <Label htmlFor={searchId}>Rechercher (nom ou email)</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={searchId}
              type="search"
              className="h-11 pl-9"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        </div>
        {users.isSuccess && (
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
            {users.data.total} compte{users.data.total > 1 ? 's' : ''}
          </p>
        )}
      </div>
      {feedback && (
        <AdminFeedback>
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          {feedback}
        </AdminFeedback>
      )}
      {users.isPending && (
        <Skeleton className="h-48 rounded-2xl" role="status" aria-label="Chargement" />
      )}
      {users.isError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
          Impossible de charger les comptes.
        </p>
      )}
      {users.isSuccess && users.data.items.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun compte trouvé"
          description="Vérifie l’orthographe du nom ou de l’email."
        />
      )}
      {users.isSuccess && users.data.items.length > 0 && (
        <>
          <AdminTable
            caption="Comptes"
            head={['Utilisateur', 'Email', 'Type de compte', 'Inscrit le', 'Statut', 'Action']}
          >
            {users.data.items.map((user) => (
              <UserRow key={user.id} user={user} onDone={setFeedback} />
            ))}
          </AdminTable>
          {pageCount > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                className="h-10"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft aria-hidden />
                Précédent
              </Button>
              <span className="text-sm">
                Page {page} sur {pageCount}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-10"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Suivant
                <ChevronRight aria-hidden />
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function UserRow({ user, onDone }: { user: User; onDone: (message: string) => void }) {
  const setStatus = useSetUserStatus(user.id);
  const name = `${user.firstName} ${user.lastName}`;
  const isAdmin = user.roles.includes('admin');
  const initials = `${user.firstName.charAt(0)}${user.lastName.replace(/[^\p{L}]/gu, '').charAt(0)}`;

  return (
    <AdminRow>
      <AdminCell label="Utilisateur" primary>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="bg-secondary font-semibold text-primary">
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold whitespace-nowrap">{name}</span>
        </div>
      </AdminCell>
      <AdminCell label="Email" className="break-all md:break-normal">
        {user.email}
      </AdminCell>
      <AdminCell label="Type de compte">
        <span className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <StatusPill key={role} tone={role === 'admin' ? 'terra' : 'neutral'}>
              {USER_ROLE_LABELS[role]}
            </StatusPill>
          ))}
        </span>
      </AdminCell>
      <AdminCell label="Inscrit le" className="whitespace-nowrap">
        {dateFormatter.format(new Date(user.createdAt))}
      </AdminCell>
      <AdminCell label="Statut">
        <StatusPill tone={user.status === 'active' ? 'success' : 'danger'}>
          {USER_STATUS_LABELS[user.status]}
        </StatusPill>
      </AdminCell>
      <AdminCell label="Action" className="md:text-right">
        {isAdmin ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : user.status === 'active' ? (
          <ReasonDialog
            trigger={
              <Button size="sm" variant="outline" className="h-9" aria-label={`Suspendre ${name}`}>
                Suspendre
              </Button>
            }
            title={`Suspendre ${name}`}
            description="Le compte ne pourra plus se connecter ; son profil prestataire sortira de la recherche."
            confirmLabel="Suspendre le compte"
            minLength={3}
            destructive
            onConfirm={(note) =>
              setStatus
                .mutateAsync({ status: 'suspended', note })
                .then(() => onDone(`Compte de ${name} suspendu.`))
            }
          />
        ) : (
          <ReasonDialog
            trigger={
              <Button size="sm" variant="outline" className="h-9" aria-label={`Réactiver ${name}`}>
                Réactiver
              </Button>
            }
            title={`Réactiver ${name}`}
            description="Le compte pourra de nouveau se connecter ; son profil prestataire revient en ligne."
            confirmLabel="Réactiver le compte"
            minLength={3}
            onConfirm={(note) =>
              setStatus
                .mutateAsync({ status: 'active', note })
                .then(() => onDone(`Compte de ${name} réactivé.`))
            }
          />
        )}
      </AdminCell>
    </AdminRow>
  );
}
