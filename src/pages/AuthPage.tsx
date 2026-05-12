import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/icon';

interface AuthPageProps {
  onSuccess: () => void;
  initialRef?: string;
}

export default function AuthPage({ onSuccess, initialRef = '' }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', referral_code: initialRef });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRef) setMode('register');
  }, [initialRef]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.referral_code || undefined);
      }
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 pt-20">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(251,191,36,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md fade-up-1">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
              <span className="text-black font-bold text-sm font-oswald">GD</span>
            </div>
            <span className="font-oswald text-xl tracking-widest text-white uppercase">Golden Door</span>
          </div>
          <h2 className="font-oswald text-3xl text-white font-bold mb-1">
            {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
          </h2>
          <p className="text-white/40 font-rubik text-sm">
            {mode === 'login' ? 'Войди в свой личный кабинет' : 'Зарегистрируйся и начни открывать двери'}
          </p>
        </div>

        {/* Card */}
        <div className="animated-border rounded-2xl" style={{ background: 'linear-gradient(135deg, #0d1117, #111827)' }}>
          <div className="p-8">
            {/* Tab switch */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all ${
                    mode === m ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {m === 'login' ? 'Вход' : 'Регистрация'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Имя</label>
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Александр"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="alex@mail.ru"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Пароль</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">
                    Реферальный код <span className="text-gold-600/70">(обязателен)</span>
                  </label>
                  <div className="relative">
                    <input
                      value={form.referral_code}
                      onChange={e => set('referral_code', e.target.value.toUpperCase())}
                      placeholder="ALEX1234"
                      required
                      className="w-full bg-black/40 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-300 font-oswald tracking-widest text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-gold-800/60"
                    />
                    <Icon name="Key" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-600/50" />
                  </div>
                  <p className="text-xs text-white/30 mt-1.5 font-rubik">
                    Попросите реферальный код у пригласившего вас участника
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} className="text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm font-rubik">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-4 rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </button>
            </form>

            {mode === 'register' && (
              <p className="text-xs text-white/20 text-center mt-4 font-rubik leading-relaxed">
                Регистрируясь, вы соглашаетесь с условиями использования сервиса
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
