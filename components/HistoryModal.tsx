
import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, ArrowRight, Folder, CalendarDays, ShoppingCart, ShoppingBag, TrendingUp } from 'lucide-react';
import { ArchivedDay, SaleItem } from '../types';

interface HistoryModalProps {
  history: ArchivedDay[];
  onClose: () => void;
  onClearHistory: () => void;
  onPreviewInvoice: (items: SaleItem[]) => void;
  onUpdateOrder: (date: string, orderId: string, updatedItems: SaleItem[]) => void;
}

type NavStep = 'years' | 'months' | 'days';
type ViewType = 'sales' | 'purchases';

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory, onPreviewInvoice, onUpdateOrder }) => {
  const [step, setStep] = useState<NavStep>('years');
  const [viewType, setViewType] = useState<ViewType>('sales');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

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
    }).sort((a,b) => b.timestamp - a.timestamp);
  }, [history, selectedYear, selectedMonth]);

  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex).toLocaleString('ar-SY', { month: 'long' });
  };

  const renderContent = () => {
    if (step === 'years') return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up">
            {years.length > 0 ? years.map(year => (
                <button key={year} onClick={() => { setSelectedYear(year); setStep('months'); }} className="bg-gray-700/50 hover:bg-gray-600 border border-gray-600 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <Folder size={48} className="text-[#FA8072] group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-black text-white">{year}</span>
                </button>
            )) : (
              <div className="col-span-full py-20 text-center text-gray-500">لا توجد بيانات مؤرشفة بعد</div>
            )}
        </div>
    );

    if (step === 'months') return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up">
            {months.map(monthIdx => (
                <button key={monthIdx} onClick={() => { setSelectedMonth(monthIdx); setStep('days'); }} className="bg-gray-700/50 hover:bg-gray-600 border border-gray-600 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <CalendarDays size={48} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white">{getMonthName(monthIdx)}</span>
                </button>
            ))}
        </div>
    );

    if (step === 'days') return (
        <div className="flex flex-col gap-4 animate-fade-up h-full">
            <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
                <button onClick={() => setViewType('sales')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${viewType === 'sales' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>أرشيف المبيعات</button>
                <button onClick={() => setViewType('purchases')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${viewType === 'purchases' ? 'bg-[#FA8072] text-white' : 'text-gray-500 hover:text-gray-300'}`}>أرشيف المشتريات</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {currentDaysData.map(day => {
                    const purchaseTotal = (day.purchaseInvoices || []).reduce((s,i) => s + i.totalAmount, 0);
                    const dayTotal = viewType === 'sales' ? day.totalRevenue : purchaseTotal;
                    
                    return (
                        <div key={day.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                            <div onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className="p-4 flex justify-between items-center cursor-pointer bg-gray-900/50 hover:bg-gray-900 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-500">{expandedDayId === day.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                                    <span className="text-white font-bold">{day.date}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-black text-lg ${viewType === 'sales' ? 'text-green-400' : 'text-red-400'}`}>
                                        {dayTotal.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">ل.س</span>
                                </div>
                            </div>
                            
                            {expandedDayId === day.id && (
                                <div className="p-4 bg-gray-900/30 border-t border-gray-700 animate-fade-up">
                                    {viewType === 'sales' ? (
                                        <div className="space-y-2">
                                            {day.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs p-3 bg-gray-800 rounded-lg border border-gray-700/50">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBag size={14} className="text-gray-500" />
                                                        <span className="text-white font-medium">{item.name} <span className="text-gray-500 font-normal">({item.quantity})</span></span>
                                                    </div>
                                                    <span className="text-white font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <button onClick={() => onPreviewInvoice(day.items)} className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors">معاينة الفاتورة اليومية</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {(day.purchaseInvoices || []).map((inv, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs p-3 bg-gray-800 rounded-lg border border-red-900/10">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingCart size={14} className="text-red-400/50" />
                                                        <span className="text-gray-300 font-bold">{inv.supplierName}</span>
                                                    </div>
                                                    <span className="text-red-400 font-black">{inv.totalAmount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {(!day.purchaseInvoices || day.purchaseInvoices.length === 0) && <p className="text-center py-4 text-gray-600 text-[10px] italic">لا توجد مشتريات لهذا اليوم</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-700 flex flex-col h-[85vh] overflow-hidden">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
            <div className="flex items-center gap-4">
                {step !== 'years' && (
                    <button onClick={() => {
                        if (step === 'days') { setStep('months'); setSelectedMonth(-1); } 
                        else if (step === 'months') { setStep('years'); setSelectedYear(''); }
                    }} className="bg-gray-700 hover:bg-[#FA8072] p-2 rounded-full text-white transition-colors">
                        <ArrowRight size={20} />
                    </button>
                )}
                <div>
                    <h3 className="font-black text-xl text-white">الأرشيف المحاسبي</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                        {selectedYear} {selectedMonth !== -1 ? `• ${getMonthName(selectedMonth)}` : ''}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">{renderContent()}</div>
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-center">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div><span className="text-[10px] text-gray-500 font-bold">تصفح زمنـي</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#FA8072]"></div><span className="text-[10px] text-gray-500 font-bold">نظام الأرشفة v2</span></div>
            </div>
        </div>
      </div>
    </div>
  );
};
