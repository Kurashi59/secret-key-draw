import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${6 + Math.random() * 6}s`,
  size: `${2 + Math.random() * 4}px`,
}));

const STATS = [
  { label: 'Участников', value: '12 847' },
  { label: 'Призов выдано', value: '4 320' },
  { label: 'Ключей продано', value: '38 091' },
  { label: 'Выплачено ₽', value: '7.2 млн' },
];

export default function HomePage() {
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGlowing(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen grid-bg overflow-hidden">
      {/* Particles */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-gold-400 opacity-0"
            style={{
              left: p.left,
              bottom: '-10px',
              width: p.size,
              height: p.size,
              animation: `particle-float ${p.duration} ${p.delay} ease-in infinite`,
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          opacity: glowing ? 1 : 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(251,191,36,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
        {/* Crown badge */}
        <div className="fade-up-1 mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-oswald tracking-widest uppercase">
          <Icon name="Crown" size={14} />
          Премиальный розыгрыш
        </div>

        {/* Title */}
        <h1 className="fade-up-2 font-oswald text-6xl md:text-8xl font-bold leading-none tracking-tight mb-4">
          <span className="text-shimmer">GOLDEN</span>
          <br />
          <span className="text-white/90">DOOR</span>
        </h1>

        <p className="fade-up-3 font-rubik text-lg md:text-xl text-white/50 max-w-xl mb-10 leading-relaxed">
          За каждой дверью — реальный приз. Купи ключ, открой дверь, <br className="hidden md:block" />
          забери выигрыш. Без лотереи. Без обмана.
        </p>

        {/* CTA Buttons */}
        <div className="fade-up-4 flex flex-col sm:flex-row gap-4 mb-16">
          <button className="btn-gold px-10 py-4 text-sm rounded-lg shadow-lg">
            Купить ключ
          </button>
          <button className="px-10 py-4 text-sm rounded-lg border border-gold-500/30 text-gold-300 font-oswald font-medium tracking-widest uppercase hover:border-gold-400 hover:text-gold-200 transition-all">
            Смотреть двери
          </button>
        </div>

        {/* Stats */}
        <div className="fade-up-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {STATS.map(s => (
            <div key={s.label} className="card-glow rounded-xl p-4 text-center">
              <div className="font-oswald text-2xl font-bold text-gold-400">{s.value}</div>
              <div className="font-rubik text-xs text-white/40 mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float opacity-40">
        <Icon name="ChevronDown" size={24} className="text-gold-400" />
      </div>
    </div>
  );
}
