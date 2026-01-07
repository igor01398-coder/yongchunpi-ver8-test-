
import React, { useState } from 'react';
import { X, Settings, Volume2, VolumeX, Eye, EyeOff, RotateCcw, Lock, CloudFog, Download, FileText, Copy, Check, MessageSquare, ClipboardCheck } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  isSfxEnabled: boolean;
  onToggleSfx: (enabled: boolean) => void;
  isFogEnabled: boolean;
  onToggleFog: () => void;
  isFogTimeReached: boolean;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isSfxEnabled,
  onToggleSfx,
  isFogEnabled,
  onToggleFog,
  isFogTimeReached,
  onResetGame
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const generateReportString = (): string | null => {
    try {
        const STORAGE_KEY = 'yongchun_save_v1';
        const savedRaw = localStorage.getItem(STORAGE_KEY);
        
        if (!savedRaw) {
            alert("尚無存檔紀錄，無法匯出。");
            return null;
        }

        const data = JSON.parse(savedRaw);
        const { teamName, playerStats, startTime, endTime, puzzleProgress } = data;
        
        // Helper to format date
        const fmtDate = (isoStr: string) => isoStr ? new Date(isoStr).toLocaleString('zh-TW') : '未完成';
        
        // Construct Report
        let report = `=== 永春陂地質調查報告 ===\n`;
        report += `匯出時間: ${new Date().toLocaleString('zh-TW')}\n`;
        report += `------------------------\n`;
        report += `隊伍名稱: ${teamName || 'Unknown'}\n`;
        report += `目前階級: ${playerStats?.rank} (Lv.${playerStats?.level})\n`;
        report += `開始時間: ${fmtDate(startTime)}\n`;
        report += `結束時間: ${fmtDate(endTime)}\n`;
        report += `------------------------\n\n`;

        // Mission 1
        const m1 = puzzleProgress?.['1'];
        if (m1) {
            report += `【任務一：四獸山連線】\n`;
            report += `狀態: ${m1.isQuizSolved ? '已完成' : '進行中'}\n`;
            report += `失敗/錯誤次數: ${m1.failureCount || 0}\n`;
            if (m1.m1Heights) {
                report += `[高度測量]\n`;
                report += `  - 虎山: ${m1.m1Heights.tiger || '-'} m\n`;
                report += `  - 豹山: ${m1.m1Heights.leopard || '-'} m\n`;
                report += `  - 獅山: ${m1.m1Heights.lion || '-'} m\n`;
                report += `  - 象山: ${m1.m1Heights.elephant || '-'} m\n`;
            }
            report += `[地形觀察]: ${m1.m1Reason || '未填寫'}\n\n`;
        } else {
             report += `【任務一】：尚未開始\n\n`;
        }

        // Mission 2
        const m2 = puzzleProgress?.['2'];
        if (m2) {
            report += `【任務二：岩層解密】\n`;
            report += `失敗/錯誤次數: ${m2.failureCount || 0}\n`;
            report += `[地層問答]: ${m2.quizInput || '未作答'}\n`;
            report += `[採樣筆記]: ${m2.imageDescription || '未填寫'}\n\n`;
        } else {
             report += `【任務二】：尚未開始\n\n`;
        }

        // Mission 3
        const m3 = puzzleProgress?.['3'];
        if (m3) {
            report += `【任務三：等高線挑戰】\n`;
            report += `失敗/錯誤次數: ${m3.failureCount || 0}\n`;
            report += `[等高線判讀]: 等高線越「${m3.quizSelect1 || '-'}」，爬起來越「${m3.quizSelect2 || '-'}」，坡度感受「${m3.quizSelect3 || '-'}」\n`;
            report += `[路線繪製筆記]: ${m3.imageDescription || '未填寫'}\n\n`;
        } else {
             report += `【任務三】：尚未開始\n\n`;
        }

        // Side Missions
        const s1 = puzzleProgress?.['s1'];
        if (s1 && s1.sideMissionSubmissions && s1.sideMissionSubmissions.length > 0) {
            report += `【支線任務：擋土牆獵人】(共 ${s1.sideMissionSubmissions.length} 筆紀錄)\n`;
            report += `失敗/錯誤次數: ${s1.failureCount || 0}\n`;
            s1.sideMissionSubmissions.forEach((sub: any, idx: number) => {
                report += `  #${idx + 1} [${new Date(sub.timestamp).toLocaleTimeString()}]: ${sub.description || '無文字說明'}\n`;
            });
            report += `\n`;
        } else {
             report += `【支線任務】：無紀錄\n\n`;
        }
        
        return report;
    } catch (e) {
        console.error("Report Generation failed:", e);
        return null;
    }
  };

  const handleDownload = () => {
    const report = generateReportString();
    if (!report) return;
    
    try {
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const STORAGE_KEY = 'yongchun_save_v1';
        const savedRaw = localStorage.getItem(STORAGE_KEY);
        const data = savedRaw ? JSON.parse(savedRaw) : {};
        
        link.href = url;
        link.download = `yongchun_report_${data.teamName || 'data'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed:", e);
        alert("下載失敗。");
    }
  };

  const handleCopy = async () => {
    const report = generateReportString();
    if (!report) return;
    
    try {
        await navigator.clipboard.writeText(report);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
        console.error("Copy failed:", e);
        alert("複製失敗，請手動複製。");
    }
  };

  return (
    <div className="absolute inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden relative">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold font-mono text-slate-700 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> 系統設定
                </h2>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-900"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 space-y-6">
                
                {/* Audio Setting */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSfxEnabled ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                            {isSfxEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">音效 (SFX)</div>
                            <div className="text-xs text-slate-500">介面點擊與任務提示音</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onToggleSfx(!isSfxEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isSfxEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isSfxEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                {/* Fog Setting */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isFogEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            {isFogEnabled ? <CloudFog className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">探險迷霧 (Mysterious Mist)</div>
                            <div className="text-xs text-slate-500">
                                {isFogTimeReached ? "已啟動：視野受限" : "尚未啟動：20分鐘後開啟"}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onToggleFog}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isFogEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isFogEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                <hr className="border-slate-100" />

                {/* Export Report */}
                <div className="space-y-3">
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        探險紀錄匯出
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-mono font-bold transition-colors"
                        >
                            {copySuccess ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copySuccess ? "已複製" : "複製文字"}
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-mono font-bold transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            下載檔案
                        </button>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Survey Link */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-100 rounded text-purple-600">
                            <ClipboardCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-purple-800 text-sm mb-1">活動回饋 (Survey)</div>
                            <p className="text-xs text-purple-600 mb-3 leading-relaxed">
                                探險結束後，請協助填寫。
                            </p>
                            <a 
                                href="https://docs.google.com/forms/d/e/1FAIpQLSdAGXib_RfYl3wLCIHezeNzJBtYzvnz_RU9NA9eXr_qjIWJNQ/viewform"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-purple-200 hover:bg-purple-300 text-purple-800 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <ClipboardCheck className="w-3 h-3" />
                                填寫回饋單
                            </a>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Reset Game */}
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-rose-100 rounded text-rose-600">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-rose-800 text-sm mb-1">重置遊戲進度</div>
                            <p className="text-xs text-rose-600 mb-3 leading-relaxed">
                                清除所有紀錄並回到初始畫面。此動作無法復原。
                            </p>
                            <button 
                                onClick={onResetGame}
                                className="w-full bg-rose-200 hover:bg-rose-300 text-rose-800 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="w-3 h-3" />
                                確認重置
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
