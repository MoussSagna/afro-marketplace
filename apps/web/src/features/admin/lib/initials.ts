/** Les initiales d'un nom (« Kompa Vibes Haïti » → « KV »), « ? » s'il est vide. */
export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || '?'
  );
}
