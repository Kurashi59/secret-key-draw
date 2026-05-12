import { useState } from 'react';
import Icon from '@/components/ui/icon';

const ADMIN_TABS = ['Двери и призы', 'Тексты сайта', 'Розыгрыши', 'Рефералы', 'Пользователи'];

const DOORS_DATA = [
  { id: 1, name: 'Дверь удачи', prize: '1 000 ₽', keyPrice: 99, keySold: 412, revenue: 40788, rarity: 'Обычная' },
  { id: 2, name: 'Синяя дверь', prize: 'iPhone 15', keyPrice: 499, keySold: 187, revenue: 93313, rarity: 'Редкая' },
  { id: 3, name: 'Фиолетовый зал', prize: 'MacBook Air', keyPrice: 999, keySold: 98, revenue: 97902, rarity: 'Эпическая' },
  { id: 4, name: 'Золотые врата', prize: '100 000 ₽', keyPrice: 1999, keySold: 42, revenue: 83958, rarity: 'Легендарная' },
];

const SITE_TEXTS = [
  { key: 'hero_title', label: 'Заголовок главной', value: 'GOLDEN DOOR' },
  { key: 'hero_subtitle', label: 'Подзаголовок', value: 'За каждой дверью — реальный приз' },
  { key: 'cta_button', label: 'Кнопка CTA', value: 'Купить ключ' },
  { key: 'about_text', label: 'О проекте (кратко)', value: 'Честный розыгрыш призов с открытием дверей' },
];

const REFERRALS = [
  { user: 'Alex P.', code: 'ALEX2024', invited: 14, earned: 1820, active: true },
  { user: 'Maria K.', code: 'MARIA99', invited: 31, earned: 4230, active: true },
  { user: 'Denis V.', code: 'DENIS007', invited: 7, earned: 690, active: false },
  { user: 'Olga R.', code: 'OLGA_VIP', invited: 52, earned: 8100, active: true },
];

