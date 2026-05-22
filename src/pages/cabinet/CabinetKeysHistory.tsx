import { KEY_COLORS, HistoryItem, UserKey } from './CabinetTypes';

interface KeysTabProps {
  loading: boolean;
  myKeys: UserKey[];
}

interface HistoryTabProps {
  loading: boolean;
  history: HistoryItem[];
}

export function CabinetKeysTab({ loading, myKeys }: KeysTabProps) {
  return (
    <div className="card-glow rounded-2xl overflow-hidden fade-up-3">
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="font-oswald text-lg text-white tracking-wide">Мои ключи</h3>
      </div>
      {loading ? (
        <div className="text-center py-12 text-white/30 font-rubik">Загрузка...</div>
      ) : myKeys.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🗝</div>
          <div className="text-white/30 font-rubik text-sm">Ключей пока нет. Купите ключ на странице Дверей</div>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {myKeys.map(k => (
            <div key={k.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`text-2xl border rounded-lg p-2 ${KEY_COLORS[k.key_type] || KEY_COLORS.common}`}>🗝</div>
                <div>
                  <div className={`font-oswald text-sm font-bold ${KEY_COLORS[k.key_type]?.split(' ')[0] || 'text-white/70'}`}>{k.key_name}</div>
                  <div className="text-xs text-white/30 font-rubik">{k.door_name}</div>
                </div>
              </div>
              <div className="text-right">
                {k.is_used ? (
                  <span className="text-xs text-white/30 font-rubik">Использован</span>
                ) : (
                  <span className="text-xs text-green-400 font-rubik bg-green-400/10 px-2 py-0.5 rounded-full">Доступен</span>
                )}
                <div className="text-xs text-white/20 mt-0.5">{new Date(k.purchased_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CabinetHistoryTab({ loading, history }: HistoryTabProps) {
  return (
    <div className="card-glow rounded-2xl overflow-hidden fade-up-3">
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="font-oswald text-lg text-white tracking-wide">История открытий</h3>
      </div>
      {loading ? (
        <div className="text-center py-12 text-white/30 font-rubik">Загрузка...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🚪</div>
          <div className="text-white/30 font-rubik text-sm">Вы ещё не открывали дверей</div>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {history.map(item => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.prize_icon}</span>
                <div>
                  <div className="font-rubik text-sm text-white/80">{item.door_name}</div>
                  <div className="text-xs text-white/30">{new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>
              <div className="font-oswald text-sm font-bold text-green-400">{item.prize_won}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
