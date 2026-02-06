
import React, { useMemo, useState } from 'react';
import { X, BarChart3, Printer, Activity, Target } from 'lucide-react';
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

  const totals = useMemo(() => {
    const revenue = filteredData.reduce((s, d) => s + d.revenue, 0);
    const purchases = filteredData.reduce((s, d) => s + d.purchases, 0);
    const profit = filteredData.reduce((s, d) => s + d.profit, 0);
    const expenseRatio = revenue > 0 ? (purchases / revenue * 100) : 0;
    const profitMargin = revenue > 0 ? (profit / revenue * 100) : 0;
    
    return { revenue, purchases, profit, expenseRatio, profitMargin };
  }, [filteredData]);

  const productStats = useMemo(() => {
    const stats: Record<string, { qty: number, revenue: number, profit: number, cost: number }> = {};
    filteredData.forEach(day => {
      day.items.forEach(item => {
        if (!stats[item.name]) stats[item.name] = { qty: 0, revenue: 0, profit: 0, cost: 0 };
        stats[item.name].qty += item.quantity;
        stats[item.name].revenue += (item.price * item.quantity);
        stats[item.name].cost += ((item.costPrice || 0) * item.quantity);
        stats[item.name].profit += ((item.price - (item.costPrice || 0)) * item.quantity);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredData]);

  const renderTimelineChart = () => {
    if (filteredData.length < 2) return (
        <div className="h-32 flex items-center justify-center border border-dashed border-gray-300 text-gray-400 text-[10px]">
            لا توجد بيانات كافية لرسم المنحنى الزمني حالياً
        </div>
    );

    const width = 800;
    const height = 150;
    const padding = 40;
    
    const maxVal = Math.max(...filteredData.map(d => Math.max(d.revenue, d.purchases, d.profit, 1000)));
    const getX = (index: number) => padding + (index * (width - 2 * padding) / (filteredData.length - 1));
    const getY = (val: number) => height - padding - (val * (height - 2 * padding) / maxVal);

    const revPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue)}`).join(' ');
    const purPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.purchases)}`).join(' ');
    const profPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.profit)}`).join(' ');

    return (
      <div className="py-4">
        <h4 className="text-[10px] font-black mb-4 flex items-center gap-2 text-gray-800 uppercase tracking-wider">
           <Activity size={12} className="text-black" /> الاتجاه المالي المباشر (الزمن vs القيمة):
        </h4>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="black" strokeWidth="1" />
          {filteredData.map((d, i) => {
             if (filteredData.length > 10 && i % 4 !== 0) return null;
             return (
               <text key={i} x={getX(i)} y={height - padding + 15} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#999">
                 {d.date.split('/')[0]}
               </text>
             );
          })}
          <path d={revPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <path d={purPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
          <path d={profPath} fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          {filteredData.map((d, i) => (
            <circle key={i} cx={getX(i)} cy={getY(d.profit)} r="3" fill="black" />
          ))}
        </svg>
        <div className="flex justify-center gap-8 mt-6 text-[8px] font-black border-t border-gray-100 pt-3">
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10b981] rounded-full"></div> <span>المبيعات</span></div>
           <div className="flex items-center gap-2"><div className="w-3 h-1 bg-[#ef4444]"></div> <span>المشتريات</span></div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-full"></div> <span>الربح الصافي</span></div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-a4-content');
    const printArea = document.getElementById('print-area');
    if (printContent && printArea) {
      printArea.innerHTML = printContent.innerHTML;
      printArea.className = 'print-mode-a4';
      setTimeout(() => {
        window.print();
        setTimeout(() => { printArea.innerHTML = ''; printArea.className = ''; }, 500);
      }, 300);
    }
  };

  const getMonthName = (m: number) => new Date(2000, m).toLocaleString('ar-SY', { month: 'long' });

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-gray-700 flex flex-col h-[95vh]">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-[#FA8072]/20 p-2.5 rounded-2xl"><BarChart3 className="text-[#FA8072]" size={24} /></div>
             <h3 className="font-black text-xl text-white">التحليلات والذكاء المالي</h3>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg border border-gray-200"><Printer size={18} /> طباعة التقرير (A4)</button>
              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition-all text-gray-400"><X size={24} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-950/30">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
             <div className="flex bg-gray-950 p-1.5 rounded-2xl border border-gray-800">
                <button onClick={() => setViewMode('days')} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${viewMode === 'days' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500'}`}>المدى القريب</button>
                <button onClick={() => setViewMode('monthly')} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500'}`}>الجرد الشهري</button>
             </div>
             {viewMode === 'days' ? (
               <div className="flex gap-2">
                 {[7, 15, 30].map(c => (
                   <button key={c} onClick={() => setDaysCount(c as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border ${daysCount === c ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-600'}`}>{c} يوم</button>
                 ))}
               </div>
             ) : (
               <div className="flex gap-2">
                 <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-gray-900 border border-gray-800 text-white text-[10px] px-5 py-2.5 rounded-xl outline-none">
                   {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{getMonthName(i)}</option>)}
                 </select>
               </div>
             )}
          </div>

          <div className="flex justify-center p-4">
             <div id="report-a4-content" className="bg-white text-black w-[210mm] p-[18mm] shadow-2xl min-h-[297mm] flex flex-col gap-10">
                
                <div className="flex justify-between items-end border-b-2 border-black pb-4">
                    <div>
                        <h1 className="text-4xl font-black text-black mb-1">مخبز كوكيز</h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Financial Performance Analysis</p>
                    </div>
                    <div className="text-left font-black">
                        <span className="text-[9px] text-gray-400 block uppercase mb-1">Report Generated on</span>
                        <span className="text-base tabular-nums">{now.toLocaleDateString('ar-SY')}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col border-r-2 border-black/10 pr-6 last:border-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase mb-2">حجم المبيعات</span>
                        <span className="text-2xl font-black text-black tabular-nums">{totals.revenue.toLocaleString()}</span>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold">ليرة سورية</span>
                    </div>
                    <div className="flex flex-col border-r-2 border-black/10 pr-6 last:border-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase mb-2">إجمالي التكلفة</span>
                        <span className="text-2xl font-black text-red-600 tabular-nums">{totals.purchases.toLocaleString()}</span>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold">ليرة سورية</span>
                    </div>
                    <div className="flex flex-col border-r-2 border-black/10 pr-6 last:border-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase mb-2">صافي الربح</span>
                        <span className={`text-2xl font-black tabular-nums ${totals.profit >= 0 ? 'text-green-600' : 'text-red-700'}`}>
                          {totals.profit.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold">ليرة سورية</span>
                    </div>
                    <div className="flex flex-col pr-6">
                        <span className="text-[9px] font-black text-gray-400 uppercase mb-2">نسبة الربحية</span>
                        <span className={`text-2xl font-black tabular-nums ${totals.profitMargin >= 0 ? 'text-black' : 'text-red-600'}`}>
                          {totals.profitMargin.toFixed(1)}%
                        </span>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold">من إجمالي الدخل</span>
                    </div>
                </div>

                <div className="border-t border-b border-gray-100 py-6">
                    {renderTimelineChart()}
                </div>

                <div className="flex-1">
                   <h3 className="text-[12px] font-black mb-4 flex items-center gap-2 border-r-4 border-black pr-3">تحليل أداء المنتجات المبيعة:</h3>
                   <table className="w-full text-right text-[11px] border-collapse">
                      <thead>
                          <tr className="border-b-2 border-black">
                              <th className="py-3 font-black text-gray-400">اسم المنتج</th>
                              <th className="py-3 text-center font-black text-gray-400">الكمية</th>
                              <th className="py-3 text-center font-black text-gray-400">إيرادات البيع</th>
                              <th className="py-3 text-left font-black text-black">صافي الأرباح</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {productStats.map(([name, data], idx) => (
                              <tr key={idx} className="group hover:bg-gray-50">
                                  <td className="py-4 font-black text-black">{name}</td>
                                  <td className="py-4 text-center tabular-nums font-bold text-gray-600">{data.qty.toLocaleString()}</td>
                                  <td className="py-4 text-center tabular-nums font-bold text-gray-600">{data.revenue.toLocaleString()}</td>
                                  <td className={`py-4 text-left font-black tabular-nums ${data.profit >= 0 ? 'text-black' : 'text-red-600'}`}>
                                    {data.profit.toLocaleString()}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                   </table>
                </div>

                <div className="grid grid-cols-1 gap-8 pt-8 border-t-2 border-black">
                    <div>
                        <h4 className="text-[10px] font-black mb-3 flex items-center gap-2"><Target size={14} /> ملاحظات التقرير الإحصائي:</h4>
                        <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">
                          تم استخراج هذا التقرير بناءً على البيانات المسجلة في النظام للفترة المحددة. 
                          {totals.profit >= 0 
                            ? ` تم تحقيق صافي ربح قدره ${totals.profit.toLocaleString()} ل.س، مع مساهمة رئيسية من منتج (${productStats[0]?.[0] || '---'}).`
                            : ` تم تسجيل عجز إجمالي قدره ${Math.abs(totals.profit).toLocaleString()} ل.س خلال هذه الفترة.`
                          }
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-6 flex justify-between items-end border-t border-gray-100">
                    <div className="text-[8px] font-bold text-gray-400">
                        <p>نظام محاسبة مخبز كوكيز | CB-2026-v2</p>
                        <p>تاريخ الاستخراج: {now.toLocaleString('ar-SY')}</p>
                    </div>
                    <div className="text-center w-48 pt-2">
                        <div className="h-[1px] bg-black w-full mb-2"></div>
                        <span className="text-[10px] font-black">الاعتماد المالي المعتمد</span>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
