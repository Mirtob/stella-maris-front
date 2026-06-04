/**
 * URL safety helpers — defense against XSS via `javascript:`, `data:`, `vbscript:`,
 * `file:` and other non-network protocols injected into <a href>, window.open(),
 * <iframe src>, <img src>, etc.
 *
 * React escapes string interpolation by default ({foo}) but does NOT validate
 * URL protocols. Passing `javascript:alert(1)` to <a href={url}> will execute
 * the payload when the user clicks the link.
 *
 * Always wrap user/DB-sourced URLs with isSafeUrl() or safeUrl() before placing
 * them into DOM attributes or browser APIs.
 */

/** Protocols allowed for navigation / linking. */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/** Returns true if the URL is safe to put into href / window.open / iframe src. */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  // Relative URLs (no protocol) are safe — they navigate within the same origin
  if (url.startsWith('/') && !url.startsWith('//')) return true;

  try {
    const parsed = new URL(url, window.location.origin);
    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns the URL if it's safe, or `undefined` otherwise. Convenient for
 * conditional rendering: `<a href={safeUrl(maybeBadUrl)}>` will render
 * an anchor without an href when the URL is unsafe, which the browser
 * treats as non-interactive instead of executing a payload.
 */
export function safeUrl(url: string | null | undefined): string | undefined {
  return isSafeUrl(url) ? (url as string) : undefined;
}

/**
 * Safe wrapper for window.open(). Returns null and does nothing if the URL
 * is unsafe; otherwise opens with noopener,noreferrer.
 */
export function safeWindowOpen(url: string | null | undefined): Window | null {
  if (!isSafeUrl(url)) return null;
  return window.open(url as string, '_blank', 'noopener,noreferrer');
}
