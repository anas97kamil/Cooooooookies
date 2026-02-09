import React, { useState, useEffect } from 'react';
import { FileText, History, Database, Wifi, WifiOff, RefreshCw, Clock, DownloadCloud, BarChart3, Wallet, LogOut, AppWindow } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenDataManagement: () => void;
  onOpenExpenses: () => void;
  onOpenAnalytics: () => void;
  onLogout: () => void;
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
  onLogout,
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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <header className="bg-[#1F2937] border-b border-gray-700 shadow-xl sticky top-0 z-40 no-print">
      <div className="container mx-auto px-4 py-1.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            
            {/* Right Side: Brand & Mobile Status */}
            <div className="flex items-center justify-between w-full md:w-auto">
                 <div className="flex items-center gap-2">
                     <div className="bg-gradient-to-br from-[#FA8072] to-orange-600 p-1.5 rounded-lg shadow-lg">
                       <FileText className="text-white" size={16} />
                     </div>
                     <h1 className="font-bold text-sm text-white leading-tight">نظام المبيعات</h1>
                 </div>

                 {/* Mobile Android-style Status Bar */}
                 <div className="md:hidden flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-gray-700">
                    {installPrompt && (
                      <button onClick={onInstall} className="text-orange-400 animate-pulse px-2 ml-1 border-l border-gray-700/50">
                        <AppWindow size={14} />
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 px-2 border-l border-gray-700/50">
                        <button onClick={onQuickBackup} className="text-gray-400"><DownloadCloud size={12} /></button>
                        <button onClick={onManualSync} disabled={isSyncing} className={`text-blue-400 ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={12} /></button>
                        <div className={isOnline ? 'text-green-500' : 'text-red-500 animate-pulse'}>
                          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-white px-1 tabular-nums">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                 </div>
            </div>
            
            {/* Center: Navigation Buttons */}
            <div className="flex items-center gap-0.5 bg-gray-900/40 p-1 rounded-xl border border-gray-800/50">
                <button onClick={onOpenAnalytics} className="flex flex-col items-center justify-center w-12 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all group">
                    <BarChart3 size={16} className="group-hover:text-green-400" />
                    <span className="text-[8px] font-bold mt-0.5">التحليلات</span>
                </button>
                <button onClick={onOpenExpenses} className="flex flex-col items-center justify-center w-12 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all group">
                    <Wallet size={16} className="group-hover:text-red-400" />
                    <span className="text-[8px] font-bold mt-0.5">المشتريات</span>
                </button>
                <button onClick={onOpenHistory} className="flex flex-col items-center justify-center w-12 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all group">
                    <History size={16} className="group-hover:text-purple-400" />
                    <span className="text-[8px] font-bold mt-0.5">المبيعات</span>
                </button>
                <button onClick={onOpenDataManagement} className="flex flex-col items-center justify-center w-12 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all group">
                    <Database size={16} className="group-hover:text-blue-400" />
                    <span className="text-[8px] font-bold mt-0.5">البيانات</span>
                </button>
                <button onClick={onLogout} className="flex flex-col items-center justify-center w-12 h-10 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all group">
                    <LogOut size={16} />
                    <span className="text-[8px] font-bold mt-0.5">خروج</span>
                </button>
            </div>

            {/* Left Side: Desktop Status Bar */}
            <div className="hidden md:flex items-center">
                 <div className="flex items-center bg-gray-950 px-3 py-1 rounded-full border border-gray-800 shadow-2xl gap-3">
                    {installPrompt && (
                      <button 
                        onClick={onInstall}
                        className="flex items-center gap-2 bg-[#FA8072] text-white px-3 py-1 rounded-full text-[10px] font-black hover:bg-orange-500 transition-all shadow-lg animate-bounce"
                      >
                        <AppWindow size={14} />
                        تثبيت النظام
                      </button>
                    )}
                    <div className="flex items-center gap-3 px-3 border-l border-gray-800/80">
                        <button 
                            onClick={onQuickBackup} 
                            className="text-gray-500 hover:text-white transition-colors"
                            title="نسخة سريعة"
                        >
                            <DownloadCloud size={14} />
                        </button>
                        <button 
                            onClick={onManualSync} 
                            disabled={isSyncing} 
                            className={`text-blue-400 hover:text-blue-300 transition-colors ${isSyncing ? 'animate-spin' : ''}`}
                            title={`آخر مزامنة: ${formatLastSync(lastSyncTime)}`}
                        >
                            <RefreshCw size={14} />
                        </button>
                        <div className={isOnline ? 'text-green-500/80' : 'text-red-600 animate-pulse'} title={isOnline ? 'متصل' : 'غير متصل'}>
                            {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pr-1">
                        <div className="flex flex-col items-end leading-none">
                            <span className="font-black text-[12px] text-white tracking-tight tabular-nums">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <span className="text-[7px] font-bold text-gray-500">
                                {currentTime.toLocaleDateString('en-US')}
                            </span>
                        </div>
                        <Clock size={12} className="text-[#FA8072]" />
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </header>
  );
};