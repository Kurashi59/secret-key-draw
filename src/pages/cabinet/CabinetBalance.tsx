import Icon from '@/components/ui/icon';
import { TX_LABELS, Transaction } from './CabinetTypes';

interface CabinetBalanceTabProps {
  externalBalance: number;
  referralBalance: number;
  paymentSuccess: boolean;
  selectedProvider: 'yookassa' | 'sberbank' | 'tinkoff' | 'manual';
  onSelectProvider: (p: 'yookassa' | 'sberbank' | 'tinkoff' | 'manual') => void;
  depositAmount: string;
  onDepositAmountChange: (v: string) => void;
  depositComment: string;
  onDepositCommentChange: (v: string) => void;
  depositMsg: string;
  depositLoading: boolean;
  onRequestDeposit: () => void;
  qrUrl: string;
  loadingTx: boolean;
  transactions: Transaction[];
}

const PROVIDERS = [
  { id: 'yookassa', label: 'ЮКасса',  icon: '💳' },
  { id: 'sberbank', label: 'Сбербанк', icon: '🟢' },
  { id: 'tinkoff',  label: 'Т-Банк',   icon: '🟡' },
  { id: 'manual',   label: 'Вручную',  icon: '📋' },
] as const;

export function CabinetBalanceTab({
  externalBalance, referralBalance, paymentSuccess,
  selectedProvider, onSelectProvider,
  depositAmount, onDepositAmountChange,
  depositComment, onDepositCommentChange,
  depositMsg, depositLoading, onRequestDeposit,
  qrUrl,
  loadingTx, transactions,
}: CabinetBalanceTabProps) {
  return (
    <div className="space-y-4 fade-up-3">

      {/* Успешная оплата */}
      {paymentSuccess && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
          <Icon name="CheckCircle" size={20} className="text-green-400 shrink-0" />
          <div>
            <p className="text-green-400 font-oswald text-sm">Оплата прошла успешно!</p>
            <p className="text-white/50 font-rubik text-xs">Средства зачислены на ваш счёт автоматически</p>
          </div>
        </div>
      )}

      {/* Балансы */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-glow rounded-xl p-5">
          <div className="text-xs text-white/40 uppercase tracking-wider font-rubik mb-2">Внешний счёт (с карты)</div>
          <div className="font-oswald text-3xl text-gold-400 font-bold mb-4">{(externalBalance || 0).toLocaleString()} ₽</div>

          {/* Выбор способа оплаты */}
          <div className="mb-3">
            <p className="text-xs text-white/40 font-rubik mb-2">Способ оплаты:</p>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => onSelectProvider(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-rubik transition-all border ${
                    selectedProvider === p.id
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input type="number" value={depositAmount} onChange={e => onDepositAmountChange(e.target.value)}
                placeholder="Сумма (мин. 100 ₽)" min={100}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-rubik focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
              <button onClick={onRequestDeposit} disabled={depositLoading}
                className="btn-gold px-4 py-2 rounded-xl text-xs disabled:opacity-60 whitespace-nowrap">
                {depositLoading ? '...' : selectedProvider === 'manual' ? 'Заявка' : 'Оплатить'}
              </button>
            </div>
            {selectedProvider === 'manual' && (
              <input value={depositComment} onChange={e => onDepositCommentChange(e.target.value)}
                placeholder="Комментарий (необязательно)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-rubik focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
            )}
          </div>

          {depositMsg && <p className="text-xs mt-2 font-rubik" style={{ color: depositMsg.includes('Заявка') || depositMsg.includes('успеш') ? '#4ade80' : '#f87171' }}>{depositMsg}</p>}

          {selectedProvider !== 'manual' && (
            <p className="text-xs text-white/20 mt-2 font-rubik">Вы будете перенаправлены на страницу оплаты. Деньги зачислятся автоматически.</p>
          )}

          {selectedProvider === 'manual' && qrUrl && (
            <div className="mt-3 flex flex-col items-center gap-2 p-4 bg-white rounded-xl w-fit mx-auto">
              <img src={qrUrl} alt="QR-код для оплаты" className="w-48 h-48 object-contain" />
              <p className="text-black text-xs font-rubik text-center">Сканируйте для оплаты</p>
            </div>
          )}
          {selectedProvider === 'manual' && (
            <p className="text-xs text-white/20 mt-2 font-rubik">После оплаты отправьте заявку — администратор зачислит средства на счёт</p>
          )}
        </div>
        <div className="card-glow rounded-xl p-5" style={{ borderColor: 'rgba(74,222,128,0.15)' }}>
          <div className="text-xs text-green-400/70 uppercase tracking-wider font-rubik mb-2">Реф. бонусы (внутренний)</div>
          <div className="font-oswald text-3xl text-green-400 font-bold mb-2">{(referralBalance || 0).toLocaleString()} ₽</div>
          <p className="text-xs text-white/20 font-rubik">Начисляется за приглашённых пользователей</p>
        </div>
      </div>

      {/* История транзакций */}
      <div className="card-glow rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="font-oswald text-lg text-white tracking-wide">История транзакций</h3>
        </div>
        {loadingTx ? (
          <div className="text-center py-8 text-white/30 font-rubik">Загрузка...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-white/30 font-rubik text-sm">Транзакций пока нет</div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="font-rubik text-sm text-white/80">{TX_LABELS[tx.type] || tx.type}</div>
                  <div className="text-xs text-white/30">{tx.description}</div>
                  <div className="text-xs text-white/20">{new Date(tx.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-right">
                  <div className={`font-oswald text-base font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ₽
                  </div>
                  <div className="text-xs text-white/30">{tx.balance_type === 'referral' ? 'Реф.' : 'Счёт'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}