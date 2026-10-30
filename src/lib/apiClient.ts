/**
 * Central API client for the Magic AI Node.js backend.
 * All frontend services use this instead of the Supabase JS client.
 *
 * Token storage: localStorage key "magic_ai_token"
 * Base URL: VITE_API_BASE_URL env var (default: http://localhost:4000/api)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'magic_ai_token';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Token expired — clear local storage
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('magic_ai_auth_expired'));
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error((data as any)?.error || `Request failed: ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

// ─── HTTP methods ─────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body ?? {}),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

export default api;
