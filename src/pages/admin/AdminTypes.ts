export const ADMIN_TABS = ['Обзор', 'Двери', 'Тексты сайта', 'Контакты', 'Пользователи', 'Рефералы', 'Заявки', 'Оплата'];

export const COLORS = ['#6b7280','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b'];
export const RARITIES = [
  { v: 'common', label: 'Обычная' },
  { v: 'rare', label: 'Редкая' },
  { v: 'epic', label: 'Эпическая' },
  { v: 'legendary', label: 'Легендарная' },
];

export interface Door {
  id: number; name: string; prize: string; prize_icon: string;
  key_price: number; rarity: string; keys_sold: number; is_active: boolean;
  draw_at: string | null; instant_open: boolean; key_type: string;
  color: string; is_trigger: boolean; key_name: string;
  prizes_total: number; prizes_left: number;
}
export interface Prize { id: number; name: string; description: string; is_won: boolean; sort_order: number; quantity: number; }
export interface PrizeFreq { id: number; every_n: number; prize_amount: number; description: string; sort_order: number; }
export interface SiteContent { [key: string]: { value: string; label: string } }
export interface ContactsInfo { [key: string]: { value: string; label: string } }
export interface AdminUser {
  id: number; name: string; full_name: string; email: string; phone: string;
  birth_date: string; role: string; referral_code: string;
  external_balance: number; referral_balance: number; keys_count: number;
  is_blocked: boolean; is_main_admin: boolean; created_at: string;
}
export interface RefAgent { id: number; name: string; referral_code: string; invited: number; earned: number; }
export interface DepositReq { id: number; user_id: number; user_name: string; user_email: string; amount: number; status: string; created_at: string; comment: string; }
