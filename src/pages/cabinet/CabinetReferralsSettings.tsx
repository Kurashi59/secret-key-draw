import Icon from '@/components/ui/icon';
import { ReferralTreeNode } from './CabinetTypes';

interface CabinetReferralsTabProps {
  referralCode: string;
  referralLink: string;
  referralInvited: number;
  referralBalance: number;
  copied: boolean;
  onCopy: () => void;
  memberNumber: string;
  tree: ReferralTreeNode[];
  treeLoading: boolean;
}

interface CabinetSettingsTabProps {
  passwordForm: { old_password: string; new_password: string; new_password2: string };
  onPasswordChange: (patch: Partial<{ old_password: string; new_password: string; new_password2: string }>) => void;
  saveLoading: boolean;
  saveMsg: string;
  onSave: (e: React.FormEvent) => void;
  onLogout: () => void;
  onResetVersion: () => void;
}

export function CabinetReferralsTab({
  referralCode, referralLink, referralInvited, referralBalance, copied, onCopy,
  memberNumber, tree, treeLoading,
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

      <div className="card-glow rounded-2xl p-6">
        <h3 className="font-oswald text-lg text-white mb-1 tracking-wide">Реферальное дерево</h3>
        <p className="text-xs text-white/30 font-rubik mb-5">Ваша структура: приглашённые и их наставники</p>
        {treeLoading ? (
          <div className="text-center py-8 text-white/30 font-rubik text-sm">Загрузка...</div>
        ) : tree.length <= 1 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🌳</div>
            <div className="text-white/30 font-rubik text-sm">Пока никого не пригласили</div>
          </div>
        ) : (
          <div className="space-y-2">
            {tree.filter(n => n.level > 0).map(node => (
              <div key={node.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                style={{ marginLeft: `${(node.level - 1) * 20}px` }}>
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-xs font-oswald text-gold-400 flex-shrink-0">
                  {node.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-rubik text-sm text-white/90 truncate">{node.name}</div>
                  <div className="text-xs text-white/30 font-rubik">№ {node.member_number}</div>
                </div>
                <div className="hidden sm:flex flex-col text-right text-xs text-white/30 font-rubik gap-0.5">
                  {node.mentor1 && <span>1: {node.mentor1.member_number}</span>}
                  {node.mentor2 && <span>2: {node.mentor2.member_number}</span>}
                  {node.mentor3 && <span>3: {node.mentor3.member_number}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-white/20 font-rubik mt-4">Ваш номер пайщика: <span className="text-white/40">{memberNumber}</span></p>
      </div>
    </div>
  );
}

export function CabinetSettingsTab({
  passwordForm, onPasswordChange, saveLoading, saveMsg, onSave, onLogout, onResetVersion,
}: CabinetSettingsTabProps) {
  return (
    <div className="card-glow rounded-2xl p-6 fade-up-3">
      <h3 className="font-oswald text-lg text-white mb-1 tracking-wide">Смена пароля</h3>
      <p className="text-xs text-white/30 font-rubik mb-5">Логин (номер пайщика) и наставников может изменить только администратор</p>
      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Текущий пароль</label>
          <input type="password" value={passwordForm.old_password}
            onChange={e => onPasswordChange({ old_password: e.target.value })}
            placeholder="••••••••" required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Новый пароль</label>
          <input type="password" value={passwordForm.new_password}
            onChange={e => onPasswordChange({ new_password: e.target.value })}
            placeholder="Минимум 6 символов" required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-rubik uppercase tracking-wider mb-2">Повторите новый пароль</label>
          <input type="password" value={passwordForm.new_password2}
            onChange={e => onPasswordChange({ new_password2: e.target.value })}
            placeholder="••••••••" required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-rubik text-sm focus:outline-none focus:border-gold-500/50 transition-colors placeholder-white/20" />
        </div>
        {saveMsg && <p className={`text-sm font-rubik ${saveMsg === 'Пароль изменён!' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saveLoading} className="btn-gold px-8 py-3 rounded-xl text-sm disabled:opacity-60">
            {saveLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={onLogout} className="px-6 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-rubik hover:border-red-500/40 transition-colors">
            Выйти
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-white/5">
        <p className="text-xs text-white/30 font-rubik mb-3">Версия отображения сайта</p>
        <button type="button" onClick={onResetVersion}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-xs font-rubik hover:border-white/20 hover:text-white/60 transition-all">
          <Icon name="Monitor" size={14} />
          Изменить версию сайта (мобильная / компьютерная)
        </button>
      </div>
    </div>
  );
}