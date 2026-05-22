import Icon from '@/components/ui/icon';

interface CabinetReferralsTabProps {
  referralCode: string;
  referralLink: string;
  referralInvited: number;
  referralBalance: number;
  copied: boolean;
  onCopy: () => void;
}

interface CabinetSettingsTabProps {
  profileForm: { name: string; full_name: string; phone: string; birth_date: string };
  onProfileChange: (patch: Partial<{ name: string; full_name: string; phone: string; birth_date: string }>) => void;
  saveLoading: boolean;
  saveMsg: string;
  onSave: (e: React.FormEvent) => void;
  onLogout: () => void;
}

export function CabinetReferralsTab({
  referralCode, referralLink, referralInvited, referralBalance, copied, onCopy,
}: CabinetReferralsTabProps) {
  return (
    <div className="space-y-4 fade-up-3">
      <div className="card-glow rounded-2xl p-6">
        <h3 className="font-oswald text-lg text-white mb-1 tracking-wide">Ваш реферальный код</h3>
        <p className="text-xs text-white/30 font-rubik mb-5">За каждого приглашённого — 10% с его первой покупки ключа</p>
        <div className="bg-black/40 border border-gold-500/20 rounded-xl px-4 py-3 mb-3 text-center">
          <div className="font-oswald text-2xl text-gold-400 tracking-widest">{referralCode}</div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-xs text-white/40 font-rubik truncate">{referralLink}</div>
          <button onClick={onCopy} className="btn-gold px-4 py-2 rounded-xl text-xs flex-shrink-0">
            {copied ? '✓' : <Icon name="Copy" size={14} />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card-glow rounded-xl p-4 text-center">
          <div className="font-oswald text-2xl text-white font-bold">{referralInvited}</div>
          <div className="text-xs text-white/40 font-rubik mt-1">Приглашено</div>
        </div>
        <div className="card-glow rounded-xl p-4 text-center">
          <div className="font-oswald text-2xl text-green-400 font-bold">{referralBalance} ₽</div>
          <div className="text-xs text-white/40 font-rubik mt-1">Реф. бонусов</div>
        </div>
      </div>
    </div>
  );
}

export function CabinetSettingsTab({
  profileForm, onProfileChange, saveLoading, saveMsg, onSave, onLogout,
}: CabinetSettingsTabProps) {
  const fields = [
    { key: 'name',       label: 'Отображаемое имя',   placeholder: 'Александр',                    type: 'text' },
    { key: 'full_name',  label: 'ФИО полностью',       placeholder: 'Иванов Александр Петрович',    type: 'text' },
    { key: 'phone',      label: 'Телефон',             placeholder: '+7 900 000-00-00',             type: 'tel'  },
    { key: 'birth_date', label: 'Дата рождения',       placeholder: '',                             type: 'date' },
  ] as const;

  return (
    <div className="card-glow rounded-2xl p-6 fade-up-3">
      <h3 className="font-oswald text-lg text-white mb-5 tracking-wide">Настройки профиля</h3>
      <form onSubmit={onSave} className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">{f.label}</label>
            <input type={f.type} value={profileForm[f.key]}
              onChange={e => onProfileChange({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
          </div>
        ))}
        {saveMsg && <p className={`text-sm font-rubik ${saveMsg === 'Сохранено!' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saveLoading} className="btn-gold px-8 py-3 rounded-xl text-sm disabled:opacity-60">
            {saveLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={onLogout} className="px-6 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-rubik hover:border-red-500/40 transition-colors">
            Выйти
          </button>
        </div>
      </form>
    </div>
  );
}
