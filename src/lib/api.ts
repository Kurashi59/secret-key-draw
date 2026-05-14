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
    register: (body: { name: string; full_name?: string; email: string; phone: string; birth_date: string; password: string; referral_code?: string }) =>
      request(a('register'), { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request(a('login'), { method: 'POST', body: JSON.stringify(body) }),

    me: () => request(a('me')),
    logout: () => request(a('logout'), { method: 'POST' }),

    updateProfile: (body: { name?: string; full_name?: string; phone?: string; birth_date?: string }) =>
      request(a('update'), { method: 'POST', body: JSON.stringify(body) }),

    adminSetRole: (user_id: number, role: 'user' | 'admin') =>
      request(a('admin_set_role'), { method: 'POST', body: JSON.stringify({ user_id, role }) }),

    adminDeposit: (user_id: number, amount: number, balance_type: 'external' | 'referral', description?: string) =>
      request(a('admin_deposit'), { method: 'POST', body: JSON.stringify({ user_id, amount, balance_type, description }) }),
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

    // Prizes
    getPrizes: (door_id: number) => request(c('get_prizes') + `&door_id=${door_id}`),
    addPrize: (door_id: number, name: string, description?: string) =>
      request(c('add_prize'), { method: 'POST', body: JSON.stringify({ door_id, name, description }) }),
    updatePrize: (prize_id: number, name?: string, description?: string) =>
      request(c('update_prize'), { method: 'POST', body: JSON.stringify({ prize_id, name, description }) }),
    deletePrize: (prize_id: number) =>
      request(c('delete_prize'), { method: 'POST', body: JSON.stringify({ prize_id }) }),

    // Keys
    getMyKeys: () => request(c('get_my_keys')),
    buyKey: (door_id: number) =>
      request(c('buy_key'), { method: 'POST', body: JSON.stringify({ door_id }) }),

    // Door open
    openDoor: (door_id: number, key_id: number) =>
      request(c('open_door'), { method: 'POST', body: JSON.stringify({ door_id, key_id }) }),

    // Transactions
    getTransactions: () => request(c('get_transactions')),
    history: () => request(c('history')),

    // Deposit
    requestDeposit: (amount: number) =>
      request(c('request_deposit'), { method: 'POST', body: JSON.stringify({ amount }) }),

    // Admin
    adminStats: () => request(c('admin_stats')),
    adminUsers: () => request(c('admin_users')),
    adminBlockUser: (user_id: number, is_blocked: boolean) =>
      request(c('block_user'), { method: 'POST', body: JSON.stringify({ user_id, is_blocked }) }),
    adminReferrals: () => request(c('admin_referrals')),
    adminDeposits: () => request(c('admin_deposits')),
    adminConfirmDeposit: (request_id: number) =>
      request(c('admin_confirm_deposit'), { method: 'POST', body: JSON.stringify({ request_id }) }),
  },
};
