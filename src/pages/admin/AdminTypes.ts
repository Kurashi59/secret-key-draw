export const ADMIN_TABS = ['Обзор', 'Двери', 'Тексты сайта', 'Контакты', 'Пользователи', 'Рефералы', 'Рег. заявки', 'Депозиты', 'Журнал наставников', 'Оплата'];

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
  member_number: string; mentor1_id: number | null; mentor2_id: number | null; mentor3_id: number | null;
  external_balance: number; referral_balance: number; keys_count: number;
  is_blocked: boolean; is_main_admin: boolean; created_at: string;
}
export interface RefAgent { id: number; name: string; referral_code: string; invited: number; earned: number; }
export interface DepositReq { id: number; user_id: number; user_name: string; user_email: string; amount: number; status: string; created_at: string; comment: string; }
export interface RegistrationRequest {
  id: number; name: string; phone: string; comment: string; status: string; created_at: string;
  mentor_id: number; mentor_name: string; mentor_member_number: string;
}
export interface ReferralTreeNode {
  id: number; name: string; member_number: string; level: number;
  mentor1: { member_number: string; name: string } | null;
  mentor2: { member_number: string; name: string } | null;
  mentor3: { member_number: string; name: string } | null;
}
export interface MentorLogEntry {
  id: number; user_id: number; user_name: string; user_member_number: string;
  changed_by: number | null; changed_by_name: string;
  old_mentor1: { member_number: string; name: string } | null;
  old_mentor2: { member_number: string; name: string } | null;
  old_mentor3: { member_number: string; name: string } | null;
  new_mentor1: { member_number: string; name: string } | null;
  new_mentor2: { member_number: string; name: string } | null;
  new_mentor3: { member_number: string; name: string } | null;
  reason: string;
  created_at: string;
}