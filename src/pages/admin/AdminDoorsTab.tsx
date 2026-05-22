import Icon from '@/components/ui/icon';
import { Door, COLORS, RARITIES } from './AdminTypes';

interface AdminDoorsTabProps {
  doors: Door[];
  doorMsg: string;
  editingDoor: number | null;
  doorDraft: Partial<Door & { draw_at_input: string }>;
  inputCls: string;
  onCreateDoor: () => void;
  onStartEdit: (door: Door) => void;
  onSaveDoor: (id: number) => void;
  onDeleteDoor: (id: number) => void;
  onCancelEdit: () => void;
  onSetPrizesForDoor: (door: Door) => void;
  onDoorDraftChange: (patch: Partial<Door & { draw_at_input: string }>) => void;
}

export function AdminDoorsTab({
  doors, doorMsg, editingDoor, doorDraft, inputCls,
  onCreateDoor, onStartEdit, onSaveDoor, onDeleteDoor, onCancelEdit,
  onSetPrizesForDoor, onDoorDraftChange,
}: AdminDoorsTabProps) {
  return (
    <div className="space-y-4 fade-up-3">
      {doorMsg && <p className={`text-sm font-rubik ${doorMsg.includes('Ошибка') || doorMsg.includes('ошибка') ? 'text-red-400' : 'text-green-400'}`}>{doorMsg}</p>}
      <button onClick={onCreateDoor} className="btn-gold px-5 py-2 rounded-xl text-sm">+ Создать дверь</button>
      {doors.map(door => (
        <div key={door.id} className="card-glow rounded-xl p-4">
          {editingDoor === door.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-rubik block mb-1">Название двери</label>
                  <input value={doorDraft.name || ''} onChange={e => onDoorDraftChange({ name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-rubik block mb-1">Название ключа</label>
                  <input value={doorDraft.key_name || ''} onChange={e => onDoorDraftChange({ key_name: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-rubik block mb-1">Иконка приза</label>
                  <input value={doorDraft.prize_icon || ''} onChange={e => onDoorDraftChange({ prize_icon: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-rubik block mb-1">Описание приза</label>
                  <input value={doorDraft.prize || ''} onChange={e => onDoorDraftChange({ prize: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-rubik block mb-1">Цена ключа (₽)</label>
                  <input type="number" value={doorDraft.key_price || 0} onChange={e => onDoorDraftChange({ key_price: +e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-rubik block mb-1">Редкость</label>
                  <select value={doorDraft.rarity || 'common'} onChange={e => onDoorDraftChange({ rarity: e.target.value })} className={inputCls}>
                    {RARITIES.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 font-rubik block mb-1">Цвет двери</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => onDoorDraftChange({ color: c })}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${doorDraft.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                  <input type="color" value={doorDraft.color || '#6b7280'} onChange={e => onDoorDraftChange({ color: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" title="Свой цвет" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 font-rubik block mb-1">Дата/время розыгрыша</label>
                <input type="datetime-local" value={doorDraft.draw_at_input || ''} onChange={e => onDoorDraftChange({ draw_at_input: e.target.value })} className={inputCls} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!doorDraft.instant_open}
                    onChange={e => onDoorDraftChange({ instant_open: e.target.checked })} className="w-4 h-4 accent-gold-500" />
                  <span className="text-xs text-white/60 font-rubik">Мгновенное открытие</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!doorDraft.is_active}
                    onChange={e => onDoorDraftChange({ is_active: e.target.checked })} className="w-4 h-4 accent-gold-500" />
                  <span className="text-xs text-white/60 font-rubik">Активна</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" title="Только одна дверь может быть стартовой">
                  <input type="checkbox" checked={!!doorDraft.is_trigger}
                    onChange={e => onDoorDraftChange({ is_trigger: e.target.checked })} className="w-4 h-4 accent-gold-500" />
                  <span className="text-xs text-gold-400 font-rubik">Стартовая дверь (открывает доступ к остальным)</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSaveDoor(door.id)} className="btn-gold px-5 py-2 rounded-xl text-sm">Сохранить</button>
                <button onClick={onCancelEdit} className="px-5 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-rubik hover:border-white/20">Отмена</button>
                <button onClick={() => onDeleteDoor(door.id)} className="px-5 py-2 rounded-xl bg-red-900/30 border border-red-500/20 text-red-400 text-sm font-rubik hover:bg-red-900/50 ml-auto">
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
                <button onClick={() => onSetPrizesForDoor(door)} className="px-3 py-1.5 rounded-xl border border-gold-500/30 text-gold-400 text-xs font-oswald uppercase tracking-wider hover:border-gold-400/50">
                  Призы
                </button>
                <button onClick={() => onStartEdit(door)} className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 text-xs font-oswald uppercase tracking-wider hover:border-white/20">
                  Изменить
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
