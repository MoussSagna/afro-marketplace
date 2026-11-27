import { ApiError, type NotificationPrefs, type User } from '@afro/common';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_GROUPS,
  samePrefs,
  type NotificationChannel,
  type NotificationTopic,
} from '../lib/accountForm';
import { useSaveAccount } from '../lib/useSaveAccount';
import { useUnsavedChangesGuard } from '../lib/useUnsavedChangesGuard';
import {
  AccountActions,
  AccountCard,
  AccountCardTitle,
  PRIMARY_ACTION,
  SECONDARY_ACTION,
} from './AccountPanel';

/** Les colonnes des canaux (ordinateur et tablette) : même grille pour l'en-tête et les lignes. */
const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_repeat(3,96px)] md:items-center';

/**
 * « Notifications » : pour chaque sujet enregistré dans `notificationPrefs`, un interrupteur
 * par canal (e-mail, application, SMS). Enregistré avec le reste du compte (`PATCH /me`).
 */
export function NotificationSettings({ user }: { user: User }) {
  const { save, isPending } = useSaveAccount();
  const [prefs, setPrefs] = useState<NotificationPrefs>(user.notificationPrefs);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const dirty = !samePrefs(prefs, user.notificationPrefs);
  const guard = useUnsavedChangesGuard(dirty && !isPending);

  function toggle(topic: NotificationTopic, channel: NotificationChannel, on: boolean) {
    setStatus('idle');
    setPrefs((current) => ({ ...current, [topic]: { ...current[topic], [channel]: on } }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('idle');
    try {
      const updated = await save({ notificationPrefs: prefs });
      setPrefs(updated.notificationPrefs);
      setStatus('saved');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'L’enregistrement a échoué. Réessayez dans un instant.',
      );
      setStatus('error');
    }
  }

  return (
    <AccountCard>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Préférences de notification"
        className="flex flex-col gap-6"
      >
        <p className="flex items-start gap-2.5 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Les e-mails indispensables (sécurité, confirmation de réservation) partent quoi qu’il
          arrive. En démo, rien n’est réellement envoyé.
        </p>

        {/* En-tête des colonnes (dès 768 px ; sur téléphone, chaque interrupteur a son libellé). */}
        <div
          aria-hidden
          className={cn(
            ROW_GRID,
            'hidden text-center text-sm font-semibold text-muted-foreground md:-mb-3',
          )}
        >
          <span />
          {NOTIFICATION_CHANNELS.map((channel) => (
            <span key={channel.key}>{channel.label}</span>
          ))}
        </div>

        {NOTIFICATION_GROUPS.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`notif-${group.id}`}
            className="flex flex-col gap-3 border-t pt-5"
          >
            <AccountCardTitle id={`notif-${group.id}`} icon={group.icon} title={group.title} />
            <ul className="flex flex-col gap-2">
              {group.topics.map((topic) => (
                <li
                  key={topic.key}
                  className={cn(
                    ROW_GRID,
                    'flex flex-col gap-3 rounded-xl px-1 py-2 md:gap-0 md:pl-13',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium">{topic.label}</p>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  </div>
                  {/* Téléphone : 3 colonnes égales, interrupteur au-dessus de son canal. */}
                  <div className="grid grid-cols-3 gap-2 md:contents">
                    {NOTIFICATION_CHANNELS.map((channel) => {
                      const id = `notif-${topic.key}-${channel.key}`;
                      return (
                        <div
                          key={channel.key}
                          className="flex flex-col items-start gap-1.5 md:items-center md:justify-center"
                        >
                          <Switch
                            id={id}
                            checked={prefs[topic.key][channel.key]}
                            onCheckedChange={(on) => toggle(topic.key, channel.key, on)}
                            aria-label={`${topic.label} par ${channel.label.toLowerCase()}`}
                          />
                          <label htmlFor={id} className="text-sm md:sr-only">
                            {channel.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {status === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AccountActions
          status={
            status === 'saved' &&
            !dirty && (
              <p role="status" className="flex items-center gap-1.5 text-sm text-success sm:mr-2">
                <CheckCircle2 className="size-4" aria-hidden />
                Préférences enregistrées
              </p>
            )
          }
        >
          <Button
            type="button"
            variant="outline"
            className={SECONDARY_ACTION}
            disabled={!dirty || isPending}
            onClick={() => {
              setPrefs(user.notificationPrefs);
              setStatus('idle');
            }}
          >
            Annuler
          </Button>
          <Button type="submit" className={PRIMARY_ACTION} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            Enregistrer les préférences
          </Button>
        </AccountActions>
      </form>
      {guard}
    </AccountCard>
  );
}
