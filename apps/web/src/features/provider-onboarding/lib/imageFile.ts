/** Largeur ou hauteur maximale d'une photo de galerie, en pixels. */
const MAX_SIZE = 1200;

/**
 * Transforme un fichier image en « data URL » (le texte de l'image), réduite à 1200 px.
 *
 * Au MVP mocké, il n'y a pas de stockage de fichiers : l'image est gardée telle
 * quelle dans la base mockée (localStorage). La réduire évite de remplir le
 * localStorage. Le vrai stockage (Supabase Storage) arrive au lot 10.
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch {
      // Navigateur ancien ou format non géré : on garde le fichier tel quel.
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Lecture impossible'));
    reader.readAsDataURL(file);
  });
}

/** Une photo d'illustration, pour essayer la démo sans avoir de fichier sous la main. */
export function samplePhotoUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;
}