const USERS = [
  { id: 1, name: 'Александр П.', email: 'alex@mail.ru', keys: 2, spent: 5400, wins: 3, status: 'active' },
  { id: 2, name: 'Мария К.', email: 'maria@gmail.com', keys: 5, spent: 12300, wins: 7, status: 'active' },
  { id: 3, name: 'Денис В.', email: 'denis@yandex.ru', keys: 0, spent: 990, wins: 1, status: 'blocked' },
  { id: 4, name: 'Ольга Р.', email: 'olga@mail.ru', keys: 8, spent: 34200, wins: 18, status: 'active' },
];

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="card-glow rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
          <Icon name={icon} fallback="BarChart2" size={20} className="text-gold-400" />
        </div>
        <div className="text-xs text-white/40 font-rubik uppercase tracking-wider">{label}</div>
      </div>
      <div className="font-oswald text-2xl text-white font-bold">{value}</div>
      {sub && <div className="text-xs text-green-400 mt-1 font-rubik">{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const [editingDoor, setEditingDoor] = useState<number | null>(null);
  const [doors, setDoors] = useState(DOORS_DATA);
  const [texts, setTexts] = useState(SITE_TEXTS);
  const [raffleRunning, setRaffleRunning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const updateDoor = (id: number, field: string, value: string) => {
    setDoors(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const updateText = (key: string, value: string) => {
    setTexts(prev => prev.map(t => t.key === key ? { ...t, value } : t));
  };

  const runRaffle = () => {
    setRaffleRunning(true);
    setWinner(null);
    setTimeout(() => {
      const names = USERS.filter(u => u.status === 'active').map(u => u.name);
      setWinner(names[Math.floor(Math.random() * names.length)]);
      setRaffleRunning(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Shield" size={20} className="text-gold-400" />
              <span className="font-oswald text-xs text-gold-400 uppercase tracking-widest">Панель управления</span>
            </div>
            <h2 className="font-oswald text-3xl text-white font-bold">Администратор</h2>
          </div>
          <div className="card-glow rounded-xl px-4 py-2 text-sm text-white/60 font-rubik">
            12 мая 2026
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="Users" label="Участников" value="12 847" sub="+243 за неделю" />
          <StatCard icon="Key" label="Ключей продано" value="38 091" sub="+1 204 за неделю" />
          <StatCard icon="TrendingUp" label="Доход (₽)" value="7.2 млн" sub="+8% к прошлой неделе" />
          <StatCard icon="Trophy" label="Призов выдано" value="4 320" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10 overflow-x-auto">
          {ADMIN_TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-shrink-0 py-2 px-4 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all whitespace-nowrap ${
                tab === i ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab: Двери и призы */}
        {tab === 0 && (
          <div className="space-y-4">
            {doors.map(door => (
              <div key={door.id} className="card-glow rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">🚪</div>
                    <div>
                      {editingDoor === door.id ? (
                        <input
                          value={door.name}
                          onChange={e => updateDoor(door.id, 'name', e.target.value)}
                          className="bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1 text-white font-oswald text-sm focus:outline-none"
                        />
                      ) : (
                        <div className="font-oswald text-base text-white font-semibold">{door.name}</div>
                      )}
                      <div className="text-xs text-white/30 mt-0.5">{door.rarity} · Продано: {door.keySold} ключей</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      {editingDoor === door.id ? (
                        <input
                          value={door.prize}
                          onChange={e => updateDoor(door.id, 'prize', e.target.value)}
                          className="bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1 text-gold-400 font-oswald text-sm focus:outline-none w-28"
                          placeholder="Приз"
                        />
                      ) : (
                        <div className="font-oswald text-sm text-gold-400">{door.prize}</div>
                      )}
                      <div className="text-xs text-white/30">Приз</div>
                    </div>
                    <div className="text-center">
                      {editingDoor === door.id ? (
                        <input
                          value={String(door.keyPrice)}
                          onChange={e => updateDoor(door.id, 'keyPrice', e.target.value)}
                          className="bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1 text-white font-oswald text-sm focus:outline-none w-20"
                          type="number"
                        />
                      ) : (
                        <div className="font-oswald text-sm text-white">{door.keyPrice} ₽</div>
                      )}
                      <div className="text-xs text-white/30">Цена ключа</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="font-oswald text-sm text-green-400">{door.revenue.toLocaleString()} ₽</div>
                      <div className="text-xs text-white/30">Доход</div>
                    </div>
                    <button
                      onClick={() => setEditingDoor(editingDoor === door.id ? null : door.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-oswald tracking-wider uppercase transition-all ${
                        editingDoor === door.id
                          ? 'bg-green-600 text-white hover:bg-green-500'
                          : 'border border-gold-500/30 text-gold-400 hover:border-gold-400'
                      }`}
                    >
                      {editingDoor === door.id ? 'Сохранить' : 'Изменить'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full card-glow rounded-xl py-4 border-dashed border-gold-500/20 text-gold-500/50 font-oswald text-sm uppercase tracking-widest hover:border-gold-400/40 hover:text-gold-400 transition-all flex items-center justify-center gap-2">
              <Icon name="Plus" size={16} />
              Добавить дверь
            </button>
          </div>
        )}

        {/* Tab: Тексты сайта */}
        {tab === 1 && (
          <div className="card-glow rounded-2xl p-6 space-y-5">
            <p className="text-sm text-white/40 font-rubik">Редактируй любой текст сайта — изменения применятся сразу</p>
            {texts.map(item => (
              <div key={item.key}>
                <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{item.label}</label>
                <div className="flex gap-3">
                  <input
                    value={item.value}
                    onChange={e => updateText(item.key, e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>
            ))}
            <button className="btn-gold px-8 py-3 rounded-xl text-sm mt-2">Применить изменения</button>
          </div>
        )}

        {/* Tab: Розыгрыши */}
        {tab === 2 && (
          <div className="space-y-6">
            <div className="card-glow rounded-2xl p-8 text-center">
              <Icon name="Zap" size={48} className="text-gold-400 mx-auto mb-4" />
              <h3 className="font-oswald text-2xl text-white font-bold mb-2">Запустить розыгрыш</h3>
              <p className="text-white/40 font-rubik text-sm mb-6 max-w-sm mx-auto">
                Случайный выбор победителя среди всех активных участников
              </p>
              <button
                onClick={runRaffle}
                disabled={raffleRunning}
                className="btn-gold px-12 py-4 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {raffleRunning ? '⏳ Выбираем победителя...' : '🎲 Запустить розыгрыш'}
              </button>
              {winner && (
                <div className="mt-8 animate-prize-reveal">
                  <div className="text-4xl mb-3">🏆</div>
                  <div className="font-oswald text-2xl text-gold-400 font-bold">{winner}</div>
                  <div className="text-sm text-white/40 mt-1 font-rubik">Победитель определён!</div>
                </div>
              )}
            </div>

            <div className="card-glow rounded-2xl p-6">
              <h3 className="font-oswald text-lg text-white mb-4">Статистика по дверям</h3>
              <div className="space-y-3">
                {doors.map(door => (
                  <div key={door.id} className="flex items-center gap-3">
                    <div className="text-sm text-white/60 font-rubik w-32 truncate">{door.name}</div>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-700 to-gold-400 rounded-full"
                        style={{ width: `${Math.min(100, (door.keySold / 500) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gold-400 font-oswald w-16 text-right">{door.keySold} ключей</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Рефералы */}
        {tab === 3 && (
          <div className="card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-oswald text-lg text-white">Реферальная сеть</h3>
              <div className="text-xs text-white/40 font-rubik">{REFERRALS.length} активных агентов</div>
            </div>
            <div className="divide-y divide-white/5">
              {REFERRALS.map(ref => (
                <div key={ref.code} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ref.active ? 'bg-green-400' : 'bg-white/20'}`} />
                    <div>
                      <div className="font-rubik text-sm text-white/80">{ref.user}</div>
                      <div className="text-xs text-gold-400/70 font-oswald tracking-wider">{ref.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="font-oswald text-sm text-white">{ref.invited}</div>
                      <div className="text-xs text-white/30">приглашено</div>
                    </div>
                    <div>
                      <div className="font-oswald text-sm text-gold-400">{ref.earned} ₽</div>
                      <div className="text-xs text-white/30">заработано</div>
                    </div>
                    <button className="text-xs border border-white/10 text-white/40 rounded-lg px-3 py-1.5 hover:border-white/20 hover:text-white/60 transition-all font-oswald uppercase tracking-wider">
                      Дерево
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Пользователи */}
        {tab === 4 && (
          <div className="card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-oswald text-lg text-white">Пользователи</h3>
              <input
                placeholder="Поиск..."
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/60 font-rubik focus:outline-none focus:border-gold-500/30 w-40"
              />
            </div>
            <div className="divide-y divide-white/5">
              {USERS.map(user => (
                <div key={user.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-rubik text-sm text-white/80">{user.name}</div>
                      <div className="text-xs text-white/30">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <div className="font-oswald text-sm text-white">{user.keys} 🗝</div>
                      <div className="text-xs text-white/30">ключей</div>
                    </div>
                    <div>
                      <div className="font-oswald text-sm text-gold-400">{user.spent.toLocaleString()} ₽</div>
                      <div className="text-xs text-white/30">потрачено</div>
                    </div>
                    <div>
                      <div className="font-oswald text-sm text-green-400">{user.wins}</div>
                      <div className="text-xs text-white/30">побед</div>
                    </div>
                    <button className="text-xs border border-white/10 text-white/40 rounded-lg px-3 py-1.5 hover:border-red-500/30 hover:text-red-400 transition-all font-oswald uppercase tracking-wider">
                      {user.status === 'active' ? 'Блок' : 'Разблок'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
