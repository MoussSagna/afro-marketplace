import { ArrowRight } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';

/** Une adresse e-mail plausible (la vraie vérification se fera à l'envoi, avec le back-end). */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * « Restez informé » : inscription à la lettre d'information.
 * Pas encore de back-end : on vérifie l'adresse et on le dit honnêtement (rien n'est enregistré).
 */
export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'invalid' | 'sent'>('idle');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState(EMAIL.test(email.trim()) ? 'sent' : 'invalid');
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Lettre d’information">
      <label htmlFor={`${id}-email`} className="sr-only">
        Votre adresse e-mail
      </label>
      <div
        className={cn(
          'flex items-center rounded-full border bg-white/5 p-1.5 pl-5 transition-colors focus-within:border-cta/80 focus-within:bg-white/10',
          state === 'invalid' ? 'border-cta' : 'border-white/20',
        )}
      >
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          placeholder="Votre adresse e-mail"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== 'idle') setState('idle');
          }}
          aria-invalid={state === 'invalid'}
          aria-describedby={`${id}-message`}
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-white/70 2xl:text-[19px]"
        />
        <button
          type="submit"
          aria-label="S’inscrire à la lettre d’information"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cta text-cta-foreground transition-colors outline-none hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground 2xl:size-[54px]"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
      <p id={`${id}-message`} role="status" className="mt-3 min-h-5 text-sm text-white/85">
        {state === 'invalid' && 'Saisis une adresse e-mail valide (ex. nom@exemple.fr).'}
        {state === 'sent' &&
          'Merci ! L’inscription à la lettre d’information arrive bientôt : ton adresse n’a pas encore été enregistrée.'}
      </p>
    </form>
  );
}
