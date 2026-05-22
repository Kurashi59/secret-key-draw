import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { TABS, HistoryItem, Transaction, UserKey } from './cabinet/CabinetTypes';
import { CabinetKeysTab, CabinetHistoryTab } from './cabinet/CabinetKeysHistory';
import { CabinetBalanceTab } from './cabinet/CabinetBalance';
import { CabinetReferralsTab, CabinetSettingsTab } from './cabinet/CabinetReferralsSettings';

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
  const [selectedProvider, setSelectedProvider] = useState<'yookassa' | 'sberbank' | 'tinkoff' | 'manual'>('yookassa');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      setActiveTab(4);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setPaymentSuccess(false), 6000);
    }
  }, []);

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
      if (selectedProvider === 'manual') {
        const res = await api.content.requestDeposit(amount, depositComment);
        setDepositMsg((res as { message?: string }).message || 'Заявка отправлена');
        setDepositAmount(''); setDepositComment('');
      } else {
        const returnUrl = `${window.location.origin}${window.location.pathname}?payment=success&tab=4`;
        const res = await api.payments.create(amount, selectedProvider, returnUrl);
        const data = res as { confirmation_url?: string };
        if (data.confirmation_url) {
          window.location.href = data.confirmation_url;
        }
      }
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
              <div className="text-xs text-green-400/70 uppercase tracking-wider font-rubik mb-1">Бонусы</div>
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
                { icon: 'Key',        label: 'Ключей куплено',  value: String(user.keys_count) },
                { icon: 'KeyRound',   label: 'Ключей доступно', value: String(user.keys_available || 0) },
                { icon: 'Users',      label: 'Рефералов',       value: String(user.referral_invited) },
                { icon: 'TrendingUp', label: 'Реф. доход',      value: `${user.referral_earned} ₽` },
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
          <CabinetKeysTab loading={loadingKeys} myKeys={myKeys} />
        )}

        {/* История открытий */}
        {activeTab === 2 && (
          <CabinetHistoryTab loading={loadingHistory} history={history} />
        )}

        {/* Рефералы */}
        {activeTab === 3 && (
          <CabinetReferralsTab
            referralCode={user.referral_code}
            referralLink={referralLink}
            referralInvited={user.referral_invited}
            referralBalance={user.referral_balance}
            copied={copied}
            onCopy={copyRef}
          />
        )}

        {/* Баланс и транзакции */}
        {activeTab === 4 && (
          <CabinetBalanceTab
            externalBalance={user.external_balance}
            referralBalance={user.referral_balance}
            paymentSuccess={paymentSuccess}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            depositAmount={depositAmount}
            onDepositAmountChange={setDepositAmount}
            depositComment={depositComment}
            onDepositCommentChange={setDepositComment}
            depositMsg={depositMsg}
            depositLoading={depositLoading}
            onRequestDeposit={requestDeposit}
            qrUrl={qrUrl}
            showQr={showQr}
            onToggleQr={() => setShowQr(v => !v)}
            loadingTx={loadingTx}
            transactions={transactions}
          />
        )}

        {/* Настройки */}
        {activeTab === 5 && (
          <CabinetSettingsTab
            profileForm={profileForm}
            onProfileChange={patch => setProfileForm(prev => ({ ...prev, ...patch }))}
            saveLoading={saveLoading}
            saveMsg={saveMsg}
            onSave={saveProfile}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  );
}
