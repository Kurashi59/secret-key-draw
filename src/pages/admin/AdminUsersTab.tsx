import { AdminUser, RefAgent, DepositReq, RegistrationRequest, MentorLogEntry } from './AdminTypes';

const statusLabel: Record<string, string> = { pending: 'Ожидает', completed: 'Выполнено', rejected: 'Отклонено', approved: 'Одобрено' };
const statusColor: Record<string, string> = { pending: 'text-yellow-400', completed: 'text-green-400', rejected: 'text-red-400', approved: 'text-green-400' };

export interface CreateUserDraft {
  name: string; full_name: string; phone: string; password: string; member_number: string;
  mentor1_id: string; mentor2_id: string; mentor3_id: string;
}

export interface ApproveRegDraft {
  requestId: number; mentor2_id: string; mentor3_id: string; member_number: string; password: string;
}

interface AdminUsersTabProps {
  adminUsers: AdminUser[];
  userMsg: string;
  isMainAdmin: boolean;
  inputCls: string;
  deleteConfirm: { userId: number; input: string } | null;
  depositUser: { userId: number; amount: string } | null;
  onToggleBlock: (uid: number, blocked: boolean) => void;
  onSetRole: (uid: number, role: 'user' | 'admin') => void;
  onSetDeleteConfirm: (v: { userId: number; input: string } | null) => void;
  onDeleteUser: () => void;
  onSetDepositUser: (v: { userId: number; amount: string } | null) => void;
  onManualDeposit: () => void;
  onDepositUserChange: (patch: { amount: string }) => void;
  onDeleteConfirmChange: (patch: { input: string }) => void;
  onOpenCreateUser: () => void;
}

interface AdminReferralsTabProps {
  refAgents: RefAgent[];
}

interface AdminDepositsTabProps {
  deposits: DepositReq[];
  depositMsg: string;
  onConfirmDeposit: (id: number) => void;
  onRejectDeposit: (id: number) => void;
}

interface AdminRegistrationRequestsTabProps {
  requests: RegistrationRequest[];
  regMsg: string;
  onOpenApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
}

interface AdminUsersModalsProps {
  deleteConfirm: { userId: number; input: string } | null;
  depositUser: { userId: number; amount: string } | null;
  inputCls: string;
  onSetDeleteConfirm: (v: { userId: number; input: string } | null) => void;
  onDeleteUser: () => void;
  onSetDepositUser: (v: { userId: number; amount: string } | null) => void;
  onManualDeposit: () => void;
  onDepositUserChange: (patch: { amount: string }) => void;
  onDeleteConfirmChange: (patch: { input: string }) => void;
  createUserOpen: boolean;
  createUserDraft: CreateUserDraft;
  createUserMsg: string;
  createUserResult: { member_number: string; password: string } | null;
  onCloseCreateUser: () => void;
  onCreateUserChange: (patch: Partial<CreateUserDraft>) => void;
  onSubmitCreateUser: () => void;
  approveReg: ApproveRegDraft | null;
  approveRegMsg: string;
  approveRegResult: { member_number: string; password: string } | null;
  onCloseApproveReg: () => void;
  onApproveRegChange: (patch: Partial<ApproveRegDraft>) => void;
  onSubmitApproveReg: () => void;
}

