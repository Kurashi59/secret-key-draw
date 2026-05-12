import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface ContactsData {
  email?: { value: string };
  phone?: { value: string };
  telegram?: { value: string };
  address?: { value: string };
  work_hours?: { value: string };
  map_url?: { value: string };
}

export default function ContactsPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [contacts, setContacts] = useState<ContactsData>({});

  useEffect(() => {
    api.content.getContacts().then(setContacts).catch(() => {});
  }, []);

  const contactLinks = [
    { icon: 'Mail', label: 'Email', value: contacts.email?.value || '...', link: `mailto:${contacts.email?.value || ''}` },
    { icon: 'MessageCircle', label: 'Telegram', value: contacts.telegram?.value || '...', link: `https://t.me/${(contacts.telegram?.value || '').replace('@', '')}` },
    { icon: 'Phone', label: 'Телефон', value: contacts.phone?.value || '...', link: `tel:${contacts.phone?.value || ''}` },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="fade-up-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-oswald tracking-widest uppercase mb-4">
            <Icon name="MessageSquare" size={14} />
            Контакты
          </div>
          <h2 className="fade-up-2 font-oswald text-5xl text-white font-bold mb-3">Напиши нам</h2>
          <p className="fade-up-3 font-rubik text-white/40 text-base max-w-md mx-auto">
            Ответим в течение часа в рабочие дни. По срочным вопросам — в Telegram.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="card-glow rounded-2xl p-6">
            {sent ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-oswald text-xl text-white font-bold mb-2">Сообщение отправлено!</h3>
                <p className="text-white/40 font-rubik text-sm">Мы ответим в ближайшее время</p>
                <button onClick={() => setSent(false)} className="mt-6 text-gold-400 text-sm font-rubik underline hover:text-gold-300">
                  Отправить ещё
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-oswald text-lg text-white tracking-wide mb-5">Обратная связь</h3>
                {[
                  { key: 'name', label: 'Ваше имя', placeholder: 'Александр' },
                  { key: 'email', label: 'Email', placeholder: 'alex@mail.ru' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{field.label}</label>
                    <input
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Сообщение</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Опишите ваш вопрос..."
                    rows={4}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors resize-none placeholder-white/20"
                  />
                </div>
                <button type="submit" className="btn-gold w-full py-3 rounded-xl text-sm mt-2">
                  Отправить сообщение
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            {contactLinks.map(c => (
              <a key={c.label} href={c.link} className="card-glow rounded-xl p-5 flex items-center gap-4 block no-underline">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name={c.icon} fallback="Mail" size={22} className="text-gold-400" />
                </div>
                <div>
                  <div className="text-xs text-white/30 font-rubik uppercase tracking-wider mb-0.5">{c.label}</div>
                  <div className="font-oswald text-base text-white/80">{c.value}</div>
                </div>
                <Icon name="ArrowRight" size={18} className="text-white/20 ml-auto" />
              </a>
            ))}

            {/* Address */}
            {contacts.address && (
              <div className="card-glow rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="MapPin" size={22} className="text-gold-400" />
                </div>
                <div>
                  <div className="text-xs text-white/30 font-rubik uppercase tracking-wider mb-0.5">Адрес</div>
                  <div className="font-oswald text-base text-white/80">{contacts.address.value}</div>
                </div>
                {contacts.map_url && (
                  <a href={contacts.map_url.value} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    <Icon name="ExternalLink" size={16} className="text-white/20 hover:text-gold-400 transition-colors" />
                  </a>
                )}
              </div>
            )}

            {/* Work hours */}
            <div className="card-glow rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <Icon name="Clock" size={22} className="text-gold-400" />
                </div>
                <div>
                  <div className="text-xs text-white/30 font-rubik uppercase tracking-wider mb-0.5">Режим работы</div>
                  <div className="font-oswald text-base text-white/80">{contacts.work_hours?.value || 'Пн–Пт, 9:00–21:00'}</div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-rubik">Сейчас онлайн</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
