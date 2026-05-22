import { HistoryItem, UserKey } from './CabinetTypes';

interface KeysTabProps {
  loading: boolean;
  myKeys: UserKey[];
}

interface HistoryTabProps {
  loading: boolean;
  history: HistoryItem[];
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function KeyIcon({ color, isUsed }: { color?: string; isUsed: boolean }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
      style={{
        background: isUsed ? 'rgba(255,255,255,0.05)' : `${color || '#6b7280'}22`,
        border: `1px solid ${isUsed ? 'rgba(255,255,255,0.08)' : `${color || '#6b7280'}55`}`,
      }}
    >
      {isUsed ? '🔓' : '🗝'}
    </div>
  );
}

export function CabinetKeysTab({ loading, myKeys }: KeysTabProps) {
  const active = myKeys.filter(k => !k.is_used);
  const used = myKeys.filter(k => k.is_used);

  return (
    <div className="space-y-4 fade-up-3">
      {/* Активные ключи */}
      <div className="card-glow rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-oswald text-lg text-white tracking-wide">Активные ключи</h3>
          <span className="text-xs font-rubik text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            {active.length} шт.
          </span>
        </div>
        {loading ? (
          <div className="text-center py-10 text-white/30 font-rubik text-sm">Загрузка...</div>
        ) : active.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">🗝</div>
            <div className="text-white/30 font-rubik text-sm">Нет активных ключей</div>
            <div className="text-white/20 font-rubik text-xs mt-1">Перейдите в раздел «Двери», чтобы купить ключ</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {active.map(k => (
              <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                <KeyIcon color={k.door_color} isUsed={false} />
                <div className="flex-1 min-w-0">
                  <div className="font-oswald text-sm text-white font-semibold truncate">{k.key_name}</div>
                  <div className="text-xs text-white/40 font-rubik truncate">{k.door_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-green-400 font-rubik bg-green-400/10 px-2 py-0.5 rounded-full">Готов к использованию</span>
                  <div className="text-xs text-white/20 font-rubik mt-1">{formatDate(k.purchased_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Использованные ключи */}
      {!loading && used.length > 0 && (
        <div className="card-glow rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-oswald text-base text-white/60 tracking-wide">Использованные ключи</h3>
            <span className="text-xs font-rubik text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              {used.length} шт.
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {used.map(k => (
              <div key={k.id} className="flex items-center gap-4 px-5 py-4 opacity-50">
                <KeyIcon color={k.door_color} isUsed={true} />
                <div className="flex-1 min-w-0">
                  <div className="font-oswald text-sm text-white/60 font-semibold truncate">{k.key_name}</div>
                  <div className="text-xs text-white/30 font-rubik truncate">{k.door_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-white/30 font-rubik">Использован</span>
                  <div className="text-xs text-white/20 font-rubik mt-1">{formatDate(k.purchased_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CabinetHistoryTab({ loading, history }: HistoryTabProps) {
  return (
    <div className="card-glow rounded-2xl overflow-hidden fade-up-3">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-oswald text-lg text-white tracking-wide">История открытий</h3>
        {history.length > 0 && (
          <span className="text-xs font-rubik text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {history.length} открытий
          </span>
        )}
      </div>
      {loading ? (
        <div className="text-center py-12 text-white/30 font-rubik text-sm">Загрузка...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🚪</div>
          <div className="text-white/30 font-rubik text-sm">Вы ещё не открывали дверей</div>
          <div className="text-white/20 font-rubik text-xs mt-1">Купите ключ и попробуйте своё везение</div>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {history.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                {item.prize_icon || '🎁'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald text-sm text-white font-semibold truncate">{item.door_name || '—'}</div>
                <div className="text-xs text-white/30 font-rubik mt-0.5">{formatDate(item.created_at)}</div>
              </div>
              <div className="text-right flex-shrink-0 max-w-[140px]">
                <div className="font-rubik text-sm text-gold-400 font-medium break-words">
                  {item.prize_won || 'Участник'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
