import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/icon';

interface Door {
  id: number;
  name: string;
  prize: string;
  prize_icon: string;
  key_price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  keys_sold: number;
  is_active: boolean;
  draw_at: string | null;
  instant_open: boolean;
  key_type: string;
  prizes_total: number;
  prizes_left: number;
}

interface UserKey {
  id: number;
  door_id: number;
  key_type: string;
  key_name: string;
  is_used: boolean;
}

const RARITY = {
  common: { label: 'Обычная', color: 'text-slate-400 border-slate-600', glow: 'rgba(100,116,139,0.4)', bg: 'from-slate-800 to-slate-700' },
  rare: { label: 'Редкая', color: 'text-blue-400 border-blue-600', glow: 'rgba(59,130,246,0.4)', bg: 'from-blue-900 to-blue-800' },
  epic: { label: 'Эпическая', color: 'text-purple-400 border-purple-600', glow: 'rgba(147,51,234,0.4)', bg: 'from-purple-900 to-purple-800' },
  legendary: { label: 'Легендарная', color: 'text-gold-400 border-gold-600', glow: 'rgba(251,191,36,0.4)', bg: 'from-yellow-900 to-amber-800' },
};

function Countdown({ drawAt }: { drawAt: string }) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(drawAt).getTime() - Date.now();
      if (diff <= 0) { setLeft('Розыгрыш!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(d > 0 ? `${d}д ${h}ч ${m}м` : `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [drawAt]);
  return (
    <div className="flex items-center gap-1.5 bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1.5">
      <Icon name="Clock" size={12} className="text-gold-400" />
      <span className="font-oswald text-xs text-gold-400 tracking-wider">{left}</span>
    </div>
  );
}

function DoorCard({
  door, userKeys, onNeedAuth, onBought, onOpened,
}: {
  door: Door;
  userKeys: UserKey[];
  onNeedAuth: () => void;
  onBought: () => void;
  onOpened: (prize: string) => void;
}) {
  const { user, refreshUser } = useAuth();
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [wonPrize, setWonPrize] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const rarity = RARITY[door.rarity] || RARITY.common;

  const myKeys = userKeys.filter(k => k.door_id === door.id && !k.is_used);
  const hasKey = myKeys.length > 0;

  // Is draw time reached?
  const canOpen = door.instant_open || !door.draw_at || new Date(door.draw_at).getTime() <= Date.now();

  const buyKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onNeedAuth(); return; }
    setLoading(true);
    setMsg('');
    try {
      const res = await api.content.buyKey(door.id);
      setMsg(`✓ ${res.key_name} куплен`);
      await refreshUser();
      onBought();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Ошибка покупки');
    } finally {
      setLoading(false);
    }
  };

  const openDoor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onNeedAuth(); return; }
    if (!hasKey) { setMsg('Сначала купите ключ'); return; }
    if (!canOpen) { setMsg('Розыгрыш ещё не начался'); return; }
    if (opening || revealed) return;
    if (door.prizes_left === 0) { setMsg('Все призы разыграны'); return; }
    const key = myKeys[0];
    setOpening(true);
    setLoading(true);
    setMsg('');
    try {
      const res = await api.content.openDoor(door.id, key.id);
      setTimeout(() => {
        setWonPrize(res.prize);
        setRevealed(true);
        onOpened(res.prize);
        refreshUser();
        onBought();
      }, 1300);
    } catch (err: unknown) {
      setOpening(false);
      setMsg(err instanceof Error ? err.message : 'Ошибка открытия');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ boxShadow: opening || revealed ? `0 0 40px ${rarity.glow}` : '0 4px 20px rgba(0,0,0,0.5)' }}>

      <div className="relative h-60" style={{ perspective: '1200px' }}>
        <div className={`absolute inset-0 bg-gradient-to-b ${rarity.bg} flex flex-col items-center justify-center z-0`}>
          {revealed ? (
            <div className="text-center" style={{ animation: 'prize-reveal 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
              <div className="text-5xl mb-2">{door.prize_icon}</div>
              <div className="font-oswald text-xl text-white font-bold">{wonPrize}</div>
              <div className="text-xs text-white/60 mt-1">Вы выиграли!</div>
            </div>
          ) : (
            <div className="text-center opacity-20"><Icon name="HelpCircle" size={56} className="text-white mx-auto" /></div>
          )}
        </div>

        <div className={`door-panel absolute top-0 left-0 w-1/2 h-full z-10 bg-gradient-to-b ${rarity.bg} border-r border-black/30`}
          style={{ transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)', ...(opening || revealed ? { transform: 'perspective(1200px) rotateY(-110deg)', opacity: 0.3 } : {}) }}>
          <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03))' }}>
            <div className="w-2 h-2 rounded-full bg-gold-400/30 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className={`door-panel-right absolute top-0 right-0 w-1/2 h-full z-10 bg-gradient-to-b ${rarity.bg}`}
          style={{ transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)', ...(opening || revealed ? { transform: 'perspective(1200px) rotateY(110deg)', opacity: 0.3 } : {}) }}>
          <div className="w-full h-full" style={{ background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.03))' }} />
        </div>

        {!opening && !revealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="text-4xl">🚪</div>
            <div className="font-oswald text-sm text-white/80 tracking-wider">{door.name}</div>
            <div className={`text-xs border rounded-full px-3 py-0.5 font-rubik ${rarity.color}`}>{rarity.label}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card-glow rounded-b-2xl px-4 py-3 space-y-3">
        {/* Countdown / info */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-white/30 font-rubik">Ключ: {door.key_price} ₽</div>
            {door.prizes_left !== undefined && (
              <div className="text-xs text-white/20 font-rubik">Призов: {door.prizes_left}</div>
            )}
          </div>
          {!door.instant_open && door.draw_at && <Countdown drawAt={door.draw_at} />}
        </div>

        {/* Key status */}
        {hasKey && (
          <div className="text-xs text-green-400 font-rubik bg-green-400/10 rounded-lg px-2 py-1 text-center">
            У вас {myKeys.length} ключ{myKeys.length > 1 ? 'а' : ''} для этой двери
          </div>
        )}

        {msg && (
          <div className={`text-xs font-rubik text-center rounded-lg px-2 py-1 ${msg.startsWith('✓') ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>{msg}</div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button onClick={buyKey} disabled={loading}
            className="flex-1 py-2 rounded-lg text-xs font-oswald border border-white/20 text-white/60 hover:border-gold-500/40 hover:text-gold-400 transition-colors disabled:opacity-50">
            {loading ? '...' : `Купить ключ`}
          </button>
          <button onClick={openDoor} disabled={loading || !hasKey || !canOpen || revealed || door.prizes_left === 0}
            className={`flex-1 py-2 rounded-lg text-xs font-oswald transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              hasKey && canOpen && !revealed ? 'btn-gold' : 'border border-white/10 text-white/30'
            }`}>
            {revealed ? 'Открыта' : !canOpen ? '🔒 Ждите' : 'Открыть'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoorsPage({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { user } = useAuth();
  const [doors, setDoors] = useState<Door[]>([]);
  const [userKeys, setUserKeys] = useState<UserKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [winMsg, setWinMsg] = useState('');

  const loadDoors = useCallback(() => {
    api.content.getDoors().then(setDoors).catch(() => {});
  }, []);

  const loadKeys = useCallback(() => {
    if (user) api.content.getMyKeys().then(setUserKeys).catch(() => {});
  }, [user]);

  useEffect(() => {
    api.content.getDoors()
      .then(setDoors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleBought = () => { loadDoors(); loadKeys(); };
  const handleOpened = (prize: string) => {
    setWinMsg(`🎉 Поздравляем! Вы выиграли: ${prize}`);
    setTimeout(() => setWinMsg(''), 6000);
  };

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="fade-up-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-oswald tracking-widest uppercase mb-4">
            <Icon name="DoorOpen" size={14} />
            Все двери
          </div>
          <h2 className="fade-up-2 font-oswald text-4xl md:text-5xl text-white font-bold mb-3">
            Выбери <span className="text-shimmer">свою дверь</span>
          </h2>
          <p className="fade-up-3 text-white/40 font-rubik max-w-md mx-auto">
            Купите ключ, дождитесь розыгрыша и откройте дверь — внутри реальный приз
          </p>
        </div>

        {winMsg && (
          <div className="mb-6 bg-gold-500/10 border border-gold-500/30 rounded-2xl px-6 py-4 text-center fade-up-1">
            <p className="font-oswald text-lg text-gold-400">{winMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-white/30 font-rubik">Загружаем двери...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doors.map((door, i) => (
              <div key={door.id} style={{ animationDelay: `${i * 0.1}s` }} className="fade-up-2">
                <DoorCard
                  door={door}
                  userKeys={userKeys}
                  onNeedAuth={onNeedAuth}
                  onBought={handleBought}
                  onOpened={handleOpened}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
