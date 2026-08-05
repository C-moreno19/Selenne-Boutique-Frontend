export const apiBase = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';

const RT_KEY = '_selenne_rt';

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function getAccessToken() { return _accessToken; }
function setAccessToken(token: string | null) { _accessToken = token ?? null; }
function getRefreshToken() { return _refreshToken; }
function setRefreshToken(token: string | null) {
  _refreshToken = token ?? null;
  if (token) sessionStorage.setItem(RT_KEY, token);
  else sessionStorage.removeItem(RT_KEY);
}
function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  sessionStorage.removeItem(RT_KEY);
}
export function getSavedRefreshToken(): string | null {
  return sessionStorage.getItem(RT_KEY);
}

let refreshingPromise: Promise<boolean> | null = null;

async function ensureRefreshed(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) { clearTokens(); return false; }

  refreshingPromise = (async () => {
    try {
      const res = await fetch(apiBase + '/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      if (!res.ok) { clearTokens(); return false; }
      const data = await res.json();
      // El backend retorna ApiResponse<string> → el token está en data.data
      const newToken = data?.accessToken || data?.data;
      if (newToken) setAccessToken(newToken);
      if (data?.refreshToken) setRefreshToken(data.refreshToken);
      return !!newToken;
    } catch (e) {
      clearTokens(); return false;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

// El generico por defecto queda en `any` a proposito: esta funcion es el punto de entrada
// de todas las llamadas HTTP del proyecto y no todos los call sites migraron a tipos reales
// todavia. Los que ya lo hicieron (contexts principales) pasan su propio <T>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchWithAuth<T = any>(input: string, options: RequestInit = {}, retry = true): Promise<T> {
  const url = `${apiBase}${input}`;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (res.status !== 401) {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  if (!retry) {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    throw { status: res.status, data };
  }

  const ok = await ensureRefreshed();
  if (!ok) {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    throw { status: res.status, data };
  }

  const newToken = getAccessToken();
  if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
  const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
  const text = await retryRes.text();
  const data = text ? JSON.parse(text) : null;
  if (!retryRes.ok) throw { status: retryRes.status, data };
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function postJson<T = any>(path: string, body: unknown) {
  return fetchWithAuth<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getJson<T = any>(path: string) {
  return fetchWithAuth<T>(path, { method: 'GET' });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function putJson<T = any>(path: string, body: unknown) {
  return fetchWithAuth<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteJson<T = any>(path: string) {
  return fetchWithAuth<T>(path, { method: 'DELETE' });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function postForm<T = any>(path: string, form: FormData) {
  return fetchWithAuth<T>(path, { method: 'POST', body: form });
}
export function setTokensFromAuthResponse(obj: { accessToken?: string; refreshToken?: string } | null) {
  if (!obj) return;
  if (obj.accessToken) setAccessToken(obj.accessToken);
  if (obj.refreshToken) setRefreshToken(obj.refreshToken);
}
export function clearAuthTokens() { clearTokens(); }

export default { apiBase, fetchWithAuth, postJson, putJson, deleteJson, getJson, postForm, setTokensFromAuthResponse, clearAuthTokens };