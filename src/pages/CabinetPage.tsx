import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const TABS = ['Обзор', 'Ключи', 'История', 'Рефералы', 'Баланс', 'Настройки'];

interface HistoryItem {
  id: number;
  prize_won: string;
  created_at: string;
  door_name: string;
  prize_icon: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance_type: string;
  description: string;
  status: string;
  created_at: string;
}

interface UserKey {
  id: number;
  door_id: number;
  key_type: string;
  key_name: string;
  is_used: boolean;
  purchased_at: string;
  door_name: string;
}

const KEY_COLORS: Record<string, string> = {
  common: 'text-white/70 border-white/20',
  rare: 'text-blue-400 border-blue-400/30',
  epic: 'text-purple-400 border-purple-400/30',
  legendary: 'text-gold-400 border-gold-400/30',
};

const TX_LABELS: Record<string, string> = {
  deposit: 'Пополнение',
  key_purchase: 'Покупка ключа',
  referral_bonus: 'Реф. бонус',
  door_open_refund: 'Возврат',
};

export default function CabinetPage({ onGoAuth }: { onGoAuth: () => void }) {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myKeys, setMyKeys] = useState<UserKey[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', full_name: '', phone: '', birth_date: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositComment, setDepositComment] = useState('');
  const [depositMsg, setDepositMsg] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (user) setProfileForm({
      name: user.name,
      full_name: user.full_name || '',
      phone: user.phone || '',
      birth_date: user.birth_date || '',
    });
  }, [user]);

  useEffect(() => {
    api.content.getPaymentSettings().then((ps) => {
      const settings = ps as Record<string, { value: string }>;
      setQrUrl(settings?.qr_image_url?.value || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 2) {
      setLoadingHistory(true);
      api.content.history().then(h => setHistory(h as unknown as HistoryItem[])).catch(() => {}).finally(() => setLoadingHistory(false));
    }
    if (activeTab === 4) {
      setLoadingTx(true);
      api.content.getTransactions().then(t => setTransactions(t as unknown as Transaction[])).catch(() => {}).finally(() => setLoadingTx(false));
    }
    if (activeTab === 1) {
      setLoadingKeys(true);
      api.content.getMyKeys().then(k => setMyKeys(k as unknown as UserKey[])).catch(() => {}).finally(() => setLoadingKeys(false));
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
      await api.auth.updateProfile(profileForm);
      await refreshUser();
      setSaveMsg('Сохранено!');
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaveLoading(false);
    }
  };

  const requestDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount < 100) { setDepositMsg('Минимум 100 ₽'); return; }
    setDepositLoading(true);
    setDepositMsg('');
    try {
      const res = await api.content.requestDeposit(amount, depositComment);
      setDepositMsg((res as { message?: string }).message || 'Заявка отправлена');
      setDepositAmount(''); setDepositComment('');
    } catch (e: unknown) {
      setDepositMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setDepositLoading(false);
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-oswald text-2xl text-white font-bold truncate">{user.name}</h2>
              {user.role === 'admin' && (
                <span className="text-xs bg-gold-500/20 border border-gold-500/30 text-gold-400 rounded-full px-2 py-0.5 font-oswald flex-shrink-0">ADMIN</span>
              )}
            </div>
            <div className="text-white/40 text-sm font-rubik mb-1">{user.email}</div>
            {user.phone && <div className="text-white/30 text-xs font-rubik mb-2">{user.phone}</div>}
            <div className="flex items-center gap-2">
              <span className="text-xs border border-gold-500/40 bg-gold-500/10 text-gold-400 rounded-full px-3 py-0.5 font-oswald tracking-wider">👑 {user.level}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-32">
                <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full" style={{ width: `${user.level_progress}%` }} />
              </div>
            </div>
          </div>

          {/* Two balances */}
          <div className="flex flex-row sm:flex-col gap-3">
            <div className="card-glow rounded-xl px-4 py-3 text-center min-w-[110px]">
              <div className="text-xs text-white/40 uppercase tracking-wider font-rubik mb-1">Счёт</div>
              <div className="font-oswald text-xl text-gold-400 font-bold">{(user.external_balance || 0).toLocaleString()} ₽</div>
            </div>
            <div className="card-glow rounded-xl px-4 py-3 text-center min-w-[110px]" style={{ borderColor: 'rgba(74,222,128,0.2)' }}>
              <div className="text-xs text-green-400/70 uppercase tracking-wider font-rubik mb-1">Реф. бонусы</div>
              <div className="font-oswald text-xl text-green-400 font-bold">{(user.referral_balance || 0).toLocaleString()} ₽</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10 fade-up-2">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`flex-1 min-w-fit py-2 px-2 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all ${
                activeTab === i ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Обзор */}
        {activeTab === 0 && (
          <div className="space-y-4 fade-up-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: 'Key', label: 'Ключей куплено', value: String(user.keys_count) },
                { icon: 'KeyRound', label: 'Ключей доступно', value: String(user.keys_available || 0) },
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
            {user.full_name && (
              <div className="card-glow rounded-xl p-4">
                <div className="text-xs text-white/30 font-rubik uppercase tracking-wider mb-2">Данные аккаунта</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-rubik">
                  <div><span className="text-white/30">ФИО: </span><span className="text-white/80">{user.full_name}</span></div>
                  {user.phone && <div><span className="text-white/30">Телефон: </span><span className="text-white/80">{user.phone}</span></div>}
                  {user.birth_date && <div><span className="text-white/30">Дата рождения: </span><span className="text-white/80">{new Date(user.birth_date).toLocaleDateString('ru-RU')}</span></div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ключи */}
        {activeTab === 1 && (
          <div className="card-glow rounded-2xl overflow-hidden fade-up-3">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="font-oswald text-lg text-white tracking-wide">Мои ключи</h3>
            </div>
            {loadingKeys ? (
              <div className="text-center py-12 text-white/30 font-rubik">Загрузка...</div>
            ) : myKeys.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🗝</div>
                <div className="text-white/30 font-rubik text-sm">Ключей пока нет. Купите ключ на странице Дверей</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {myKeys.map(k => (
                  <div key={k.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl border rounded-lg p-2 ${KEY_COLORS[k.key_type] || KEY_COLORS.common}`}>🗝</div>
                      <div>
                        <div className={`font-oswald text-sm font-bold ${KEY_COLORS[k.key_type]?.split(' ')[0] || 'text-white/70'}`}>{k.key_name}</div>
                        <div className="text-xs text-white/30 font-rubik">{k.door_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {k.is_used ? (
                        <span className="text-xs text-white/30 font-rubik">Использован</span>
                      ) : (
                        <span className="text-xs text-green-400 font-rubik bg-green-400/10 px-2 py-0.5 rounded-full">Доступен</span>
                      )}
                      <div className="text-xs text-white/20 mt-0.5">{new Date(k.purchased_at).toLocaleDateString('ru-RU')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* История открытий */}
        {activeTab === 2 && (
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
        {activeTab === 3 && (
          <div className="space-y-4 fade-up-3">
            <div className="card-glow rounded-2xl p-6">
              <h3 className="font-oswald text-lg text-white mb-1 tracking-wide">Ваш реферальный код</h3>
              <p className="text-xs text-white/30 font-rubik mb-5">За каждого приглашённого — 10% с его первой покупки ключа</p>
              <div className="bg-black/40 border border-gold-500/20 rounded-xl px-4 py-3 mb-3 text-center">
                <div className="font-oswald text-2xl text-gold-400 tracking-widest">{user.referral_code}</div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-xs text-white/40 font-rubik truncate">{referralLink}</div>
                <button onClick={copyRef} className="btn-gold px-4 py-2 rounded-xl text-xs flex-shrink-0">
                  {copied ? '✓' : <Icon name="Copy" size={14} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-glow rounded-xl p-4 text-center">
                <div className="font-oswald text-2xl text-white font-bold">{user.referral_invited}</div>
                <div className="text-xs text-white/40 font-rubik mt-1">Приглашено</div>
              </div>
              <div className="card-glow rounded-xl p-4 text-center">
                <div className="font-oswald text-2xl text-green-400 font-bold">{user.referral_balance} ₽</div>
                <div className="text-xs text-white/40 font-rubik mt-1">Реф. бонусов</div>
              </div>
            </div>
          </div>
        )}

        {/* Баланс и транзакции */}
        {activeTab === 4 && (
          <div className="space-y-4 fade-up-3">
            {/* Балансы */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-glow rounded-xl p-5">
                <div className="text-xs text-white/40 uppercase tracking-wider font-rubik mb-2">Внешний счёт (с карты)</div>
                <div className="font-oswald text-3xl text-gold-400 font-bold mb-4">{(user.external_balance || 0).toLocaleString()} ₽</div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                      placeholder="Сумма (мин. 100 ₽)" min={100}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-rubik focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
                    <button onClick={requestDeposit} disabled={depositLoading}
                      className="btn-gold px-4 py-2 rounded-xl text-xs disabled:opacity-60">
                      {depositLoading ? '...' : 'Отправить заявку'}
                    </button>
                  </div>
                  <input value={depositComment} onChange={e => setDepositComment(e.target.value)}
                    placeholder="Комментарий (необязательно)" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-rubik focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
                </div>
                {depositMsg && <p className="text-xs mt-2 font-rubik" style={{ color: depositMsg.includes('Заявка') ? '#4ade80' : '#f87171' }}>{depositMsg}</p>}
                {qrUrl && (
                  <div className="mt-3">
                    <button onClick={() => setShowQr(!showQr)} className="flex items-center gap-2 text-xs text-gold-400 font-rubik hover:text-gold-300 transition-colors">
                      <Icon name="QrCode" size={14} />
                      {showQr ? 'Скрыть QR-код для оплаты' : 'Показать QR-код для оплаты'}
                    </button>
                    {showQr && (
                      <div className="mt-3 flex flex-col items-center gap-2 p-4 bg-white rounded-xl w-fit">
                        <img src={qrUrl} alt="QR-код для оплаты" className="w-48 h-48 object-contain" />
                        <p className="text-black text-xs font-rubik text-center">Сканируйте для оплаты</p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-white/20 mt-2 font-rubik">После оплаты отправьте заявку — администратор зачислит средства на счёт</p>
              </div>
              <div className="card-glow rounded-xl p-5" style={{ borderColor: 'rgba(74,222,128,0.15)' }}>
                <div className="text-xs text-green-400/70 uppercase tracking-wider font-rubik mb-2">Реф. бонусы (внутренний)</div>
                <div className="font-oswald text-3xl text-green-400 font-bold mb-2">{(user.referral_balance || 0).toLocaleString()} ₽</div>
                <p className="text-xs text-white/20 font-rubik">Начисляется за приглашённых пользователей</p>
              </div>
            </div>

            {/* История транзакций */}
            <div className="card-glow rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="font-oswald text-lg text-white tracking-wide">История транзакций</h3>
              </div>
              {loadingTx ? (
                <div className="text-center py-8 text-white/30 font-rubik">Загрузка...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-white/30 font-rubik text-sm">Транзакций пока нет</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="font-rubik text-sm text-white/80">{TX_LABELS[tx.type] || tx.type}</div>
                        <div className="text-xs text-white/30">{tx.description}</div>
                        <div className="text-xs text-white/20">{new Date(tx.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-oswald text-base font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ₽
                        </div>
                        <div className="text-xs text-white/30">{tx.balance_type === 'referral' ? 'Реф.' : 'Счёт'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Настройки */}
        {activeTab === 5 && (
          <div className="card-glow rounded-2xl p-6 fade-up-3">
            <h3 className="font-oswald text-lg text-white mb-5 tracking-wide">Настройки профиля</h3>
            <form onSubmit={saveProfile} className="space-y-4">
              {[
                { key: 'name', label: 'Отображаемое имя', placeholder: 'Александр', type: 'text' },
                { key: 'full_name', label: 'ФИО полностью', placeholder: 'Иванов Александр Петрович', type: 'text' },
                { key: 'phone', label: 'Телефон', placeholder: '+7 900 000-00-00', type: 'tel' },
                { key: 'birth_date', label: 'Дата рождения', placeholder: '', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{f.label}</label>
                  <input type={f.type} value={profileForm[f.key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
                </div>
              ))}
              {saveMsg && <p className={`text-sm font-rubik ${saveMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saveLoading} className="btn-gold px-8 py-3 rounded-xl text-sm disabled:opacity-60">
                  {saveLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => logout()} className="px-6 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-rubik hover:border-red-500/40 transition-colors">
                  Выйти
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}