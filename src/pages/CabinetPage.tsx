import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const TABS = ['Обзор', 'История', 'Рефералы', 'Настройки'];

interface HistoryItem {
  id: number;
  prize_won: string;
  amount_won: number;
  created_at: string;
  door_name: string;
  prize_icon: string;
}

export default function CabinetPage({ onGoAuth }: { onGoAuth: () => void }) {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    if (activeTab === 1 && user) {
      setLoadingHistory(true);
      api.content.history()
        .then(data => setHistory(data))
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="min-h-screen grid-bg pt-32 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-6">🔐</div>
        <h2 className="font-oswald text-2xl text-white font-bold mb-3">Войдите в аккаунт</h2>
        <p className="text-white/40 font-rubik mb-6">Для доступа к личному кабинету необходима авторизация</p>
        <button className="btn-gold px-10 py-3 rounded-xl text-sm" onClick={onGoAuth}>Войти / Зарегистрироваться</button>
      </div>
    );
  }

  const referralLink = `${window.location.origin}?ref=${user.referral_code}`;

  const copyRef = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg('');
    try {
      await api.auth.updateProfile({ name: profileForm.name, phone: profileForm.phone });
      await refreshUser();
      setSaveMsg('Сохранено!');
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaveLoading(false);
    }
  };

  const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="card-glow rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 fade-up-1">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
              <span className="font-oswald text-2xl text-black font-bold">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#07090f]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-oswald text-2xl text-white font-bold">{user.name}</h2>
              {user.role === 'admin' && (
                <span className="text-xs bg-gold-500/20 border border-gold-500/30 text-gold-400 rounded-full px-2 py-0.5 font-oswald">ADMIN</span>
              )}
            </div>
            <div className="text-white/40 text-sm font-rubik mb-2">{user.email}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs border border-gold-500/40 bg-gold-500/10 text-gold-400 rounded-full px-3 py-0.5 font-oswald tracking-wider">
                👑 {user.level}
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-32">
                <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full" style={{ width: `${user.level_progress}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="card-glow rounded-xl px-5 py-3 text-center">
              <div className="font-oswald text-2xl text-gold-400 font-bold">{user.balance.toLocaleString()} ₽</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">Баланс</div>
            </div>
            <span className="font-oswald text-lg text-white/70">🗝 {user.keys_count} ключей</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10 fade-up-2">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 px-3 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all ${
                activeTab === i ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Обзор */}
        {activeTab === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-3">
            {[
              { icon: 'Key', label: 'Ключей куплено', value: String(user.keys_count) },
              { icon: 'Trophy', label: 'Баланс', value: `${user.balance} ₽` },
              { icon: 'Users', label: 'Рефералов', value: String(user.referral_invited) },
              { icon: 'TrendingUp', label: 'Реф. доход', value: `${user.referral_earned} ₽` },
            ].map(item => (
              <div key={item.label} className="card-glow rounded-xl p-4 text-center">
                <Icon name={item.icon} fallback="Star" size={24} className="text-gold-400 mx-auto mb-2" />
                <div className="font-oswald text-xl text-white font-bold">{item.value}</div>
                <div className="text-xs text-white/40 mt-0.5 font-rubik">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* История */}
        {activeTab === 1 && (
          <div className="card-glow rounded-2xl overflow-hidden fade-up-3">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="font-oswald text-lg text-white tracking-wide">История открытий</h3>
            </div>
            {loadingHistory ? (
              <div className="text-center py-12 text-white/30 font-rubik">Загрузка...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🚪</div>
                <div className="text-white/30 font-rubik text-sm">Вы ещё не открывали дверей</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.prize_icon}</span>
                      <div>
                        <div className="font-rubik text-sm text-white/80">{item.door_name}</div>
                        <div className="text-xs text-white/30">{new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
                      </div>
                    </div>
                    <div className="font-oswald text-sm font-bold text-green-400">{item.prize_won}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Рефералы */}
        {activeTab === 2 && (
          <div className="space-y-4 fade-up-3">
            <div className="card-glow rounded-2xl p-6">
              <h3 className="font-oswald text-lg text-white mb-1 tracking-wide">Ваш реферальный код</h3>
              <p className="text-xs text-white/30 font-rubik mb-5">За каждого приглашённого — 10% с его первой покупки ключа</p>
              <div className="bg-black/40 border border-gold-500/20 rounded-xl px-4 py-3 mb-3 text-center">
                <div className="font-oswald text-2xl text-gold-400 tracking-widest">{user.referral_code}</div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-xs text-white/40 font-rubik truncate">
                  {referralLink}
                </div>
                <button onClick={copyRef} className={`btn-gold px-5 rounded-xl text-sm flex-shrink-0 ${copied ? 'opacity-80' : ''}`}>
                  {copied ? '✓' : 'Копировать'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-glow rounded-xl p-4 text-center">
                <div className="font-oswald text-2xl text-white font-bold">{user.referral_invited}</div>
                <div className="text-xs text-white/40 font-rubik mt-1">Приглашено</div>
              </div>
              <div className="card-glow rounded-xl p-4 text-center">
                <div className="font-oswald text-2xl text-gold-400 font-bold">{user.referral_earned} ₽</div>
                <div className="text-xs text-white/40 font-rubik mt-1">Заработано</div>
              </div>
            </div>
          </div>
        )}

        {/* Настройки */}
        {activeTab === 3 && (
          <div className="fade-up-3 space-y-4">
            <form onSubmit={saveProfile} className="card-glow rounded-2xl p-6 space-y-5">
              <h3 className="font-oswald text-lg text-white tracking-wide">Настройки профиля</h3>
              {[{ key: 'name', label: 'Имя', placeholder: 'Александр' }, { key: 'phone', label: 'Телефон', placeholder: '+7 (900) 000-00-00' }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{f.label}</label>
                  <input value={profileForm[f.key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors" />
                </div>
              ))}
              <div className="bg-black/30 rounded-xl px-4 py-3">
                <div className="text-xs text-white/30 mb-1 font-rubik uppercase tracking-wider">Email</div>
                <div className="text-white/60 font-rubik text-sm">{user.email}</div>
              </div>
              {saveMsg && <div className={`text-sm font-rubik ${saveMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</div>}
              <button type="submit" disabled={saveLoading} className="btn-gold w-full py-3 rounded-xl text-sm">
                {saveLoading ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
            </form>
            <button onClick={logout} className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 font-oswald text-sm uppercase tracking-wider hover:border-red-500/40 transition-all">
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
