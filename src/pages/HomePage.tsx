import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${6 + Math.random() * 6}s`,
  size: `${2 + Math.random() * 4}px`,
}));

interface SiteContent {
  hero_title?: { value: string };
  hero_subtitle?: { value: string };
  hero_cta?: { value: string };
  stats_participants?: { value: string };
  stats_prizes?: { value: string };
  stats_keys?: { value: string };
  stats_payouts?: { value: string };
}

export default function HomePage({ onGoToDoors }: { onGoToDoors: () => void }) {
  const [glowing, setGlowing] = useState(false);
  const [content, setContent] = useState<SiteContent>({});

  useEffect(() => {
    const t = setTimeout(() => setGlowing(true), 400);
    api.content.getSite().then(setContent).catch(() => {});
    return () => clearTimeout(t);
  }, []);

  const c = {
    title: content.hero_title?.value || 'GOLDEN DOOR',
    subtitle: content.hero_subtitle?.value || 'За каждой дверью — реальный приз. Купи ключ, открой дверь, забери выигрыш.',
    cta: content.hero_cta?.value || 'Купить ключ',
    participants: content.stats_participants?.value || '12 847',
    prizes: content.stats_prizes?.value || '4 320',
    keys: content.stats_keys?.value || '38 091',
    payouts: content.stats_payouts?.value || '7.2 млн',
  };

  const titleParts = c.title.split(' ');
  const titleFirst = titleParts[0];
  const titleRest = titleParts.slice(1).join(' ');

  return (
    <div className="relative min-h-screen grid-bg overflow-hidden">
      {/* Particles */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {PARTICLES.map(p => (
          <div key={p.id} className="absolute rounded-full bg-gold-400 opacity-0"
            style={{ left: p.left, bottom: '-10px', width: p.size, height: p.size,
              animation: `particle-float ${p.duration} ${p.delay} ease-in infinite` }} />
        ))}
      </div>

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: glowing ? 1 : 0, background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
        <div className="fade-up-1 mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-oswald tracking-widest uppercase">
          <Icon name="Crown" size={14} />
          Премиальный розыгрыш
        </div>

        <h1 className="fade-up-2 font-oswald text-6xl md:text-8xl font-bold leading-none tracking-tight mb-4">
          <span className="text-shimmer">{titleFirst}</span>
          {titleRest && <><br /><span className="text-white/90">{titleRest}</span></>}
        </h1>

        <p className="fade-up-3 font-rubik text-lg md:text-xl text-white/50 max-w-xl mb-10 leading-relaxed">
          {c.subtitle}
        </p>

        <div className="fade-up-4 flex flex-col sm:flex-row gap-4 mb-16">
          <button className="btn-gold px-10 py-4 text-sm rounded-lg shadow-lg" onClick={onGoToDoors}>
            {c.cta}
          </button>
          <button className="px-10 py-4 text-sm rounded-lg border border-gold-500/30 text-gold-300 font-oswald font-medium tracking-widest uppercase hover:border-gold-400 hover:text-gold-200 transition-all"
            onClick={onGoToDoors}>
            Смотреть двери
          </button>
        </div>

        {/* Stats */}
        <div className="fade-up-5 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { label: 'Участников', value: c.participants },
            { label: 'Призов выдано', value: c.prizes },
            { label: 'Ключей продано', value: c.keys },
            { label: 'Выплачено ₽', value: c.payouts },
          ].map(s => (
            <div key={s.label} className="card-glow rounded-xl p-4 text-center">
              <div className="font-oswald text-2xl font-bold text-gold-400">{s.value}</div>
              <div className="font-rubik text-xs text-white/40 mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float opacity-40">
        <Icon name="ChevronDown" size={24} className="text-gold-400" />
      </div>
    </div>
  );
}
