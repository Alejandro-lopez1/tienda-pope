const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

function getAuthToken(): string | null {
  return localStorage.getItem('admin_access_token') || localStorage.getItem('access_token');
}

type ApiFetchOptions = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const { auth = true, ...rest } = init;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(rest.headers || {});
  const token = getAuthToken();
  if (auth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (rest.body && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { ...rest, headers });
  if (
    res.status === 401 &&
    auth &&
    !/\/auth\/(login|refresh)\/?/.test(path) &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/admin/login')
  ) {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  }
  return res;
}

export { API_BASE_URL };
