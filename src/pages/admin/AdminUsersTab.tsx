import { AdminUser, RefAgent, DepositReq } from './AdminTypes';

const statusLabel: Record<string, string> = { pending: 'Ожидает', completed: 'Выполнено', rejected: 'Отклонено' };
const statusColor: Record<string, string> = { pending: 'text-yellow-400', completed: 'text-green-400', rejected: 'text-red-400' };

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

export function AdminUsersModals({
  deleteConfirm, depositUser, inputCls,
  onSetDeleteConfirm, onDeleteUser,
  onSetDepositUser, onManualDeposit,
  onDepositUserChange, onDeleteConfirmChange,
}: Pick<AdminUsersTabProps, 'deleteConfirm' | 'depositUser' | 'inputCls' | 'onSetDeleteConfirm' | 'onDeleteUser' | 'onSetDepositUser' | 'onManualDeposit' | 'onDepositUserChange' | 'onDeleteConfirmChange'>) {
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
    </>
  );
}

export function AdminUsersTab({
  adminUsers, userMsg, isMainAdmin, inputCls: _inputCls,
  onToggleBlock, onSetRole, onSetDeleteConfirm, onSetDepositUser,
}: AdminUsersTabProps) {
  return (
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
