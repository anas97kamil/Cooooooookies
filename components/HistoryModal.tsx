
import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronDown, ChevronUp, Download, Store, User, Search, Receipt, Package, ArrowRight, Folder, CalendarDays, TrendingDown, TrendingUp, Wallet, BadgeDollarSign, Edit3, Save, Trash2, Filter } from 'lucide-react';
import { ArchivedDay, SaleItem, SaleType } from '../types';

interface HistoryModalProps {
  history: ArchivedDay[];
  onClose: () => void;
  onClearHistory: () => void;
  onPreviewInvoice: (items: SaleItem[]) => void;
  onUpdateOrder: (date: string, orderId: string, updatedItems: SaleItem[]) => void;
}

type NavStep = 'years' | 'months' | 'days';
type ViewMode = 'invoices' | 'items' | 'profit';
type SaleFilter = 'all' | 'retail' | 'wholesale';

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory, onPreviewInvoice, onUpdateOrder }) => {
  const [step, setStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [viewMode, setViewMode] = useState<ViewMode>('invoices');
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('all');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  
  const [editingOrder, setEditingOrder] = useState<{ date: string, orderId: string, items: SaleItem[] } | null>(null);

  const searchResults = useMemo(() => {
      if (!searchTerm) return null;
      const lowerTerm = searchTerm.toLowerCase();
      const allInvoices: { date: string; items: SaleItem[]; total: number; customerName: string; saleType: string; orderId: string }[] = [];

      history.forEach(day => {
          const dayGroups: { [key: string]: SaleItem[] } = {};
          day.items.forEach(item => {
              const key = item.orderId || `legacy-${item.time}`;
              if (!dayGroups[key]) dayGroups[key] = [];
              dayGroups[key].push(item);
          });

          Object.values(dayGroups).forEach(group => {
              const first = group[0];
              const name = (first.customerName || `زبون ${first.customerNumber}`).toLowerCase();
              if (name.includes(lowerTerm) || first.customerNumber.toString().includes(lowerTerm)) {
                  allInvoices.push({
                      date: day.date,
                      items: group,
                      total: group.reduce((sum, i) => sum + i.price * i.quantity, 0),
                      customerName: first.customerName || `زبون ${first.customerNumber}`,
                      saleType: first.saleType,
                      orderId: first.orderId
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

  // Main data filtering logic for day view
  const currentDaysData = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    
    return history.filter(day => {
      const d = new Date(day.timestamp);
      return d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth;
    }).map(day => {
        // Apply sale type filter to items within each day
        const filteredItems = day.items.filter(item => 
            saleFilter === 'all' || item.saleType === saleFilter
        );
        
        return {
            ...day,
            items: filteredItems,
            totalRevenue: filteredItems.reduce((s, i) => s + (i.price * i.quantity), 0),
            totalItems: filteredItems.reduce((s, i) => s + i.quantity, 0)
        };
    }).filter(day => day.items.length > 0); // Only keep days that have items after filtering
  }, [history, selectedYear, selectedMonth, saleFilter]);

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
                  itemMap.set(key, { name: item.name, quantity: item.quantity, revenue: revenue, cost: cost, unitType: item.unitType });
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

  const saveEditedOrder = () => {
      if (!editingOrder) return;
      onUpdateOrder(editingOrder.date, editingOrder.orderId, editingOrder.items);
      setEditingOrder(null);
  };

  const getMonthName = (monthIndex: number) => {
    const date = new Date(2000, monthIndex);
    return date.toLocaleString('ar-SY', { month: 'long' });
  };

  const renderContent = () => {
    if (editingOrder) {
        return (
            <div className="bg-gray-800 rounded-2xl p-6 space-y-4 animate-fade-up">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h4 className="text-white font-bold flex items-center gap-2"><Edit3 size={18} /> تعديل الفاتورة - {editingOrder.date}</h4>
                    <button onClick={() => setEditingOrder(null)} className="text-gray-400"><X size={20}/></button>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[50vh]">
                    {editingOrder.items.map((item, idx) => (
                        <div key={item.id} className="bg-gray-700 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                            <span className="text-white font-bold flex-1">{item.name}</span>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-gray-500 uppercase">الكمية</label>
                                <input type="number" step="0.1" value={item.quantity} onChange={e => {
                                    const next = [...editingOrder.items];
                                    next[idx] = { ...next[idx], quantity: parseFloat(e.target.value) || 0 };
                                    setEditingOrder({ ...editingOrder, items: next });
                                }} className="bg-gray-900 text-white w-20 text-center py-1 rounded" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-gray-500 uppercase">السعر</label>
                                <input type="number" value={item.price} onChange={e => {
                                    const next = [...editingOrder.items];
                                    next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 };
                                    setEditingOrder({ ...editingOrder, items: next });
                                }} className="bg-gray-900 text-[#FA8072] font-bold w-24 text-center py-1 rounded" />
                            </div>
                            <button onClick={() => {
                                const next = editingOrder.items.filter(i => i.id !== item.id);
                                setEditingOrder({ ...editingOrder, items: next });
                            }} className="text-red-400 p-2"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <button onClick={saveEditedOrder} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={20}/> حفظ التعديلات</button>
                    <button onClick={() => setEditingOrder(null)} className="px-6 bg-gray-700 text-white rounded-xl">إلغاء</button>
                </div>
            </div>
        );
    }

    if (searchTerm) {
        if (!searchResults || searchResults.length === 0) return <div className="flex flex-col items-center justify-center h-full text-gray-500"><Search size={48} className="mb-4 opacity-50" /><p>لا توجد نتائج مطابقة</p></div>;
        return (
            <div className="animate-fade-up space-y-4 overflow-y-auto max-h-[70vh]">
                 <div className="space-y-3">
                    {searchResults.map((inv, idx) => (
                         <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <span className="font-bold text-white block">{inv.customerName}</span>
                                     <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{inv.date}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${inv.saleType === 'wholesale' ? 'bg-[#FA8072]/20 text-[#FA8072]' : 'bg-blue-400/20 text-blue-400'}`}>
                                            {inv.saleType === 'wholesale' ? 'جملة' : 'مفرق'}
                                        </span>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <span className="font-bold text-[#FA8072]">{inv.total.toLocaleString()}</span>
                                     <button onClick={() => setEditingOrder({ date: inv.date, orderId: inv.orderId, items: inv.items })} className="bg-blue-600/20 text-blue-400 p-2 rounded-lg"><Edit3 size={16} /></button>
                                     <button onClick={() => onPreviewInvoice(inv.items)} className="bg-gray-700 p-2 rounded-lg text-white"><Download size={16} /></button>
                                 </div>
                             </div>
                         </div>
                    ))}
                 </div>
            </div>
        );
    }

    if (step === 'years') return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
            {years.map(year => (
                <button key={year} onClick={() => handleYearSelect(year)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all">
                    <Folder size={40} className="text-[#FA8072]" />
                    <span className="text-xl font-bold text-white">{year}</span>
                </button>
            ))}
        </div>
    );

    if (step === 'months') return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
            {months.map(monthIdx => (
                <button key={monthIdx} onClick={() => handleMonthSelect(monthIdx)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all">
                    <CalendarDays size={40} className="text-blue-400" />
                    <span className="text-xl font-bold text-white">{getMonthName(monthIdx)}</span>
                </button>
            ))}
        </div>
    );

    if (step === 'days') return (
        <div className="flex flex-col gap-4 animate-fade-up h-full">
            
            {/* Main Tabs (Invoices, Items, Profit) */}
            <div className="flex bg-gray-700 p-1 rounded-xl shrink-0">
                <button onClick={() => setViewMode('invoices')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'invoices' ? 'bg-white text-black' : 'text-gray-400'}`}><Receipt size={16} /> الفواتير</button>
                <button onClick={() => setViewMode('items')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'items' ? 'bg-[#FA8072] text-white' : 'text-gray-400'}`}><Package size={16} /> المواد</button>
                <button onClick={() => setViewMode('profit')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'profit' ? 'bg-green-600 text-white' : 'text-gray-400'}`}><BadgeDollarSign size={16} /> الأرباح</button>
            </div>

            {/* Sale Type Sub-filter */}
            <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-700 shrink-0">
                <span className="text-[10px] font-bold text-gray-500 mr-2 flex items-center gap-1"><Filter size={10} /> نوع البيع:</span>
                <button onClick={() => setSaleFilter('all')} className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors ${saleFilter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-700'}`}>الكل</button>
                <button onClick={() => setSaleFilter('retail')} className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors ${saleFilter === 'retail' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:bg-gray-700'}`}>مفرق</button>
                <button onClick={() => setSaleFilter('wholesale')} className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors ${saleFilter === 'wholesale' ? 'bg-[#FA8072]/30 text-[#FA8072] border border-[#FA8072]/20' : 'text-gray-500 hover:bg-gray-700'}`}>جملة</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-900/30 rounded-xl border border-gray-700/50 p-2">
                {viewMode === 'profit' ? (
                    <div className="animate-fade-up space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center"><span className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">الإيراد ({saleFilter === 'all' ? 'كلي' : saleFilter === 'retail' ? 'مفرق' : 'جملة'})</span><span className="text-xl font-bold text-white">{totalRevenueForPeriod.toLocaleString()}</span></div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center"><span className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">التكلفة</span><span className="text-xl font-bold text-red-400">{totalCostForPeriod.toLocaleString()}</span></div>
                            <div className="bg-green-900/20 p-4 rounded-xl border border-green-800 text-center"><span className="text-[10px] text-green-600 font-bold block mb-1 uppercase tracking-wider">الربح الصافي</span><span className="text-2xl font-black text-green-400">{totalProfitForPeriod.toLocaleString()}</span></div>
                        </div>
                        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"><table className="w-full text-right text-sm"><thead className="bg-gray-900 text-gray-500 text-[10px]"><tr><th className="p-3">المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3">الربح</th></tr></thead><tbody className="divide-y divide-gray-700">{aggregatedItems.map((item, idx) => (<tr key={idx}><td className="p-3 text-white">{item.name}</td><td className="p-3 text-center text-gray-400">{item.quantity} {item.unitType === 'kg' ? 'كغ' : 'قطعة'}</td><td className="p-3 text-green-400 font-bold">{(item.revenue - item.cost).toLocaleString()}</td></tr>))}</tbody></table></div>
                    </div>
                ) : viewMode === 'items' ? (
                    <div className="space-y-3">
                        {aggregatedItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 text-sm">لا توجد مبيعات بهذا النوع في الفترة المحددة</div>
                        ) : aggregatedItems.map((item, idx) => (
                            <div key={idx} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                                <div><span className="text-white font-bold block">{item.name}</span><span className="text-xs text-gray-500">{item.quantity} مبيع</span></div>
                                <span className="text-[#FA8072] font-bold">{item.revenue.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentDaysData.length === 0 ? (
                             <div className="text-center py-10 text-gray-600 text-sm">لا توجد فواتير بهذا النوع في الفترة المحددة</div>
                        ) : currentDaysData.map(day => {
                            const dayOrders = new Map<string, SaleItem[]>();
                            day.items.forEach(i => { const key = i.orderId || i.time; if(!dayOrders.has(key)) dayOrders.set(key, []); dayOrders.get(key)!.push(i); });
                            return (
                                <div key={day.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                    <div onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className="p-4 flex justify-between items-center cursor-pointer bg-gray-900/50">
                                        <div className="flex items-center gap-2">{expandedDayId === day.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}<span className="text-white font-bold">{day.date}</span></div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500">{day.items.length} مادة</span>
                                            <span className="text-[#FA8072] font-bold">{day.totalRevenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {expandedDayId === day.id && (
                                        <div className="p-3 bg-gray-900/20 border-t border-gray-700 space-y-2">
                                            {Array.from(dayOrders.entries()).map(([oid, items]) => (
                                                <div key={oid} className={`p-2 rounded flex justify-between items-center border ${items[0].saleType === 'wholesale' ? 'bg-[#FA8072]/5 border-[#FA8072]/20' : 'bg-blue-400/5 border-blue-400/20'}`}>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-300 font-bold truncate max-w-[150px]">{items[0].customerName || `زبون ${items[0].customerNumber}`}</span>
                                                        <span className={`text-[8px] font-bold ${items[0].saleType === 'wholesale' ? 'text-[#FA8072]' : 'text-blue-400'}`}>{items[0].saleType === 'wholesale' ? 'جملة' : 'مفرق'}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="text-xs font-bold text-white mr-2 self-center">{items.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
                                                        <button onClick={() => setEditingOrder({ date: day.date, orderId: oid, items })} className="text-blue-400 p-1"><Edit3 size={14} /></button>
                                                        <button onClick={() => onPreviewInvoice(items)} className="text-white p-1"><Download size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col h-[85vh]">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
                {step !== 'years' && <button onClick={handleBack} className="bg-gray-700 p-2 rounded-full text-white"><ArrowRight size={20} /></button>}
                <h3 className="font-bold text-lg text-white">سجل المبيعات والتحليل</h3>
            </div>
            <div className="flex-grow max-w-xs mx-4"><div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14}/><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث عن زبون..." className="w-full bg-gray-900 border border-gray-700 text-white py-1.5 pr-8 pl-4 rounded-lg text-xs outline-none focus:border-[#FA8072]"/></div></div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><X size={24} /></button>
        </div>
        <div className="p-4 flex-1 overflow-hidden bg-gray-900/20">{renderContent()}</div>
      </div>
    </div>
  );
};
