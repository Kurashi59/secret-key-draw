import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Door, Prize, PrizeFreq } from './AdminTypes';

export function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
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

export function PrizesEditor({ door, onClose }: { door: Door; onClose: () => void }) {
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
