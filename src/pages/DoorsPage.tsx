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
  color: string;
  is_trigger: boolean;
  key_name: string;
  prizes_total: number;
  prizes_left: number;
  is_unlocked: boolean;
}

interface UserKey {
  id: number;
  door_id: number;
  key_type: string;
  key_name: string;
  is_used: boolean;
}

const RARITY = {
  common: { label: 'Обычная', color: 'text-slate-400 border-slate-600', glow: 'rgba(100,116,139,0.4)' },
  rare: { label: 'Редкая', color: 'text-blue-400 border-blue-600', glow: 'rgba(59,130,246,0.4)' },
  epic: { label: 'Эпическая', color: 'text-purple-400 border-purple-600', glow: 'rgba(147,51,234,0.4)' },
  legendary: { label: 'Легендарная', color: 'text-gold-400 border-gold-600', glow: 'rgba(251,191,36,0.4)' },
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
  const [buyCooldown, setBuyCooldown] = useState(0);
  const rarity = RARITY[door.rarity] || RARITY.common;

  // Таймер кулдауна (10 секунд после покупки)
  useEffect(() => {
    if (buyCooldown <= 0) return;
    const timer = setTimeout(() => setBuyCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [buyCooldown]);

  const myKeys = userKeys.filter(k => k.door_id === door.id && !k.is_used);
  const hasKey = myKeys.length > 0;
  const canOpen = door.instant_open || !door.draw_at || new Date(door.draw_at).getTime() <= Date.now();
  const isLocked = !door.is_unlocked;

  const buyKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onNeedAuth(); return; }
    if (isLocked) { setMsg('Сначала откройте стартовую дверь'); return; }
    if (buyCooldown > 0) { setMsg(`Подождите ${buyCooldown} сек.`); return; }
    setLoading(true); setMsg('');
    try {
      const res = await api.content.buyKey(door.id);
      setMsg(`✓ ${(res as { key_name?: string }).key_name || 'Ключ'} куплен`);
      setBuyCooldown(10);
      await refreshUser();
      onBought();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Ошибка покупки');
    } finally { setLoading(false); }
  };

  const openDoor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onNeedAuth(); return; }
    if (!hasKey) { setMsg('Сначала купите ключ'); return; }
    if (!canOpen) { setMsg('Розыгрыш ещё не начался'); return; }
    if (opening || revealed) return;
    if (door.prizes_left === 0) { setMsg('Все призы разыграны'); return; }
    const key = myKeys[0];
    setOpening(true); setLoading(true); setMsg('');
    try {
      const res = await api.content.openDoor(door.id, key.id);
      const prize = (res as { prize?: string }).prize || 'Приз';
      setTimeout(() => {
        setWonPrize(prize);
        setRevealed(true);
        onOpened(prize);
        refreshUser();
        onBought();
      }, 1300);
    } catch (err: unknown) {
      setOpening(false);
      setMsg(err instanceof Error ? err.message : 'Ошибка открытия');
    } finally { setLoading(false); }
  };

  const doorColor = door.color || '#6b7280';

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ boxShadow: opening || revealed ? `0 0 40px ${rarity.glow}` : '0 4px 20px rgba(0,0,0,0.5)', opacity: isLocked ? 0.7 : 1 }}>

      {/* Дверь */}
      <div className="relative h-60" style={{ perspective: '1200px' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0"
          style={{ background: `linear-gradient(135deg, ${doorColor}88, ${doorColor}44)` }}>
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

        <div className="door-panel absolute top-0 left-0 w-1/2 h-full z-10"
          style={{
            background: `linear-gradient(135deg, ${doorColor}dd, ${doorColor}aa)`,
            borderRight: '1px solid rgba(0,0,0,0.3)',
            transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
            ...(opening || revealed ? { transform: 'perspective(1200px) rotateY(-110deg)', opacity: 0.3 } : {})
          }}>
          <div className="w-2 h-2 rounded-full bg-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="door-panel-right absolute top-0 right-0 w-1/2 h-full z-10"
          style={{
            background: `linear-gradient(135deg, ${doorColor}aa, ${doorColor}88)`,
            transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
            ...(opening || revealed ? { transform: 'perspective(1200px) rotateY(110deg)', opacity: 0.3 } : {})
          }} />

        {!opening && !revealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
            {isLocked ? (
              <>
                <Icon name="Lock" size={40} className="text-white/40" />
                <div className="font-oswald text-sm text-white/50 tracking-wider">{door.name}</div>
                <div className="text-xs text-white/30 font-rubik">Сначала откройте стартовую дверь</div>
              </>
            ) : (
              <>
                <div className="text-4xl">🚪</div>
                <div className="font-oswald text-sm text-white/80 tracking-wider">{door.name}</div>
                <div className={`text-xs border rounded-full px-3 py-0.5 font-rubik ${rarity.color}`}>{rarity.label}</div>
                {door.is_trigger && (
                  <div className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-full px-2 py-0.5 font-rubik">
                    Стартовая
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card-glow rounded-b-2xl px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-white/30 font-rubik">Ключ: {door.key_name || 'Стандартный'} · {door.key_price} ₽</div>
            {door.prizes_left !== undefined && (
              <div className="text-xs text-white/20 font-rubik">Призов: {door.prizes_left}</div>
            )}
          </div>
          {!door.instant_open && door.draw_at && <Countdown drawAt={door.draw_at} />}
        </div>

        {hasKey && (
          <div className="text-xs text-green-400 font-rubik bg-green-400/10 rounded-lg px-2 py-1 text-center">
            У вас {myKeys.length} ключ{myKeys.length > 1 ? 'а' : ''} для этой двери
          </div>
        )}

        {msg && (
          <div className={`text-xs font-rubik text-center rounded-lg px-2 py-1 ${msg.startsWith('✓') ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>{msg}</div>
        )}

        <div className="flex gap-2">
          <button onClick={buyKey} disabled={loading || isLocked || buyCooldown > 0}
            className="flex-1 py-2 rounded-lg text-xs font-oswald border border-white/20 text-white/60 hover:border-gold-500/40 hover:text-gold-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? '...' : isLocked ? '🔒 Заблокировано' : buyCooldown > 0 ? `⏳ ${buyCooldown}с` : 'Купить ключ'}
          </button>
          <button onClick={openDoor} disabled={loading || !hasKey || !canOpen || revealed || door.prizes_left === 0 || isLocked}
            className={`flex-1 py-2 rounded-lg text-xs font-oswald transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              hasKey && canOpen && !revealed && !isLocked ? 'btn-gold' : 'border border-white/10 text-white/30'
            }`}>
            {revealed ? 'Открыта' : !canOpen ? '⏳ Ждите' : 'Открыть'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoorsPage({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { user } = useAuth();
  const [doors, setDoors] = useState<Door[]>([]);
  const [triggerUnlocked, setTriggerUnlocked] = useState(false);
  const [userKeys, setUserKeys] = useState<UserKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [winMsg, setWinMsg] = useState('');

  const loadDoors = useCallback(() => {
    api.content.getDoors().then((res) => {
      const data = res as { doors: Door[]; trigger_unlocked: boolean };
      setDoors(data.doors || []);
      setTriggerUnlocked(data.trigger_unlocked || false);
    }).catch(() => {});
  }, []);

  const loadKeys = useCallback(() => {
    if (user) api.content.getMyKeys().then(k => setUserKeys(k as unknown as UserKey[])).catch(() => {});
  }, [user]);

  useEffect(() => {
    api.content.getDoors().then((res) => {
      const data = res as { doors: Door[]; trigger_unlocked: boolean };
      setDoors(data.doors || []);
      setTriggerUnlocked(data.trigger_unlocked || false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleBought = () => { loadDoors(); loadKeys(); };
  const handleOpened = (prize: string) => {
    setWinMsg(`🎉 Поздравляем! Вы выиграли: ${prize}`);
    loadDoors(); loadKeys();
    setTimeout(() => setWinMsg(''), 6000);
  };

  const triggerDoor = doors.find(d => d.is_trigger);
  const otherDoors = doors.filter(d => !d.is_trigger);

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

        {/* Подсказка о стартовой двери */}
        {!triggerUnlocked && triggerDoor && user && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-6 py-4 text-center">
            <p className="font-rubik text-sm text-blue-300">
              Сначала откройте стартовую дверь <span className="font-bold text-white">«{triggerDoor.name}»</span> — это разблокирует доступ ко всем остальным дверям
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-white/30 font-rubik">Загружаем двери...</div>
        ) : doors.length === 0 ? (
          <div className="text-center py-20 text-white/30 font-rubik">Двери пока не добавлены</div>
        ) : (
          <>
            {/* Стартовая дверь */}
            {triggerDoor && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-500/30" />
                  <span className="text-xs font-oswald text-gold-400 tracking-widest uppercase px-3">Стартовая дверь</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-500/30" />
                </div>
                <div className="max-w-sm mx-auto fade-up-2">
                  <DoorCard door={triggerDoor} userKeys={userKeys} onNeedAuth={onNeedAuth} onBought={handleBought} onOpened={handleOpened} />
                </div>
              </div>
            )}

            {/* Остальные двери */}
            {otherDoors.length > 0 && (
              <div>
                {triggerDoor && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-xs font-oswald text-white/30 tracking-widest uppercase px-3">
                      {triggerUnlocked ? 'Доступные двери' : '🔒 Заблокировано'}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherDoors.map((door, i) => (
                    <div key={door.id} style={{ animationDelay: `${i * 0.1}s` }} className="fade-up-2">
                      <DoorCard door={door} userKeys={userKeys} onNeedAuth={onNeedAuth} onBought={handleBought} onOpened={handleOpened} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}