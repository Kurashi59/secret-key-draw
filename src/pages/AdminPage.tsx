import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const ADMIN_TABS = ['Обзор', 'Двери', 'Тексты сайта', 'Контакты', 'Пользователи', 'Рефералы', 'Заявки', 'Оплата'];

interface Door {
  id: number; name: string; prize: string; prize_icon: string;
  key_price: number; rarity: string; keys_sold: number; is_active: boolean;
  draw_at: string | null; instant_open: boolean; key_type: string;
  color: string; is_trigger: boolean; key_name: string;
  prizes_total: number; prizes_left: number;
}
interface Prize { id: number; name: string; description: string; is_won: boolean; sort_order: number; quantity: number; }
interface PrizeFreq { id: number; every_n: number; prize_amount: number; description: string; sort_order: number; }
interface SiteContent { [key: string]: { value: string; label: string } }
interface ContactsInfo { [key: string]: { value: string; label: string } }
interface AdminUser {
  id: number; name: string; full_name: string; email: string; phone: string;
  birth_date: string; role: string; referral_code: string;
  external_balance: number; referral_balance: number; keys_count: number;
  is_blocked: boolean; is_main_admin: boolean; created_at: string;
}
interface RefAgent { id: number; name: string; referral_code: string; invited: number; earned: number; }
interface DepositReq { id: number; user_id: number; user_name: string; user_email: string; amount: number; status: string; created_at: string; comment: string; }

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

const COLORS = ['#6b7280','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b'];
const RARITIES = [
  { v: 'common', label: 'Обычная' },
  { v: 'rare', label: 'Редкая' },
  { v: 'epic', label: 'Эпическая' },
  { v: 'legendary', label: 'Легендарная' },
];

