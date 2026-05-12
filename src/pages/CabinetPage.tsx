import { useState } from 'react';
import Icon from '@/components/ui/icon';

const USER = {
  name: 'Александр Петров',
  email: 'alex@example.com',
  balance: 3400,
  keys: 2,
  referralCode: 'ALEX2024',
  referralCount: 14,
  referralEarned: 1820,
  level: 'Золотой',
  levelProgress: 68,
};

const HISTORY = [
  { id: 1, date: '12.05.2026', door: 'Синяя дверь', result: 'iPhone 15', amount: '+49 500 ₽', win: true },
  { id: 2, date: '10.05.2026', door: 'Дверь удачи', result: '1 000 ₽', amount: '+1 000 ₽', win: true },
  { id: 3, date: '08.05.2026', door: 'Ночная дверь', result: 'Ключ куплен', amount: '-199 ₽', win: false },
  { id: 4, date: '05.05.2026', door: 'Рубиновый чертог', result: 'PlayStation 5', amount: '+34 990 ₽', win: true },
];

const TABS = ['Обзор', 'История', 'Рефералы', 'Настройки'];

export default function CabinetPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="card-glow rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
              <span className="font-oswald text-2xl text-black font-bold">АП</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#07090f]" />
          </div>
          <div className="flex-1">
            <h2 className="font-oswald text-2xl text-white font-bold">{USER.name}</h2>
            <div className="text-white/40 text-sm font-rubik mb-2">{USER.email}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs border border-gold-500/40 bg-gold-500/10 text-gold-400 rounded-full px-3 py-0.5 font-oswald tracking-wider">
                👑 {USER.level}
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-32">
                <div
                  className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                  style={{ width: `${USER.levelProgress}%` }}
                />
              </div>
              <span className="text-xs text-white/30">{USER.levelProgress}%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="card-glow rounded-xl px-5 py-3 text-center">
              <div className="font-oswald text-2xl text-gold-400 font-bold">{USER.balance.toLocaleString()} ₽</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">Баланс</div>
            </div>
            <div className="text-center">
              <span className="font-oswald text-lg text-white/70">🗝 {USER.keys} ключа</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 px-3 rounded-lg font-oswald text-sm tracking-wider uppercase transition-all ${
                activeTab === i
                  ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: 'Key', label: 'Открыто дверей', value: '18' },
              { icon: 'Trophy', label: 'Выиграно', value: '12' },
              { icon: 'Users', label: 'Рефералов', value: String(USER.referralCount) },
              { icon: 'TrendingUp', label: 'Реф. доход', value: `${USER.referralEarned} ₽` },
            ].map(item => (
              <div key={item.label} className="card-glow rounded-xl p-4 text-center">
                <Icon name={item.icon} fallback="Star" size={24} className="text-gold-400 mx-auto mb-2" />
                <div className="font-oswald text-xl text-white font-bold">{item.value}</div>
                <div className="text-xs text-white/40 mt-0.5 font-rubik">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 1 && (
          <div className="card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="font-oswald text-lg text-white tracking-wide">История открытий</h3>
            </div>
            <div className="divide-y divide-white/5">
              {HISTORY.map(item => (
                <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.win ? 'bg-green-400' : 'bg-white/20'}`} />
                    <div>
                      <div className="font-rubik text-sm text-white/80">{item.door}</div>
                      <div className="text-xs text-white/30">{item.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-oswald text-sm font-bold ${item.win ? 'text-green-400' : 'text-white/40'}`}>
                      {item.amount}
                    </div>
                    <div className="text-xs text-white/30">{item.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="card-glow rounded-2xl p-6">
              <h3 className="font-oswald text-lg text-white mb-4 tracking-wide">Ваш реферальный код</h3>
              <div className="flex gap-3">
                <div className="flex-1 bg-black/30 border border-gold-500/20 rounded-xl px-4 py-3 font-oswald text-xl text-gold-400 tracking-widest">
                  {USER.referralCode}
                </div>
                <button className="btn-gold px-5 rounded-xl text-sm">
                  Копировать
                </button>
              </div>
              <p className="text-sm text-white/30 mt-3 font-rubik">
                За каждого приглашённого — 10% с его первой покупки ключа
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-glow rounded-xl p-4 text-center">
                <div className="font-oswald text-2xl text-white font-bold">{USER.referralCount}</div>
                <div className="text-xs text-white/40 font-rubik mt-1">Приглашено</div>
              </div>
              <div className="card-glow rounded-xl p-4 text-center">
                <div className="font-oswald text-2xl text-gold-400 font-bold">{USER.referralEarned} ₽</div>
                <div className="text-xs text-white/40 font-rubik mt-1">Заработано</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="card-glow rounded-2xl p-6 space-y-5">
            <h3 className="font-oswald text-lg text-white tracking-wide">Настройки профиля</h3>
            {[
              { label: 'Имя', value: USER.name },
              { label: 'Email', value: USER.email },
              { label: 'Телефон', value: '+7 (900) 000-00-00' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">
                  {field.label}
                </label>
                <input
                  defaultValue={field.value}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
            ))}
            <button className="btn-gold w-full py-3 rounded-xl text-sm mt-2">
              Сохранить изменения
            </button>
          </div>
        )}
      </div>
    </div>
  );
}