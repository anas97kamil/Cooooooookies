
import React, { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Info, Filter } from 'lucide-react';
import { ArchivedDay, SaleItem, PurchaseInvoice } from '../types';

interface AnalyticsModalProps {
  history: ArchivedDay[];
  currentSales: SaleItem[];
  currentPurchases: PurchaseInvoice[];
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ history, currentSales, currentPurchases, onClose }) => {
  const [filterMode, setFilterMode] = useState<'quick' | 'custom'>('quick');
  const [daysCount, setDaysCount] = useState<7 | 15 | 30>(7);
  
  // Custom Filter States
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    history.forEach(day => {
        const y = new Date(day.timestamp).getFullYear().toString();
        yearSet.add(y);
    });
    yearSet.add(new Date().getFullYear().toString());
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [history]);

  const months = [
    { id: 'all', name: 'كامل السنة' },
    { id: '0', name: 'يناير' }, { id: '1', name: 'فبراير' }, { id: '2', name: 'مارس' },
    { id: '3', name: 'أبريل' }, { id: '4', name: 'مايو' }, { id: '5', name: 'يونيو' },
    { id: '6', name: 'يوليو' }, { id: '7', name: 'أغسطس' }, { id: '8', name: 'سبتمبر' },
    { id: '9', name: 'أكتوبر' }, { id: '10', name: 'نوفمبر' }, { id: '11', name: 'ديسمبر' }
  ];

  const processedData = useMemo(() => {
    const todayDate = new Date().toLocaleDateString('ar-SY');
    const todayTimestamp = Date.now();
    
    // 1. Calculate current day metrics
    const todayRevenue = currentSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const todayPurchases = currentPurchases.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const todayCOGS = currentSales.reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);
    const todayProfit = todayRevenue - todayCOGS - todayPurchases;

    let allData = [
      ...history.map(day => ({
        date: day.date,
        revenue: day.totalRevenue,
        purchases: (day.purchaseInvoices || []).reduce((sum, inv) => sum + inv.totalAmount, 0),
        profit: day.totalRevenue - (day.items || []).reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0) - (day.purchaseInvoices || []).reduce((sum, inv) => sum + inv.totalAmount, 0),
        timestamp: day.timestamp
      })),
      {
        date: todayDate,
        revenue: todayRevenue,
        purchases: todayPurchases,
        profit: todayProfit,
        timestamp: todayTimestamp
      }
    ].sort((a, b) => a.timestamp - b.timestamp);

    // Apply Filters
    if (filterMode === 'quick') {
        return allData.slice(-daysCount);
    } else {
        if (selectedYear !== 'all') {
            allData = allData.filter(d => new Date(d.timestamp).getFullYear().toString() === selectedYear);
            if (selectedMonth !== 'all') {
                allData = allData.filter(d => new Date(d.timestamp).getMonth().toString() === selectedMonth);
            }
        }
        return allData;
    }
  }, [history, currentSales, currentPurchases, daysCount, filterMode, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const totalRevenue = processedData.reduce((s, d) => s + d.revenue, 0);
    const totalPurchases = processedData.reduce((s, d) => s + d.purchases, 0);
    const totalProfit = processedData.reduce((s, d) => s + d.profit, 0);
    return { totalRevenue, totalPurchases, totalProfit };
  }, [processedData]);

  // Chart Rendering Logic
  const chartHeight = 240;
  const chartWidth = 800;
  const padding = 40;
  const maxVal = Math.max(...processedData.flatMap(d => [d.revenue, d.purchases, d.profit, 1000]));
  
  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding) / (processedData.length - 1 || 1));
  const getY = (value: number) => chartHeight - padding - ((value / (maxVal || 1)) * (chartHeight - 2 * padding));

  const points = {
    revenue: processedData.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' '),
    purchases: processedData.map((d, i) => `${getX(i)},${getY(d.purchases)}`).join(' '),
    profit: processedData.map((d, i) => `${getX(i)},${getY(d.profit)}`).join(' ')
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-3">
             <div className="bg-[#FA8072]/20 p-2 rounded-xl">
                <BarChart3 className="text-[#FA8072]" size={24} />
             </div>
             <div>
                <h3 className="font-bold text-xl text-white">مركز التحليلات البيانية</h3>
                <p className="text-gray-500 text-xs">مراقبة الأداء المالي منذ بدء المشروع</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
             
             <div className="flex flex-col gap-3 w-full lg:w-auto">
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    <button onClick={() => setFilterMode('quick')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterMode === 'quick' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>تصفية سريعة</button>
                    <button onClick={() => setFilterMode('custom')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterMode === 'custom' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>تصفية مخصصة</button>
                </div>

                {filterMode === 'quick' ? (
                   <div className="flex gap-2">
                        {[7, 15, 30].map(n => (
                        <button key={n} onClick={() => setDaysCount(n as any)} className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${daysCount === n ? 'border-[#FA8072] text-[#FA8072] bg-[#FA8072]/10' : 'border-gray-700 text-gray-500'}`}>آخر {n} يوم</button>
                        ))}
                   </div>
                ) : (
                   <div className="flex gap-2">
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-lg border border-gray-700 outline-none">
                            <option value="all">كل السنوات (البداية)</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} disabled={selectedYear === 'all'} className="bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-lg border border-gray-700 outline-none disabled:opacity-50">
                            {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                   </div>
                )}
             </div>

             <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
                <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl text-center">
                   <span className="text-[9px] text-blue-400 font-bold block mb-1">المبيعات</span>
                   <span className="text-sm font-black text-white">{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="bg-red-600/10 border border-red-500/20 px-4 py-2 rounded-xl text-center">
                   <span className="text-[9px] text-red-400 font-bold block mb-1">المشتريات</span>
                   <span className="text-sm font-black text-white">{stats.totalPurchases.toLocaleString()}</span>
                </div>
                <div className="bg-green-600/10 border border-green-500/20 px-4 py-2 rounded-xl text-center">
                   <span className="text-[9px] text-green-400 font-bold block mb-1">الأرباح</span>
                   <span className="text-sm font-black text-white">{stats.totalProfit.toLocaleString()}</span>
                </div>
             </div>
          </div>

          {/* SVG Chart Section */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-700 p-4 relative">
             <div className="flex items-center gap-6 mb-4 px-2">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[9px] text-gray-400 font-bold">المبيعات</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-[9px] text-gray-400 font-bold">المشتريات</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span className="text-[9px] text-gray-400 font-bold">صافي الربح</span></div>
             </div>

             <div className="relative overflow-x-auto pb-4">
                {processedData.length > 1 ? (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[600px]">
                        <defs>
                            <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" /><stop offset="100%" stopColor="#3B82F6" stopOpacity="0" /></linearGradient>
                            <linearGradient id="grad-profit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.2" /><stop offset="100%" stopColor="#10B981" stopOpacity="0" /></linearGradient>
                        </defs>
                        <polyline points={`${padding},${chartHeight-padding} ${points.revenue} ${chartWidth-padding},${chartHeight-padding}`} fill="url(#grad-revenue)" />
                        <polyline points={`${padding},${chartHeight-padding} ${points.profit} ${chartWidth-padding},${chartHeight-padding}`} fill="url(#grad-profit)" />
                        <polyline points={points.revenue} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinejoin="round" />
                        <polyline points={points.purchases} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round" />
                        <polyline points={points.profit} fill="none" stroke="#10B981" strokeWidth="4" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-600 text-xs italic">لا توجد بيانات كافية للرسم البياني في هذه الفترة</div>
                )}
             </div>
          </div>

          {/* Cards Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 flex items-center justify-between">
                <div>
                   <p className="text-gray-500 text-[10px] font-bold mb-1">متوسط الربح في الفترة</p>
                   <h4 className="text-xl font-black text-white">{(stats.totalProfit / (processedData.length || 1)).toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-[10px] text-gray-500">ل.س</span></h4>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full text-green-500">
                   <ArrowUpRight size={20} />
                </div>
             </div>

             <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 flex items-center justify-between">
                <div>
                   <p className="text-gray-500 text-[10px] font-bold mb-1">هامش الربح التقريبي</p>
                   <h4 className="text-xl font-black text-white">{((stats.totalProfit / (stats.totalRevenue || 1)) * 100).toFixed(1)}%</h4>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-full text-orange-500">
                   <TrendingUp size={20} />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 bg-blue-900/10 p-3 rounded-xl border border-blue-500/20 text-blue-400">
             <Info size={16} />
             <p className="text-[10px] font-bold">البيانات المعروضة تعتمد على السجلات المدخلة في النظام. تأكد من تحديث سجل المشتريات والمبيعات للحصول على دقة كاملة.</p>
          </div>
        </div>

        <div className="p-4 bg-gray-900/80 border-t border-gray-700 text-center">
           <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">نظام التحليل المحمي v1.5 &copy; 2026</p>
        </div>
      </div>
    </div>
  );
};
