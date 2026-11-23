import {
  ApiError,
  PROFILE_REQUIREMENTS,
  useAddMedia,
  useDeleteMedia,
  type Media,
} from '@afro/common';
import { ImagePlus, Sparkles, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { imageFileToDataUrl, samplePhotoUrl } from '../lib/imageFile';

/** La galerie du profil : ajout de photos (fichier ou exemple) et suppression. */
export function GalleryEditor({ media }: { media: Media[] }) {
  const addMedia = useAddMedia();
  const deleteMedia = useDeleteMedia();
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const images = media.filter((m) => m.type === 'image');
  const missing = Math.max(0, PROFILE_REQUIREMENTS.minImages - images.length);

  async function add(urls: string[]) {
    setError(null);
    try {
      for (const url of urls) await addMedia.mutateAsync({ type: 'image', url });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'L’ajout de la photo a échoué.');
    }
  }

  return (
    <section aria-labelledby="gallery-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="gallery-title" className="font-sans text-base font-semibold">
          Tes photos
        </h3>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {missing > 0
            ? `${images.length} photo${images.length > 1 ? 's' : ''}, encore ${missing} pour atteindre le minimum de 3`
            : `${images.length} photos`}
        </p>
      </div>
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="group relative overflow-hidden rounded-xl border">
              <img
                src={image.url}
                alt={image.caption ?? `Photo ${index + 1}`}
                className="aspect-[3/2] w-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 size-8"
                aria-label={`Supprimer la photo ${index + 1}`}
                disabled={deleteMedia.isPending}
                onClick={() => deleteMedia.mutate(image.id)}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" disabled={addMedia.isPending}>
          <label htmlFor={inputId} className="cursor-pointer">
            <ImagePlus aria-hidden />
            Ajouter des photos
          </label>
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            await add(await Promise.all(files.map(imageFileToDataUrl)));
          }}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={addMedia.isPending}
          onClick={() => add([samplePhotoUrl(`wenzee-${Date.now()}`)])}
        >
          <Sparkles aria-hidden />
          Ajouter une photo d’exemple
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
