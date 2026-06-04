/**
 * Text normalization for accent-insensitive search.
 *
 * Catholic liturgical music titles use many accented characters
 * (Comunión, Pentecostés, María, Señor). Mobile users typing on a
 * Spanish keyboard often skip accents — "comunion" should still find
 * "Comunión". Lowercase + NFD + strip combining marks gives us that.
 */

/** Lowercase the string and remove all accents/diacritics. */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** True if `haystack` contains `needle` after normalizing both sides. */
export function matchesSearch(haystack: string | undefined | null, needle: string): boolean {
  if (!haystack) return false;
  if (!needle) return true;
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}
