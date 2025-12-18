
import React, { useMemo, useState } from 'react';
import { X, BarChart3, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
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
    // Current day stats
    const todayRevenue = currentSales.reduce((s, i) => s + (i.price * i.quantity), 0);
    const todayPurchasesTotal = currentPurchases.reduce((s, i) => s + i.totalAmount, 0);
    // Net profit = Sum of (Sell Price - Cost Price) * Quantity
    const todayProfit = currentSales.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0);

    const combined = [
      ...history.map(day => ({
        date: day.date,
        revenue: day.totalRevenue,
        purchases: (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        profit: day.items.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0),
        timestamp: day.timestamp
      })),
      {
        date: 'اليوم',
        revenue: todayRevenue,
        purchases: todayPurchasesTotal,
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

  // Chart configuration
  const chartHeight = 350;
  const chartWidth = 900;
  const padding = 60;
  const maxVal = Math.max(...processedData.flatMap(d => [d.revenue, d.profit, d.purchases, 10000]));
  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding) / (processedData.length - 1 || 1));
  const getY = (value: number) => chartHeight - padding - ((value / (maxVal || 1)) * (chartHeight - 2 * padding));

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-[3rem] w-full max-w-5xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="bg-[#FA8072]/20 p-3 rounded-2xl"><BarChart3 className="text-[#FA8072]" size={28} /></div>
             <div className="flex flex-col">
                <h3 className="font-black text-2xl text-white">التحليلات المالية الموحدة</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">مقارنة المبيعات، المشتريات والأرباح</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-700 rounded-2xl transition-all text-gray-400"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
          <div className="flex justify-center">
             <div className="flex gap-2 bg-gray-900/80 p-2 rounded-2xl border border-gray-700 shadow-inner">
                {[7, 15, 30].map(n => (
                   <button key={n} onClick={() => setDaysCount(n as any)} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${daysCount === n ? 'bg-[#FA8072] text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>آخر {n} يوم</button>
                ))}
             </div>
          </div>

          <div className="bg-gray-950/40 rounded-[3rem] border border-gray-700 p-10 shadow-inner relative overflow-hidden group">
             {/* Legend */}
             <div className="absolute top-6 right-10 flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-tighter">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div><span className="text-gray-400">المبيعات</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div><span className="text-gray-400">المشتريات</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div><span className="text-gray-400">صافي الربح</span></div>
             </div>

             <div className="overflow-x-auto pb-6 custom-scrollbar">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[800px]">
                    {/* Horizontal Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                        <line key={i} x1={padding} y1={getY(maxVal * v)} x2={chartWidth - padding} y2={getY(maxVal * v)} stroke="#374151" strokeWidth="1" strokeDasharray="5,5" />
                    ))}
                    
                    {/* Paths */}
                    {/* Revenue Line (Blue) */}
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                    
                    {/* Purchases Line (Red) */}
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.purchases)}`).join(' ')} fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg opacity-80" />
                    
                    {/* Profit Line (Green) */}
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.profit)}`).join(' ')} fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                    
                    {/* Points & Labels */}
                    {processedData.map((d, i) => (
                        <g key={i}>
                            {/* Revenue Point */}
                            <circle cx={getX(i)} cy={getY(d.revenue)} r="8" fill="#1F2937" stroke="#3B82F6" strokeWidth="4" className="cursor-pointer hover:r-10 transition-all" />
                            {/* Purchase Point */}
                            <circle cx={getX(i)} cy={getY(d.purchases)} r="6" fill="#1F2937" stroke="#EF4444" strokeWidth="3" />
                            {/* Profit Point */}
                            <circle cx={getX(i)} cy={getY(d.profit)} r="7" fill="#1F2937" stroke="#10B981" strokeWidth="3" />
                            
                            <text x={getX(i)} y={chartHeight - 15} textAnchor="middle" className="text-[12px] fill-gray-600 font-black tabular-nums">{d.date.split('/')[0]}</text>
                        </g>
                    ))}
                </svg>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-blue-600/10 p-8 rounded-[2.5rem] border border-blue-500/20 text-center shadow-lg relative overflow-hidden group">
                <DollarSign size={80} className="absolute -bottom-6 -right-6 text-blue-500/5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">إجمالي المبيعات</span>
                <span className="text-3xl font-black text-white">{stats.totalRevenue.toLocaleString()}</span>
             </div>
             
             <div className="bg-red-600/10 p-8 rounded-[2.5rem] border border-red-500/20 text-center shadow-lg relative overflow-hidden group">
                <ShoppingCart size={80} className="absolute -bottom-6 -right-6 text-red-500/5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-2">إجمالي المشتريات</span>
                <span className="text-3xl font-black text-white">{stats.totalPurchases.toLocaleString()}</span>
             </div>

             <div className="bg-green-600/10 p-8 rounded-[2.5rem] border border-green-500/20 text-center relative overflow-hidden group shadow-lg">
                <TrendingUp size={80} className="absolute -bottom-6 -right-6 text-green-500/5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-2">صافي الربح الفعلي</span>
                <span className="text-3xl font-black text-white">{stats.totalProfit.toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
