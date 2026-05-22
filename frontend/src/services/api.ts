export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
export const DATA_BASE = import.meta.env.VITE_DATA_BASE || 'http://localhost:8788';

export const getAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${path}`;
};

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request(base: string, path: string, options: FetchOptions = {}) {
  const url = new URL(`${base}${path}`);
  if (options.params) {
    Object.keys(options.params).forEach(key => 
      url.searchParams.append(key, options.params![key])
    );
  }

  const headers = new Headers(options.headers || {});
  
  // Inject Bearer Token from LocalStorage
  const token = localStorage.getItem('prode_u_jwt');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const data = await response.json();
      errorMsg = data.error || errorMsg;
    } catch {
      try {
        const text = await response.text();
        errorMsg = text || errorMsg;
      } catch {}
    }
    throw new Error(errorMsg);
  }

  // Check content type
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response;
}

export const api = {
  // Wrapper for api-worker (general API)
  get: (path: string, options?: FetchOptions) => request(API_BASE, path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: FetchOptions) => 
    request(API_BASE, path, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
  put: (path: string, body?: any, options?: FetchOptions) => 
    request(API_BASE, path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string, options?: FetchOptions) => request(API_BASE, path, { ...options, method: 'DELETE' }),

  // Wrapper for data-worker (read-only cached fixtures, standings, etc.)
  data: {
    get: (path: string, options?: FetchOptions) => request(DATA_BASE, path, { ...options, method: 'GET' }),
  }
};
