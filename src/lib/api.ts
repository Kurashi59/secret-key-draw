const AUTH_URL = 'https://functions.poehali.dev/7a0bfbbe-e6dc-439b-8068-9b9b23998b5a';
const CONTENT_URL = 'https://functions.poehali.dev/9f14e54c-c915-4e37-94ac-1d7812c3c407';

function getToken(): string {
  return localStorage.getItem('gd_token') || '';
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

// Auth
export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string; referral_code?: string }) =>
      request(`${AUTH_URL}/register`, { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request(`${AUTH_URL}/login`, { method: 'POST', body: JSON.stringify(body) }),

    me: () => request(`${AUTH_URL}/me`),

    logout: () => request(`${AUTH_URL}/logout`, { method: 'POST' }),

    updateProfile: (body: { name?: string; phone?: string }) =>
      request(`${AUTH_URL}/me`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  content: {
    getSite: () => request(`${CONTENT_URL}/site`),
    updateSite: (updates: Record<string, string>) =>
      request(`${CONTENT_URL}/site`, { method: 'PUT', body: JSON.stringify({ updates }) }),

    getContacts: () => request(`${CONTENT_URL}/contacts`),
    updateContacts: (updates: Record<string, string>) =>
      request(`${CONTENT_URL}/contacts`, { method: 'PUT', body: JSON.stringify({ updates }) }),

    getDoors: () => request(`${CONTENT_URL}/doors`),
    getAllDoors: () => request(`${CONTENT_URL}/doors/all`),
    updateDoor: (id: number, body: Record<string, unknown>) =>
      request(`${CONTENT_URL}/doors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    createDoor: (body: Record<string, unknown>) =>
      request(`${CONTENT_URL}/doors`, { method: 'POST', body: JSON.stringify(body) }),

    adminStats: () => request(`${CONTENT_URL}/admin/stats`),
    adminUsers: () => request(`${CONTENT_URL}/admin/users`),
    adminBlockUser: (id: number, is_blocked: boolean) =>
      request(`${CONTENT_URL}/admin/users/${id}/block`, { method: 'PUT', body: JSON.stringify({ is_blocked }) }),
    adminReferrals: () => request(`${CONTENT_URL}/admin/referrals`),

    history: () => request(`${CONTENT_URL}/history`),
  },
};
