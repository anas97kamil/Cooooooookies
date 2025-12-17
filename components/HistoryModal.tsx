import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronDown, ChevronUp, Download, Store, User, Search, Receipt, Package, ArrowRight, Folder, CalendarDays, TrendingDown, TrendingUp, Wallet, BadgeDollarSign, ChartBar } from 'lucide-react';
import { ArchivedDay, SaleItem } from '../types';

interface HistoryModalProps {
  history: ArchivedDay[];
  onClose: () => void;
  onClearHistory: () => void;
  onPreviewInvoice: (items: SaleItem[]) => void;
}

type NavStep = 'years' | 'months' | 'days';
type ViewMode = 'invoices' | 'items' | 'profit';

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory, onPreviewInvoice }) => {
  const [step, setStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [viewMode, setViewMode] = useState<ViewMode>('invoices');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const searchResults = useMemo(() => {
      if (!searchTerm) return null;
      const lowerTerm = searchTerm.toLowerCase();
      const allInvoices: { date: string; items: SaleItem[]; total: number; customerName: string; saleType: string }[] = [];

      history.forEach(day => {
          const dayGroups: { [key: string]: SaleItem[] } = {};
          day.items.forEach(item => {
              const key = item.orderId || `legacy-${item.time}`;
              if (!dayGroups[key]) dayGroups[key] = [];
              dayGroups[key].push(item);
          });

          Object.values(dayGroups).forEach(group => {
              const first = group[0];
              const name = first.customerName || `زبون ${first.customerNumber}`;
              if (name.toLowerCase().includes(lowerTerm) || first.customerNumber.toString().includes(lowerTerm)) {
                  allInvoices.push({
                      date: day.date,
                      items: group,
                      total: group.reduce((sum, i) => sum + i.price * i.quantity, 0),
                      customerName: name,
                      saleType: first.saleType
                  });
              }
          });
      });
      return allInvoices;
  }, [history, searchTerm]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>(history.map(day => new Date(day.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [history]);

  const months = useMemo(() => {
    if (!selectedYear) return [];
    const uniqueMonths = new Set<number>(
      history
        .filter(day => new Date(day.timestamp).getFullYear().toString() === selectedYear)
        .map(day => new Date(day.timestamp).getMonth())
    );
    return Array.from(uniqueMonths).sort((a, b) => b - a);
  }, [history, selectedYear]);

  const currentDaysData = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    return history.filter(day => {
      const d = new Date(day.timestamp);
      return d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [history, selectedYear, selectedMonth]);

  const aggregatedItems = useMemo(() => {
      const itemMap = new Map<string, { name: string; quantity: number; revenue: number; cost: number; unitType: string }>();

      currentDaysData.forEach(day => {
          day.items.forEach(item => {
              const key = `${item.name}-${item.unitType}`;
              const existing = itemMap.get(key);
              const cost = (item.costPrice || 0) * item.quantity;
              const revenue = item.price * item.quantity;
              if (existing) {
                  existing.quantity += item.quantity;
                  existing.revenue += revenue;
                  existing.cost += cost;
              } else {
                  itemMap.set(key, {
                      name: item.name,
                      quantity: item.quantity,
                      revenue: revenue,
                      cost: cost,
                      unitType: item.unitType
                  });
              }
          });
      });

      return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [currentDaysData]);

  const totalRevenueForPeriod = currentDaysData.reduce((sum, day) => sum + day.totalRevenue, 0);
  const totalCostForPeriod = aggregatedItems.reduce((sum, item) => sum + item.cost, 0);
  const totalProfitForPeriod = totalRevenueForPeriod - totalCostForPeriod;

  const handleYearSelect = (year: string) => { setSelectedYear(year); setStep('months'); };
  const handleMonthSelect = (monthIndex: number) => { setSelectedMonth(monthIndex); setStep('days'); };
  const handleBack = () => {
    if (step === 'days') { setStep('months'); setSelectedMonth(-1); } 
    else if (step === 'months') { setStep('years'); setSelectedYear(''); }
  };

  const getMonthName = (monthIndex: number) => {
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleString('ar-SY', { month: 'long' });
  };

  const renderContent = () => {
    if (searchTerm) {
        if (!searchResults || searchResults.length === 0) {
            return <div className="flex flex-col items-center justify-center h-full text-gray-500"><Search size={48} className="mb-4 opacity-50" /><p>لا توجد نتائج مطابقة</p></div>;
        }
        return (
            <div className="animate-fade-up space-y-4">
                 <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex justify-between items-center">
                    <div><h4 className="text-white font-bold text-sm">نتائج البحث: {searchTerm}</h4></div>
                    <div className="text-right"><span className="block font-bold text-[#FA8072] text-xl">{searchResults.reduce((a,c) => a+c.total, 0).toLocaleString()} ل.س</span></div>
                 </div>
                 <div className="space-y-3">
                    {searchResults.map((inv, idx) => (
                         <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                             <div className="flex justify-between items-start mb-2">
                                 <div><span className="font-bold text-white block">{inv.customerName}</span><span className="text-xs text-gray-500">{inv.date}</span></div>
                                 <div className="flex items-center gap-3"><span className="font-bold text-[#FA8072]">{inv.total.toLocaleString()}</span><button onClick={() => onPreviewInvoice(inv.items)} className="bg-gray-700 p-1.5 rounded-lg"><Download size={16} /></button></div>
                             </div>
                         </div>
                    ))}
                 </div>
            </div>
        );
    }

    if (step === 'years') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
                {years.map(year => (
                    <button key={year} onClick={() => handleYearSelect(year)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600 p-6 rounded-2xl flex flex-col items-center gap-3 group transition-all">
                        <Folder size={40} className="text-[#FA8072]" />
                        <span className="text-xl font-bold text-white">{year}</span>
                    </button>
                ))}
            </div>
        );
    }

    if (step === 'months') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
                {months.map(monthIdx => (
                    <button key={monthIdx} onClick={() => handleMonthSelect(monthIdx)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all">
                        <CalendarDays size={40} className="text-blue-400" />
                        <span className="text-xl font-bold text-white">{getMonthName(monthIdx)}</span>
                    </button>
                ))}
            </div>
        );
    }

    if (step === 'days') {
        return (
            <div className="flex flex-col gap-4 animate-fade-up h-full">
                <div className="flex bg-gray-700 p-1 rounded-xl shrink-0">
                    <button onClick={() => setViewMode('invoices')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'invoices' ? 'bg-white text-black' : 'text-gray-400'}`}>
                        <Receipt size={16} /> فواتير اليوم
                    </button>
                    <button onClick={() => setViewMode('items')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'items' ? 'bg-[#FA8072] text-white' : 'text-gray-400'}`}>
                        <Package size={16} /> المبيعات
                    </button>
                    <button onClick={() => setViewMode('profit')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'profit' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
                        <BadgeDollarSign size={16} /> الأرباح
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-900/30 rounded-xl border border-gray-700/50 p-2">
                    {viewMode === 'profit' ? (
                        <div className="animate-fade-up space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <span className="text-[10px] text-gray-500 font-bold block mb-1">إجمالي المبيعات</span>
                                    <span className="text-xl font-bold text-white">{totalRevenueForPeriod.toLocaleString()}</span>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <span className="text-[10px] text-gray-500 font-bold block mb-1">رأس المال (المواد)</span>
                                    <span className="text-xl font-bold text-red-400">{totalCostForPeriod.toLocaleString()}</span>
                                </div>
                                <div className="bg-green-900/20 p-4 rounded-xl border border-green-800">
                                    <span className="text-[10px] text-green-600 font-bold block mb-1">صافي الربح الشهري</span>
                                    <span className="text-2xl font-black text-green-400">{totalProfitForPeriod.toLocaleString()} <span className="text-xs font-normal">ل.س</span></span>
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                <h5 className="p-3 bg-gray-900/50 text-white font-bold text-sm">تحليل الربحية لكل مادة</h5>
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-gray-900 text-gray-500 text-[10px]">
                                        <tr><th className="p-3">المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3">الإيراد</th><th className="p-3">الربح</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {aggregatedItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 text-white font-medium">{item.name}</td>
                                                <td className="p-3 text-center text-gray-400">{item.quantity} {item.unitType === 'kg' ? 'كغ' : 'قطعة'}</td>
                                                <td className="p-3 text-white">{item.revenue.toLocaleString()}</td>
                                                <td className="p-3 text-green-400 font-bold">{(item.revenue - item.cost).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : viewMode === 'items' ? (
                        <div className="space-y-3">
                            {aggregatedItems.map((item, idx) => (
                                <div key={idx} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                                    <div><span className="text-white font-bold block">{item.name}</span><span className="text-xs text-gray-500">{item.quantity} مبيع</span></div>
                                    <span className="text-[#FA8072] font-bold">{item.revenue.toLocaleString()} ل.س</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentDaysData.map(day => (
                                <div key={day.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                    <div onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className="p-4 flex justify-between items-center cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            {expandedDayId === day.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            <span className="text-white font-bold">{day.date}</span>
                                        </div>
                                        <span className="text-[#FA8072] font-bold">{day.totalRevenue.toLocaleString()} ل.س</span>
                                    </div>
                                    {expandedDayId === day.id && (
                                        <div className="p-3 bg-gray-900/50 border-t border-gray-700 space-y-2">
                                            {day.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-400"><span>{item.name} ({item.quantity})</span><span>{item.price * item.quantity}</span></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col h-[85vh]">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
                {step !== 'years' && <button onClick={handleBack} className="bg-gray-700 p-2 rounded-full text-white"><ArrowRight size={20} /></button>}
                <h3 className="font-bold text-lg text-white">الأرشيف وتحليل الأرباح</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><X size={24} /></button>
        </div>
        <div className="p-4 flex-1 overflow-hidden bg-gray-900/20">{renderContent()}</div>
      </div>
    </div>
  );
};