import { useState, useEffect } from 'react';
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
}

const RARITY = {
  common: { label: 'Обычная', color: 'text-slate-400 border-slate-600', glow: 'rgba(100,116,139,0.4)', bg: 'from-slate-800 to-slate-700' },
  rare: { label: 'Редкая', color: 'text-blue-400 border-blue-600', glow: 'rgba(59,130,246,0.4)', bg: 'from-blue-900 to-blue-800' },
  epic: { label: 'Эпическая', color: 'text-purple-400 border-purple-600', glow: 'rgba(147,51,234,0.4)', bg: 'from-purple-900 to-purple-800' },
  legendary: { label: 'Легендарная', color: 'text-gold-400 border-gold-600', glow: 'rgba(251,191,36,0.4)', bg: 'from-yellow-900 to-amber-800' },
};

function DoorCard({ door, onNeedAuth }: { door: Door; onNeedAuth: () => void }) {
  const { user } = useAuth();
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const rarity = RARITY[door.rarity] || RARITY.common;

  const handleOpen = () => {
    if (opening || revealed) return;
    if (!user) { onNeedAuth(); return; }
    setOpening(true);
    setTimeout(() => setRevealed(true), 1300);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: opening || revealed ? `0 0 40px ${rarity.glow}` : '0 4px 20px rgba(0,0,0,0.5)' }}
      onClick={handleOpen}>
      <div className="relative h-72" style={{ perspective: '1200px' }}>
        {/* Prize behind door */}
        <div className={`absolute inset-0 bg-gradient-to-b ${rarity.bg} flex flex-col items-center justify-center z-0`}>
          {revealed ? (
            <div className="text-center" style={{ animation: 'prize-reveal 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
              <div className="text-6xl mb-3">{door.prize_icon}</div>
              <div className="font-oswald text-2xl text-white font-bold">{door.prize}</div>
              <div className="text-xs text-white/60 mt-1">Вы выиграли!</div>
            </div>
          ) : (
            <div className="text-center opacity-20"><Icon name="HelpCircle" size={64} className="text-white mx-auto" /></div>
          )}
        </div>

        {/* Left panel */}
        <div className={`door-panel absolute top-0 left-0 w-1/2 h-full z-10 bg-gradient-to-b ${rarity.bg} border-r border-black/30`}
          style={opening || revealed ? { transform: 'perspective(1200px) rotateY(-110deg)', opacity: 0.3 } : {}}>
          <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03))' }}>
            <div className="w-2 h-2 rounded-full bg-gold-400/30 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right panel */}
        <div className={`door-panel-right absolute top-0 right-0 w-1/2 h-full z-10 bg-gradient-to-b ${rarity.bg}`}
          style={opening || revealed ? { transform: 'perspective(1200px) rotateY(110deg)', opacity: 0.3 } : {}}>
          <div className="w-full h-full" style={{ background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.03))' }} />
        </div>

        {/* Closed overlay */}
        {!opening && !revealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="text-4xl transition-transform duration-300 group-hover:scale-110">🚪</div>
            <div className="font-oswald text-base text-white/80 tracking-wider">{door.name}</div>
            <div className={`text-xs border rounded-full px-3 py-0.5 font-rubik ${rarity.color}`}>{rarity.label}</div>
          </div>
        )}
      </div>

      <div className="card-glow rounded-b-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <div className="font-oswald text-sm text-white/50 uppercase tracking-wider mb-0.5">Ключ</div>
          <div className="font-oswald text-xl text-gold-400 font-bold">{door.key_price} ₽</div>
        </div>
        <button
          className={`btn-gold px-5 py-2 text-xs rounded-lg ${revealed ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={e => { e.stopPropagation(); handleOpen(); }}
          disabled={revealed}>
          {revealed ? 'Открыта' : !user ? 'Войти' : 'Открыть'}
        </button>
      </div>
    </div>
  );
}

export default function DoorsPage({ onNeedAuth }: { onNeedAuth: () => void }) {
  const [doors, setDoors] = useState<Door[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.content.getDoors()
      .then(setDoors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
            Каждая дверь — реальный приз. Кликни, чтобы открыть. Требуется ключ.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/30 font-rubik">Загружаем двери...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doors.map((door, i) => (
              <div key={door.id} style={{ animationDelay: `${i * 0.1}s` }} className="fade-up-2">
                <DoorCard door={door} onNeedAuth={onNeedAuth} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
