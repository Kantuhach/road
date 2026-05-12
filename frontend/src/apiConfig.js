const raw = import.meta.env.VITE_API_BASE_URL?.trim();

/** Backend HTTP origin when the SPA is hosted separately (no trailing slash). */
export const API_ORIGIN = raw ? raw.replace(/\/$/, '') : '';

/** Absolute or same-origin path for fetch(); respects `VITE_API_BASE_URL`. */
export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
}
