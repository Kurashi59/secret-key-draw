const AUTH_URL = 'https://functions.poehali.dev/7a0bfbbe-e6dc-439b-8068-9b9b23998b5a';
const CONTENT_URL = 'https://functions.poehali.dev/9f14e54c-c915-4e37-94ac-1d7812c3c407';

function getToken(): string {
  return localStorage.getItem('gd_token') || '';
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
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

const a = (action: string) => `${AUTH_URL}?action=${action}`;
const c = (action: string) => `${CONTENT_URL}?action=${action}`;

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string; referral_code?: string }) =>
      request(a('register'), { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request(a('login'), { method: 'POST', body: JSON.stringify(body) }),

    me: () => request(a('me')),

    logout: () => request(a('logout'), { method: 'POST' }),

    updateProfile: (body: { name?: string; phone?: string }) =>
      request(a('update'), { method: 'POST', body: JSON.stringify(body) }),
  },

  content: {
    getSite: () => request(c('get_site')),
    updateSite: (updates: Record<string, string>) =>
      request(c('update_site'), { method: 'POST', body: JSON.stringify({ updates }) }),

    getContacts: () => request(c('get_contacts')),
    updateContacts: (updates: Record<string, string>) =>
      request(c('update_contacts'), { method: 'POST', body: JSON.stringify({ updates }) }),

    getDoors: () => request(c('get_doors')),
    getAllDoors: () => request(c('get_all_doors')),
    updateDoor: (id: number, body: Record<string, unknown>) =>
      request(c('update_door'), { method: 'POST', body: JSON.stringify({ id, ...body }) }),
    createDoor: (body: Record<string, unknown>) =>
      request(c('create_door'), { method: 'POST', body: JSON.stringify(body) }),

    adminStats: () => request(c('admin_stats')),
    adminUsers: () => request(c('admin_users')),
    adminBlockUser: (user_id: number, is_blocked: boolean) =>
      request(c('block_user'), { method: 'POST', body: JSON.stringify({ user_id, is_blocked }) }),
    adminReferrals: () => request(c('admin_referrals')),

    history: () => request(c('history')),
  },
};
