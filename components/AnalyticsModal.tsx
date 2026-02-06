
import React, { useMemo, useState } from 'react';
import { X, BarChart3, Printer, FileText } from 'lucide-react';
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
    profit: filteredData.reduce((s, d) => s + d.profit, 0)
  }), [filteredData]);

  const handlePrint = () => {
    const printContent = document.getElementById('report-a4-content');
    const printArea = document.getElementById('print-area');
    
    if (printContent && printArea) {
      printArea.innerHTML = printContent.innerHTML;
      printArea.className = 'print-mode-a4';
      window.print();
      printArea.innerHTML = '';
    }
  };

  const getMonthName = (m: number) => new Date(2000, m).toLocaleString('ar-SY', { month: 'long' });

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-gray-700 flex flex-col h-[95vh]">
        
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-[#FA8072]/20 p-2.5 rounded-2xl"><BarChart3 className="text-[#FA8072]" size={24} /></div>
             <h3 className="font-black text-xl text-white">التحليلات (تقرير A4)</h3>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg"><FileText size={18} /> طباعة تقرير A4</button>
              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition-all text-gray-400"><X size={24} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-950/30">
          <div className="flex justify-center mb-8">
             <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                <button onClick={() => setViewMode('days')} className={`px-8 py-2.5 rounded-lg text-xs font-black transition-all ${viewMode === 'days' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>الأيام الأخيرة</button>
                <button onClick={() => setViewMode('monthly')} className={`px-8 py-2.5 rounded-lg text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-[#FA8072] text-white' : 'text-gray-500'}`}>تقرير شهري</button>
             </div>
          </div>

          <div className="flex justify-center p-4">
             {/* هذا الجزء يتم نسخه لمنطقة الطباعة عند الضغط على زر الطباعة */}
             <div id="report-a4-content" className="bg-white text-black w-[210mm] p-[20mm] shadow-2xl">
                <div className="text-center mb-10 border-b-4 border-black pb-6">
                    <h1 className="text-4xl font-black mb-2">مخبز كوكيز</h1>
                    <p className="text-lg font-bold">تقرير الأداء المالي والتحليلات</p>
                    <p className="text-sm mt-4 font-black">
                        {viewMode === 'monthly' ? `إحصائيات شهر ${getMonthName(selectedMonth)} ${selectedYear}` : `إحصائيات آخر ${daysCount} يوم`}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="border-2 border-black p-6 bg-gray-50">
                        <span className="text-xs font-black block mb-2 uppercase tracking-widest">إجمالي المبيعات</span>
                        <span className="text-3xl font-black tabular-nums">{totals.revenue.toLocaleString()}</span>
                    </div>
                    <div className="border-2 border-black p-6 bg-gray-50">
                        <span className="text-xs font-black block mb-2 uppercase tracking-widest">إجمالي المشتريات</span>
                        <span className="text-3xl font-black tabular-nums">{totals.purchases.toLocaleString()}</span>
                    </div>
                    <div className="border-2 border-black p-6 bg-gray-50">
                        <span className="text-xs font-black block mb-2 uppercase tracking-widest">صافي الأرباح</span>
                        <span className="text-3xl font-black tabular-nums text-green-600">{totals.profit.toLocaleString()}</span>
                    </div>
                </div>

                <h4 className="text-xl font-black mb-6 border-r-4 border-black pr-4">تفاصيل مبيعات المنتجات</h4>
                <table className="w-full text-right text-sm border-collapse">
                    <thead className="bg-gray-100 font-black">
                        <tr className="border-y-2 border-black">
                            <th className="p-4">اسم المنتج</th>
                            <th className="p-4 text-center">الكمية المباعة</th>
                            <th className="p-4 text-left">صافي الربح</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {productStats.map(([name, data], idx) => (
                            <tr key={idx}>
                                <td className="p-4 font-black">{name}</td>
                                <td className="p-4 text-center tabular-nums">{data.qty.toLocaleString()}</td>
                                <td className="p-4 text-left font-black tabular-nums">{data.profit.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-20 flex justify-between items-center text-xs font-black border-t-2 border-black pt-6">
                    <span>نظام محاسبة مخبز كوكيز - تقرير رسمي</span>
                    <span>تاريخ الإصدار: {now.toLocaleDateString('ar-SY')}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