function PrizesEditor({ door, onClose }: { door: Door; onClose: () => void }) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [frequencies, setFrequencies] = useState<PrizeFreq[]>([]);
  const [newPrize, setNewPrize] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'prizes' | 'frequency'>('prizes');
  const [newFreqN, setNewFreqN] = useState(10);
  const [newFreqAmt, setNewFreqAmt] = useState(1000);
  const [newFreqDesc, setNewFreqDesc] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.content.getPrizes(door.id),
      api.content.getPrizeFrequency(door.id),
    ]).then(([p, f]) => {
      setPrizes(p as unknown as Prize[]);
      setFrequencies((f as unknown as PrizeFreq[]).filter((r: PrizeFreq) => r.sort_order >= 0));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [door.id]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newPrize.trim()) return;
    try {
      await api.content.addPrize(door.id, newPrize.trim(), newQty);
      setNewPrize(''); setNewQty(1);
      load(); setMsg('Приз добавлен');
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить приз?')) return;
    try { await api.content.deletePrize(id); load(); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const addFreq = async () => {
    const desc = newFreqDesc || `Каждый ${newFreqN}-й выигрывает ${newFreqAmt.toLocaleString()} ₽`;
    try {
      await api.content.addPrizeFrequency(door.id, newFreqN, newFreqAmt, desc);
      setNewFreqDesc(''); load(); setMsg('Правило добавлено');
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const removeFreq = async (id: number) => {
    try { await api.content.deletePrizeFrequency(id); load(); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const inputCls = 'bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50';

  const activePrizes = prizes.filter(p => !p.is_won);
  const wonPrizes = prizes.filter(p => p.is_won);
  const totalPrizeSlots = activePrizes.reduce((s, p) => s + (p.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg card-glow rounded-2xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-oswald text-lg text-white">Настройка призов: {door.name}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><Icon name="X" size={20} /></button>
        </div>
        {msg && <p className="text-xs text-green-400 mb-2 font-rubik">{msg}</p>}

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('prizes')} className={`flex-1 py-2 rounded-xl text-xs font-oswald tracking-wider uppercase transition-all ${activeTab === 'prizes' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-white/40 border border-white/10'}`}>
            Список призов ({totalPrizeSlots} шт)
          </button>
          <button onClick={() => setActiveTab('frequency')} className={`flex-1 py-2 rounded-xl text-xs font-oswald tracking-wider uppercase transition-all ${activeTab === 'frequency' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-white/40 border border-white/10'}`}>
            Частота выигрыша
          </button>
        </div>

        {activeTab === 'prizes' && (
          <>
            <div className="flex gap-2 mb-3">
              <input value={newPrize} onChange={e => setNewPrize(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="Название приза"
                className={`flex-1 ${inputCls}`} />
              <input type="number" min={1} value={newQty} onChange={e => setNewQty(Math.max(1, +e.target.value))}
                className={`w-16 ${inputCls} text-center`} title="Количество" />
              <button onClick={add} className="btn-gold px-4 py-2 rounded-xl text-xs whitespace-nowrap">+ Добавить</button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {loading ? <div className="text-center py-6 text-white/30 text-sm font-rubik">Загрузка...</div> :
                activePrizes.length === 0 ? (
                  <div className="text-center py-6 text-white/30 text-sm font-rubik">Призы не добавлены</div>
                ) : activePrizes.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                    <div>
                      <span className="text-sm text-white/80 font-rubik">{p.name}</span>
                      <span className="ml-2 text-xs text-gold-400 font-oswald">× {p.quantity || 1}</span>
                    </div>
                    <button onClick={() => remove(p.id)} className="text-red-400/60 hover:text-red-400 transition-colors ml-2">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                ))
              }
              {wonPrizes.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs text-white/20 font-rubik mb-2">Разыграны ({wonPrizes.length} шт):</div>
                  {wonPrizes.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-1.5 opacity-40">
                      <span className="text-sm text-white/50 font-rubik line-through">{p.name}</span>
                      <span className="text-xs text-white/30">выдан</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'frequency' && (
          <>
            <div className="text-xs text-white/40 font-rubik mb-3">
              Правила частоты применяются по номеру открытия двери пользователем. Если несколько правил совпадают — берётся первое совпадение. Если ни одно не совпадает — выдаётся случайный приз из списка.
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-white/40 font-rubik block mb-1">Каждый N-й</label>
                  <input type="number" min={1} value={newFreqN} onChange={e => setNewFreqN(+e.target.value)} className={`w-full ${inputCls}`} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 font-rubik block mb-1">Сумма (₽)</label>
                  <input type="number" min={0} value={newFreqAmt} onChange={e => setNewFreqAmt(+e.target.value)} className={`w-full ${inputCls}`} />
                </div>
              </div>
              <input value={newFreqDesc} onChange={e => setNewFreqDesc(e.target.value)}
                placeholder={`Описание (авто: "Каждый ${newFreqN}-й выигрывает ${newFreqAmt} ₽")`}
                className={`w-full ${inputCls}`} />
              <button onClick={addFreq} className="btn-gold px-4 py-2 rounded-xl text-xs w-full">+ Добавить правило</button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {loading ? <div className="text-center py-4 text-white/30 text-sm font-rubik">Загрузка...</div> :
                frequencies.length === 0 ? (
                  <div className="text-center py-4 text-white/30 text-sm font-rubik">
                    По умолчанию — случайный приз из списка
                  </div>
                ) : frequencies.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                    <div>
                      <div className="text-sm text-white/80 font-rubik">{f.description}</div>
                      <div className="text-xs text-gold-400/60 font-oswald">Каждый {f.every_n}-й → {f.prize_amount.toLocaleString()} ₽</div>
                    </div>
                    <button onClick={() => removeFreq(f.id)} className="text-red-400/60 hover:text-red-400 transition-colors ml-2">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                ))
              }
            </div>
          </>
        )}
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

  const [paymentSettings, setPaymentSettings] = useState<Record<string, { value: string; label: string }>>({});
  const [qrUrl, setQrUrl] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');

  const [refAgents, setRefAgents] = useState<RefAgent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [stats, setStats] = useState({ users: 0, opens: 0, revenue: 0, referrals: 0, pending_deposits: 0 });
  const [userMsg, setUserMsg] = useState('');
  const [depositMsg, setDepositMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: number; input: string } | null>(null);
  const [depositUser, setDepositUser] = useState<{ userId: number; amount: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, sc, co, ra, au, dep, ps] = await Promise.all([
        api.content.adminStats(),
        api.content.getAllDoors(),
        api.content.getSite(),
        api.content.getContacts(),
        api.content.adminReferrals(),
        api.content.adminUsers(),
        api.content.adminDeposits(),
        api.content.getPaymentSettings(),
      ]);
      setStats(s as typeof stats);
      setDoors(d as unknown as Door[]);
      setSiteContent(sc as SiteContent);
      setContacts(co as ContactsInfo);
      setRefAgents(ra as unknown as RefAgent[]);
      setAdminUsers(au as unknown as AdminUser[]);
      setDeposits(dep as unknown as DepositReq[]);
      setPaymentSettings(ps as typeof paymentSettings);
      setSiteDraft(Object.fromEntries(Object.entries(sc as SiteContent).map(([k, v]) => [k, v.value])));
      setContactsDraft(Object.fromEntries(Object.entries(co as ContactsInfo).map(([k, v]) => [k, v.value])));
      const qr = (ps as Record<string, { value: string }>)?.qr_image_url?.value || '';
      setQrUrl(qr);
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
      await api.content.getAllDoors().then(d => setDoors(d as unknown as Door[]));
      setDoorMsg('Сохранено');
    } catch (e: unknown) { setDoorMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const deleteDoor = async (doorId: number) => {
    if (!confirm('Удалить дверь?')) return;
    try {
      await api.content.deleteDoor(doorId);
      await api.content.getAllDoors().then(d => setDoors(d as unknown as Door[]));
      setDoorMsg('Дверь удалена');
    } catch (e: unknown) { setDoorMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const createDoor = async () => {
    try {
      await api.content.createDoor({ name: 'Новая дверь', prize: 'Приз', prize_icon: '🎁', key_price: 99, rarity: 'common', instant_open: true, key_type: 'common', color: '#6b7280', key_name: 'Стандартный ключ' });
      await api.content.getAllDoors().then(d => setDoors(d as unknown as Door[]));
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

  const savePayment = async () => {
    setPaymentSaving(true); setPaymentMsg('');
    try {
      await api.content.updatePaymentSettings({ qr_image_url: qrUrl });
      setPaymentMsg('Сохранено!');
    } catch (e: unknown) { setPaymentMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setPaymentSaving(false); }
  };

  const handleQrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setQrUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleBlock = async (uid: number, blocked: boolean) => {
    setUserMsg('');
    try {
      await api.content.adminBlockUser(uid, !blocked);
      await api.content.adminUsers().then(u => setAdminUsers(u as unknown as AdminUser[]));
      setUserMsg('Обновлено');
    } catch (e: unknown) { setUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const setRole = async (uid: number, role: 'user' | 'admin') => {
    setUserMsg('');
    try {
      await api.auth.adminSetRole(uid, role);
      await api.content.adminUsers().then(u => setAdminUsers(u as unknown as AdminUser[]));
      setUserMsg('Роль обновлена');
    } catch (e: unknown) { setUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const deleteUser = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.input !== 'Удалить?') {
      setUserMsg('Введите точно "Удалить?" для подтверждения');
      return;
    }
    setUserMsg('');
    try {
      await api.auth.adminDeleteUser(deleteConfirm.userId, deleteConfirm.input);
      setDeleteConfirm(null);
      await api.content.adminUsers().then(u => setAdminUsers(u as unknown as AdminUser[]));
      setUserMsg('Пользователь удалён');
    } catch (e: unknown) { setUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const manualDeposit = async () => {
    if (!depositUser || !depositUser.amount) return;
    setUserMsg('');
    try {
      await api.auth.adminDeposit(depositUser.userId, +depositUser.amount, 'external', 'Ручное пополнение');
      setDepositUser(null);
      await api.content.adminUsers().then(u => setAdminUsers(u as unknown as AdminUser[]));
      setUserMsg('Баланс пополнен');
    } catch (e: unknown) { setUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const confirmDeposit = async (reqId: number) => {
    setDepositMsg('');
    try {
      const res = await api.content.adminConfirmDeposit(reqId);
      setDepositMsg((res as { message?: string }).message || 'Выполнено');
      await api.content.adminDeposits().then(d => setDeposits(d as unknown as DepositReq[]));
      await api.content.adminStats().then(s => setStats(s as typeof stats));
    } catch (e: unknown) { setDepositMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const rejectDeposit = async (reqId: number) => {
    setDepositMsg('');
    try {
      await api.content.adminRejectDeposit(reqId);
      setDepositMsg('Заявка отклонена');
      await api.content.adminDeposits().then(d => setDeposits(d as unknown as DepositReq[]));
    } catch (e: unknown) { setDepositMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors';

  const statusLabel: Record<string, string> = { pending: 'Ожидает', completed: 'Выполнено', rejected: 'Отклонено' };
  const statusColor: Record<string, string> = { pending: 'text-yellow-400', completed: 'text-green-400', rejected: 'text-red-400' };

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      {prizesForDoor && <PrizesEditor door={prizesForDoor} onClose={() => setPrizesForDoor(null)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-glow rounded-2xl p-6">
            <h3 className="font-oswald text-lg text-white mb-2">Удаление пользователя</h3>
            <p className="text-white/50 font-rubik text-sm mb-4">Введите <span className="text-red-400 font-bold">Удалить?</span> для подтверждения</p>
            <input value={deleteConfirm.input} onChange={e => setDeleteConfirm({ ...deleteConfirm, input: e.target.value })}
              placeholder='Удалить?' className={inputCls + ' mb-4'} />
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl text-white/50 border border-white/10 text-sm font-rubik hover:border-white/20">Отмена</button>
              <button onClick={deleteUser} className={`flex-1 py-2 rounded-xl text-sm font-oswald tracking-wider uppercase ${deleteConfirm.input === 'Удалить?' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-red-600/30 text-red-400/50 cursor-not-allowed'}`}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {depositUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-glow rounded-2xl p-6">
            <h3 className="font-oswald text-lg text-white mb-4">Пополнить баланс</h3>
            <input type="number" min={1} value={depositUser.amount} onChange={e => setDepositUser({ ...depositUser, amount: e.target.value })}
              placeholder="Сумма (₽)" className={inputCls + ' mb-4'} />
            <div className="flex gap-3">
              <button onClick={() => setDepositUser(null)} className="flex-1 py-2 rounded-xl text-white/50 border border-white/10 text-sm font-rubik hover:border-white/20">Отмена</button>
              <button onClick={manualDeposit} className="flex-1 btn-gold py-2 rounded-xl text-sm">Пополнить</button>
            </div>
          </div>
        </div>
      )}

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
                <StatCard icon="Wallet" label="Заявок ожидает" value={String(stats.pending_deposits)} />
              </div>
            )}

            {/* Двери */}
            {tab === 1 && (
              <div className="space-y-4 fade-up-3">
                {doorMsg && <p className={`text-sm font-rubik ${doorMsg.includes('Ошибка') || doorMsg.includes('ошибка') ? 'text-red-400' : 'text-green-400'}`}>{doorMsg}</p>}
                <button onClick={createDoor} className="btn-gold px-5 py-2 rounded-xl text-sm">+ Создать дверь</button>
                {doors.map(door => (
                  <div key={door.id} className="card-glow rounded-xl p-4">
                    {editingDoor === door.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Название двери</label>
                            <input value={doorDraft.name || ''} onChange={e => setDoorDraft(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Название ключа</label>
                            <input value={doorDraft.key_name || ''} onChange={e => setDoorDraft(p => ({ ...p, key_name: e.target.value }))} className={inputCls} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Иконка приза</label>
                            <input value={doorDraft.prize_icon || ''} onChange={e => setDoorDraft(p => ({ ...p, prize_icon: e.target.value }))} className={inputCls} />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Описание приза</label>
                            <input value={doorDraft.prize || ''} onChange={e => setDoorDraft(p => ({ ...p, prize: e.target.value }))} className={inputCls} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Цена ключа (₽)</label>
                            <input type="number" value={doorDraft.key_price || 0} onChange={e => setDoorDraft(p => ({ ...p, key_price: +e.target.value }))} className={inputCls} />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 font-rubik block mb-1">Редкость</label>
                            <select value={doorDraft.rarity || 'common'} onChange={e => setDoorDraft(p => ({ ...p, rarity: e.target.value }))} className={inputCls}>
                              {RARITIES.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-white/40 font-rubik block mb-1">Цвет двери</label>
                          <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                              <button key={c} onClick={() => setDoorDraft(p => ({ ...p, color: c }))}
                                className={`w-7 h-7 rounded-lg border-2 transition-all ${doorDraft.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ background: c }} />
                            ))}
                            <input type="color" value={doorDraft.color || '#6b7280'} onChange={e => setDoorDraft(p => ({ ...p, color: e.target.value }))}
                              className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" title="Свой цвет" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-white/40 font-rubik block mb-1">Дата/время розыгрыша</label>
                          <input type="datetime-local" value={doorDraft.draw_at_input || ''} onChange={e => setDoorDraft(p => ({ ...p, draw_at_input: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!doorDraft.instant_open}
                              onChange={e => setDoorDraft(p => ({ ...p, instant_open: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                            <span className="text-xs text-white/60 font-rubik">Мгновенное открытие</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!doorDraft.is_active}
                              onChange={e => setDoorDraft(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                            <span className="text-xs text-white/60 font-rubik">Активна</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer" title="Только одна дверь может быть стартовой">
                            <input type="checkbox" checked={!!doorDraft.is_trigger}
                              onChange={e => setDoorDraft(p => ({ ...p, is_trigger: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                            <span className="text-xs text-gold-400 font-rubik">Стартовая дверь (открывает доступ к остальным)</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveDoor(door.id)} className="btn-gold px-5 py-2 rounded-xl text-sm">Сохранить</button>
                          <button onClick={() => setEditingDoor(null)} className="px-5 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-rubik hover:border-white/20">Отмена</button>
                          <button onClick={() => deleteDoor(door.id)} className="px-5 py-2 rounded-xl bg-red-900/30 border border-red-500/20 text-red-400 text-sm font-rubik hover:bg-red-900/50 ml-auto">
                            <Icon name="Trash2" size={14} className="inline mr-1" />Удалить дверь
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl" style={{ background: door.color || '#6b7280' }}>
                            {door.prize_icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-oswald text-white">{door.name}</span>
                              {door.is_trigger && <span className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded-full font-rubik">Стартовая</span>}
                              {!door.is_active && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-rubik">Скрыта</span>}
                            </div>
                            <div className="text-xs text-white/40 font-rubik">
                              Ключ: {door.key_name} · {door.key_price} ₽ · Призов: {door.prizes_left}/{door.prizes_total}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPrizesForDoor(door)} className="px-3 py-1.5 rounded-xl border border-gold-500/30 text-gold-400 text-xs font-oswald uppercase tracking-wider hover:border-gold-400/50">
                            Призы
                          </button>
                          <button onClick={() => startEdit(door)} className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 text-xs font-oswald uppercase tracking-wider hover:border-white/20">
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
                {siteMsg && <p className={`text-sm font-rubik ${siteMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{siteMsg}</p>}
                {Object.entries(siteContent).map(([key, { label }]) => (
                  <div key={key}>
                    <label className="text-xs text-white/40 font-rubik block mb-1">{label || key}</label>
                    <input value={siteDraft[key] || ''} onChange={e => setSiteDraft(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
                <button onClick={saveSite} disabled={siteSaving} className="btn-gold px-8 py-2 rounded-xl text-sm">
                  {siteSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            )}

            {/* Контакты */}
            {tab === 3 && (
              <div className="space-y-4 fade-up-3">
                {contactsMsg && <p className={`text-sm font-rubik ${contactsMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{contactsMsg}</p>}
                {Object.entries(contacts).map(([key, { label }]) => (
                  <div key={key}>
                    <label className="text-xs text-white/40 font-rubik block mb-1">{label || key}</label>
                    <input value={contactsDraft[key] || ''} onChange={e => setContactsDraft(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
                <button onClick={saveContacts} disabled={contactsSaving} className="btn-gold px-8 py-2 rounded-xl text-sm">
                  {contactsSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            )}

            {/* Пользователи */}
            {tab === 4 && (
              <div className="space-y-4 fade-up-3">
                {userMsg && <p className={`text-sm font-rubik ${userMsg.includes('Ошибка') || userMsg.includes('ошибка') || userMsg.includes('введите') ? 'text-red-400' : 'text-green-400'}`}>{userMsg}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-rubik">
                    <thead>
                      <tr className="text-left border-b border-white/10">
                        {['Имя','Email','Баланс','Роль','Статус','Действия'].map(h => (
                          <th key={h} className="py-2 px-3 text-white/40 text-xs font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-2 px-3">
                            <div className="text-white/80">{u.name}</div>
                            <div className="text-xs text-white/30">{u.phone || '—'}</div>
                          </td>
                          <td className="py-2 px-3 text-white/50">{u.email}</td>
                          <td className="py-2 px-3 text-gold-400">{u.external_balance.toLocaleString()} ₽</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-gold-500/20 text-gold-400' : 'bg-white/10 text-white/50'}`}>
                              {u.role === 'admin' ? 'Адм.' : 'Пользователь'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-xs ${u.is_blocked ? 'text-red-400' : 'text-green-400'}`}>
                              {u.is_blocked ? 'Заблокирован' : 'Активен'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => setDepositUser({ userId: u.id, amount: '' })}
                                className="text-xs px-2 py-1 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors">
                                + Баланс
                              </button>
                              <button onClick={() => toggleBlock(u.id, u.is_blocked)}
                                className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.is_blocked ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                                {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                              </button>
                              {user.is_main_admin && !u.is_main_admin && (
                                <>
                                  <button onClick={() => setRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                    className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                                    {u.role === 'admin' ? 'Снять адм.' : 'Назначить адм.'}
                                  </button>
                                  <button onClick={() => setDeleteConfirm({ userId: u.id, input: '' })}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-900/20 text-red-400/70 hover:bg-red-900/40 hover:text-red-400 transition-colors">
                                    Удалить
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Рефералы */}
            {tab === 5 && (
              <div className="fade-up-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-rubik">
                    <thead>
                      <tr className="text-left border-b border-white/10">
                        {['Имя','Реф. код','Приглашено','Заработано'].map(h => (
                          <th key={h} className="py-2 px-3 text-white/40 text-xs font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {refAgents.map(r => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-2 px-3 text-white/80">{r.name}</td>
                          <td className="py-2 px-3"><code className="text-gold-400 text-xs bg-gold-500/10 px-2 py-0.5 rounded">{r.referral_code}</code></td>
                          <td className="py-2 px-3 text-white/60">{r.invited}</td>
                          <td className="py-2 px-3 text-gold-400">{Number(r.earned).toLocaleString()} ₽</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Заявки */}
            {tab === 6 && (
              <div className="space-y-4 fade-up-3">
                {depositMsg && <p className={`text-sm font-rubik ${depositMsg.includes('Ошибка') || depositMsg.includes('ошибка') ? 'text-red-400' : 'text-green-400'}`}>{depositMsg}</p>}
                {deposits.length === 0 ? (
                  <div className="text-center py-12 text-white/30 font-rubik">Заявок нет</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-rubik">
                      <thead>
                        <tr className="text-left border-b border-white/10">
                          {['Пользователь','Сумма','Статус','Комментарий','Дата','Действия'].map(h => (
                            <th key={h} className="py-2 px-3 text-white/40 text-xs font-normal">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map(d => (
                          <tr key={d.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="py-2 px-3">
                              <div className="text-white/80">{d.user_name}</div>
                              <div className="text-xs text-white/30">{d.user_email}</div>
                            </td>
                            <td className="py-2 px-3 text-gold-400 font-bold">{d.amount.toLocaleString()} ₽</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs ${statusColor[d.status] || 'text-white/50'}`}>
                                {statusLabel[d.status] || d.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-white/40 text-xs max-w-32 truncate">{d.comment || '—'}</td>
                            <td className="py-2 px-3 text-white/40 text-xs">{new Date(d.created_at).toLocaleDateString('ru')}</td>
                            <td className="py-2 px-3">
                              {d.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button onClick={() => confirmDeposit(d.id)} className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                                    Подтвердить
                                  </button>
                                  <button onClick={() => rejectDeposit(d.id)} className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                    Отклонить
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Оплата (QR-код) */}
            {tab === 7 && (
              <div className="max-w-lg space-y-6 fade-up-3">
                {paymentMsg && <p className={`text-sm font-rubik ${paymentMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{paymentMsg}</p>}
                <div>
                  <h2 className="font-oswald text-xl text-white mb-1">QR-код для оплаты</h2>
                  <p className="text-white/40 font-rubik text-xs mb-4">Загрузите QR-код, который пользователи будут видеть при пополнении счёта</p>

                  <div className="flex gap-4 items-start mb-4">
                    {qrUrl ? (
                      <div className="relative">
                        <img src={qrUrl} alt="QR-код" className="w-40 h-40 rounded-xl object-cover border border-gold-500/20" />
                        <button onClick={() => setQrUrl('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400">
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/30 cursor-pointer hover:border-gold-500/30 hover:text-white/50 transition-all"
                        onClick={() => fileRef.current?.click()}>
                        <Icon name="QrCode" size={32} />
                        <span className="text-xs font-rubik mt-2">Загрузить QR</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <button onClick={() => fileRef.current?.click()} className="w-full py-2 rounded-xl border border-white/10 text-white/50 text-sm font-rubik hover:border-gold-500/30 hover:text-white/70 transition-all flex items-center justify-center gap-2">
                        <Icon name="Upload" size={16} />Выбрать изображение
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleQrFile} className="hidden" />
                      <label className="text-xs text-white/40 font-rubik block mb-1 mt-3">Или вставьте URL:</label>
                      <input value={qrUrl} onChange={e => setQrUrl(e.target.value)}
                        placeholder="https://..." className={inputCls} />
                    </div>
                  </div>

                  <button onClick={savePayment} disabled={paymentSaving} className="btn-gold px-8 py-2 rounded-xl text-sm">
                    {paymentSaving ? 'Сохранение...' : 'Сохранить QR-код'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
