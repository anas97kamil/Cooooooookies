
import React, { useMemo, useState } from 'react';
import { X, BarChart3, ArrowUpRight, TrendingUp, Info, Zap } from 'lucide-react';
import { ArchivedDay, SaleItem, PurchaseInvoice } from '../types';

interface AnalyticsModalProps {
  history: ArchivedDay[];
  currentSales: SaleItem[];
  currentPurchases: PurchaseInvoice[];
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ history, currentSales, currentPurchases, onClose }) => {
  const [daysCount, setDaysCount] = useState<7 | 15 | 30>(7);

  const processedData = useMemo(() => {
    // Current day real-time calculation
    const todayRevenue = currentSales.reduce((s, i) => s + (i.price * i.quantity), 0);
    const todayPurchases = currentPurchases.reduce((s, i) => s + i.totalAmount, 0);
    const todayProfit = todayRevenue - todayPurchases;

    const combined = [
      ...history.map(day => ({
        date: day.date,
        revenue: day.totalRevenue,
        purchases: (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        profit: day.totalRevenue - (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        timestamp: day.timestamp
      })),
      {
        date: 'اليوم (مباشر)',
        revenue: todayRevenue,
        purchases: todayPurchases,
        profit: todayProfit,
        timestamp: Date.now()
      }
    ].sort((a, b) => a.timestamp - b.timestamp);

    return combined.slice(-daysCount);
  }, [history, currentSales, currentPurchases, daysCount]);

  const stats = useMemo(() => {
    return {
      totalRevenue: processedData.reduce((s, d) => s + d.revenue, 0),
      totalPurchases: processedData.reduce((s, d) => s + d.purchases, 0),
      totalProfit: processedData.reduce((s, d) => s + d.profit, 0)
    };
  }, [processedData]);

  // SVG Chart Logic
  const chartHeight = 240;
  const chartWidth = 800;
  const padding = 50;
  const maxVal = Math.max(...processedData.flatMap(d => [d.revenue, d.purchases, 5000]));
  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding) / (processedData.length - 1 || 1));
  const getY = (value: number) => chartHeight - padding - ((value / (maxVal || 1)) * (chartHeight - 2 * padding));

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-4">
             <div className="bg-[#FA8072]/20 p-3 rounded-2xl border border-[#FA8072]/10"><BarChart3 className="text-[#FA8072]" size={28} /></div>
             <div>
                <h3 className="font-black text-2xl text-white tracking-tight">تحليلات الأداء المباشر</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">تحديث لحظي لكافة العمليات</p>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-700 rounded-2xl transition-all"><X size={24} className="text-gray-400" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex gap-2 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-700">
                {[7, 15, 30].map(n => (
                   <button 
                    key={n} 
                    onClick={() => setDaysCount(n as any)} 
                    className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all ${daysCount === n ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                   >
                    آخر {n} يوم
                   </button>
                ))}
             </div>
             
             <div className="flex flex-wrap gap-4">
                <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex flex-col">
                    <span className="text-[9px] text-blue-400 font-black mb-1 uppercase tracking-tighter">إجمالي المبيعات</span>
                    <span className="text-xl font-black text-white">{stats.totalRevenue.toLocaleString()} <small className="text-[10px] text-gray-500 font-normal">ل.س</small></span>
                </div>
                <div className="bg-red-600/10 border border-red-500/20 px-6 py-3 rounded-2xl flex flex-col">
                    <span className="text-[9px] text-red-400 font-black mb-1 uppercase tracking-tighter">إجمالي المشتريات</span>
                    <span className="text-xl font-black text-white">{stats.totalPurchases.toLocaleString()} <small className="text-[10px] text-gray-500 font-normal">ل.س</small></span>
                </div>
             </div>
          </div>

          <div className="bg-gray-900/40 rounded-[2rem] border border-gray-700 p-8 shadow-inner relative group">
             <div className="absolute top-4 right-8 flex items-center gap-4 text-[10px] font-bold">
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div><span className="text-gray-400 uppercase">المبيعات</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div><span className="text-gray-400 uppercase">المشتريات</span></div>
             </div>
             
             <div className="relative overflow-x-auto pb-4 custom-scrollbar">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[700px] drop-shadow-2xl">
                    <defs>
                        <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.2 }} />
                            <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                    <path d={`M ${getX(0)},${chartHeight-padding} ${processedData.map((d, i) => `L ${getX(i)},${getY(d.revenue)}`).join(' ')} L ${getX(processedData.length-1)},${chartHeight-padding} Z`} fill="url(#gradBlue)" />
                    
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.purchases)}`).join(' ')} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {processedData.map((d, i) => (
                        <g key={i}>
                            <circle cx={getX(i)} cy={getY(d.revenue)} r="6" fill="#1F2937" stroke="#3B82F6" strokeWidth="3" />
                            <text x={getX(i)} y={chartHeight - 15} textAnchor="middle" className="text-[11px] fill-gray-600 font-bold font-mono">{d.date.split('/')[0]}/{d.date.split('/')[1]}</text>
                        </g>
                    ))}
                </svg>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-gray-800/40 p-6 rounded-3xl border border-gray-700 flex items-center justify-between group hover:border-green-500/40 transition-all hover:bg-gray-800/60 shadow-xl">
                <div>
                   <p className="text-gray-500 text-[10px] font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={10} /> صافي الربح الميداني</p>
                   <h4 className="text-3xl font-black text-green-400 tabular-nums">{stats.totalProfit.toLocaleString()} <span className="text-xs text-gray-600 font-normal">ل.س</span></h4>
                </div>
                <div className="bg-green-500/10 p-4 rounded-2xl text-green-500 group-hover:scale-110 transition-transform"><ArrowUpRight size={28} /></div>
             </div>
             
             <div className="bg-gray-800/40 p-6 rounded-3xl border border-gray-700 flex items-center justify-between group hover:border-orange-500/40 transition-all hover:bg-gray-800/60 shadow-xl">
                <div>
                   <p className="text-gray-500 text-[10px] font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><Zap size={10} /> هامش الأرباح</p>
                   <h4 className="text-3xl font-black text-orange-400 tabular-nums">{((stats.totalProfit / (stats.totalRevenue || 1)) * 100).toFixed(1)}%</h4>
                </div>
                <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
             </div>
          </div>

          <div className="flex items-center gap-4 bg-blue-900/30 p-5 rounded-3xl border border-blue-500/20 text-blue-300 shadow-lg">
             <div className="bg-blue-500/20 p-2.5 rounded-xl"><Info size={20} className="shrink-0" /></div>
             <p className="text-[11px] font-bold leading-relaxed">
                <span className="text-white">نظام المزامنة الذكي:</span> التحليلات أعلاه لا تقتصر على الأرشيف فقط، بل تدمج تلقائياً كافة مبيعات ومشتريات اليوم الحالية المسجلة في الذاكرة اللحظية لتعطيك أدق صورة لمركزك المالي الآن.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
