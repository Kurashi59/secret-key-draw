import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const ADMIN_TABS = ['Двери', 'Тексты сайта', 'Контакты', 'Рефералы', 'Пользователи'];

interface Door { id: number; name: string; prize: string; prize_icon: string; key_price: number; rarity: string; keys_sold: number; is_active: boolean; }
interface SiteContent { [key: string]: { value: string; label: string } }
interface ContactsInfo { [key: string]: { value: string; label: string } }
interface AdminUser { id: number; name: string; email: string; phone: string; referral_code: string; balance: number; keys_count: number; is_blocked: boolean; created_at: string; }
interface RefAgent { id: number; name: string; referral_code: string; invited: number; earned: number; }

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card-glow rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
          <Icon name={icon} fallback="BarChart2" size={20} className="text-gold-400" />
        </div>
        <div className="text-xs text-white/40 font-rubik uppercase tracking-wider">{label}</div>
      </div>
      <div className="font-oswald text-2xl text-white font-bold">{value}</div>
    </div>
  );
}

export default function AdminPage({ onGoAuth }: { onGoAuth: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [doors, setDoors] = useState<Door[]>([]);
  const [editingDoor, setEditingDoor] = useState<number | null>(null);
  const [doorDraft, setDoorDraft] = useState<Partial<Door>>({});

  const [siteContent, setSiteContent] = useState<SiteContent>({});
  const [siteDraft, setSiteDraft] = useState<Record<string, string>>({});
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteMsg, setSiteMsg] = useState('');

  const [contacts, setContacts] = useState<ContactsInfo>({});
  const [contactsDraft, setContactsDraft] = useState<Record<string, string>>({});
  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsMsg, setContactsMsg] = useState('');

  const [refAgents, setRefAgents] = useState<RefAgent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ users: 0, opens: 0, revenue: 0, referrals: 0 });

  const [winner, setWinner] = useState<string | null>(null);
  const [raffleRunning, setRaffleRunning] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    Promise.all([
      api.content.getAllDoors(),
      api.content.getSite(),
      api.content.getContacts(),
      api.content.adminStats(),
    ]).then(([d, s, c, st]) => {
      setDoors(d);
      setSiteContent(s);
      setSiteDraft(Object.fromEntries(Object.entries(s).map(([k, v]: [string, unknown]) => [k, (v as {value:string}).value])));
      setContacts(c);
      setContactsDraft(Object.fromEntries(Object.entries(c).map(([k, v]: [string, unknown]) => [k, (v as {value:string}).value])));
      setStats(st);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (tab === 3) api.content.adminReferrals().then(setRefAgents).catch(() => {});
    if (tab === 4) api.content.adminUsers().then(setAdminUsers).catch(() => {});
  }, [tab, user]);

  if (!user) {
    return (
      <div className="min-h-screen grid-bg pt-32 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-6">🔐</div>
        <h2 className="font-oswald text-2xl text-white font-bold mb-3">Только для администраторов</h2>
        <button className="btn-gold px-10 py-3 rounded-xl text-sm" onClick={onGoAuth}>Войти</button>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen grid-bg pt-32 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-6">🚫</div>
        <h2 className="font-oswald text-2xl text-white font-bold mb-3">Нет доступа</h2>
        <p className="text-white/40 font-rubik">Эта страница только для администраторов</p>
      </div>
    );
  }

  const saveDoor = async (id: number) => {
    await api.content.updateDoor(id, doorDraft);
    const updated = await api.content.getAllDoors();
    setDoors(updated);
    setEditingDoor(null);
    setDoorDraft({});
  };

  const saveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiteSaving(true);
    setSiteMsg('');
    try {
      await api.content.updateSite(siteDraft);
      setSiteMsg('Сохранено! Изменения отображаются на сайте.');
    } catch (err: unknown) {
      setSiteMsg(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSiteSaving(false);
    }
  };

  const saveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactsSaving(true);
    setContactsMsg('');
    try {
      await api.content.updateContacts(contactsDraft);
      setContactsMsg('Контакты обновлены!');
    } catch (err: unknown) {
      setContactsMsg(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setContactsSaving(false);
    }
  };

  const toggleBlock = async (id: number, currently: boolean) => {
    await api.content.adminBlockUser(id, !currently);
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: !currently } : u));
  };

  const runRaffle = () => {
    setRaffleRunning(true);
    setWinner(null);
    setTimeout(() => {
      const active = adminUsers.filter(u => !u.is_blocked);
      if (active.length > 0) setWinner(active[Math.floor(Math.random() * active.length)].name);
      setRaffleRunning(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-up-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Shield" size={18} className="text-gold-400" />
              <span className="font-oswald text-xs text-gold-400 uppercase tracking-widest">Панель управления</span>
            </div>
            <h2 className="font-oswald text-3xl text-white font-bold">Администратор</h2>
          </div>
          <div className="card-glow rounded-xl px-4 py-2 text-sm text-white/60 font-rubik">
            {user.email}
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 fade-up-2">
            <StatCard icon="Users" label="Участников" value={String(stats.users)} />
            <StatCard icon="Key" label="Открытий" value={String(stats.opens)} />
            <StatCard icon="TrendingUp" label="Доход" value={`${stats.revenue.toLocaleString()} ₽`} />
            <StatCard icon="Share2" label="Реф. начислений" value={String(stats.referrals)} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10 overflow-x-auto fade-up-3">
          {ADMIN_TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`flex-shrink-0 py-2 px-4 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all whitespace-nowrap ${
                tab === i ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Двери */}
        {tab === 0 && (
          <div className="space-y-4">
            {doors.map(door => (
              <div key={door.id} className="card-glow rounded-xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{door.prize_icon}</span>
                    <div>
                      {editingDoor === door.id ? (
                        <input value={doorDraft.name ?? door.name}
                          onChange={e => setDoorDraft(p => ({ ...p, name: e.target.value }))}
                          className="bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1 text-white font-oswald text-sm focus:outline-none" />
                      ) : (
                        <div className="font-oswald text-base text-white font-semibold">{door.name}</div>
                      )}
                      <div className="text-xs text-white/30 mt-0.5">{door.rarity} · {door.keys_sold} продано</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      {editingDoor === door.id ? (
                        <input value={doorDraft.prize ?? door.prize}
                          onChange={e => setDoorDraft(p => ({ ...p, prize: e.target.value }))}
                          className="bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1 text-gold-400 font-oswald text-sm focus:outline-none w-28" placeholder="Приз" />
                      ) : (
                        <div className="font-oswald text-sm text-gold-400">{door.prize}</div>
                      )}
                      <div className="text-xs text-white/30">Приз</div>
                    </div>
                    <div className="text-center">
                      {editingDoor === door.id ? (
                        <input type="number" value={doorDraft.key_price ?? door.key_price}
                          onChange={e => setDoorDraft(p => ({ ...p, key_price: Number(e.target.value) }))}
                          className="bg-black/40 border border-gold-500/30 rounded-lg px-3 py-1 text-white font-oswald text-sm focus:outline-none w-20" />
                      ) : (
                        <div className="font-oswald text-sm text-white">{door.key_price} ₽</div>
                      )}
                      <div className="text-xs text-white/30">Цена ключа</div>
                    </div>
                    <button
                      onClick={() => editingDoor === door.id ? saveDoor(door.id) : (setEditingDoor(door.id), setDoorDraft({}))}
                      className={`px-4 py-2 rounded-lg text-xs font-oswald tracking-wider uppercase transition-all ${
                        editingDoor === door.id ? 'bg-green-600 text-white hover:bg-green-500' : 'border border-gold-500/30 text-gold-400 hover:border-gold-400'
                      }`}>
                      {editingDoor === door.id ? 'Сохранить' : 'Изменить'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Тексты сайта */}
        {tab === 1 && (
          <form onSubmit={saveSite} className="card-glow rounded-2xl p-6 space-y-5">
            <p className="text-sm text-white/40 font-rubik">Изменения применяются мгновенно — все посетители сайта сразу увидят новый текст</p>
            {Object.entries(siteContent).map(([key, item]) => (
              <div key={key}>
                <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{item.label}</label>
                <input value={siteDraft[key] ?? item.value}
                  onChange={e => setSiteDraft(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors" />
              </div>
            ))}
            {siteMsg && (
              <div className={`text-sm font-rubik ${siteMsg.includes('Сохранено') ? 'text-green-400' : 'text-red-400'}`}>{siteMsg}</div>
            )}
            <button type="submit" disabled={siteSaving} className="btn-gold px-8 py-3 rounded-xl text-sm">
              {siteSaving ? 'Сохраняем...' : 'Применить изменения'}
            </button>
          </form>
        )}

        {/* Контакты */}
        {tab === 2 && (
          <form onSubmit={saveContacts} className="card-glow rounded-2xl p-6 space-y-5">
            <p className="text-sm text-white/40 font-rubik">Адрес, телефон, email и ссылка на карту — всё обновляется мгновенно</p>
            {Object.entries(contacts).map(([key, item]) => (
              <div key={key}>
                <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{item.label}</label>
                <input value={contactsDraft[key] ?? item.value}
                  onChange={e => setContactsDraft(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors" />
              </div>
            ))}
            {contactsMsg && (
              <div className={`text-sm font-rubik ${contactsMsg.includes('обновлены') ? 'text-green-400' : 'text-red-400'}`}>{contactsMsg}</div>
            )}
            <button type="submit" disabled={contactsSaving} className="btn-gold px-8 py-3 rounded-xl text-sm">
              {contactsSaving ? 'Сохраняем...' : 'Сохранить контакты'}
            </button>
          </form>
        )}

        {/* Рефералы */}
        {tab === 3 && (
          <div className="card-glow rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="font-oswald text-lg text-white">Реферальная сеть</h3>
            </div>
            {refAgents.length === 0 ? (
              <div className="text-center py-12 text-white/30 font-rubik text-sm">Пока нет данных</div>
            ) : (
              <div className="divide-y divide-white/5">
                {refAgents.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                    <div>
                      <div className="font-rubik text-sm text-white/80">{ref.name}</div>
                      <div className="text-xs text-gold-400/70 font-oswald tracking-wider">{ref.referral_code}</div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="font-oswald text-sm text-white">{ref.invited}</div>
                        <div className="text-xs text-white/30">приглашено</div>
                      </div>
                      <div>
                        <div className="font-oswald text-sm text-gold-400">{Number(ref.earned).toLocaleString()} ₽</div>
                        <div className="text-xs text-white/30">заработано</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Пользователи */}
        {tab === 4 && (
          <div className="space-y-4">
            <div className="card-glow rounded-2xl p-6 text-center">
              <Icon name="Zap" size={36} className="text-gold-400 mx-auto mb-3" />
              <h3 className="font-oswald text-xl text-white font-bold mb-2">Случайный розыгрыш</h3>
              <button onClick={runRaffle} disabled={raffleRunning || adminUsers.length === 0}
                className="btn-gold px-10 py-3 rounded-xl text-sm disabled:opacity-50 mb-4">
                {raffleRunning ? '⏳ Выбираем...' : '🎲 Запустить'}
              </button>
              {winner && (
                <div className="mt-2">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-oswald text-xl text-gold-400 font-bold">{winner}</div>
                </div>
              )}
            </div>

            <div className="card-glow rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="font-oswald text-lg text-white">Все пользователи</h3>
              </div>
              {adminUsers.length === 0 ? (
                <div className="text-center py-12 text-white/30 font-rubik text-sm">Пока нет пользователей</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {adminUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${u.is_blocked ? 'bg-red-500' : 'bg-green-400'}`} />
                        <div>
                          <div className="font-rubik text-sm text-white/80">{u.name}</div>
                          <div className="text-xs text-white/30">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-gold-400 font-oswald">{u.referral_code}</div>
                        <button onClick={() => toggleBlock(u.id, u.is_blocked)}
                          className={`text-xs border rounded-lg px-3 py-1.5 font-oswald uppercase tracking-wider transition-all ${
                            u.is_blocked
                              ? 'border-green-500/30 text-green-400 hover:border-green-500/60'
                              : 'border-red-500/20 text-red-400 hover:border-red-500/40'
                          }`}>
                          {u.is_blocked ? 'Разблок' : 'Блок'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
