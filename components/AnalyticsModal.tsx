
import React, { useMemo, useState } from 'react';
import { X, BarChart3, ArrowUpRight, TrendingUp, Info } from 'lucide-react';
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
    const todayProfit = todayRevenue - todayPurchases; // Simplified for dashboard

    const combined = [
      ...history.map(day => ({
        date: day.date,
        revenue: day.totalRevenue,
        purchases: (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        profit: day.totalRevenue - (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        timestamp: day.timestamp
      })),
      {
        date: 'اليوم (لحظي)',
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
  const padding = 40;
  const maxVal = Math.max(...processedData.flatMap(d => [d.revenue, d.purchases, 1000]));
  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding) / (processedData.length - 1 || 1));
  const getY = (value: number) => chartHeight - padding - ((value / (maxVal || 1)) * (chartHeight - 2 * padding));

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-3">
             <div className="bg-[#FA8072]/20 p-2 rounded-xl"><BarChart3 className="text-[#FA8072]" size={24} /></div>
             <div>
                <h3 className="font-bold text-xl text-white">التحليلات والمزامنة اللحظية</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">تحديث البيانات يتم فور تسجيل أي عملية بيع</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
             <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-700">
                {[7, 15, 30].map(n => (
                   <button key={n} onClick={() => setDaysCount(n as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${daysCount === n ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>آخر {n} يوم</button>
                ))}
             </div>
             <div className="flex gap-3">
                <div className="bg-blue-600/10 border border-blue-500/20 px-5 py-2 rounded-xl"><span className="text-[9px] text-blue-400 font-bold block mb-1 uppercase">إجمالي المبيعات</span><span className="text-base font-black text-white">{stats.totalRevenue.toLocaleString()}</span></div>
                <div className="bg-red-600/10 border border-red-500/20 px-5 py-2 rounded-xl"><span className="text-[9px] text-red-400 font-bold block mb-1 uppercase">إجمالي المشتريات</span><span className="text-base font-black text-white">{stats.totalPurchases.toLocaleString()}</span></div>
             </div>
          </div>

          <div className="bg-gray-900/50 rounded-2xl border border-gray-700 p-6">
             <div className="relative overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[600px]">
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinejoin="round" />
                    <polyline points={processedData.map((d, i) => `${getX(i)},${getY(d.purchases)}`).join(' ')} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinejoin="round" />
                    {processedData.map((d, i) => (
                        <circle key={i} cx={getX(i)} cy={getY(d.revenue)} r="4" fill="#3B82F6" />
                    ))}
                </svg>
             </div>
             <div className="flex justify-between mt-4 px-10 text-[10px] text-gray-500 font-bold">
                {processedData.map((d, i) => <span key={i}>{d.date.split('/')[0]}/{d.date.split('/')[1]}</span>)}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 flex items-center justify-between group hover:border-green-500/30 transition-colors">
                <div>
                   <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-tighter">صافي الربح المتوقع</p>
                   <h4 className="text-2xl font-black text-green-400">{stats.totalProfit.toLocaleString()} <span className="text-xs text-gray-600 font-normal">ل.س</span></h4>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full text-green-500 group-hover:scale-110 transition-transform"><ArrowUpRight size={24} /></div>
             </div>
             <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 flex items-center justify-between group hover:border-orange-500/30 transition-colors">
                <div>
                   <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-tighter">هامش المبيعات</p>
                   <h4 className="text-2xl font-black text-orange-400">{((stats.totalProfit / (stats.totalRevenue || 1)) * 100).toFixed(1)}%</h4>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-full text-orange-500 group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
             </div>
          </div>

          <div className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 text-blue-400 animate-pulse">
             <Info size={18} className="shrink-0" />
             <p className="text-[10px] font-bold leading-relaxed">المزامنة مفعلة: الأرقام أعلاه تشمل كافة العمليات المسجلة في السلة حالياً وقبل ترحيلها للأرشيف اليومي.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
