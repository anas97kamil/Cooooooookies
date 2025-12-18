
import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, ArrowRight, Folder, CalendarDays, ShoppingBag, Zap, Store, User, Filter, TrendingUp, PieChart, Info, LogOut } from 'lucide-react';
import { ArchivedDay, SaleItem, SaleType } from '../types';

interface HistoryModalProps {
  history: ArchivedDay[];
  currentSales?: SaleItem[];
  onClose: () => void;
  onClearHistory: () => void;
  onPreviewInvoice: (items: SaleItem[]) => void;
  onUpdateOrder: (date: string, orderId: string, updatedItems: SaleItem[]) => void;
}

type NavStep = 'years' | 'months' | 'days';
type FilterType = 'all' | SaleType;
type TabMode = 'archive' | 'profit-report';

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  history, currentSales = [], onClose, onClearHistory, onPreviewInvoice, onUpdateOrder 
}) => {
  const [tab, setTab] = useState<TabMode>('archive');
  const [step, setStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fullHistory = useMemo(() => {
      const merged = [...history];
      if (currentSales.length > 0) {
          const today = new Date();
          const todayStr = today.toLocaleDateString('ar-SY');
          const existingTodayIdx = merged.findIndex(d => d.date.includes(todayStr));
          
          const todayEntry: ArchivedDay = {
              id: 'today-active',
              date: `${todayStr} (مبيعات حية)`,
              timestamp: Date.now(),
              totalRevenue: currentSales.reduce((s, i) => s + (i.price * i.quantity), 0),
              totalExpenses: 0,
              totalItems: currentSales.length,
              items: currentSales,
              purchaseInvoices: []
          };

          if (existingTodayIdx > -1) merged[existingTodayIdx] = todayEntry;
          else merged.push(todayEntry);
      }
      return merged;
  }, [history, currentSales]);

  const profitReport = useMemo(() => {
    const report: Record<string, { today: number, month: number, year: number, total: number }> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toLocaleDateString('ar-SY');

    fullHistory.forEach(day => {
        const d = new Date(day.timestamp);
        const isYear = d.getFullYear() === currentYear;
        const isMonth = isYear && d.getMonth() === currentMonth;
        const isToday = day.date.includes(todayStr);

        day.items.forEach(item => {
            const profitPerUnit = item.price - (item.costPrice || 0);
            const totalProfit = profitPerUnit * item.quantity;
            
            if (!report[item.name]) {
                report[item.name] = { today: 0, month: 0, year: 0, total: 0 };
            }

            report[item.name].total += totalProfit;
            if (isYear) report[item.name].year += totalProfit;
            if (isMonth) report[item.name].month += totalProfit;
            if (isToday) report[item.name].today += totalProfit;
        });
    });

    return Object.entries(report).sort((a, b) => b[1].total - a[1].total);
  }, [fullHistory]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>(fullHistory.map(day => new Date(day.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [fullHistory]);

  const months = useMemo(() => {
    if (!selectedYear) return [];
    const uniqueMonths = new Set<number>(
      fullHistory
        .filter(day => new Date(day.timestamp).getFullYear().toString() === selectedYear)
        .map(day => new Date(day.timestamp).getMonth())
    );
    return Array.from(uniqueMonths).sort((a, b) => b - a);
  }, [fullHistory, selectedYear]);

  const currentDaysData = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    return fullHistory.filter(day => {
      const d = new Date(day.timestamp);
      return d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth;
    }).sort((a,b) => b.timestamp - a.timestamp);
  }, [fullHistory, selectedYear, selectedMonth]);

  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex).toLocaleString('ar-SY', { month: 'long' });
  };

  const renderArchive = () => {
    if (step === 'years') return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up">
            {years.length > 0 ? years.map(year => (
                <button key={year} onClick={() => { setSelectedYear(year); setStep('months'); }} className="bg-gray-700/50 hover:bg-gray-600 border border-gray-600 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <Folder size={48} className="text-[#FA8072] group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-black text-white">{year}</span>
                </button>
            )) : (
              <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <div className="bg-gray-700/30 p-6 rounded-full"><Zap size={48} className="text-gray-600" /></div>
                  <p className="text-gray-500 font-bold">لا توجد عمليات بيع مؤرشفة بعد</p>
              </div>
            )}
        </div>
    );

    if (step === 'months') return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up">
            {months.map(monthIdx => (
                <button key={monthIdx} onClick={() => { setSelectedMonth(monthIdx); setStep('days'); }} className="bg-gray-700/50 hover:bg-gray-600 border border-gray-600 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <CalendarDays size={48} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white">{getMonthName(monthIdx)}</span>
                </button>
            ))}
        </div>
    );

    if (step === 'days') return (
        <div className="flex flex-col gap-4 animate-fade-up h-full">
            <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-700 shrink-0">
                <button onClick={() => setFilterType('all')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>الكل</button>
                <button onClick={() => setFilterType('retail')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${filterType === 'retail' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>مفرق</button>
                <button onClick={() => setFilterType('wholesale')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${filterType === 'wholesale' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>جملة</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {currentDaysData.map(day => {
                    const filteredItems = day.items.filter(item => filterType === 'all' || item.saleType === filterType);
                    if (filteredItems.length === 0 && filterType !== 'all') return null;
                    const dayTotal = filteredItems.reduce((s, i) => s + (i.price * i.quantity), 0);
                    const isToday = day.id === 'today-active';

                    return (
                        <div key={day.id} className={`rounded-xl border overflow-hidden shadow-sm transition-all ${isToday ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-700 bg-gray-800'}`}>
                            <div onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className={`p-4 flex justify-between items-center cursor-pointer ${isToday ? 'bg-orange-500/10' : 'bg-gray-900/50 hover:bg-gray-900'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-500">{expandedDayId === day.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                                    <span className={`font-bold ${isToday ? 'text-orange-400' : 'text-white'}`}>{day.date}</span>
                                </div>
                                <span className="font-black text-lg text-green-400">{dayTotal.toLocaleString()} <small className="text-[10px] text-gray-500 font-normal">ل.س</small></span>
                            </div>
                            {expandedDayId === day.id && (
                                <div className="p-4 bg-gray-900/30 border-t border-gray-700 animate-fade-up space-y-2">
                                    {filteredItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs p-3 bg-gray-800 rounded-lg border border-gray-700/50">
                                            <div className="flex items-center gap-3">
                                                {item.saleType === 'wholesale' ? <Store size={14} className="text-orange-400" /> : <User size={14} className="text-blue-400" />}
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{item.name}</span>
                                                    <span className="text-[9px] text-gray-500">{item.saleType === 'wholesale' ? 'جملة' : 'مفرق'} • الكمية: {item.quantity}</span>
                                                </div>
                                            </div>
                                            <span className="text-white font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <button onClick={() => onPreviewInvoice(filteredItems)} className="w-full mt-2 py-2 bg-gray-700 hover:bg-[#FA8072] text-white rounded-lg text-xs font-bold transition-all">معاينة الفواتير</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderProfitReport = () => (
    <div className="flex flex-col h-full animate-fade-up">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-4 flex items-start gap-3">
            <span className="shrink-0 mt-0.5"><Info size={20} className="text-blue-400" /></span>
            <p className="text-xs text-gray-400 leading-relaxed font-bold">
                هذا التقرير يحلل صافي أرباح كل منتج بشكل منفصل بناءً على الفرق بين (سعر البيع) و (سعر التكلفة) المسجل عند وقت البيع.
            </p>
        </div>
        
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-xs">
                    <thead className="bg-gray-800 text-gray-400 font-black uppercase text-[9px] tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 border-b border-gray-700">اسم المنتج</th>
                            <th className="p-4 border-b border-gray-700 text-center">أرباح اليوم</th>
                            <th className="p-4 border-b border-gray-700 text-center">أرباح الشهر</th>
                            <th className="p-4 border-b border-gray-700 text-center">أرباح السنة</th>
                            <th className="p-4 border-b border-gray-700 text-center bg-[#FA8072]/10 text-[#FA8072]">إجمالي الربح</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {profitReport.map(([name, data], idx) => (
                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 font-black text-white">{name}</td>
                                <td className="p-4 text-center tabular-nums text-gray-400">{data.today.toLocaleString()}</td>
                                <td className="p-4 text-center tabular-nums text-gray-400">{data.month.toLocaleString()}</td>
                                <td className="p-4 text-center tabular-nums text-gray-400">{data.year.toLocaleString()}</td>
                                <td className="p-4 text-center tabular-nums font-black text-green-400 bg-green-400/5">{data.total.toLocaleString()}</td>
                            </tr>
                        ))}
                        {profitReport.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-gray-600 font-bold">لا توجد بيانات بيع مسجلة بعد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-700 flex flex-col h-[85vh] overflow-hidden animate-fade-up">
        {/* Header Header */}
        <div className="p-4 md:p-5 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center bg-gray-900/50 gap-4 shrink-0">
            
            {/* 1. Close Button (Far Left in RTL) */}
            <div className="w-full md:w-auto order-3 md:order-1 flex justify-start">
                <button onClick={onClose} className="flex items-center gap-2 bg-gray-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 group">
                    <span>إغلاق</span>
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            {/* 2. Center Tabs */}
            <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-700 w-full md:w-auto order-2">
                <button 
                  onClick={() => setTab('archive')} 
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${tab === 'archive' ? 'bg-[#FA8072] text-white shadow-lg shadow-orange-900/20' : 'text-gray-500 hover:text-white'}`}
                >
                    <Folder size={14} /> تصفح الأرشيف
                </button>
                <button 
                  onClick={() => setTab('profit-report')} 
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${tab === 'profit-report' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-500 hover:text-white'}`}
                >
                    <PieChart size={14} /> تقرير الأرباح
                </button>
            </div>
            
            {/* 3. Title & Back Navigation (Far Right in RTL) */}
            <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-3 justify-end">
                <h3 className="font-black text-lg md:text-xl text-white">أرشيف المبيعات</h3>
                {tab === 'archive' && step !== 'years' && (
                    <button onClick={() => {
                        if (step === 'days') { setStep('months'); setSelectedMonth(-1); } 
                        else if (step === 'months') { setStep('years'); setSelectedYear(''); }
                    }} className="bg-gray-700 hover:bg-[#FA8072] p-2 rounded-full text-white transition-colors shrink-0 shadow-lg"><ArrowRight size={20} /></button>
                )}
            </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {tab === 'archive' ? renderArchive() : renderProfitReport()}
        </div>
      </div>
    </div>
  );
};
