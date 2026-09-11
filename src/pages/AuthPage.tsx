import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface AuthPageProps {
  onSuccess: () => void;
  initialRef?: string;
}

export default function AuthPage({ onSuccess, initialRef = '' }: AuthPageProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'request'>('login');
  const [loginForm, setLoginForm] = useState({ member_number: '', password: '' });
  const [reqForm, setReqForm] = useState({ name: '', phone: '', comment: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (initialRef) setMode('request');
  }, [initialRef]);

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMsg('Выполняем вход...');
    try {
      await login(loginForm.member_number, loginForm.password);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      if (msg.includes('не отвечает') || msg.includes('подключиться')) {
        setError('Сервер запускается, попробуйте ещё раз через 5-10 секунд');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMsg('Отправляем заявку...');
    try {
      await api.content.submitRegistrationRequest({
        name: reqForm.name,
        phone: reqForm.phone,
        comment: reqForm.comment || undefined,
        referral_code: initialRef,
      });
      setRequestSent(true);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Ошибка');
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 pt-20 pb-10">
      <div className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(251,191,36,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md fade-up-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
              <span className="text-black font-bold text-sm font-oswald">GD</span>
            </div>
            <span className="font-oswald text-xl tracking-widest text-white uppercase">Golden Door</span>
          </div>
          <h2 className="font-oswald text-3xl text-white font-bold mb-1">
            {mode === 'login' ? 'Добро пожаловать' : 'Заявка на регистрацию'}
          </h2>
          <p className="text-white/40 font-rubik text-sm">
            {mode === 'login' ? 'Войди в свой личный кабинет' : 'Ваш наставник пригласил вас в проект'}
          </p>
        </div>

        <div className="animated-border rounded-2xl" style={{ background: 'linear-gradient(135deg, #0d1117, #111827)' }}>
          <div className="p-8">
            {!initialRef && (
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
                {(['login', 'request'] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(''); setRequestSent(false); }}
                    className={`flex-1 py-2 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all ${
                      mode === m ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
                    }`}>
                    {m === 'login' ? 'Вход' : 'Заявка'}
                  </button>
                ))}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-black font-rubik uppercase tracking-wider mb-2">Номер пайщика</label>
                  <input value={loginForm.member_number} onChange={e => setLoginForm(p => ({ ...p, member_number: e.target.value }))}
                    placeholder="1001" required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-black font-rubik uppercase tracking-wider mb-2">Пароль</label>
                  <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••" required className={inputCls} />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} className="text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm font-rubik">{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-gold w-full py-4 rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (loadingMsg || '⏳ Подключаемся...') : 'Войти'}
                </button>
                {loading && (
                  <p className="text-xs text-white/30 text-center font-rubik mt-1">
                    Первый запуск может занять до 15 секунд
                  </p>
                )}
                <p className="text-xs text-white/20 text-center mt-4 font-rubik leading-relaxed">
                  Логин и пароль выдаёт администратор при регистрации
                </p>
              </form>
            )}

            {mode === 'request' && !requestSent && (
              <form onSubmit={handleRequest} className="space-y-4">
                {initialRef && (
                  <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Icon name="Key" size={16} className="text-gold-500/60 flex-shrink-0" />
                    <span className="text-gold-300/80 text-xs font-rubik">Реферальный код наставника: <b className="text-gold-400">{initialRef}</b></span>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-black font-rubik uppercase tracking-wider mb-2">Ваше имя</label>
                  <input value={reqForm.name} onChange={e => setReqForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Александр" required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-black font-rubik uppercase tracking-wider mb-2">Телефон</label>
                  <input type="tel" value={reqForm.phone} onChange={e => setReqForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+7 900 000-00-00" required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-black font-rubik uppercase tracking-wider mb-2">
                    Комментарий <span className="text-black/50">(необязательно)</span>
                  </label>
                  <input value={reqForm.comment} onChange={e => setReqForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Сообщение наставнику" className={inputCls} />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} className="text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm font-rubik">{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-gold w-full py-4 rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (loadingMsg || '⏳ Отправляем...') : 'Отправить заявку'}
                </button>
                <p className="text-xs text-white/20 text-center mt-4 font-rubik leading-relaxed">
                  Заявку рассмотрит администратор. После проверки вам выдадут номер пайщика и пароль для входа
                </p>
              </form>
            )}

            {mode === 'request' && requestSent && (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-oswald text-lg text-white mb-2">Заявка отправлена</h3>
                <p className="text-white/40 font-rubik text-sm">Администратор свяжется с вами после проверки и выдаст данные для входа</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
