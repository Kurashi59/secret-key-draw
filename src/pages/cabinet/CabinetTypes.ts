export const TABS = ['Обзор', 'Ключи', 'История', 'Рефералы', 'Баланс', 'Настройки'];

export const KEY_COLORS: Record<string, string> = {
  common: 'text-white/70 border-white/20',
  rare: 'text-blue-400 border-blue-400/30',
  epic: 'text-purple-400 border-purple-400/30',
  legendary: 'text-gold-400 border-gold-400/30',
};

export const TX_LABELS: Record<string, string> = {
  deposit: 'Пополнение',
  key_purchase: 'Покупка ключа',
  referral_bonus: 'Реф. бонус',
  door_open_refund: 'Возврат',
};

export interface HistoryItem {
  id: number;
  prize_won: string;
  created_at: string;
  door_name: string;
  prize_icon: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance_type: string;
  description: string;
  status: string;
  created_at: string;
}

export interface UserKey {
  id: number;
  door_id: number;
  key_type: string;
  key_name: string;
  is_used: boolean;
  purchased_at: string;
  door_name: string;
  door_color?: string;
  is_trigger?: boolean;
}