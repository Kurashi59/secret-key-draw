import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { ADMIN_TABS, Door, SiteContent, ContactsInfo, AdminUser, RefAgent, DepositReq, RegistrationRequest, MentorLogEntry } from './admin/AdminTypes';
import { StatCard, PrizesEditor } from './admin/AdminPrizesEditor';
import { AdminDoorsTab } from './admin/AdminDoorsTab';
import { AdminUsersTab, AdminReferralsTab, AdminDepositsTab, AdminUsersModals, AdminRegistrationRequestsTab, AdminMentorLogTab, CreateUserDraft, ApproveRegDraft } from './admin/AdminUsersTab';

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
  const [qrPendingBase64, setQrPendingBase64] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');

  const [refAgents, setRefAgents] = useState<RefAgent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [regRequests, setRegRequests] = useState<RegistrationRequest[]>([]);
  const [regMsg, setRegMsg] = useState('');
  const [mentorLog, setMentorLog] = useState<MentorLogEntry[]>([]);
  const [stats, setStats] = useState({ users: 0, opens: 0, revenue: 0, referrals: 0, pending_deposits: 0, pending_registrations: 0 });
  const [userMsg, setUserMsg] = useState('');
  const [depositMsg, setDepositMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: number; input: string } | null>(null);
  const [depositUser, setDepositUser] = useState<{ userId: number; amount: string } | null>(null);

  const emptyCreateUserDraft: CreateUserDraft = { name: '', full_name: '', phone: '', password: '', member_number: '', mentor1_id: '', mentor2_id: '', mentor3_id: '' };
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserDraft, setCreateUserDraft] = useState<CreateUserDraft>(emptyCreateUserDraft);
  const [createUserMsg, setCreateUserMsg] = useState('');
  const [createUserResult, setCreateUserResult] = useState<{ member_number: string; password: string } | null>(null);

  const [approveReg, setApproveReg] = useState<ApproveRegDraft | null>(null);
  const [approveRegMsg, setApproveRegMsg] = useState('');
  const [approveRegResult, setApproveRegResult] = useState<{ member_number: string; password: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, sc, co, ra, au, dep, ps, rr, ml] = await Promise.all([
        api.content.adminStats(),
        api.content.getAllDoors(),
        api.content.getSite(),
        api.content.getContacts(),
        api.content.adminReferrals(),
        api.content.adminUsers(),
        api.content.adminDeposits(),
        api.content.getPaymentSettings(),
        api.content.adminRegistrationRequests(),
        api.auth.adminMentorLog(),
      ]);
      setStats(s as typeof stats);
      setDoors(d as unknown as Door[]);
      setSiteContent(sc as SiteContent);
      setContacts(co as ContactsInfo);
      setRefAgents(ra as unknown as RefAgent[]);
      setAdminUsers(au as unknown as AdminUser[]);
      setDeposits(dep as unknown as DepositReq[]);
      setPaymentSettings(ps as typeof paymentSettings);
      setRegRequests(rr as unknown as RegistrationRequest[]);
      setMentorLog(ml as unknown as MentorLogEntry[]);
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
      if (qrPendingBase64) {
        const res = await api.content.uploadQr(qrPendingBase64);
        const uploaded = res as { url?: string };
        if (uploaded.url) {
          setQrUrl(uploaded.url);
          setQrPendingBase64('');
        }
      } else if (qrUrl && !qrUrl.startsWith('data:')) {
        await api.content.updatePaymentSettings({ qr_image_url: qrUrl });
      } else if (!qrUrl) {
        await api.content.updatePaymentSettings({ qr_image_url: '' });
      }
      setPaymentMsg('QR-код сохранён!');
    } catch (e: unknown) { setPaymentMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setPaymentSaving(false); }
  };

  const handleQrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setQrUrl(dataUrl);
      setQrPendingBase64(dataUrl);
    };
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

  const submitCreateUser = async () => {
    setCreateUserMsg('');
    const d = createUserDraft;
    if (!d.name || !d.mentor1_id || !d.mentor2_id || !d.mentor3_id) {
      setCreateUserMsg('Заполните имя и всех трёх наставников');
      return;
    }
    try {
      const res = await api.auth.adminCreateUser({
        name: d.name,
        full_name: d.full_name || undefined,
        phone: d.phone || undefined,
        password: d.password || undefined,
        member_number: d.member_number || undefined,
        mentor1_id: +d.mentor1_id,
        mentor2_id: +d.mentor2_id,
        mentor3_id: +d.mentor3_id,
      });
      const r = res as { member_number: string; password: string };
      setCreateUserResult({ member_number: r.member_number, password: r.password });
      await api.content.adminUsers().then(u => setAdminUsers(u as unknown as AdminUser[]));
      await api.content.adminStats().then(s => setStats(s as typeof stats));
      await api.auth.adminMentorLog().then(ml => setMentorLog(ml as unknown as MentorLogEntry[]));
    } catch (e: unknown) { setCreateUserMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const closeCreateUser = () => {
    setCreateUserOpen(false);
    setCreateUserDraft(emptyCreateUserDraft);
    setCreateUserMsg('');
    setCreateUserResult(null);
  };

  const openApproveReg = (requestId: number) => {
    setApproveReg({ requestId, mentor2_id: '', mentor3_id: '', member_number: '', password: '' });
    setApproveRegMsg('');
    setApproveRegResult(null);
  };

  const closeApproveReg = () => {
    setApproveReg(null);
    setApproveRegMsg('');
    setApproveRegResult(null);
  };

  const submitApproveReg = async () => {
    if (!approveReg) return;
    setApproveRegMsg('');
    if (!approveReg.mentor2_id || !approveReg.mentor3_id) {
      setApproveRegMsg('Укажите второго и третьего наставника');
      return;
    }
    try {
      const res = await api.content.adminApproveRegistration({
        request_id: approveReg.requestId,
        mentor2_id: +approveReg.mentor2_id,
        mentor3_id: +approveReg.mentor3_id,
        member_number: approveReg.member_number || undefined,
        password: approveReg.password || undefined,
      });
      const r = res as { member_number: string; password: string };
      setApproveRegResult({ member_number: r.member_number, password: r.password });
      await api.content.adminRegistrationRequests().then(rr => setRegRequests(rr as unknown as RegistrationRequest[]));
      await api.content.adminUsers().then(u => setAdminUsers(u as unknown as AdminUser[]));
      await api.content.adminStats().then(s => setStats(s as typeof stats));
      await api.auth.adminMentorLog().then(ml => setMentorLog(ml as unknown as MentorLogEntry[]));
    } catch (e: unknown) { setApproveRegMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const rejectReg = async (requestId: number) => {
    setRegMsg('');
    try {
      await api.content.adminRejectRegistration(requestId);
      setRegMsg('Заявка отклонена');
      await api.content.adminRegistrationRequests().then(rr => setRegRequests(rr as unknown as RegistrationRequest[]));
      await api.content.adminStats().then(s => setStats(s as typeof stats));
    } catch (e: unknown) { setRegMsg(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors';

  return (
    <div className="min-h-screen grid-bg pt-24 pb-16 px-4">
      {prizesForDoor && <PrizesEditor door={prizesForDoor} onClose={() => setPrizesForDoor(null)} />}

      <AdminUsersModals
        deleteConfirm={deleteConfirm}
        depositUser={depositUser}
        inputCls={inputCls}
        onSetDeleteConfirm={setDeleteConfirm}
        onDeleteUser={deleteUser}
        onSetDepositUser={setDepositUser}
        onManualDeposit={manualDeposit}
        onDepositUserChange={patch => setDepositUser(prev => prev ? { ...prev, ...patch } : null)}
        onDeleteConfirmChange={patch => setDeleteConfirm(prev => prev ? { ...prev, ...patch } : null)}
        createUserOpen={createUserOpen}
        createUserDraft={createUserDraft}
        createUserMsg={createUserMsg}
        createUserResult={createUserResult}
        onCloseCreateUser={closeCreateUser}
        onCreateUserChange={patch => setCreateUserDraft(prev => ({ ...prev, ...patch }))}
        onSubmitCreateUser={submitCreateUser}
        approveReg={approveReg}
        approveRegMsg={approveRegMsg}
        approveRegResult={approveRegResult}
        onCloseApproveReg={closeApproveReg}
        onApproveRegChange={patch => setApproveReg(prev => prev ? { ...prev, ...patch } : null)}
        onSubmitApproveReg={submitApproveReg}
      />

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
              {t}
              {t === 'Депозиты' && stats.pending_deposits > 0 ? ` (${stats.pending_deposits})` : ''}
              {t === 'Рег. заявки' && stats.pending_registrations > 0 ? ` (${stats.pending_registrations})` : ''}
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
              <AdminDoorsTab
                doors={doors}
                doorMsg={doorMsg}
                editingDoor={editingDoor}
                doorDraft={doorDraft}
                inputCls={inputCls}
                onCreateDoor={createDoor}
                onStartEdit={startEdit}
                onSaveDoor={saveDoor}
                onDeleteDoor={deleteDoor}
                onCancelEdit={() => setEditingDoor(null)}
                onSetPrizesForDoor={setPrizesForDoor}
                onDoorDraftChange={patch => setDoorDraft(p => ({ ...p, ...patch }))}
              />
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
              <AdminUsersTab
                adminUsers={adminUsers}
                userMsg={userMsg}
                isMainAdmin={!!user.is_main_admin}
                inputCls={inputCls}
                deleteConfirm={deleteConfirm}
                depositUser={depositUser}
                onToggleBlock={toggleBlock}
                onSetRole={setRole}
                onSetDeleteConfirm={setDeleteConfirm}
                onDeleteUser={deleteUser}
                onSetDepositUser={setDepositUser}
                onManualDeposit={manualDeposit}
                onDepositUserChange={patch => setDepositUser(prev => prev ? { ...prev, ...patch } : null)}
                onDeleteConfirmChange={patch => setDeleteConfirm(prev => prev ? { ...prev, ...patch } : null)}
                onOpenCreateUser={() => setCreateUserOpen(true)}
              />
            )}

            {/* Рефералы */}
            {tab === 5 && <AdminReferralsTab refAgents={refAgents} />}

            {/* Рег. заявки */}
            {tab === 6 && (
              <AdminRegistrationRequestsTab
                requests={regRequests}
                regMsg={regMsg}
                onOpenApprove={openApproveReg}
                onReject={rejectReg}
              />
            )}

            {/* Депозиты */}
            {tab === 7 && (
              <AdminDepositsTab
                deposits={deposits}
                depositMsg={depositMsg}
                onConfirmDeposit={confirmDeposit}
                onRejectDeposit={rejectDeposit}
              />
            )}

            {/* Журнал наставников */}
            {tab === 8 && <AdminMentorLogTab entries={mentorLog} />}

            {/* Оплата (QR-код) */}
            {tab === 9 && (
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