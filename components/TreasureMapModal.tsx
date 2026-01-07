
import React from 'react';
import { X, Map as MapIcon, Lock, Unlock, Sparkles, ChevronRight, BookOpen } from 'lucide-react';

interface TreasureMapModalProps {
  onClose: () => void;
  collectedFragments: number[];
}

export const TreasureMapModal: React.FC<TreasureMapModalProps> = ({ onClose, collectedFragments }) => {
  const fragments = [
    {
      id: 0,
      title: '四獸山稜線圖',
      description: '紀錄了虎、豹、獅、象四山的高度與地形高低落差。',
      hint: '完成任務一：四獸山連線即可解鎖'
    },
    {
      id: 1,
      title: '岩層演變紀錄',
      description: '詳載了永春營區下方的砂岩結構與地殼運動痕跡。',
      hint: '完成任務二：岩層解密即可解鎖'
    },
    {
      id: 2,
      title: '陂塘集水脈絡',
      description: '揭示了地形如何將降水匯聚於永春陂，形成天然溼地。',
      hint: '完成任務三：等高線挑戰即可解鎖'
    }
  ];

  const allCollected = collectedFragments.length === 3;

  return (
    <div className="absolute inset-0 z-[1200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Decorative Header */}
        <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
            <h2 className="text-lg font-bold font-mono flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                尋寶手冊
            </h2>
            <button onClick={onClose} className="hover:bg-amber-600 rounded-full p-1 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            <div className="text-center mb-4">
                <div className="text-[10px] font-mono text-amber-600 uppercase tracking-widest mb-1">Fragments Recovery</div>
                <div className="flex items-center justify-center gap-4">
                    {[0, 1, 2].map(id => (
                        <div key={id} className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                            collectedFragments.includes(id) 
                            ? 'bg-amber-100 border-amber-500 text-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                            : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}>
                            {collectedFragments.includes(id) ? <Sparkles className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {fragments.map((f) => {
                    const isCollected = collectedFragments.includes(f.id);
                    return (
                        <div key={f.id} className={`p-4 rounded-lg border transition-all ${
                            isCollected ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 opacity-60'
                        }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {isCollected ? <Unlock className="w-4 h-4 text-amber-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                                <h3 className={`font-bold font-mono text-sm ${isCollected ? 'text-amber-800' : 'text-slate-500'}`}>
                                    {isCollected ? f.title : `碎片 #${f.id + 1} (加密中)`}
                                </h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed pl-7">
                                {isCollected ? f.description : f.hint}
                            </p>
                        </div>
                    );
                })}
            </div>

            {allCollected ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center animate-bounce mt-4">
                    <p className="text-emerald-700 font-bold text-sm">恭喜！已拼湊完整的永春陂古地圖！</p>
                    <p className="text-[10px] text-emerald-600 font-mono mt-1">THE ANCIENT MAP IS FULLY RESTORED</p>
                </div>
            ) : (
                <div className="text-center pt-4">
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                        需要 {3 - collectedFragments.length} 更多碎片以完整修復
                    </p>
                </div>
            )}
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-center">
            <button 
                onClick={onClose}
                className="px-8 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold font-mono text-sm transition-all"
            >
                返回地圖
            </button>
        </div>
      </div>
    </div>
  );
};
