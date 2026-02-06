
import React, { useMemo, useState } from 'react';
import { X, BarChart3, Printer, FileText, TrendingUp, Trophy, Activity, Target, PieChart, ShoppingBag, Truck, ReceiptText, LineChart } from 'lucide-react';
import { ArchivedDay, SaleItem, PurchaseInvoice, PurchaseItem } from '../types';

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
        purchaseInvoices: day.purchaseInvoices || [],
        timestamp: day.timestamp
      })),
      {
        date: todayStr,
        revenue: currentSales.reduce((s, i) => s + (i.price * i.quantity), 0),
        purchases: currentPurchases.reduce((s, i) => s + i.totalAmount, 0),
        profit: currentSales.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0),
        items: currentSales,
        purchaseInvoices: currentPurchases,
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

  // إحصائيات المبيعات
  const productStats = useMemo(() => {
    const stats: Record<string, { qty: number, revenue: number, profit: number, unit: string, cost: number }> = {};
    filteredData.forEach(day => {
      day.items.forEach(item => {
        if (!stats[item.name]) stats[item.name] = { qty: 0, revenue: 0, profit: 0, unit: item.unitType, cost: 0 };
        stats[item.name].qty += item.quantity;
        stats[item.name].revenue += (item.price * item.quantity);
        stats[item.name].cost += ((item.costPrice || 0) * item.quantity);
        stats[item.name].profit += ((item.price - (item.costPrice || 0)) * item.quantity);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].qty - a[1].qty);
  }, [filteredData]);

  const totals = useMemo(() => {
    const revenue = filteredData.reduce((s, d) => s + d.revenue, 0);
    const purchases = filteredData.reduce((s, d) => s + d.purchases, 0);
    const profit = filteredData.reduce((s, d) => s + d.profit, 0);
    
    const uniqueOrders = new Set();
    filteredData.forEach(d => d.items.forEach(i => uniqueOrders.add(i.orderId)));
    
    return {
      revenue,
      purchases,
      profit,
      orderCount: uniqueOrders.size,
      avgOrder: uniqueOrders.size > 0 ? (revenue / uniqueOrders.size) : 0,
      expenseRatio: revenue > 0 ? (purchases / revenue * 100) : 0
    };
  }, [filteredData]);

  // منطق رسم المنحنيات البيانية بواسطة SVG
  const renderChart = () => {
    if (filteredData.length < 2) return null;

    const width = 800;
    const height = 180;
    const padding = 20;
    
    const maxVal = Math.max(...filteredData.map(d => Math.max(d.revenue, d.purchases, d.profit, 1000)));
    
    const getX = (index: number) => padding + (index * (width - 2 * padding) / (filteredData.length - 1));
    const getY = (val: number) => height - padding - (val * (height - 2 * padding) / maxVal);

    const generatePath = (dataKey: 'revenue' | 'purchases' | 'profit') => {
      return filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[dataKey])}`).join(' ');
    };

    return (
      <div className="w-full border-2 border-black p-4 bg-gray-50/50">
        <h3 className="text-[11px] font-black mb-4 flex items-center gap-2 border-b border-black/10 pb-1">
          <LineChart size={14} /> منحنيات الأداء المالي (المبيعات vs المشتريات vs الأرباح):
        </h3>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* شبكة أفقية خلفية */}
          {[0, 0.5, 1].map(p => (
            <line key={p} x1={padding} y1={getY(maxVal * p)} x2={width - padding} y2={getY(maxVal * p)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
          ))}
          
          {/* مسار المبيعات */}
          <path d={generatePath('revenue')} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* مسار المشتريات */}
          <path d={generatePath('purchases')} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round" strokeLinejoin="round" />
          {/* مسار الأرباح */}
          <path d={generatePath('profit')} fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* نقاط البيانات للأرباح */}
          {filteredData.map((d, i) => (
            <circle key={i} cx={getX(i)} cy={getY(d.profit)} r="4" fill="black" />
          ))}
        </svg>
        
        {/* مفتاح الرسم البياني */}
        <div className="flex justify-center gap-6 mt-4 text-[9px] font-black uppercase">
            <div className="flex items-center gap-1.5"><div className="w-8 h-1 bg-[#059669]"></div> <span>إجمالي المبيعات</span></div>
            <div className="flex items-center gap-1.5"><div className="w-8 h-1 bg-[#dc2626] border-b border-dashed border-white"></div> <span>إجمالي المشتريات</span></div>
            <div className="flex items-center gap-1.5"><div className="w-8 h-1.5 bg-black"></div> <span>صافي الربح الفعلي</span></div>
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
             <h3 className="font-black text-xl text-white">التقارير التحليلية والذكاء المالي</h3>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg border border-gray-200"><Printer size={18} /> طباعة التقرير الشامل (A4)</button>
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
                 <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-gray-900 border border-gray-800 text-white text-[10px] px-5 py-2.5 rounded-xl outline-none focus:border-[#FA8072]">
                   {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{getMonthName(i)}</option>)}
                 </select>
               </div>
             )}
          </div>

          <div className="flex justify-center p-4">
             <div id="report-a4-content" className="bg-white text-black w-[210mm] p-[15mm] shadow-2xl min-h-[297mm] flex flex-col gap-6">
                
                {/* الترويسة العصرية */}
                <div className="flex justify-between items-center border-b-4 border-black pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-3xl font-black rounded-xl">C</div>
                        <div>
                            <h1 className="text-3xl font-black uppercase text-black leading-none">مخبز كوكيز</h1>
                            <p className="text-[10px] font-bold text-gray-600 mt-1">نظام إدارة العمليات والتحليل المالي المتقدم</p>
                        </div>
                    </div>
                    <div className="text-left font-black">
                        <p className="text-xl uppercase border-b-2 border-black inline-block mb-1">تقرير الأداء المالي</p>
                        <p className="text-[9px] text-gray-500 block">الفترة: {viewMode === 'monthly' ? `${getMonthName(selectedMonth)} ${selectedYear}` : `آخر ${daysCount} يوم`}</p>
                    </div>
                </div>

                {/* قسم المؤشرات الشاملة (KPIs) */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="border-2 border-black p-4 text-center">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">إجمالي المبيعات</span>
                        <span className="text-lg font-black text-black tabular-nums">{totals.revenue.toLocaleString()}</span>
                    </div>
                    <div className="border-2 border-black p-4 text-center bg-gray-50">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">إجمالي المشتريات</span>
                        <span className="text-lg font-black text-red-600 tabular-nums">{totals.purchases.toLocaleString()}</span>
                    </div>
                    <div className="border-2 border-black p-4 text-center">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">صافي الربح</span>
                        <span className="text-lg font-black text-black tabular-nums">{totals.profit.toLocaleString()}</span>
                    </div>
                    <div className="border-2 border-black p-4 text-center">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">متوسط الفاتورة</span>
                        <span className="text-lg font-black text-black tabular-nums">{totals.avgOrder.toFixed(0)}</span>
                    </div>
                </div>

                {/* قسم منحنيات الأداء المالي (بديل الموردين والمشتريات) */}
                {renderChart()}

                {/* التحليل التفصيلي للمنتجات */}
                <div className="flex-1">
                   <h3 className="text-[11px] font-black mb-3 flex items-center gap-2"><PieChart size={14} /> تحليل ربحية الأصناف المباعة:</h3>
                   <table className="w-full text-right text-[10px] border-collapse">
                      <thead>
                          <tr className="bg-black text-white">
                              <th className="p-3 font-black">اسم الصنف</th>
                              <th className="p-3 text-center font-black">الكمية</th>
                              <th className="p-3 text-center font-black">المبيعات</th>
                              <th className="p-3 text-center font-black">التكلفة</th>
                              <th className="p-3 text-left font-black">الربح الصافي</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                          {productStats.map(([name, data], idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="p-2 font-black text-black">{name}</td>
                                  <td className="p-2 text-center tabular-nums font-bold">{data.qty.toLocaleString()}</td>
                                  <td className="p-2 text-center tabular-nums font-bold">{data.revenue.toLocaleString()}</td>
                                  <td className="p-2 text-center tabular-nums text-gray-500 font-bold">{data.cost.toLocaleString()}</td>
                                  <td className="p-2 text-left font-black tabular-nums">{data.profit.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                      <tfoot>
                          <tr className="border-t-4 border-black bg-gray-100 font-black text-[11px]">
                              <td className="p-3 text-xs">الإجمالي العام للفترة</td>
                              <td colSpan={3} className="p-3 text-center italic text-[9px] text-gray-500">تم احتساب الأرباح بناءً على تكلفة المواد عند المبيع</td>
                              <td className="p-3 text-left text-xs">{totals.profit.toLocaleString()} ل.س</td>
                          </tr>
                      </tfoot>
                   </table>
                </div>

                {/* ملخص الأداء الذكي */}
                <div className="p-4 bg-gray-50 border-r-8 border-black">
                    <h4 className="text-[10px] font-black mb-1 flex items-center gap-2 uppercase"><Target size={12} /> خلاصة المركز المالي والتوجه العام:</h4>
                    <p className="text-[10px] font-bold leading-relaxed text-gray-800">
                        تظهر الرسوم البيانية أعلاه استقرار المسار المالي للمخبز بمتوسط إيرادات دورية قدرها {totals.revenue.toLocaleString()} ل.س. 
                        تمثل التكاليف التشغيلية (المشتريات) حوالي {totals.expenseRatio.toFixed(1)}% من إجمالي الدخل، مما يشير إلى كفاءة إدارة التكاليف. 
                        الصنف الأعلى مبيعاً ({productStats[0]?.[0] || '---'}) يظل الركيزة الأساسية للنمو، بينما نوصي بمراقبة منحنى المشتريات لضمان بقاء هوامش الربح ضمن المنطقة الآمنة.
                    </p>
                </div>

                {/* التوقيعات */}
                <div className="mt-auto pt-6 border-t border-black flex justify-between items-end">
                    <div className="text-[8px] font-bold text-gray-500 space-y-1">
                        <p>نظام محاسبة مخبز كوكيز - CB Analytics v2.6</p>
                        <p>مرجع التقرير الرقمي: CB-{Date.now().toString().slice(-6)}</p>
                        <p>وقت الاستخراج: {now.toLocaleTimeString('ar-SY')}</p>
                    </div>
                    <div className="text-center w-48 border-t-2 border-black pt-2">
                        <span className="text-[10px] font-black">اعتماد الإدارة المالية</span>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
