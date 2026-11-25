import {
  ApiError,
  accountDefaults,
  accountFormSchema,
  toUpdateMeInput,
  useDeleteMe,
  useUpdateMe,
  type AccountFormValues,
  type User,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSessionStore } from '@/stores/session';
import type { z } from 'zod';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TOPICS } from '../lib/accountForm';

/** C8 : mes informations, mes préférences de notification, et la suppression du compte. */
export function AccountPage() {
  const user = useSessionStore((state) => state.user);
  usePageMeta('Mon compte');
  // <RequireAuth> garantit un utilisateur ; ce cas ne se produit qu'à la déconnexion.
  if (!user) return null;

  return (
    <section aria-labelledby="account-title" className="flex max-w-2xl flex-col gap-8">
      <h1 id="account-title" className="text-3xl font-semibold">
        Mon compte
      </h1>
      <ProfileForm user={user} />
      <DeleteAccountSection />
    </section>
  );
}

function ProfileForm({ user }: { user: User }) {
  const updateMe = useUpdateMe();
  const setUser = useSessionStore((state) => state.setUser);
  const [saved, setSaved] = useState(false);
  const form = useForm<AccountFormValues, unknown, z.output<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: accountDefaults(user),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSaved(false);
    try {
      const updated = await updateMe.mutateAsync(toUpdateMeInput(values));
      setUser(updated);
      form.reset(accountDefaults(updated));
      setSaved(true);
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiError ? error.message : 'L’enregistrement a échoué.',
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <section
          aria-labelledby="account-info"
          className="flex flex-col gap-4 rounded-xl border bg-card p-5"
        >
          <h2 id="account-info" className="text-xl font-semibold">
            Mes informations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={user.email} readOnly disabled />
            <p className="text-sm text-muted-foreground">
              Pour changer d’email, écris-nous depuis la page d’aide.
            </p>
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone (facultatif)</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormDescription>
                  Il n’est jamais affiché : il sert aux rappels par SMS.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section
          aria-labelledby="account-notifications"
          className="flex flex-col gap-4 rounded-xl border bg-card p-5"
        >
          <h2 id="account-notifications" className="text-xl font-semibold">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Choisis comment être prévenu. Les emails indispensables (sécurité, confirmation de
            réservation) partent quoi qu’il arrive.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Préférences de notification</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-2 pr-4 text-left font-medium">
                    Sujet
                  </th>
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <th key={channel.key} scope="col" className="px-3 py-2 font-medium">
                      {channel.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TOPICS.map((topic) => (
                  <tr key={topic.key} className="border-t">
                    <th scope="row" className="py-2 pr-4 text-left font-normal">
                      {topic.label}
                    </th>
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <td key={channel.key} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          aria-label={`${topic.label} par ${channel.label.toLowerCase()}`}
                          {...form.register(`notificationPrefs.${topic.key}.${channel.key}`)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {saved && !form.formState.isDirty && (
            <p role="status" className="flex items-center gap-1 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Modifications enregistrées
            </p>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Form>
  );
}

const CONFIRM_WORD = 'SUPPRIMER';

/**
 * La suppression du compte (droit à l'effacement, RGPD). On demande de taper un mot
 * pour éviter le clic par erreur ; le serveur refuse s'il reste une réservation à venir.
 */
function DeleteAccountSection() {
  const deleteMe = useDeleteMe();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const fieldId = useId();

  async function confirm() {
    try {
      await deleteMe.mutateAsync();
      setOpen(false);
      // /deconnexion ferme la session hors de l'espace protégé (voir LogoutPage),
      // puis l'accueil affiche la confirmation.
      await navigate('/deconnexion', { replace: true, state: { accountDeleted: true } });
    } catch {
      // L'erreur est affichée dans la fenêtre (deleteMe.error).
    }
  }

  return (
    <section
      aria-labelledby="account-delete"
      className="flex flex-col gap-3 rounded-xl border border-destructive/40 p-5"
    >
      <h2 id="account-delete" className="text-xl font-semibold">
        Supprimer mon compte
      </h2>
      <p className="text-sm text-muted-foreground">
        Tes informations personnelles sont effacées et tu es déconnecté. Tes avis restent visibles,
        signés « Utilisateur supprimé ». Ton profil prestataire, si tu en as un, est retiré de la
        recherche. C’est définitif.
      </p>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setTyped('');
            deleteMe.reset();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-fit">
            <Trash2 aria-hidden />
            Supprimer mon compte
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ton compte ?</DialogTitle>
            <DialogDescription>
              Cette action ne peut pas être annulée. Tape {CONFIRM_WORD} pour confirmer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId}>Confirmation</Label>
            <Input
              id={fieldId}
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
          {deleteMe.isError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteMe.error instanceof ApiError
                ? deleteMe.error.message
                : 'La suppression a échoué.'}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD || deleteMe.isPending}
              onClick={confirm}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
