import { useEffect } from 'react';

const SITE_NAME = 'Wenzee';

/**
 * Titre de l'onglet et description pour Google, page par page (SEO de base).
 * usePageMeta('Traiteurs', 'Les meilleurs traiteurs afro…') → « Traiteurs · Wenzee ».
 */
export function usePageMeta(title: string | undefined, description?: string) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} · ${SITE_NAME}`;
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.append(meta);
      }
      meta.content = description;
    }
  }, [title, description]);
}
