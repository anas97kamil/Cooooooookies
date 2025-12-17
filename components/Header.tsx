
import React, { useState, useEffect } from 'react';
import { FileText, History, Database, Wifi, WifiOff, RefreshCw, Clock, Calendar, Download, Wallet, DownloadCloud, BarChart3 } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenDataManagement: () => void;
  onOpenExpenses: () => void;
  onOpenAnalytics: () => void;
  isOnline: boolean;
  lastSyncTime: Date;
  onManualSync: () => void;
  onQuickBackup: () => void;
  isSyncing: boolean;
  installPrompt?: any;
  onInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenHistory, 
  onOpenDataManagement, 
  onOpenExpenses,
  onOpenAnalytics,
  isOnline,
  lastSyncTime,
  onManualSync,
  onQuickBackup,
  isSyncing,
  installPrompt,
  onInstall
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLastSync = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="bg-[#1F2937] border-b border-gray-700 shadow-lg sticky top-0 z-40 no-print">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Right Section: Identity & Status */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                 <div className="flex items-center gap-3">
                     <div className="bg-gradient-to-br from-[#FA8072] to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/20">
                       <FileText className="text-white" size={20} />
                     </div>
                     <div className="flex flex-col">
                        <h1 className="font-bold text-lg text-white leading-tight">نظام المبيعات</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 font-medium">مخبز كوكيز</span>
                            <span className="text-gray-600 text-[10px]">•</span>
                            <div className={`flex items-center gap-1 text-[10px] font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                                <span>{isOnline ? 'متصل' : 'أوفلاين'}</span>
                            </div>
                        </div>
                     </div>
                 </div>

                 <div className="md:hidden flex flex-col items-end justify-center bg-[#FA8072]/10 border border-[#FA8072]/20 text-white px-3 py-1 rounded-xl">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#FA8072]">
                         <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                         <Clock size={10} />
                    </div>
                 </div>
            </div>
            
            {/* Left Section: Actions Toolbar */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-gray-800/50 p-1.5 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                 
                 {installPrompt && onInstall && (
                    <button onClick={onInstall} className="flex items-center gap-1 bg-[#FA8072] hover:bg-[#e67365] text-white px-3 py-1.5 rounded-xl transition-all shadow-md mr-1 animate-pulse">
                        <Download size={14} />
                        <span className="text-xs font-bold">تثبيت</span>
                    </button>
                 )}

                 <div className="flex items-center gap-1">
                    <button 
                        onClick={onManualSync}
                        disabled={isSyncing}
                        className={`flex flex-col items-center justify-center px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl transition-all group min-w-[100px] ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="مزامنة لحظية للبيانات في المتصفح"
                    >
                        <div className="flex items-center gap-2">
                            <RefreshCw size={14} className={`${isSyncing ? 'animate-spin text-white' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span className="text-[11px] font-black uppercase tracking-wider">{isSyncing ? 'جاري...' : 'مزامنة'}</span>
                        </div>
                        <span className="text-[9px] font-bold text-blue-300/60 mt-0.5">
                            {formatLastSync(lastSyncTime)}
                        </span>
                    </button>

                    <button 
                        onClick={onQuickBackup}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-xl transition-all group"
                        title="تحميل نسخة احتياطية فورية"
                    >
                        <DownloadCloud size={16} className="group-hover:text-blue-400 transition-colors" />
                        <span className="text-xs font-bold hidden sm:inline">نسخة سريعة</span>
                    </button>
                 </div>

                 <div className="w-px h-6 bg-gray-700 mx-1"></div>

                 <div className="flex items-center gap-1">
                    <button onClick={onOpenAnalytics} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 transition-colors group" title="التحليلات والرسوم البيانية">
                        <BarChart3 size={18} className="group-hover:text-green-400 transition-colors" />
                        <span className="text-xs font-bold hidden lg:inline">التحليلات</span>
                    </button>

                    <button onClick={onOpenExpenses} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 transition-colors group" title="المشتريات">
                        <Wallet size={18} className="group-hover:text-red-400 transition-colors" />
                        <span className="text-xs font-bold hidden lg:inline">المشتريات</span>
                    </button>

                    <button onClick={onOpenHistory} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 transition-colors group" title="المبيعات">
                        <History size={18} className="group-hover:text-purple-400 transition-colors" />
                        <span className="text-xs font-bold hidden lg:inline">المبيعات</span>
                    </button>

                    <button onClick={onOpenDataManagement} className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 transition-colors group" title="إدارة البيانات">
                        <Database size={18} className="group-hover:text-blue-400 transition-colors" />
                        <span className="text-xs font-bold hidden lg:inline">البيانات</span>
                    </button>
                 </div>
                 
                 <div className="hidden md:flex flex-col items-end justify-center bg-[#FA8072] text-white px-3 py-1 rounded-xl shadow-md ml-1 min-w-[100px]">
                    <div className="flex items-center gap-1.5 font-bold text-xs border-b border-white/20 pb-0.5 w-full justify-end">
                         <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                         <Clock size={10} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium pt-0.5 w-full justify-end">
                        <span>{currentTime.toLocaleDateString('en-GB')}</span>
                        <Calendar size={10} />
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </header>
  );
};
