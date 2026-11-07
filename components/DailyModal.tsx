import React from 'react';
import { X, Gift, Check } from 'lucide-react';
import { Button } from './Button';
import {
  EGG_INFO, MISSION_BONUS, PlayerProgress, SNACKS, STAMP_CARD_SIZE, SnackType, StampResult, rewardLabel,
} from '../services/progress';

interface DailyModalProps {
  progress: PlayerProgress;
  stampResult: StampResult | null;
  onClaimMission: (id: string) => void;
  onClose: () => void;
}

export const DailyModal: React.FC<DailyModalProps> = ({ progress, stampResult, onClaimMission, onClose }) => {
  // Right after the 7th stamp the card resets to 0, but we still want to show it full.
  const shownStamps = stampResult?.stamped ? stampResult.count : progress.stamps.count;
  const missions = progress.missions.list;
  const allDone = missions.length > 0 && missions.every(m => m.claimed);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl animate-pop-in relative max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="とじる" className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-black text-gray-800 mb-3 flex items-center gap-2"><Gift className="w-6 h-6 text-pink-500" />きょうの おたのしみ</h2>

        {/* Stamp card */}
        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-3 border-2 border-yellow-200 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-black text-yellow-700 text-sm">まいにち スタンプ</span>
            <span className="text-[11px] font-bold text-yellow-600">7こ たまると 🌟きんの タマゴ！</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: STAMP_CARD_SIZE }, (_, i) => {
              const filled = i < shownStamps;
              const isNew = stampResult?.stamped && i === shownStamps - 1;
              return (
                <div key={i} className={`aspect-square rounded-full flex items-center justify-center text-lg border-2 ${filled ? 'bg-pink-400 border-pink-500 text-white' : 'bg-white border-dashed border-yellow-300 text-yellow-300'} ${isNew ? 'animate-pop-in ring-4 ring-pink-200' : ''}`}>
                  {filled ? '💮' : i === STAMP_CARD_SIZE - 1 ? '🌟' : i + 1}
                </div>
              );
            })}
          </div>
          {stampResult?.stamped && (
            <p className="mt-2 text-center text-sm font-black text-pink-600 animate-fade-in">
              きょうの スタンプ ゲット！ {stampResult.rewards.map(rewardLabel).join('・')}
            </p>
          )}
        </section>

        {/* Missions */}
        <section className="mb-4">
          <div className="font-black text-gray-700 text-sm mb-2">きょうの ミッション</div>
          <ul className="space-y-2">
            {missions.map(m => {
              const done = m.progress >= m.target;
              return (
                <li key={m.id} className={`flex items-center gap-2 rounded-2xl p-2.5 border-2 ${m.claimed ? 'bg-gray-50 border-gray-100 opacity-70' : done ? 'bg-green-50 border-green-300' : 'bg-white border-gray-100'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-gray-800">{m.label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${(m.progress / m.target) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">{m.progress}/{m.target}</span>
                    </div>
                    <div className="text-[11px] font-bold text-pink-500 mt-0.5">ごほうび: {rewardLabel(m.reward)}</div>
                  </div>
                  {m.claimed ? (
                    <span className="text-xs font-black text-gray-400 flex items-center gap-0.5"><Check className="w-4 h-4" />もらった</span>
                  ) : (
                    <button onClick={() => onClaimMission(m.id)} disabled={!done}
                      className={`text-xs font-black px-3 py-2 rounded-full shrink-0 ${done ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white animate-bounce shadow' : 'bg-gray-100 text-gray-400'}`}>
                      もらう
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={`text-center text-xs font-bold mt-2 ${allDone ? 'text-green-600' : 'text-gray-500'}`}>
            {allDone ? 'ぜんぶ クリア！ すごい！' : `3つ ぜんぶで ボーナス ${rewardLabel(MISSION_BONUS)}`}
          </p>
        </section>

        {/* Inventory */}
        <section className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-2xl p-2.5 border border-gray-100">
            <div className="text-[11px] font-black text-gray-500 mb-1">おやつ</div>
            <div className="flex gap-2 text-sm font-black text-gray-700">
              {(Object.keys(SNACKS) as SnackType[]).map(s => <span key={s}>{SNACKS[s].emoji}×{progress.snacks[s]}</span>)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-2.5 border border-gray-100">
            <div className="text-[11px] font-black text-gray-500 mb-1">タマゴ</div>
            {progress.egg ? (
              <div className="text-sm font-black text-gray-700">
                {EGG_INFO[progress.egg.tier].emoji} {progress.egg.warmth}/{EGG_INFO[progress.egg.tier].need}
                <span className="block text-[10px] text-gray-400 font-bold">ステージ クリアで あたたまる</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-gray-400">もっていない</div>
            )}
          </div>
        </section>

        <Button onClick={onClose} size="lg" className="w-full">あそびに いく！</Button>
      </div>
    </div>
  );
};
