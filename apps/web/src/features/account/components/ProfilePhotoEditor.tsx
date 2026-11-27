import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AVATAR_MAX_SIZE, imageFileToDataUrl } from '@/features/provider-onboarding/lib/imageFile';

/** Au-delà, on refuse le fichier avant même de le lire (une photo de téléphone fait 2 à 6 Mo). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface ProfilePhotoEditorProps {
  /** La photo du formulaire : celle du compte, ou l'aperçu de la nouvelle (« data URL »). */
  value: string;
  /** La photo enregistrée sur le compte, pour savoir si `value` est un aperçu. */
  savedValue: string;
  onChange(url: string): void;
  initials: string;
  fullName: string;
  memberSince: string;
}

/**
 * La photo de profil : avatar (ou initiales), nom, date d'inscription, « Changer la photo ».
 * Le fichier choisi est réduit (400 px) et montré en APERÇU : il n'est envoyé qu'avec
 * « Enregistrer les modifications », comme les autres champs ; « Annuler » le retire.
 * Même mécanisme que la galerie prestataire (data URL au MVP, Supabase Storage au lot 10).
 */
export function ProfilePhotoEditor({
  value,
  savedValue,
  onChange,
  initials,
  fullName,
  memberSince,
}: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const isPreview = value !== savedValue && value !== '';

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Choisissez une image (JPEG, PNG ou WebP).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image trop lourde : 10 Mo maximum.');
      return;
    }
    setReading(true);
    try {
      onChange(await imageFileToDataUrl(file, AVATAR_MAX_SIZE));
    } catch {
      setError('Impossible de lire cette image. Essayez-en une autre.');
    } finally {
      setReading(false);
    }
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
      <div className="flex items-center gap-4 sm:gap-7">
        <div className="relative shrink-0">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-secondary text-[28px] font-semibold text-primary sm:size-24 sm:text-[34px]">
            {value ? (
              <img
                src={value}
                alt={isPreview ? 'Aperçu de la nouvelle photo' : 'Votre photo de profil'}
                className="size-full object-cover"
              />
            ) : (
              <span aria-hidden>{initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={openPicker}
            aria-label="Choisir une photo de profil"
            className="absolute -right-0.5 -bottom-0.5 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground transition-colors outline-none hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <Camera className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-xl font-semibold sm:text-[22px]">{fullName}</p>
          <p className="text-[15px] text-muted-foreground sm:text-base">{memberSince}</p>
          {isPreview && (
            <p role="status" className="text-sm font-medium text-primary">
              Aperçu : enregistrez pour valider la nouvelle photo.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:ml-auto sm:flex-col sm:items-end">
        <Button
          type="button"
          variant="outline"
          onClick={openPicker}
          disabled={reading}
          aria-describedby={error ? errorId : undefined}
          className="h-11 rounded-full px-5 text-[15px] font-semibold text-primary has-[>svg]:px-5"
        >
          {reading ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
          Changer la photo
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange('')}
            className="h-9 rounded-full px-4 text-sm text-muted-foreground has-[>svg]:px-4"
          >
            <Trash2 aria-hidden />
            Retirer la photo
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Fichier de la photo de profil"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive sm:basis-full">
          {error}
        </p>
      )}
    </div>
  );
}
