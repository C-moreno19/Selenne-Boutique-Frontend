export const apiBase = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';

function getAccessToken() { return localStorage.getItem('accessToken'); }
function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}
function getRefreshToken() { return localStorage.getItem('refreshToken'); }
function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem('refreshToken', token);
  else localStorage.removeItem('refreshToken');
}
function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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

export async function fetchWithAuth(input: string, options: RequestInit = {}, retry = true) {
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
    try {
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw { status: res.status, data };
      return data;
    } catch (e) { throw e; }
  }

  if (!retry) {
    const text = await res.text();
    try { const data = text ? JSON.parse(text) : null; throw { status: res.status, data }; }
    catch (e) { throw e; }
  }

  const ok = await ensureRefreshed();
  if (!ok) {
    const text = await res.text();
    try { const data = text ? JSON.parse(text) : null; throw { status: res.status, data }; }
    catch (e) { throw e; }
  }

  const newToken = getAccessToken();
  if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
  const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
  const text = await retryRes.text();
  try {
    const data = text ? JSON.parse(text) : null;
    if (!retryRes.ok) throw { status: retryRes.status, data };
    return data;
  } catch (e) { throw e; }
}

export async function postJson(path: string, body: any) {
  return fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) });
}
export async function getJson(path: string) {
  return fetchWithAuth(path, { method: 'GET' });
}
export async function putJson(path: string, body: any) {
  return fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(body) });
}
export async function deleteJson(path: string) {
  return fetchWithAuth(path, { method: 'DELETE' });
}
export async function postForm(path: string, form: FormData) {
  return fetchWithAuth(path, { method: 'POST', body: form });
}
export function setTokensFromAuthResponse(obj: { accessToken?: string; refreshToken?: string } | null) {
  if (!obj) return;
  if (obj.accessToken) setAccessToken(obj.accessToken);
  if (obj.refreshToken) setRefreshToken(obj.refreshToken);
}
export function clearAuthTokens() { clearTokens(); }

export default { apiBase, fetchWithAuth, postJson, putJson, deleteJson, getJson, postForm, setTokensFromAuthResponse, clearAuthTokens };