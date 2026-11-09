const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

function getAuthToken(): string | null {
  return localStorage.getItem('admin_access_token') || localStorage.getItem('access_token');
}

type ApiFetchOptions = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const { auth = true, ...rest } = init;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const hadAuthHeader = new Headers(rest.headers || {}).has('Authorization');
  const token = getAuthToken();
  const willSendToken = auth && !!token && !hadAuthHeader;

  const buildHeaders = (withAuth: boolean) => {
    const headers = new Headers(rest.headers || {});
    if (!withAuth) headers.delete('Authorization');
    if (withAuth && willSendToken) headers.set('Authorization', `Bearer ${token}`);
    if (rest.body && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  };

  const res = await fetch(url, { ...rest, headers: buildHeaders(true) });

  if (res.status === 401 && !/\/auth\/(login|refresh)\/?/.test(path) && typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
      return res;
    }
    if (!pathname.startsWith('/admin') && (willSendToken || hadAuthHeader)) {
      return fetch(url, { ...rest, headers: buildHeaders(false) });
    }
  }
  return res;
}

export { API_BASE_URL };
