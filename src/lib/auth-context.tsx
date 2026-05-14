import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, ApiError } from './api';

export interface User {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  phone?: string;
  birth_date?: string;
  role: 'user' | 'admin';
  referral_code: string;
  referred_by?: number;
  external_balance: number;
  referral_balance: number;
  balance: number;
  keys_count: number;
  keys_available: number;
  level: string;
  level_progress: number;
  is_blocked: boolean;
  is_main_admin: boolean;
  referral_earned: number;
  referral_invited: number;
}

export interface RegisterData {
  name: string;
  full_name?: string;
  email: string;
  phone: string;
  birth_date: string;
  password: string;
  referral_code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('gd_token');
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.auth.me();
      setUser(data as unknown as User);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          // Невалидный токен — разлогиниваем
          localStorage.removeItem('gd_token');
          setUser(null);
        }
        // При 0 (сеть), 500, 502 — оставляем пользователя залогиненным
        // Токен сохраняем, попробует снова при следующем действии
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshUser(); }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('gd_token', data.token as string);
    await refreshUser();
  };

  const register = async (data: RegisterData) => {
    const resp = await api.auth.register(data);
    localStorage.setItem('gd_token', resp.token as string);
    await refreshUser();
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem('gd_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}