export function AdminUsersModals({
  deleteConfirm, depositUser, inputCls,
  onSetDeleteConfirm, onDeleteUser,
  onSetDepositUser, onManualDeposit,
  onDepositUserChange, onDeleteConfirmChange,
  createUserOpen, createUserDraft, createUserMsg, createUserResult,
  onCloseCreateUser, onCreateUserChange, onSubmitCreateUser,
  approveReg, approveRegMsg, approveRegResult,
  onCloseApproveReg, onApproveRegChange, onSubmitApproveReg,
}: AdminUsersModalsProps) {
  return (
    <>
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-glow rounded-2xl p-6">
            <h3 className="font-oswald text-lg text-white mb-2">Удаление пользователя</h3>
            <p className="text-white/50 font-rubik text-sm mb-4">Введите <span className="text-red-400 font-bold">Удалить?</span> для подтверждения</p>
            <input value={deleteConfirm.input} onChange={e => onDeleteConfirmChange({ input: e.target.value })}
              placeholder='Удалить?' className={inputCls + ' mb-4'} />
            <div className="flex gap-3">
              <button onClick={() => onSetDeleteConfirm(null)} className="flex-1 py-2 rounded-xl text-white/50 border border-white/10 text-sm font-rubik hover:border-white/20">Отмена</button>
              <button onClick={onDeleteUser} className={`flex-1 py-2 rounded-xl text-sm font-oswald tracking-wider uppercase ${deleteConfirm.input === 'Удалить?' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-red-600/30 text-red-400/50 cursor-not-allowed'}`}>
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
            <input type="number" min={1} value={depositUser.amount} onChange={e => onDepositUserChange({ amount: e.target.value })}
              placeholder="Сумма (₽)" className={inputCls + ' mb-4'} />
            <div className="flex gap-3">
              <button onClick={() => onSetDepositUser(null)} className="flex-1 py-2 rounded-xl text-white/50 border border-white/10 text-sm font-rubik hover:border-white/20">Отмена</button>
              <button onClick={onManualDeposit} className="flex-1 btn-gold py-2 rounded-xl text-sm">Пополнить</button>
            </div>
          </div>
        </div>
      )}

      {createUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <div className="w-full max-w-md card-glow rounded-2xl p-6">
            <h3 className="font-oswald text-lg text-white mb-4">Создать пайщика</h3>
            {createUserResult ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400 font-rubik text-sm mb-2">Пайщик создан успешно!</p>
                  <p className="text-white/70 text-sm font-rubik">Номер пайщика: <span className="text-gold-400 font-bold">{createUserResult.member_number}</span></p>
                  <p className="text-white/70 text-sm font-rubik">Пароль: <span className="text-gold-400 font-bold">{createUserResult.password}</span></p>
                  <p className="text-white/30 text-xs font-rubik mt-2">Сохраните эти данные — пароль больше не будет показан</p>
                </div>
                <button onClick={onCloseCreateUser} className="w-full btn-gold py-2 rounded-xl text-sm">Готово</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={createUserDraft.name} onChange={e => onCreateUserChange({ name: e.target.value })}
                  placeholder="Имя *" className={inputCls} />
                <input value={createUserDraft.full_name} onChange={e => onCreateUserChange({ full_name: e.target.value })}
                  placeholder="ФИО полностью" className={inputCls} />
                <input value={createUserDraft.phone} onChange={e => onCreateUserChange({ phone: e.target.value })}
                  placeholder="Телефон" className={inputCls} />
                <input value={createUserDraft.member_number} onChange={e => onCreateUserChange({ member_number: e.target.value })}
                  placeholder="Номер пайщика (пусто = авто)" className={inputCls} />
                <input value={createUserDraft.password} onChange={e => onCreateUserChange({ password: e.target.value })}
                  placeholder="Пароль (пусто = сгенерировать)" className={inputCls} />
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/40 font-rubik mb-2">Три наставника (ID пользователей) *</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input value={createUserDraft.mentor1_id} onChange={e => onCreateUserChange({ mentor1_id: e.target.value })}
                      placeholder="ID 1" className={inputCls} />
                    <input value={createUserDraft.mentor2_id} onChange={e => onCreateUserChange({ mentor2_id: e.target.value })}
                      placeholder="ID 2" className={inputCls} />
                    <input value={createUserDraft.mentor3_id} onChange={e => onCreateUserChange({ mentor3_id: e.target.value })}
                      placeholder="ID 3" className={inputCls} />
                  </div>
                </div>
                {createUserMsg && <p className="text-red-400 text-sm font-rubik">{createUserMsg}</p>}
                <div className="flex gap-3 pt-2">
                  <button onClick={onCloseCreateUser} className="flex-1 py-2 rounded-xl text-white/50 border border-white/10 text-sm font-rubik hover:border-white/20">Отмена</button>
                  <button onClick={onSubmitCreateUser} className="flex-1 btn-gold py-2 rounded-xl text-sm">Создать</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {approveReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <div className="w-full max-w-md card-glow rounded-2xl p-6">
            <h3 className="font-oswald text-lg text-white mb-4">Одобрить заявку</h3>
            {approveRegResult ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400 font-rubik text-sm mb-2">Пайщик зарегистрирован!</p>
                  <p className="text-white/70 text-sm font-rubik">Номер пайщика: <span className="text-gold-400 font-bold">{approveRegResult.member_number}</span></p>
                  <p className="text-white/70 text-sm font-rubik">Пароль: <span className="text-gold-400 font-bold">{approveRegResult.password}</span></p>
                  <p className="text-white/30 text-xs font-rubik mt-2">Передайте эти данные кандидату</p>
                </div>
                <button onClick={onCloseApproveReg} className="w-full btn-gold py-2 rounded-xl text-sm">Готово</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white/40 text-xs font-rubik mb-1">Первый наставник — автор реф. ссылки. Укажите второго и третьего (ID пользователей)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={approveReg.mentor2_id} onChange={e => onApproveRegChange({ mentor2_id: e.target.value })}
                    placeholder="ID наставника 2" className={inputCls} />
                  <input value={approveReg.mentor3_id} onChange={e => onApproveRegChange({ mentor3_id: e.target.value })}
                    placeholder="ID наставника 3" className={inputCls} />
                </div>
                <input value={approveReg.member_number} onChange={e => onApproveRegChange({ member_number: e.target.value })}
                  placeholder="Номер пайщика (пусто = авто)" className={inputCls} />
                <input value={approveReg.password} onChange={e => onApproveRegChange({ password: e.target.value })}
                  placeholder="Пароль (пусто = сгенерировать)" className={inputCls} />
                {approveRegMsg && <p className="text-red-400 text-sm font-rubik">{approveRegMsg}</p>}
                <div className="flex gap-3 pt-2">
                  <button onClick={onCloseApproveReg} className="flex-1 py-2 rounded-xl text-white/50 border border-white/10 text-sm font-rubik hover:border-white/20">Отмена</button>
                  <button onClick={onSubmitApproveReg} className="flex-1 btn-gold py-2 rounded-xl text-sm">Одобрить</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function AdminUsersTab({
  adminUsers, userMsg, isMainAdmin, inputCls: _inputCls,
  onToggleBlock, onSetRole, onSetDeleteConfirm, onSetDepositUser, onOpenCreateUser,
}: AdminUsersTabProps) {
  return (
    <div className="space-y-4 fade-up-3">
      <div className="flex items-center justify-between">
        {userMsg ? <p className={`text-sm font-rubik ${userMsg.includes('Ошибка') || userMsg.includes('ошибка') || userMsg.includes('введите') ? 'text-red-400' : 'text-green-400'}`}>{userMsg}</p> : <div />}
        <button onClick={onOpenCreateUser} className="btn-gold px-4 py-2 rounded-xl text-xs flex-shrink-0">+ Создать пайщика</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-rubik">
          <thead>
            <tr className="text-left border-b border-white/10">
              {['№ пайщика','Имя','Наставники','Баланс','Роль','Статус','Действия'].map(h => (
                <th key={h} className="py-2 px-3 text-white/40 text-xs font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adminUsers.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-2 px-3">
                  <code className="text-gold-400 text-xs bg-gold-500/10 px-2 py-0.5 rounded">{u.member_number || '—'}</code>
                </td>
                <td className="py-2 px-3">
                  <div className="text-white/80">{u.name}</div>
                  <div className="text-xs text-white/30">{u.phone || '—'}</div>
                </td>
                <td className="py-2 px-3 text-xs text-white/40">
                  {[u.mentor1_id, u.mentor2_id, u.mentor3_id].filter(Boolean).join(', ') || '—'}
                </td>
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
                    <button onClick={() => onSetDepositUser({ userId: u.id, amount: '' })}
                      className="text-xs px-2 py-1 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors">
                      + Баланс
                    </button>
                    <button onClick={() => onToggleBlock(u.id, u.is_blocked)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.is_blocked ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                      {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                    {isMainAdmin && !u.is_main_admin && (
                      <>
                        <button onClick={() => onSetRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                          className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                          {u.role === 'admin' ? 'Снять адм.' : 'Назначить адм.'}
                        </button>
                        <button onClick={() => onSetDeleteConfirm({ userId: u.id, input: '' })}
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
  );
}

export function AdminReferralsTab({ refAgents }: AdminReferralsTabProps) {
  return (
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
  );
}

export function AdminRegistrationRequestsTab({ requests, regMsg, onOpenApprove, onReject }: AdminRegistrationRequestsTabProps) {
  return (
    <div className="space-y-4 fade-up-3">
      {regMsg && <p className={`text-sm font-rubik ${regMsg.includes('Ошибка') || regMsg.includes('ошибка') ? 'text-red-400' : 'text-green-400'}`}>{regMsg}</p>}
      {requests.length === 0 ? (
        <div className="text-center py-12 text-white/30 font-rubik">Заявок на регистрацию нет</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-rubik">
            <thead>
              <tr className="text-left border-b border-white/10">
                {['Кандидат','Телефон','Наставник','Комментарий','Статус','Дата','Действия'].map(h => (
                  <th key={h} className="py-2 px-3 text-white/40 text-xs font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2 px-3 text-white/80">{r.name}</td>
                  <td className="py-2 px-3 text-white/50">{r.phone}</td>
                  <td className="py-2 px-3 text-xs text-white/40">{r.mentor_name} (№{r.mentor_member_number})</td>
                  <td className="py-2 px-3 text-white/40 text-xs max-w-32 truncate">{r.comment || '—'}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs ${statusColor[r.status] || 'text-white/50'}`}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-white/40 text-xs">{new Date(r.created_at).toLocaleDateString('ru')}</td>
                  <td className="py-2 px-3">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => onOpenApprove(r.id)} className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                          Одобрить
                        </button>
                        <button onClick={() => onReject(r.id)} className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
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
  );
}

export function AdminDepositsTab({ deposits, depositMsg, onConfirmDeposit, onRejectDeposit }: AdminDepositsTabProps) {
  return (
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
                        <button onClick={() => onConfirmDeposit(d.id)} className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                          Подтвердить
                        </button>
                        <button onClick={() => onRejectDeposit(d.id)} className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
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
  );
}

const reasonLabel: Record<string, string> = {
  user_created: 'Создание пайщика',
  registration_approved: 'Одобрение заявки',
  manual_update: 'Ручное изменение',
};

function MentorCell({ m }: { m: { member_number: string; name: string } | null }) {
  if (!m) return <span className="text-white/20">—</span>;
  return <span>№{m.member_number} <span className="text-white/30">({m.name})</span></span>;
}

export function AdminMentorLogTab({ entries }: { entries: MentorLogEntry[] }) {
  return (
    <div className="space-y-4 fade-up-3">
      {entries.length === 0 ? (
        <div className="text-center py-12 text-white/30 font-rubik">Изменений наставников ещё не было</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-rubik">
            <thead>
              <tr className="text-left border-b border-white/10">
                {['Пайщик','Было','Стало','Кто изменил','Причина','Дата'].map(h => (
                  <th key={h} className="py-2 px-3 text-white/40 text-xs font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/3 transition-colors align-top">
                  <td className="py-2 px-3">
                    <div className="text-white/80">{e.user_name}</div>
                    <code className="text-gold-400 text-xs bg-gold-500/10 px-1.5 py-0.5 rounded">№{e.user_member_number}</code>
                  </td>
                  <td className="py-2 px-3 text-xs text-white/50 space-y-0.5">
                    <div>1: <MentorCell m={e.old_mentor1} /></div>
                    <div>2: <MentorCell m={e.old_mentor2} /></div>
                    <div>3: <MentorCell m={e.old_mentor3} /></div>
                  </td>
                  <td className="py-2 px-3 text-xs text-white/80 space-y-0.5">
                    <div>1: <MentorCell m={e.new_mentor1} /></div>
                    <div>2: <MentorCell m={e.new_mentor2} /></div>
                    <div>3: <MentorCell m={e.new_mentor3} /></div>
                  </td>
                  <td className="py-2 px-3 text-white/60 text-xs">{e.changed_by_name || '—'}</td>
                  <td className="py-2 px-3 text-xs">
                    <span className="text-blue-400">{reasonLabel[e.reason] || e.reason}</span>
                  </td>
                  <td className="py-2 px-3 text-white/40 text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString('ru')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}