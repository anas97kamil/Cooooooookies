
import React, { useMemo, useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, ShoppingCart, DollarSign, Printer, Calendar, ChevronDown, CheckCircle2, FileText, PieChart, LayoutList } from 'lucide-react';
import { ArchivedDay, SaleItem, PurchaseInvoice } from '../types';

interface AnalyticsModalProps {
  history: ArchivedDay[];
  currentSales: SaleItem[];
  currentPurchases: PurchaseInvoice[];
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ history, currentSales, currentPurchases, onClose }) => {
  const [viewMode, setViewMode] = useState<'days' | 'monthly'>('days');
  const [daysCount, setDaysCount] = useState<7 | 15 | 30>(7);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const allData = useMemo(() => {
    const todayStr = now.toLocaleDateString('ar-SY');
    const combined = [
      ...history.map(day => ({
        date: day.date,
        revenue: day.totalRevenue,
        purchases: (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        profit: day.items.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0),
        items: day.items,
        timestamp: day.timestamp
      })),
      {
        date: todayStr,
        revenue: currentSales.reduce((s, i) => s + (i.price * i.quantity), 0),
        purchases: currentPurchases.reduce((s, i) => s + i.totalAmount, 0),
        profit: currentSales.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0),
        items: currentSales,
        timestamp: Date.now()
      }
    ].sort((a, b) => a.timestamp - b.timestamp);
    return combined;
  }, [history, currentSales, currentPurchases]);

  const filteredData = useMemo(() => {
    if (viewMode === 'days') return allData.slice(-daysCount);
    return allData.filter(d => {
      const date = new Date(d.timestamp);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [allData, viewMode, daysCount, selectedMonth, selectedYear]);

  const productStats = useMemo(() => {
    const stats: Record<string, { qty: number, revenue: number, profit: number, unit: string }> = {};
    filteredData.forEach(day => {
      day.items.forEach(item => {
        if (!stats[item.name]) stats[item.name] = { qty: 0, revenue: 0, profit: 0, unit: item.unitType };
        stats[item.name].qty += item.quantity;
        stats[item.name].revenue += (item.price * item.quantity);
        stats[item.name].profit += ((item.price - (item.costPrice || 0)) * item.quantity);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredData]);

  const totals = useMemo(() => ({
    revenue: filteredData.reduce((s, d) => s + d.revenue, 0),
    purchases: filteredData.reduce((s, d) => s + d.purchases, 0),
    profit: filteredData.reduce((s, d) => s + d.profit, 0),
    margin: filteredData.reduce((s, d) => s + d.revenue, 0) > 0 
      ? (filteredData.reduce((s, d) => s + d.profit, 0) / filteredData.reduce((s, d) => s + d.revenue, 0)) * 100 
      : 0
  }), [filteredData]);

  const handlePrintReport = () => window.print();
  const getMonthName = (m: number) => new Date(2000, m).toLocaleString('ar-SY', { month: 'long' });

  const chartHeight = 300;
  const chartWidth = 900;
  const padding = 50;
  const maxVal = Math.max(...filteredData.flatMap(d => [d.revenue, d.purchases, 5000]));
  const getX = (i: number) => padding + (i * (chartWidth - 2 * padding) / (filteredData.length - 1 || 1));
  const getY = (v: number) => chartHeight - padding - ((v / (maxVal || 1)) * (chartHeight - 2 * padding));

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col h-[95vh] print:h-auto print:bg-white print:border-none print:shadow-none print:rounded-none">
        
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 shrink-0 no-print">
          <div className="flex items-center gap-3">
             <div className="bg-[#FA8072]/20 p-2.5 rounded-2xl"><BarChart3 className="text-[#FA8072]" size={24} /></div>
             <div>
                <h3 className="font-black text-xl text-white">التحليلات المالية</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">إحصائيات الأداء والأرباح</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg active:scale-95"><Printer size={16} /> طباعة التقرير</button>
              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition-all text-gray-400"><X size={24} /></button>
          </div>
        </div>

        <div className="p-4 md:p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-900/20 print:overflow-visible print:bg-white print:p-0">
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 no-print">
             <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 shadow-inner">
                <button onClick={() => setViewMode('days')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'days' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>إحصائيات الأيام</button>
                <button onClick={() => setViewMode('monthly')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>تقرير شهري مفصل</button>
             </div>
             {viewMode === 'days' ? (
               <div className="flex gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
                  {[7, 15, 30].map(n => <button key={n} onClick={() => setDaysCount(n as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${daysCount === n ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-white'}`}>آخر {n} يوم</button>)}
               </div>
             ) : (
               <div className="flex gap-2">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#FA8072]">{[0,1,2,3,4,5,6,7,8,9,10,11].map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}</select>
                  <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-gray-950 border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#FA8072]">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
               </div>
             )}
          </div>

          {/* Report Header for Print */}
          <div className="hidden print:block text-black text-center mb-8 border-b-2 border-black pb-6">
              <h1 className="text-3xl font-black mb-1">مخبز كوكيز - تقرير الأداء المالي</h1>
              <p className="text-sm font-bold uppercase tracking-widest">
                {viewMode === 'monthly' ? `تقرير شهر ${getMonthName(selectedMonth)} لعام ${selectedYear}` : `تقرير مبيعات آخر ${daysCount} يوم`}
              </p>
              <p className="text-[10px] mt-2 font-bold italic">تاريخ إصدار التقرير: {now.toLocaleString('ar-SY')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
             <div className="bg-blue-600/10 p-5 rounded-3xl border border-blue-500/20 shadow-lg relative overflow-hidden group print:bg-white print:border-black print:rounded-none">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1 print:text-black">إجمالي المبيعات</span>
                <span className="text-2xl font-black text-white tabular-nums print:text-black">{totals.revenue.toLocaleString()}</span>
             </div>
             <div className="bg-red-600/10 p-5 rounded-3xl border border-red-500/20 shadow-lg relative overflow-hidden group print:bg-white print:border-black print:rounded-none">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1 print:text-black">إجمالي المشتريات</span>
                <span className="text-2xl font-black text-white tabular-nums print:text-black">{totals.purchases.toLocaleString()}</span>
             </div>
             <div className="bg-green-600/10 p-5 rounded-3xl border border-green-500/20 shadow-lg relative overflow-hidden group print:bg-white print:border-black print:rounded-none">
                <span className="text-[9px] font-black text-green-400 uppercase tracking-widest block mb-1 print:text-black">صافي الأرباح</span>
                <span className="text-2xl font-black text-white tabular-nums print:text-black">{totals.profit.toLocaleString()}</span>
             </div>
             <div className="bg-orange-600/10 p-5 rounded-3xl border border-orange-500/20 shadow-lg relative overflow-hidden group print:bg-white print:border-black print:rounded-none">
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1 print:text-black">نسبة الربح</span>
                <span className="text-2xl font-black text-white tabular-nums print:text-black">%{totals.margin.toFixed(1)}</span>
             </div>
          </div>

          {/* Table Header Styles for Print handled via CSS */}
          <div className="space-y-4">
             <h4 className="text-white font-black text-sm px-2 flex items-center gap-2 print:text-black">
                <LayoutList size={18} className="text-[#FA8072] print:hidden" /> إحصائيات المنتجات (الأكثر مبيعاً)
             </h4>
             <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-xl print:bg-white print:border-black print:rounded-none">
                <table className="w-full text-right text-xs">
                   <thead className="bg-gray-900 text-gray-500 print:bg-gray-100 print:text-black">
                      <tr>
                        <th className="p-4 font-black uppercase text-[10px]">المنتج</th>
                        <th className="p-4 font-black uppercase text-[10px] text-center">الكمية المباعة</th>
                        <th className="p-4 font-black uppercase text-[10px] text-center">إجمالي المبيعات</th>
                        <th className="p-4 font-black uppercase text-[10px] text-center">صافي الربح</th>
                        <th className="p-4 font-black uppercase text-[10px] text-center bg-gray-900/50 print:bg-gray-200">النسبة</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-700 print:divide-black">
                      {productStats.map(([name, data], idx) => (
                        <tr key={idx} className="hover:bg-gray-700/30 transition-colors print:text-black">
                          <td className="p-4 font-bold text-white print:text-black">{name}</td>
                          <td className="p-4 text-center font-bold tabular-nums">{data.qty.toLocaleString()} {data.unit === 'kg' ? 'كغ' : 'قطعة'}</td>
                          <td className="p-4 text-center tabular-nums">{data.revenue.toLocaleString()}</td>
                          <td className="p-4 text-center font-black text-green-400 tabular-nums print:text-black">{data.profit.toLocaleString()}</td>
                          <td className="p-4 text-center font-black bg-gray-900/20 print:bg-gray-50">%{totals.revenue > 0 ? ((data.revenue / totals.revenue) * 100).toFixed(1) : 0}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="mt-10 bg-[#FA8072]/5 border border-[#FA8072]/20 p-6 rounded-[2rem] print:bg-white print:border-black print:rounded-none print:mt-20">
             <h4 className="text-[#FA8072] font-black text-sm mb-3 flex items-center gap-2 print:text-black">
                <FileText size={18} /> تقرير تحليلي موجز
             </h4>
             <div className="text-xs text-gray-400 leading-relaxed font-bold space-y-3 print:text-black">
                <p>بلغ إجمالي حجم المبيعات خلال الفترة المحددة <span className="text-white print:text-black px-1 font-black underline">{totals.revenue.toLocaleString()} ل.س</span> مقابل تكاليف قدرت بـ <span className="text-white print:text-black px-1 font-black underline">{(totals.revenue - totals.profit).toLocaleString()} ل.س</span>.</p>
                <p>سجل النظام صافي ربح قدره <span className="text-green-400 print:text-black px-1 font-black underline">{totals.profit.toLocaleString()} ل.س</span>، بمعدل ربح إجمالي %{totals.margin.toFixed(1)}.</p>
             </div>
          </div>

          <div className="hidden print:flex justify-between items-end mt-24 px-10">
              <div className="text-center">
                  <p className="mb-12 font-black text-black text-sm">توقيع المدير المالي</p>
                  <div className="w-40 border-b-2 border-black"></div>
              </div>
              <div className="text-center">
                  <p className="mb-12 font-black text-black text-sm">ختم الإدارة</p>
                  <div className="w-40 border-b-2 border-black"></div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
