import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const ADMIN_TABS = ['Обзор', 'Двери', 'Тексты сайта', 'Контакты', 'Пользователи', 'Рефералы', 'Заявки'];

interface Door {
  id: number; name: string; prize: string; prize_icon: string;
  key_price: number; rarity: string; keys_sold: number; is_active: boolean;
  draw_at: string | null; instant_open: boolean; key_type: string;
  prizes_total: number; prizes_left: number;
}
interface Prize { id: number; name: string; description: string; is_won: boolean; sort_order: number; }
interface SiteContent { [key: string]: { value: string; label: string } }
interface ContactsInfo { [key: string]: { value: string; label: string } }
interface AdminUser {
  id: number; name: string; full_name: string; email: string; phone: string;
  birth_date: string; role: string; referral_code: string;
  external_balance: number; referral_balance: number; keys_count: number;
  is_blocked: boolean; is_main_admin: boolean; created_at: string;
}
interface RefAgent { id: number; name: string; referral_code: string; invited: number; earned: number; }
interface DepositReq { id: number; user_id: number; user_name: string; user_email: string; amount: number; status: string; created_at: string; }

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card-glow rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
          <Icon name={icon} fallback="BarChart2" size={18} className="text-gold-400" />
        </div>
        <div className="text-xs text-white/40 font-rubik uppercase tracking-wider">{label}</div>
      </div>
      <div className="font-oswald text-2xl text-white font-bold">{value}</div>
    </div>
  );
}

