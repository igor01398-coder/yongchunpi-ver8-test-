
import React from 'react';
import { X, BookOpen, Target, Shield, Camera, CloudFog, Map as MapIcon, ChevronRight, Info } from 'lucide-react';

interface ManualModalProps {
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-[1300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold font-mono text-teal-700 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            操作指引 
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Welcome Section */}
          <section>
            <h3 className="text-xs font-mono font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> 歡迎，小小地質學家
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              本調查任務旨在破解永春陂老照片中的地景密碼。請利用地圖與導覽工具前往指定座標，收集地質數據。
            </p>
          </section>

          {/* Mission Types */}
          <section>
            <h3 className="text-xs font-mono font-bold text-teal-600 uppercase tracking-widest mb-3">任務類型 (MISSION TYPES)</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 bg-amber-100 rounded flex items-center justify-center text-amber-600 shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">主線任務</h4>
                  <p className="text-xs text-slate-500">調查關鍵地標，破解地形、地層與稜線之謎。完成三項主線即可達成結局。</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">支線調查</h4>
                  <p className="text-xs text-slate-500">可重複進行的野外觀察，如尋找擋土牆。每次上傳皆可獲得額外經驗值。</p>
                </div>
              </div>
            </div>
          </section>

          {/* Ranks */}
          <section>
            <h3 className="text-xs font-mono font-bold text-teal-600 uppercase tracking-widest mb-3">階級系統 (RANKING)</h3>
            <div className="space-y-2">
              {[
                { rank: 'Cadet', title: '地質實習生', xp: '0 XP' },
                { rank: 'Scout', title: '地形線索搜查員', xp: '500 XP' },
                { rank: 'Ranger', title: '地層守護者', xp: '1000 XP' },
                { rank: 'Master', title: '永春陂調查大師', xp: '1500+ XP' }
              ].map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-4 h-4 ${idx === 0 ? 'text-slate-300' : 'text-teal-500'}`} />
                    <span className="text-xs font-mono font-bold text-slate-400">{r.rank}</span>
                    <span className="text-sm font-bold text-slate-700">{r.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{r.xp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Special Mechanics */}
          <section className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <h3 className="text-xs font-mono font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CloudFog className="w-4 h-4" /> 警報：探險迷霧
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed mb-3">
              遊戲開始 20 分鐘後，環境將變得不穩定。地圖將被「探險迷霧」籠罩，你必須靠近任務目標（80公尺內）才能看見其位置。
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 font-mono">
              <ChevronRight className="w-3 h-3" />
              請善用左下角的「導航箭頭」尋找方向
            </div>
          </section>

          {/* Map Tools */}
          <section>
            <h3 className="text-xs font-mono font-bold text-teal-600 uppercase tracking-widest mb-3">地圖工具 (MAP TOOLS)</h3>
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <MapIcon className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <div className="text-[10px] font-bold">Mapy</div>
                <div className="text-[9px] text-slate-400">觀察等高線</div>
              </div>
              <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <MapIcon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <div className="text-[10px] font-bold">GeoMap</div>
                <div className="text-[9px] text-slate-400">地質分佈圖</div>
              </div>
              <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <Shield className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="text-[10px] font-bold">AI Verify</div>
                <div className="text-[9px] text-slate-400">實地影像驗證</div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button 
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-bold font-mono transition-all shadow-md active:scale-95"
          >
            我明白任務內容了
          </button>
        </div>

      </div>
    </div>
  );
};
