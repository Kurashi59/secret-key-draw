import Icon from '@/components/ui/icon';

const HOW_IT_WORKS = [
  { step: '01', icon: 'Key', title: 'Купи ключ', desc: 'Выбери дверь и приобрети ключ к ней. Каждый ключ — это гарантированный приз.' },
  { step: '02', icon: 'DoorOpen', title: 'Открой дверь', desc: 'Кликни на дверь — она откроется с анимацией. Твой приз ждёт внутри.' },
  { step: '03', icon: 'Gift', title: 'Получи приз', desc: 'Деньги — на счёт, товары — с доставкой. Всё честно и прозрачно.' },
  { step: '04', icon: 'Users', title: 'Приглашай друзей', desc: 'Зарабатывай 10% с каждой покупки ключа приглашёнными тобой людьми.' },
];

const FAQ = [
  { q: 'Это лотерея?', a: 'Нет. В лотерее можно ничего не выиграть. Здесь каждый ключ гарантирует реальный приз, указанный за дверью. Ты платишь — ты получаешь.' },
  { q: 'Как вы гарантируете честность?', a: 'Все призы определены заранее и зафиксированы в системе до начала продаж. Алгоритм открытия не зависит от нашего решения.' },
  { q: 'Как получить деньги?', a: 'Денежные призы выводятся на карту, СБП или криптокошелёк в течение 24 часов. Для товаров — оформляем доставку.' },
  { q: 'Можно ли купить несколько ключей?', a: 'Да, без ограничений. Для каждой двери можно купить несколько ключей — каждый принесёт приз.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="fade-up-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-oswald tracking-widest uppercase mb-6">
            <Icon name="Sparkles" size={14} />
            О проекте
          </div>
          <h2 className="fade-up-2 font-oswald text-5xl md:text-6xl text-white font-bold mb-6">
            Честный розыгрыш<br />
            <span className="text-shimmer">нового поколения</span>
          </h2>
          <p className="fade-up-3 font-rubik text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Golden Door — это не казино и не лотерея. Это прозрачная система, где каждая дверь скрывает реальный приз, а каждый ключ даёт гарантированный выигрыш.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <h3 className="font-oswald text-2xl text-white font-bold mb-8 text-center tracking-wide">
            Как это работает
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className="card-glow rounded-2xl p-6 flex gap-4"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <Icon name={item.icon} fallback="Star" size={22} className="text-gold-400" />
                  </div>
                </div>
                <div>
                  <div className="font-oswald text-xs text-gold-600 tracking-widest mb-1">ШАГ {item.step}</div>
                  <h4 className="font-oswald text-lg text-white font-semibold mb-2">{item.title}</h4>
                  <p className="font-rubik text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="animated-border rounded-2xl p-8 mb-20" style={{ background: 'linear-gradient(135deg, #0d1117, #111827)' }}>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { icon: '🔒', title: 'Честность', desc: 'Призы фиксированы до продаж' },
              { icon: '⚡', title: 'Мгновенно', desc: 'Выплата в течение 24 часов' },
              { icon: '🌐', title: 'Прозрачно', desc: 'Открытая статистика всех розыгрышей' },
            ].map(v => (
              <div key={v.title}>
                <div className="text-4xl mb-3">{v.icon}</div>
                <div className="font-oswald text-base text-white font-semibold mb-1">{v.title}</div>
                <div className="font-rubik text-xs text-white/40">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="font-oswald text-2xl text-white font-bold mb-8 text-center tracking-wide">
            Частые вопросы
          </h3>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="card-glow rounded-xl p-5">
                <div className="font-oswald text-base text-gold-300 font-medium mb-2">{item.q}</div>
                <div className="font-rubik text-sm text-white/50 leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
