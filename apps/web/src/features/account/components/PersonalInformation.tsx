import { ApiError, accountFormSchema, type User } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import type { z } from 'zod';
import { initialsOf, memberSince } from '../lib/accountSections';
import { useSaveAccount } from '../lib/useSaveAccount';
import { useUnsavedChangesGuard } from '../lib/useUnsavedChangesGuard';
import { AccountActions, AccountCard, PRIMARY_ACTION, SECONDARY_ACTION } from './AccountPanel';
import { IconInput, RequiredMark } from './IconInput';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';

/** Les champs de cette rubrique (les notifications ont la leur). */
const personalInfoSchema = accountFormSchema.pick({
  firstName: true,
  lastName: true,
  phone: true,
  city: true,
  avatarUrl: true,
});
type PersonalInfoValues = z.input<typeof personalInfoSchema>;
type PersonalInfoOutput = z.output<typeof personalInfoSchema>;

const defaultsOf = (user: User): PersonalInfoValues => ({
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone ?? '',
  city: user.city ?? '',
  avatarUrl: user.avatarUrl ?? '',
});

const LABEL = 'gap-1 text-[15px] font-semibold';

/**
 * « Informations personnelles » : photo, prénom, nom, e-mail (lecture seule), téléphone, ville.
 * Validation : le schéma partagé `accountFormSchema` (site et app). Enregistrement : `PATCH /me`.
 */
export function PersonalInformation({ user }: { user: User }) {
  const { save } = useSaveAccount();
  const [saved, setSaved] = useState(false);
  const form = useForm<PersonalInfoValues, unknown, PersonalInfoOutput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: defaultsOf(user),
  });
  const { isDirty, isSubmitting, errors } = form.formState;
  const guard = useUnsavedChangesGuard(isDirty && !isSubmitting);
  const [firstName, lastName] = useWatch({
    control: form.control,
    name: ['firstName', 'lastName'],
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSaved(false);
    try {
      const updated = await save(values);
      form.reset(defaultsOf(updated));
      setSaved(true);
    } catch (error) {
      form.setError('root', {
        message:
          error instanceof ApiError
            ? error.message
            : 'L’enregistrement a échoué. Réessayez dans un instant.',
      });
    }
  });

  return (
    <AccountCard className="lg:pt-6 lg:pb-6">
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Informations personnelles"
          className="flex flex-col gap-5"
          onChange={() => setSaved(false)}
        >
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <ProfilePhotoEditor
                value={field.value}
                savedValue={user.avatarUrl ?? ''}
                onChange={(url) => {
                  setSaved(false);
                  field.onChange(url);
                }}
                initials={initialsOf(firstName || user.firstName, lastName || user.lastName)}
                fullName={`${user.firstName} ${user.lastName}`}
                memberSince={memberSince(user.createdAt)}
              />
            )}
          />

          <div className="border-t" />

          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>
                    Prénom
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <IconInput
                      icon={UserRound}
                      autoComplete="given-name"
                      aria-required
                      {...field}
                    />
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
                  <FormLabel className={LABEL}>
                    Nom
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <IconInput
                      icon={UserRound}
                      autoComplete="family-name"
                      aria-required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-email" className={LABEL}>
                Adresse e-mail
                <RequiredMark />
              </Label>
              <IconInput
                id="account-email"
                icon={Mail}
                type="email"
                value={user.email}
                readOnly
                aria-describedby="account-email-help"
              />
              <p id="account-email-help" className="text-sm text-muted-foreground">
                Pour changer d’e-mail, écrivez-nous depuis la page d’aide.
              </p>
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>Téléphone</FormLabel>
                  <FormControl>
                    <IconInput
                      icon={Phone}
                      type="tel"
                      autoComplete="tel"
                      placeholder="06 12 34 56 78"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Jamais affiché : il sert aux rappels par SMS.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>Ville</FormLabel>
                  <FormControl>
                    <IconInput
                      icon={MapPin}
                      autoComplete="address-level2"
                      placeholder="Votre ville"
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
              saved &&
              !isDirty && (
                <p role="status" className="flex items-center gap-1.5 text-sm text-success sm:mr-2">
                  <CheckCircle2 className="size-4" aria-hidden />
                  Modifications enregistrées
                </p>
              )
            }
          >
            <Button
              type="button"
              variant="outline"
              className={SECONDARY_ACTION}
              disabled={!isDirty || isSubmitting}
              onClick={() => {
                form.reset(defaultsOf(user));
                setSaved(false);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" className={PRIMARY_ACTION} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Enregistrer les modifications
            </Button>
          </AccountActions>
        </form>
      </Form>
      {guard}
    </AccountCard>
  );
}
