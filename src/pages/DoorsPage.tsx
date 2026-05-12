import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Door {
  id: number;
  name: string;
  prize: string;
  prizeIcon: string;
  keyPrice: number;
  color: string;
  glow: string;
  opened: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const RARITY_LABELS = {
  common: { label: 'Обычная', color: 'text-slate-400 border-slate-600' },
  rare: { label: 'Редкая', color: 'text-blue-400 border-blue-600' },
  epic: { label: 'Эпическая', color: 'text-purple-400 border-purple-600' },
  legendary: { label: 'Легендарная', color: 'text-gold-400 border-gold-600' },
};

const INITIAL_DOORS: Door[] = [
  { id: 1, name: 'Дверь удачи', prize: '1 000 ₽', prizeIcon: '💰', keyPrice: 99, color: 'from-slate-800 to-slate-700', glow: 'rgba(100,116,139,0.4)', opened: false, rarity: 'common' },
  { id: 2, name: 'Синяя дверь', prize: 'iPhone 15', prizeIcon: '📱', keyPrice: 499, color: 'from-blue-900 to-blue-800', glow: 'rgba(59,130,246,0.4)', opened: false, rarity: 'rare' },
  { id: 3, name: 'Фиолетовый зал', prize: 'MacBook Air', prizeIcon: '💻', keyPrice: 999, color: 'from-purple-900 to-purple-800', glow: 'rgba(147,51,234,0.4)', opened: false, rarity: 'epic' },
  { id: 4, name: 'Золотые врата', prize: '100 000 ₽', prizeIcon: '👑', keyPrice: 1999, color: 'from-yellow-900 to-amber-800', glow: 'rgba(251,191,36,0.4)', opened: false, rarity: 'legendary' },
  { id: 5, name: 'Ночная дверь', prize: '5 000 ₽', prizeIcon: '🌙', keyPrice: 199, color: 'from-indigo-900 to-slate-800', glow: 'rgba(99,102,241,0.4)', opened: false, rarity: 'common' },
  { id: 6, name: 'Рубиновый чертог', prize: 'PlayStation 5', prizeIcon: '🎮', keyPrice: 799, color: 'from-red-900 to-rose-800', glow: 'rgba(239,68,68,0.4)', opened: false, rarity: 'epic' },
];

function DoorCard({ door, onOpen }: { door: Door; onOpen: (id: number) => void }) {
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const rarity = RARITY_LABELS[door.rarity];

  const handleOpen = () => {
    if (door.opened || opening) return;
    setOpening(true);
    setTimeout(() => {
      setRevealed(true);
      onOpen(door.id);
    }, 1300);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: opening || door.opened ? `0 0 40px ${door.glow}` : '0 4px 20px rgba(0,0,0,0.5)' }}
      onClick={handleOpen}
    >
      {/* Door wrapper */}
      <div className="relative h-72" style={{ perspective: '1200px' }}>
        {/* Prize behind door */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${door.color} flex flex-col items-center justify-center z-0`}
        >
          {revealed && (
            <div className="text-center animate-prize-reveal">
              <div className="text-6xl mb-3">{door.prizeIcon}</div>
              <div className="font-oswald text-2xl text-white font-bold">{door.prize}</div>
              <div className="text-xs text-white/60 mt-1">Вы выиграли!</div>
            </div>
          )}
          {!revealed && (
            <div className="text-center opacity-20">
              <Icon name="HelpCircle" size={64} className="text-white mx-auto" />
            </div>
          )}
        </div>

        {/* Left panel */}
        <div
          className={`door-panel absolute top-0 left-0 w-1/2 h-full z-10 bg-gradient-to-b ${door.color} border-r border-black/30`}
          style={opening || door.opened ? { transform: 'perspective(1200px) rotateY(-110deg)', opacity: 0.3 } : {}}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gold-400/30 absolute right-3 top-1/2 -translate-y-1/2" />
            <div className="w-full h-full border-r-2 border-black/20" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03))' }} />
          </div>
        </div>

        {/* Right panel */}
        <div
          className={`door-panel-right absolute top-0 right-0 w-1/2 h-full z-10 bg-gradient-to-b ${door.color}`}
          style={opening || door.opened ? { transform: 'perspective(1200px) rotateY(110deg)', opacity: 0.3 } : {}}
        >
          <div className="w-full h-full" style={{ background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.03))' }} />
        </div>

        {/* Door front overlay when closed */}
        {!opening && !door.opened && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className={`text-4xl transition-transform duration-300 group-hover:scale-110`}>🚪</div>
            <div className="font-oswald text-base text-white/80 tracking-wider">{door.name}</div>
            <div className={`text-xs border rounded-full px-3 py-0.5 font-rubik ${rarity.color}`}>{rarity.label}</div>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="card-glow rounded-b-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <div className="font-oswald text-sm text-white/50 uppercase tracking-wider mb-0.5">Ключ</div>
          <div className="font-oswald text-xl text-gold-400 font-bold">{door.keyPrice} ₽</div>
        </div>
        <button
          className={`btn-gold px-5 py-2 text-xs rounded-lg ${door.opened ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={e => { e.stopPropagation(); handleOpen(); }}
          disabled={door.opened}
        >
          {door.opened ? 'Открыта' : 'Открыть'}
        </button>
      </div>
    </div>
  );
}

export default function DoorsPage() {
  const [doors, setDoors] = useState(INITIAL_DOORS);

  const handleOpen = (id: number) => {
    setDoors(prev => prev.map(d => d.id === id ? { ...d, opened: true } : d));
  };

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Doors grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doors.map((door, i) => (
            <div key={door.id} style={{ animationDelay: `${i * 0.1}s` }} className="fade-up-2">
              <DoorCard door={door} onOpen={handleOpen} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
