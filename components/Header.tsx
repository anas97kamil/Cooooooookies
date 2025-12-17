
import React, { useState, useEffect } from 'react';
import { FileText, History, Database, Wifi, WifiOff, RefreshCw, Clock, Calendar, DownloadCloud, BarChart3, Wallet } from 'lucide-react';

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
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="bg-[#1F2937] border-b border-gray-700 shadow-xl sticky top-0 z-40 no-print">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Right Section: Brand */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                 <div className="flex items-center gap-3">
                     <div className="bg-gradient-to-br from-[#FA8072] to-orange-600 p-2 rounded-xl shadow-lg">
                       <FileText className="text-white" size={18} />
                     </div>
                     <h1 className="font-bold text-base text-white leading-tight">نظام المبيعات</h1>
                 </div>

                 {/* Mobile Time Group (Like status bar) */}
                 <div className="md:hidden flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                    <div className={isOnline ? 'text-green-400' : 'text-red-400'}>
                        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                    </div>
                    <span className="text-[11px] font-bold text-white border-r border-gray-600 pr-2">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
            </div>
            
            {/* Center Section: Main Navigation Modules */}
            <div className="flex items-center gap-1 bg-gray-900/60 p-1 rounded-2xl border border-gray-700/50">
                <button onClick={onOpenAnalytics} className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all group" title="التحليلات">
                    <BarChart3 size={18} className="group-hover:text-green-400 transition-colors" />
                    <span className="text-[9px] font-bold mt-1">التحليلات</span>
                </button>

                <button onClick={onOpenExpenses} className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all group" title="المشتريات">
                    <Wallet size={18} className="group-hover:text-red-400 transition-colors" />
                    <span className="text-[9px] font-bold mt-1">المشتريات</span>
                </button>

                <button onClick={onOpenHistory} className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all group" title="الأرشيف">
                    <History size={18} className="group-hover:text-purple-400 transition-colors" />
                    <span className="text-[9px] font-bold mt-1">الأرشيف</span>
                </button>

                <button onClick={onOpenDataManagement} className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all group" title="البيانات">
                    <Database size={18} className="group-hover:text-blue-400 transition-colors" />
                    <span className="text-[9px] font-bold mt-1">البيانات</span>
                </button>
            </div>

            {/* Left Section: Utility Status Bar (Icons + Time) */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                 <div className="flex items-center bg-gray-900/80 px-2 py-1.5 rounded-full border border-gray-700/60 shadow-inner">
                    
                    {/* Status Icons */}
                    <div className="flex items-center gap-2.5 px-3 border-l border-gray-700/50 ml-1">
                        <button 
                            onClick={onManualSync}
                            disabled={isSyncing}
                            className={`text-blue-400 hover:text-blue-300 transition-all ${isSyncing ? 'animate-spin' : ''}`}
                            title={`آخر مزامنة: ${formatLastSync(lastSyncTime)}`}
                        >
                            <RefreshCw size={14} />
                        </button>

                        <button 
                            onClick={onQuickBackup}
                            className="text-gray-400 hover:text-white transition-all"
                            title="نسخة سريعة"
                        >
                            <DownloadCloud size={14} />
                        </button>

                        <div className={isOnline ? 'text-green-500/80' : 'text-red-500/80'}>
                             {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        </div>
                    </div>

                    {/* Clock & Date */}
                    <div className="hidden md:flex items-center gap-3 pr-2">
                        <div className="flex flex-col items-end justify-center leading-none">
                            <div className="flex items-center gap-1 font-black text-[11px] text-white">
                                <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                <Clock size={10} className="text-[#FA8072]" />
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-500 mt-0.5">
                                <span>{currentTime.toLocaleDateString('en-GB')}</span>
                                <Calendar size={8} />
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </header>
  );
};
