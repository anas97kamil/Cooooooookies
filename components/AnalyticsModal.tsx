import React, { useMemo, useState } from 'react';
import { X, BarChart3, Printer, Calendar, Clock, ChevronLeft, Receipt, ShoppingCart, Users, ArrowRight } from 'lucide-react';
import { ArchivedDay, SaleItem, PurchaseInvoice, SalaryPayment, GeneralExpense } from '../types';

interface AnalyticsModalProps {
  history: ArchivedDay[];
  currentSales: SaleItem[];
  currentPurchases: PurchaseInvoice[];
  currentSalaries: SalaryPayment[];
  currentGeneralExpenses: GeneralExpense[];
  onClose: () => void;
}

type ViewFilter = 'today' | 'specific' | '7days' | 'monthly' | 'range';

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ history, currentSales, currentPurchases, currentSalaries, currentGeneralExpenses, onClose }) => {
  const [filter, setFilter] = useState<ViewFilter>('today');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-US'));
  
  // Custom Range State
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // تجميع كافة البيانات في مصفوفة واحدة موحدة
  const allData = useMemo(() => {
    const todayStr = now.toLocaleDateString('en-US');
    const combined = [
      ...history.map(day => ({
        id: day.id,
        date: day.date,
        revenue: day.totalRevenue,
        purchaseTotal: (day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0),
        salaryTotal: (day.salaryPayments || []).reduce((s, i) => s + i.amount, 0),
        generalExpTotal: (day.generalExpenses || []).reduce((s, i) => s + i.amount, 0),
        expenses: ((day.purchaseInvoices || []).reduce((s, i) => s + i.totalAmount, 0) + 
                   (day.salaryPayments || []).reduce((s, i) => s + i.amount, 0) + 
                   (day.generalExpenses || []).reduce((s, i) => s + i.amount, 0)),
        profit: day.items.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0),
        items: day.items,
        timestamp: day.timestamp
      })),
      {
        id: 'today-active',
        date: todayStr,
        revenue: currentSales.reduce((s, i) => s + (i.price * i.quantity), 0),
        purchaseTotal: currentPurchases.reduce((s, i) => s + i.totalAmount, 0),
        salaryTotal: currentSalaries.reduce((s, i) => s + i.amount, 0),
        generalExpTotal: currentGeneralExpenses.reduce((s, i) => s + i.amount, 0),
        expenses: (currentPurchases.reduce((s, i) => s + i.totalAmount, 0) + 
                   currentSalaries.reduce((s, i) => s + i.amount, 0) + 
                   currentGeneralExpenses.reduce((s, i) => s + i.amount, 0)),
        profit: currentSales.reduce((s, i) => s + ((i.price - (i.costPrice || 0)) * i.quantity), 0),
        items: currentSales,
        timestamp: Date.now()
      }
    ].sort((a, b) => a.timestamp - b.timestamp);
    return combined;
  }, [history, currentSales, currentPurchases, currentSalaries, currentGeneralExpenses]);

  // تطبيق الفلتر المختار
  const filteredData = useMemo(() => {
    switch(filter) {
        case 'today':
            return allData.filter(d => d.date === now.toLocaleDateString('en-US'));
        case 'specific':
            return allData.filter(d => d.date === selectedDate);
        case '7days':
            return allData.slice(-7);
        case 'monthly':
            return allData.filter(d => {
                const date = new Date(d.timestamp);
                return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
            });
        case 'range': {
            const startTs = new Date(startDate).setHours(0, 0, 0, 0);
            const endTs = new Date(endDate).setHours(23, 59, 59, 999);
            return allData.filter(d => d.timestamp >= startTs && d.timestamp <= endTs);
        }
        default:
            return allData;
    }
  }, [allData, filter, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const totals = useMemo(() => {
    const revenue = filteredData.reduce((s, d) => s + d.revenue, 0);
    const purchases = filteredData.reduce((s, d) => s + d.purchaseTotal, 0);
    const salaries = filteredData.reduce((s, d) => s + d.salaryTotal, 0);
    const general = filteredData.reduce((s, d) => s + d.generalExpTotal, 0);
    const expenses = purchases + salaries + general;
    const profit = filteredData.reduce((s, d) => s + d.profit, 0) - general;
    const profitMargin = revenue > 0 ? (profit / revenue * 100) : 0;
    
    return { revenue, purchases, salaries, general, expenses, profit, profitMargin };
  }, [filteredData]);

  const productStats = useMemo(() => {
    const stats: Record<string, { qty: number, revenue: number, profit: number }> = {};
    filteredData.forEach(day => {
      day.items.forEach(item => {
        if (!stats[item.name]) stats[item.name] = { qty: 0, revenue: 0, profit: 0 };
        stats[item.name].qty += item.quantity;
        stats[item.name].revenue += (item.price * item.quantity);
        stats[item.name].profit += ((item.price - (item.costPrice || 0)) * item.quantity);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredData]);

  const getReportTitle = () => {
    if (filter === 'today') return "تقرير المبيعات والمصاريف لليوم";
    if (filter === 'specific') return `تقرير مالي ليوم: ${selectedDate}`;
    if (filter === '7days') return "تحليل الأداء للأسبوع الأخير";
    if (filter === 'range') return `تقرير مالي مخصص من ${startDate} إلى ${endDate}`;
    return `الجرد المالي لشهر: ${getMonthName(selectedMonth)} ${selectedYear}`;
  };

  const getMonthName = (m: number) => new Date(2000, m).toLocaleString('ar-SY', { month: 'long' });

  const handlePrint = () => {
    const printArea = document.getElementById('print-area');
    const content = document.getElementById('report-a4-content');
    if (content && printArea) {
      printArea.innerHTML = content.innerHTML;
      printArea.className = 'print-mode-a4';
      window.print();
      setTimeout(() => { printArea.innerHTML = ''; printArea.className = ''; }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print overflow-hidden">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-6xl shadow-2xl border border-gray-700 flex flex-col h-[95vh]">
        
        {/* Header Section */}
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-[#FA8072]/20 p-2.5 rounded-2xl"><BarChart3 className="text-[#FA8072]" size={24} /></div>
             <div className="flex flex-col">
                <h3 className="font-black text-xl text-white">التحليلات المالية</h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Financial Intelligence Unit</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg"><Printer size={18} /> طباعة (A4)</button>
              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition-all text-gray-400"><X size={24} /></button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="bg-gray-900/50 border-b border-gray-700 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex bg-gray-950 p-1.5 rounded-2xl border border-gray-800 w-full md:w-auto overflow-x-auto">
                <button onClick={() => setFilter('today')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${filter === 'today' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500'}`}>اليوم</button>
                <button onClick={() => setFilter('specific')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${filter === 'specific' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500'}`}>يوم محدد</button>
                <button onClick={() => setFilter('7days')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${filter === '7days' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500'}`}>أسبوع</button>
                <button onClick={() => setFilter('monthly')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${filter === 'monthly' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500'}`}>شهري</button>
                <button onClick={() => setFilter('range')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${filter === 'range' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>نطاق مخصص</button>
            </div>

            {filter === 'specific' && (
                <div className="flex items-center gap-2 animate-fade-up">
                    <span className="text-[10px] text-gray-500 font-black">اختر اليوم:</span>
                    <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-gray-950 border border-gray-700 text-white text-[11px] px-4 py-2 rounded-xl outline-none font-bold">
                        {allData.map(d => <option key={d.date} value={d.date}>{d.date}</option>)}
                    </select>
                </div>
            )}

            {filter === 'monthly' && (
                <div className="flex items-center gap-2 animate-fade-up">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-gray-950 border border-gray-700 text-white text-[11px] px-4 py-2 rounded-xl outline-none font-bold">
                        {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{getMonthName(i)}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-gray-950 border border-gray-700 text-white text-[11px] px-4 py-2 rounded-xl outline-none font-bold">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            )}

            {filter === 'range' && (
                <div className="flex items-center gap-2 animate-fade-up bg-gray-950 p-2 rounded-2xl border border-gray-800">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-500 font-black px-1">من:</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-white text-[10px] outline-none font-bold px-1" />
                    </div>
                    <ArrowRight size={14} className="text-gray-700" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-500 font-black px-1">إلى:</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-white text-[10px] outline-none font-bold px-1" />
                    </div>
                </div>
            )}
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-950/20">
          <div className="flex justify-center p-4 min-h-fit">
             <div id="report-a4-content" className="bg-white text-black w-full max-w-[210mm] p-[15mm] shadow-2xl flex flex-col gap-10 print:p-0">
                
                {/* A4 Report Header */}
                <div className="flex justify-between items-end border-b-4 border-black pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-black mb-1">مخبز كوكيز</h1>
                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">{getReportTitle()}</p>
                    </div>
                    <div className="text-left font-black">
                        <span className="text-[10px] text-gray-400 block uppercase mb-1">تاريخ الاستخراج</span>
                        <span className="text-lg tabular-nums">{now.toLocaleDateString('en-US')}</span>
                    </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="border-r-2 border-black/5 pr-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">إجمالي المبيعات</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-black tabular-nums">{totals.revenue.toLocaleString()}</span>
                            <span className="text-[8px] text-gray-500 font-bold">ل.س</span>
                        </div>
                    </div>
                    <div className="border-r-2 border-black/5 pr-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">إجمالي المصاريف</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-red-600 tabular-nums">{totals.expenses.toLocaleString()}</span>
                            <span className="text-[8px] text-gray-500 font-bold">ل.س</span>
                        </div>
                    </div>
                    <div className="border-r-2 border-black/5 pr-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">صافي الربح</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black tabular-nums ${totals.profit >= 0 ? 'text-green-600' : 'text-red-700'}`}>
                              {totals.profit.toLocaleString()}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold">ل.س</span>
                        </div>
                    </div>
                    <div className="pr-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">نسبة الربحية</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-black tabular-nums">{totals.profitMargin.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Expenses Breakdown */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 grid grid-cols-3 gap-6">
                    <div>
                        <h4 className="text-[9px] font-black text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest"><ShoppingCart size={14} className="text-red-500" /> مشتريات (مواد):</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-black tabular-nums">{totals.purchases.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-400 font-bold">ليرة</span>
                        </div>
                    </div>
                    <div className="border-r border-gray-200 pr-6">
                        <h4 className="text-[9px] font-black text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest"><Users size={14} className="text-green-600" /> عمال (رواتب):</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-black tabular-nums">{totals.salaries.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-400 font-bold">ليرة</span>
                        </div>
                    </div>
                    <div className="border-r border-gray-200 pr-6">
                        <h4 className="text-[9px] font-black text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest"><Receipt size={14} className="text-pink-500" /> مصاريف عامة:</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-black tabular-nums">{totals.general.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-400 font-bold">ليرة</span>
                        </div>
                    </div>
                </div>

                {/* Product Performance Table */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black flex items-center gap-2 border-r-4 border-black pr-3 uppercase">أداء المنتجات الأكثر مبيعاً:</h3>
                    </div>
                    <table className="w-full text-right text-[11px] border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black/10">
                                <th className="py-3 font-black text-gray-400 uppercase">المنتج</th>
                                <th className="py-3 text-center font-black text-gray-400 uppercase">الكمية المبيعة</th>
                                <th className="py-3 text-center font-black text-gray-400 uppercase">إجمالي المبيعات</th>
                                <th className="py-3 text-left font-black text-black uppercase">هامش الربح</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productStats.map(([name, data], idx) => (
                                <tr key={idx} className="group">
                                    <td className="py-4 font-black text-black">{name}</td>
                                    <td className="py-4 text-center tabular-nums font-bold text-gray-500">{data.qty.toLocaleString()}</td>
                                    <td className="py-4 text-center tabular-nums font-bold text-gray-500">{data.revenue.toLocaleString()}</td>
                                    <td className={`py-4 text-left font-black tabular-nums ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {data.profit.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {productStats.length === 0 && (
                                <tr><td colSpan={4} className="py-20 text-center text-gray-400 italic">لا توجد بيانات بيع متوفرة لهذا النطاق الزمني</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Analytics Footer */}
                <div className="mt-auto pt-10 border-t border-gray-100 flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Cookie Accounting v2.5 Premium</p>
                        <p className="text-[9px] font-bold text-gray-400">جميع البيانات مسجلة ومشفرة محلياً.</p>
                    </div>
                    <div className="text-center w-48">
                        <div className="h-[1px] bg-black w-full mb-2"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">توقيع المسؤول المالي</span>
                    </div>
                </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );
};