function PrizesEditor({ door, onClose }: { door: Door; onClose: () => void }) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [newPrize, setNewPrize] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.content.getPrizes(door.id).then(setPrizes).catch(() => {}).finally(() => setLoading(false));
  }, [door.id]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newPrize.trim()) return;
    try {
      await api.content.addPrize(door.id, newPrize.trim());
      setNewPrize('');
      load();
      setMsg('Приз добавлен');
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const remove = async (id: number) => {
    try {
      await api.content.deletePrize(id);
      load();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md card-glow rounded-2xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-oswald text-lg text-white">Призы: {door.name}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><Icon name="X" size={20} /></button>
        </div>
        {msg && <p className="text-xs text-green-400 mb-2 font-rubik">{msg}</p>}
        <div className="flex gap-2 mb-4">
          <input value={newPrize} onChange={e => setNewPrize(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Название приза"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-rubik focus:outline-none focus:border-gold-500/50" />
          <button onClick={add} className="btn-gold px-4 py-2 rounded-xl text-xs">+ Добавить</button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-2">
          {loading ? <div className="text-center py-6 text-white/30 text-sm">Загрузка...</div> :
            prizes.filter(p => !p.is_won).length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">Призы не добавлены</div>
            ) : prizes.filter(p => !p.is_won).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                <span className="text-sm text-white/80 font-rubik">{p.name}</span>
                <button onClick={() => remove(p.id)} className="text-red-400/60 hover:text-red-400 transition-colors ml-2">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            ))
          }
          {prizes.filter(p => p.is_won).length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-white/20 font-rubik mb-2">Разыграны:</div>
              {prizes.filter(p => p.is_won).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2 opacity-40">
                  <span className="text-sm text-white/50 font-rubik line-through">{p.name}</span>
                  <span className="text-xs text-white/30">выдан</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ onGoAuth }: { onGoAuth: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [doors, setDoors] = useState<Door[]>([]);
  const [editingDoor, setEditingDoor] = useState<number | null>(null);
  const [doorDraft, setDoorDraft] = useState<Partial<Door & { draw_at_input: string }>>({});
  const [prizesForDoor, setPrizesForDoor] = useState<Door | null>(null);
  const [doorMsg, setDoorMsg] = useState('');

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
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [stats, setStats] = useState({ users: 0, opens: 0, revenue: 0, referrals: 0, pending_deposits: 0 });
  const [userMsg, setUserMsg] = useState('');
  const [depositMsg, setDepositMsg] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, sc, co, ra, au, dep] = await Promise.all([
        api.content.adminStats(),
        api.content.getAllDoors(),
        api.content.getSite(),
        api.content.getContacts(),
        api.content.adminReferrals(),
        api.content.adminUsers(),
        api.content.adminDeposits(),
      ]);
      setStats(s); setDoors(d); setSiteContent(sc); setContacts(co);
      setRefAgents(ra); setAdminUsers(au); setDeposits(dep);
      setSiteDraft(Object.fromEntries(Object.entries(sc as SiteContent).map(([k, v]) => [k, v.value])));
      setContactsDraft(Object.fromEntries(Object.entries(co as ContactsInfo).map(([k, v]) => [k, v.value])));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'admin') loadAll(); }, [user, loadAll]);

  if (!user) return (
    <div className="min-h-screen grid-bg pt-32 flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-4">🔐</div>
      <button className="btn-gold px-10 py-3 rounded-xl text-sm" onClick={onGoAuth}>Войти</button>
    </div>
  );
  if (user.role !== 'admin') return (
    <div className="min-h-screen grid-bg pt-32 flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-4">⛔</div>
      <h2 className="font-oswald text-2xl text-white mb-2">Доступ закрыт</h2>
      <p className="text-white/40 font-rubik text-sm">Только для администраторов</p>
    </div>
  );

  const startEdit = (door: Door) => {
    setEditingDoor(door.id);
    const drawLocal = door.draw_at ? new Date(door.draw_at).toISOString().slice(0, 16) : '';
    setDoorDraft({ ...door, draw_at_input: drawLocal });
  };

  const saveDoor = async (id: number) => {
    setDoorMsg('');
    try {
      const payload: Record<string, unknown> = { ...doorDraft };
      if (doorDraft.draw_at_input !== undefined) {
        payload.draw_at = doorDraft.draw_at_input || '';
        delete payload.draw_at_input;
      }
      await api.content.updateDoor(id, payload);
      setEditingDoor(null);
      await api.content.getAllDoors().then(setDoors);
      setDoorMsg('Сохранено');
    } catch (e: unknown) { setDoorMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const createDoor = async () => {
    try {
      await api.content.createDoor({ name: 'Новая дверь', prize: 'Приз', prize_icon: '🎁', key_price: 99, rarity: 'common', instant_open: true, key_type: 'common' });
      await api.content.getAllDoors().then(setDoors);
    } catch (e: unknown) { setDoorMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const saveSite = async () => {
    setSiteSaving(true); setSiteMsg('');
    try { await api.content.updateSite(siteDraft); setSiteMsg('Сохранено!'); }
    catch (e: unknown) { setSiteMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setSiteSaving(false); }
  };

  const saveContacts = async () => {
    setContactsSaving(true); setContactsMsg('');
    try { await api.content.updateContacts(contactsDraft); setContactsMsg('Сохранено!'); }
    catch (e: unknown) { setContactsMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setContactsSaving(false); }
  };

  const toggleBlock = async (uid: number, blocked: boolean) => {
    setUserMsg('');
    try {
      await api.content.adminBlockUser(uid, !blocked);
      await api.content.adminUsers().then(setAdminUsers);
      setUserMsg('Обновлено');
    } catch (e: unknown) { setUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const setRole = async (uid: number, role: 'user' | 'admin') => {
    setUserMsg('');
    try {
      await api.auth.adminSetRole(uid, role);
      await api.content.adminUsers().then(setAdminUsers);
      setUserMsg('Роль обновлена');
    } catch (e: unknown) { setUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const confirmDeposit = async (reqId: number) => {
    setDepositMsg('');
    try {
      const res = await api.content.adminConfirmDeposit(reqId);
      setDepositMsg(res.message);
      await api.content.adminDeposits().then(setDeposits);
      await api.content.adminStats().then(setStats);
    } catch (e: unknown) { setDepositMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors';
  const RARITIES = ['common', 'rare', 'epic', 'legendary'];
  const KEY_TYPES = ['common', 'rare', 'epic', 'legendary'];

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      {prizesForDoor && <PrizesEditor door={prizesForDoor} onClose={() => setPrizesForDoor(null)} />}

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 fade-up-1">
          <div>
            <h1 className="font-oswald text-3xl text-white font-bold">Панель управления</h1>
            <p className="text-white/40 text-sm font-rubik">{user.is_main_admin ? 'Главный администратор' : 'Администратор'}</p>
          </div>
          <button onClick={loadAll} className="text-white/40 hover:text-gold-400 transition-colors p-2">
            <Icon name="RefreshCw" size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white/5 rounded-xl p-1 mb-6 border border-white/10 fade-up-2">
          {ADMIN_TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`flex-1 min-w-fit py-2 px-2 rounded-lg font-oswald text-xs tracking-wider uppercase transition-all ${
                tab === i ? 'bg-gradient-to-r from-gold-700 to-gold-500 text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              {t}{t === 'Заявки' && stats.pending_deposits > 0 ? ` (${stats.pending_deposits})` : ''}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-20 text-white/30 font-rubik">Загрузка...</div> : (
          <>
            {/* Обзор */}
            {tab === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 fade-up-3">
                <StatCard icon="Users" label="Пользователи" value={String(stats.users)} />
                <StatCard icon="DoorOpen" label="Открытий" value={String(stats.opens)} />
                <StatCard icon="TrendingUp" label="Выручка" value={`${stats.revenue.toLocaleString()} ₽`} />
                <StatCard icon="Gift" label="Рефералов" value={String(stats.referrals)} />
                <StatCard icon="Wallet" label="Заявок" value={String(stats.pending_deposits)} />
              </div>
            )}

            {/* Двери */}
            {tab === 1 && (
              <div className="space-y-4 fade-up-3">
                {doorMsg && <p className={`text-sm font-rubik ${doorMsg === 'Сохранено' ? 'text-green-400' : 'text-red-400'}`}>{doorMsg}</p>}
                <button onClick={createDoor} className="btn-gold px-5 py-2 rounded-xl text-sm">+ Создать дверь</button>
                {doors.map(door => (
                  <div key={door.id} className="card-glow rounded-xl p-4">
                    {editingDoor === door.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs text-white/40 font-rubik block mb-1">Название</label>
                            <input value={doorDraft.name || ''} onChange={e => setDoorDraft(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                          <div><label className="text-xs text-white/40 font-rubik block mb-1">Иконка приза</label>
                            <input value={doorDraft.prize_icon || ''} onChange={e => setDoorDraft(p => ({ ...p, prize_icon: e.target.value }))} className={inputCls} /></div>
                        </div>
                        <div><label className="text-xs text-white/40 font-rubik block mb-1">Описание приза (для отображения)</label>
                          <input value={doorDraft.prize || ''} onChange={e => setDoorDraft(p => ({ ...p, prize: e.target.value }))} className={inputCls} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs text-white/40 font-rubik block mb-1">Цена ключа (₽)</label>
                            <input type="number" value={doorDraft.key_price || 0} onChange={e => setDoorDraft(p => ({ ...p, key_price: +e.target.value }))} className={inputCls} /></div>
                          <div><label className="text-xs text-white/40 font-rubik block mb-1">Редкость</label>
                            <select value={doorDraft.rarity || 'common'} onChange={e => setDoorDraft(p => ({ ...p, rarity: e.target.value }))} className={inputCls}>
                              {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select></div>
                        </div>
                        <div><label className="text-xs text-white/40 font-rubik block mb-1">Тип ключа</label>
                          <select value={doorDraft.key_type || 'common'} onChange={e => setDoorDraft(p => ({ ...p, key_type: e.target.value }))} className={inputCls}>
                            {KEY_TYPES.map(k => <option key={k} value={k}>{k === 'common' ? 'Обычный' : k === 'rare' ? 'Синий' : k === 'epic' ? 'Эпический' : 'Золотой'}</option>)}
                          </select></div>
                        <div className="grid grid-cols-2 gap-3 items-end">
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Дата/время розыгрыша</label>
                            <input type="datetime-local" value={doorDraft.draw_at_input || ''} onChange={e => setDoorDraft(p => ({ ...p, draw_at_input: e.target.value }))} className={inputCls} />
                          </div>
                          <div className="flex items-center gap-2 pb-2">
                            <input type="checkbox" id={`instant_${door.id}`} checked={!!doorDraft.instant_open}
                              onChange={e => setDoorDraft(p => ({ ...p, instant_open: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                            <label htmlFor={`instant_${door.id}`} className="text-xs text-white/60 font-rubik">Мгновенное открытие</label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`active_${door.id}`} checked={!!doorDraft.is_active}
                            onChange={e => setDoorDraft(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                          <label htmlFor={`active_${door.id}`} className="text-xs text-white/60 font-rubik">Дверь активна</label>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => saveDoor(door.id)} className="btn-gold px-5 py-2 rounded-xl text-xs">Сохранить</button>
                          <button onClick={() => setEditingDoor(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white/40 text-xs font-rubik hover:border-white/20">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{door.prize_icon}</span>
                            <span className="font-oswald text-base text-white">{door.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${door.is_active ? 'text-green-400 border-green-400/30' : 'text-white/30 border-white/10'}`}>
                              {door.is_active ? 'Активна' : 'Скрыта'}
                            </span>
                          </div>
                          <div className="text-xs text-white/40 font-rubik">
                            Ключ: {door.key_price} ₽ · {door.rarity} · Тип: {door.key_type} · Призов: {door.prizes_left}/{door.prizes_total}
                          </div>
                          {door.draw_at && <div className="text-xs text-gold-400/70 font-rubik mt-0.5">
                            Розыгрыш: {new Date(door.draw_at).toLocaleString('ru-RU')}
                          </div>}
                          {door.instant_open && <div className="text-xs text-white/30 font-rubik">Мгновенное открытие</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setPrizesForDoor(door)} className="px-3 py-2 rounded-lg border border-gold-500/20 text-gold-400 text-xs font-rubik hover:border-gold-400/40 transition-colors">
                            Призы
                          </button>
                          <button onClick={() => startEdit(door)} className="px-3 py-2 rounded-lg border border-white/10 text-white/60 text-xs font-rubik hover:border-white/20 transition-colors">
                            Изменить
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Тексты сайта */}
            {tab === 2 && (
              <div className="space-y-4 fade-up-3">
                <div className="card-glow rounded-2xl p-6">
                  <h3 className="font-oswald text-lg text-white mb-4">Тексты и надписи сайта</h3>
                  <div className="space-y-4">
                    {Object.entries(siteContent).map(([key, item]) => (
                      <div key={key}>
                        <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{item.label || key}</label>
                        <textarea value={siteDraft[key] || ''} onChange={e => setSiteDraft(p => ({ ...p, [key]: e.target.value }))}
                          rows={2} className={inputCls + ' resize-none'} />
                      </div>
                    ))}
                  </div>
                  {siteMsg && <p className={`text-sm font-rubik mt-3 ${siteMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{siteMsg}</p>}
                  <button onClick={saveSite} disabled={siteSaving} className="btn-gold px-8 py-3 rounded-xl text-sm mt-4 disabled:opacity-60">
                    {siteSaving ? 'Сохранение...' : 'Сохранить тексты'}
                  </button>
                </div>
              </div>
            )}

            {/* Контакты */}
            {tab === 3 && (
              <div className="space-y-4 fade-up-3">
                <div className="card-glow rounded-2xl p-6">
                  <h3 className="font-oswald text-lg text-white mb-4">Контактная информация</h3>
                  <div className="space-y-4">
                    {Object.entries(contacts).map(([key, item]) => (
                      <div key={key}>
                        <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{item.label || key}</label>
                        <input value={contactsDraft[key] || ''} onChange={e => setContactsDraft(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                      </div>
                    ))}
                  </div>
                  {contactsMsg && <p className={`text-sm font-rubik mt-3 ${contactsMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{contactsMsg}</p>}
                  <button onClick={saveContacts} disabled={contactsSaving} className="btn-gold px-8 py-3 rounded-xl text-sm mt-4 disabled:opacity-60">
                    {contactsSaving ? 'Сохранение...' : 'Сохранить контакты'}
                  </button>
                </div>
              </div>
            )}

            {/* Пользователи */}
            {tab === 4 && (
              <div className="fade-up-3 space-y-3">
                {userMsg && <p className={`text-sm font-rubik ${userMsg.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>{userMsg}</p>}
                {adminUsers.map(u => (
                  <div key={u.id} className="card-glow rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-oswald text-base text-white">{u.name}</span>
                          {u.role === 'admin' && <span className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-full px-2 py-0.5">ADMIN</span>}
                          {u.is_main_admin && <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">ГЛАВНЫЙ</span>}
                          {u.is_blocked && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">БЛОК</span>}
                        </div>
                        <div className="text-xs text-white/40 font-rubik space-y-0.5">
                          <div>{u.email} · {u.phone || '—'}</div>
                          {u.full_name && <div>ФИО: {u.full_name}</div>}
                          {u.birth_date && <div>Д.р.: {new Date(u.birth_date).toLocaleDateString('ru-RU')}</div>}
                          <div>Счёт: {u.external_balance} ₽ · Реф: {u.referral_balance} ₽ · Ключей: {u.keys_count}</div>
                          <div>Реф. код: {u.referral_code} · Рег: {new Date(u.created_at).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => toggleBlock(u.id, u.is_blocked)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-rubik border transition-colors ${u.is_blocked ? 'border-green-400/30 text-green-400 hover:border-green-400/60' : 'border-red-400/30 text-red-400 hover:border-red-400/60'}`}>
                          {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                        {user.is_main_admin && !u.is_main_admin && (
                          <button onClick={() => setRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="px-3 py-1.5 rounded-lg text-xs font-rubik border border-gold-500/20 text-gold-400 hover:border-gold-400/40 transition-colors">
                            {u.role === 'admin' ? '↓ Убрать админа' : '↑ Назначить админа'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Рефералы */}
            {tab === 5 && (
              <div className="card-glow rounded-2xl overflow-hidden fade-up-3">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-oswald text-lg text-white">Реферальная активность</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {refAgents.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="font-rubik text-sm text-white/80">{a.name}</div>
                        <div className="text-xs text-white/30 font-oswald tracking-wider">{a.referral_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-oswald text-sm text-gold-400">{a.earned} ₽</div>
                        <div className="text-xs text-white/30">привёл: {a.invited}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Заявки на пополнение */}
            {tab === 6 && (
              <div className="space-y-3 fade-up-3">
                {depositMsg && <p className={`text-sm font-rubik ${depositMsg.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>{depositMsg}</p>}
                {deposits.length === 0 ? (
                  <div className="text-center py-12 text-white/30 font-rubik">Заявок нет</div>
                ) : deposits.map(d => (
                  <div key={d.id} className="card-glow rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-rubik text-sm text-white/80">{d.user_name} ({d.user_email})</div>
                      <div className="font-oswald text-lg text-gold-400">{d.amount.toLocaleString()} ₽</div>
                      <div className="text-xs text-white/30">{new Date(d.created_at).toLocaleString('ru-RU')}</div>
                    </div>
                    <div>
                      {d.status === 'pending' ? (
                        <button onClick={() => confirmDeposit(d.id)} className="btn-gold px-4 py-2 rounded-xl text-xs">
                          Зачислить
                        </button>
                      ) : (
                        <span className="text-xs text-green-400 font-rubik">Выполнено</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
