import {
  ApiError,
  changePasswordFormSchema,
  useChangePassword,
  useDeleteMe,
  type ChangePasswordFormValues,
  type User,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/features/auth/components/AuthInput';
import { PasswordRules } from '@/features/auth/components/PasswordRules';
import {
  AccountActions,
  AccountCard,
  AccountCardTitle,
  PRIMARY_ACTION,
  SECONDARY_ACTION,
} from './AccountPanel';
import { RequiredMark } from './IconInput';

const LABEL = 'gap-1 text-[15px] font-semibold';
const FIELD = 'h-11 rounded-[10px]';
const EMPTY: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

/**
 * « Sécurité » : changer son mot de passe, puis supprimer son compte.
 * Ni sessions actives ni double authentification : le MVP ne les gère pas, on ne les affiche pas.
 */
export function SecuritySettings({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-6">
      <AccountCard labelledBy="security-password">
        <div className="flex flex-col gap-6">
          <AccountCardTitle
            id="security-password"
            icon={LockKeyhole}
            title="Mot de passe"
            description="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs."
          />
          {user.authProvider === 'email' ? (
            <ChangePasswordForm />
          ) : (
            <p className="rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
              Vous vous connectez avec {user.authProvider === 'google' ? 'Google' : 'Apple'} : votre
              compte Wenzee n’a pas de mot de passe à modifier.
            </p>
          )}
        </div>
      </AccountCard>
      <DeleteAccountSection />
    </div>
  );
}

function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [done, setDone] = useState(false);
  const rulesId = useId();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: EMPTY,
  });
  const newPassword = useWatch({ control: form.control, name: 'newPassword' });
  const { isDirty, isSubmitting, errors } = form.formState;

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    setDone(false);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      form.reset(EMPTY);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'wrong_password') {
        form.setError('currentPassword', { message: error.message }, { shouldFocus: true });
      } else {
        form.setError('root', {
          message:
            error instanceof ApiError
              ? error.message
              : 'Le changement a échoué. Réessayez dans un instant.',
        });
      }
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Modifier le mot de passe"
        className="flex flex-col gap-5"
        onChange={() => setDone(false)}
      >
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem className="md:max-w-[calc(50%-12px)]">
              <FormLabel className={LABEL}>
                Mot de passe actuel
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <PasswordInput
                  icon={LockKeyhole}
                  autoComplete="current-password"
                  aria-required
                  className={FIELD}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="content-start">
                <FormLabel className={LABEL}>
                  Nouveau mot de passe
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    icon={KeyRound}
                    autoComplete="new-password"
                    aria-required
                    aria-describedby={rulesId}
                    className={FIELD}
                    {...field}
                  />
                </FormControl>
                <PasswordRules id={rulesId} value={newPassword} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="content-start">
                <FormLabel className={LABEL}>
                  Confirmation du nouveau mot de passe
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    icon={KeyRound}
                    autoComplete="new-password"
                    aria-required
                    className={FIELD}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <AccountActions
          status={
            done && (
              <p role="status" className="flex items-center gap-1.5 text-sm text-success sm:mr-2">
                <CheckCircle2 className="size-4" aria-hidden />
                Mot de passe modifié
              </p>
            )
          }
        >
          <Button
            type="button"
            variant="outline"
            className={SECONDARY_ACTION}
            disabled={!isDirty || isSubmitting}
            onClick={() => form.reset(EMPTY)}
          >
            Annuler
          </Button>
          <Button type="submit" className={PRIMARY_ACTION} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Modifier le mot de passe
          </Button>
        </AccountActions>
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
    <AccountCard labelledBy="account-delete" className="border-destructive/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-destructive"
          >
            <Trash2 className="size-5" strokeWidth={1.8} />
          </span>
          <div className="flex flex-col gap-1">
            <h3 id="account-delete" className="font-sans text-lg font-semibold">
              Supprimer mon compte
            </h3>
            <p className="text-sm text-muted-foreground">
              Vos informations personnelles sont effacées et vous êtes déconnecté. Vos avis restent
              visibles, signés « Utilisateur supprimé ». Votre profil prestataire, si vous en avez
              un, est retiré de la recherche. C’est définitif.
            </p>
          </div>
        </div>
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
            <Button
              variant="destructive"
              className="h-11 shrink-0 rounded-full px-5 has-[>svg]:px-5"
            >
              <Trash2 aria-hidden />
              Supprimer mon compte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer définitivement votre compte ?</DialogTitle>
              <DialogDescription>
                Cette action ne peut pas être annulée. Tapez {CONFIRM_WORD} pour confirmer.
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
      </div>
    </AccountCard>
  );
}
