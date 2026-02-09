
import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, ArrowRight, Folder, CalendarDays, ShoppingBag, Zap, Store, User, Filter, TrendingUp, PieChart, Info, Clock, Download, Search, Trash2, Edit3, Check, Save, Hash, Eraser, AlertCircle } from 'lucide-react';
import { ArchivedDay, SaleItem, SaleType } from '../types';

interface HistoryModalProps {
  history: ArchivedDay[];
  currentSales?: SaleItem[];
  onClose: () => void;
  onClearHistory: () => void;
  onPreviewInvoice: (items: SaleItem[]) => void;
  onUpdateOrder: (dayId: string, orderId: string, updatedItems: SaleItem[], newCustomerName?: string) => void;
  onDeleteArchivedOrder: (dayId: string, orderId: string) => void;
  onDeleteArchivedDay: (dayId: string) => void;
}

type NavStep = 'years' | 'months' | 'days';
type FilterType = 'all' | SaleType;
type TabMode = 'archive' | 'profit-report';

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  history, currentSales = [], onClose, onClearHistory, onPreviewInvoice, onUpdateOrder, onDeleteArchivedOrder, onDeleteArchivedDay 
}) => {
  const [tab, setTab] = useState<TabMode>('archive');
  const [step, setStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editOrderItems, setEditOrderItems] = useState<SaleItem[]>([]);

  const fullHistory = useMemo(() => {
      const today = new Date();
      const todayStr = today.toLocaleDateString('ar-SY');
      
      const activeSalesEntry: ArchivedDay | null = currentSales.length > 0 ? {
          id: 'today-active',
          date: `${todayStr} (مباشر)`,
          timestamp: today.getTime(),
          totalRevenue: currentSales.reduce((s, i) => s + (i.price * i.quantity), 0),
          totalExpenses: 0,
          totalItems: currentSales.length,
          items: currentSales,
          purchaseInvoices: []
      } : null;

      return activeSalesEntry ? [activeSalesEntry, ...history] : history;
  }, [history, currentSales]);

  const profitReport = useMemo(() => {
    const report: Record<string, { today: number, month: number, year: number, total: number }> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toLocaleDateString('ar-SY');

    fullHistory.forEach(day => {
        const d = new Date(day.timestamp);
        const isYear = d.getFullYear() === currentYear;
        const isMonth = isYear && d.getMonth() === currentMonth;
        const isToday = day.date.includes(todayStr);

        day.items.forEach(item => {
            const profitPerUnit = item.price - (item.costPrice || 0);
            const totalProfit = profitPerUnit * item.quantity;
            if (!report[item.name]) report[item.name] = { today: 0, month: 0, year: 0, total: 0 };
            report[item.name].total += totalProfit;
            if (isYear) report[item.name].year += totalProfit;
            if (isMonth) report[item.name].month += totalProfit;
            if (isToday) report[item.name].today += totalProfit;
        });
    });
    return Object.entries(report).sort((a, b) => b[1].total - a[1].total);
  }, [fullHistory]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>(fullHistory.map(day => new Date(day.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [fullHistory]);

  const months = useMemo(() => {
    if (!selectedYear) return [];
    const uniqueMonths = new Set<number>(
      fullHistory.filter(day => new Date(day.timestamp).getFullYear().toString() === selectedYear).map(day => new Date(day.timestamp).getMonth())
    );
    return Array.from(uniqueMonths).sort((a, b) => b - a);
  }, [fullHistory, selectedYear]);

  const currentDaysData = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    return fullHistory.filter(day => {
      const d = new Date(day.timestamp);
      return d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth;
    }).sort((a,b) => b.timestamp - a.timestamp);
  }, [fullHistory, selectedYear, selectedMonth]);

  const getMonthName = (monthIndex: number) => new Date(2000, monthIndex).toLocaleString('ar-SY', { month: 'long' });

  const groupItemsByOrder = (items: SaleItem[]) => {
      const orders: Record<string, SaleItem[]> = {};
      items.forEach(item => {
          if (!orders[item.orderId]) orders[item.orderId] = [];
          orders[item.orderId].push(item);
      });
      
      let orderList = Object.values(orders);
      
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        orderList = orderList.filter(order => 
          (order[0].customerName?.toLowerCase() || '').includes(term) ||
          order[0].orderId.includes(term) ||
          order[0].customerNumber.toString() === term ||
          order.some(item => item.name.toLowerCase().includes(term))
        );
      }

      return orderList.sort((a, b) => b[0].orderId.localeCompare(a[0].orderId));
  };

  const handleStartOrderEdit = (orderItems: SaleItem[]) => {
      setEditingOrderId(orderItems[0].orderId);
      setEditCustomerName(orderItems[0].customerName || '');
      setEditOrderItems([...orderItems]);
  };

  const handleEditItemChange = (itemId: string, field: 'price' | 'quantity', value: string) => {
      setEditOrderItems(prev => prev.map(item => {
          if (item.id === itemId) {
              return { ...item, [field]: parseFloat(value) || 0 };
          }
          return item;
      }));
  };

  const handleRemoveItemFromEdit = (itemId: string) => {
      if (editOrderItems.length <= 1) {
          alert("لا يمكن حذف آخر مادة في الفاتورة، يرجى حذف الفاتورة كاملة بدلاً من ذلك.");
          return;
      }
      setEditOrderItems(prev => prev.filter(it => it.id !== itemId));
  };

  const handleSaveOrderEdit = (dayId: string) => {
      if (!editingOrderId) return;
      onUpdateOrder(dayId, editingOrderId, editOrderItems, editCustomerName);
      setEditingOrderId(null);
  };

  const renderArchive = () => {
    if (step === 'years') return (
        <div className="flex flex-col gap-6 animate-fade-up h-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {years.length > 0 ? years.map(year => (
                    <button key={year} onClick={() => { setSelectedYear(year); setStep('months'); }} className="bg-gray-700/50 hover:bg-gray-600 border border-gray-600 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                        <Folder size={48} className="text-[#FA8072] group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-black text-white">{year}</span>
                    </button>
                )) : (
                  <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                      <div className="bg-gray-700/30 p-6 rounded-full"><Zap size={48} className="text-gray-600" /></div>
                      <p className="text-gray-500 font-bold">لا توجد عمليات بيع مؤرشفة بعد</p>
                  </div>
                )}
            </div>
            
            {history.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-700">
                    <button 
                        onClick={() => { if(window.confirm('خطر! هل أنت متأكد من مسح كافة سجلات المبيعات المؤرشفة تماماً؟ لا يمكن التراجع عن هذا الإجراء.')) onClearHistory(); }}
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all font-black text-sm border border-red-600/20 group"
                    >
                        <Eraser size={18} className="group-hover:animate-bounce" />
                        مسح كافة السجلات التاريخية وتصفير الأرشيف
                    </button>
                </div>
            )}
        </div>
    );

    if (step === 'months') return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up">
            {months.map(monthIdx => (
                <button key={monthIdx} onClick={() => { setSelectedMonth(monthIdx); setStep('days'); }} className="bg-gray-700/50 hover:bg-gray-600 border border-gray-700 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <CalendarDays size={48} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white">{getMonthName(monthIdx)}</span>
                </button>
            ))}
        </div>
    );

    if (step === 'days') return (
        <div className="flex flex-col gap-4 animate-fade-up h-full">
            <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="بحث في الفواتير (اسم الزبون، مادة، رقم الفاتورة)..." 
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl pr-10 pl-4 py-2 text-xs focus:border-[#FA8072] outline-none" 
                    />
                </div>
                <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-700 w-full md:w-auto">
                    <button onClick={() => setFilterType('all')} className={`flex-1 md:px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>الكل</button>
                    <button onClick={() => setFilterType('retail')} className={`flex-1 md:px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filterType === 'retail' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>مفرق</button>
                    <button onClick={() => setFilterType('wholesale')} className={`flex-1 md:px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filterType === 'wholesale' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>جملة</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {currentDaysData.map(day => {
                    const filteredItems = day.items.filter(item => filterType === 'all' || item.saleType === filterType);
                    const groupedOrders = groupItemsByOrder(filteredItems);
                    if (groupedOrders.length === 0) return null;
                    
                    const dayTotal = filteredItems.reduce((s, i) => s + (i.price * i.quantity), 0);
                    const isTodayActive = day.id === 'today-active';

                    return (
                        <div key={day.id} className={`rounded-xl border overflow-hidden shadow-sm transition-all ${isTodayActive ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-700 bg-gray-800'}`}>
                            <div className={`p-4 flex justify-between items-center ${isTodayActive ? 'bg-orange-500/10' : 'bg-gray-900/50'}`}>
                                <div onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className="flex items-center gap-3 cursor-pointer flex-grow">
                                    <div className="text-gray-500">{(expandedDayId === day.id || searchTerm) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                                    <span className={`font-bold ${isTodayActive ? 'text-orange-400' : 'text-white'}`}>{day.date}</span>
                                    {searchTerm && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">{groupedOrders.length} نتيجة</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-lg text-green-400">{dayTotal.toLocaleString()} <small className="text-[10px] text-gray-500 font-normal">ل.س</small></span>
                                        {day.totalExpenses > 0 && <span className="text-[10px] text-red-400 font-bold">مشتريات: {day.totalExpenses.toLocaleString()}</span>}
                                    </div>
                                    {!isTodayActive && (
                                        <button 
                                            onClick={() => { if(window.confirm(`تنبيه أمان: هل أنت متأكد من حذف يوم "${day.date}" بالكامل بجميع فواتيره؟ سيؤدي هذا لمسحه من الأرشيف نهائياً.`)) onDeleteArchivedDay(day.id); }}
                                            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                            title="حذف اليوم بالكامل"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {(expandedDayId === day.id || searchTerm) && (
                                <div className="p-4 bg-gray-900/30 border-t border-gray-700 animate-fade-up space-y-4">
                                    {groupedOrders.map((orderItems, oIdx) => {
                                        const first = orderItems[0];
                                        const isEditing = editingOrderId === first.orderId;
                                        const orderTotal = (isEditing ? editOrderItems : orderItems).reduce((s, i) => s + (i.price * i.quantity), 0);
                                        
                                        return (
                                            <div key={oIdx} className={`bg-gray-800/80 rounded-2xl border overflow-hidden shadow-inner transition-all ${isEditing ? 'border-[#FA8072] ring-2 ring-[#FA8072]/20' : 'border-gray-700'}`}>
                                                <div className={`p-3 flex justify-between items-center border-b ${isEditing ? 'bg-[#FA8072]/10 border-[#FA8072]/20' : 'bg-gray-900/50 border-gray-700/50'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-gray-700" title="رقم الفاتورة">
                                                            <Hash size={10} className="text-[#FA8072]" />
                                                            <span className="text-xs font-black text-white tabular-nums">{first.customerNumber}</span>
                                                        </div>
                                                        {first.saleType === 'wholesale' ? <Store size={14} className="text-orange-400" /> : <User size={14} className="text-blue-400" />}
                                                        
                                                        {isEditing ? (
                                                            <input 
                                                              type="text" 
                                                              value={editCustomerName} 
                                                              onChange={e => setEditCustomerName(e.target.value)}
                                                              className="bg-gray-900 border border-[#FA8072] text-white text-xs px-2 py-1 rounded-lg outline-none focus:ring-1 focus:ring-[#FA8072]"
                                                              placeholder="اسم الزبون..."
                                                            />
                                                        ) : (
                                                            <span className="text-white text-xs font-black">{first.customerName || 'زبون عام'}</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold"><Clock size={10} />{first.time}</div>
                                                        <span className="text-green-400 font-black text-sm">{orderTotal.toLocaleString()}</span>
                                                        
                                                        <div className="flex gap-2">
                                                           {isEditing ? (
                                                               <>
                                                                 <button onClick={() => handleSaveOrderEdit(day.id)} className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                                                    <Save size={14} />
                                                                 </button>
                                                                 <button onClick={() => setEditingOrderId(null)} className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded-lg transition-colors">
                                                                    <X size={14} />
                                                                 </button>
                                                               </>
                                                           ) : (
                                                               <>
                                                                 <button onClick={() => onPreviewInvoice(orderItems)} className="text-gray-500 hover:text-white transition-colors" title="طباعة"><Download size={14}/></button>
                                                                 {!isTodayActive && (
                                                                   <button onClick={() => handleStartOrderEdit(orderItems)} className="text-gray-500 hover:text-[#FA8072] transition-colors" title="تعديل الفاتورة"><Edit3 size={14}/></button>
                                                                 )}
                                                                 <button 
                                                                    onClick={() => { if(window.confirm(`هل أنت متأكد من حذف هذه الفاتورة (رقم ${first.customerNumber}) نهائياً من الأرشيف؟`)){ onDeleteArchivedOrder(day.id, first.orderId); } }} 
                                                                    className="text-gray-500 hover:text-red-400 transition-all p-1.5 hover:bg-red-500/10 rounded-lg" 
                                                                    title="حذف الفاتورة"
                                                                 >
                                                                    <Trash2 size={14}/>
                                                                 </button>
                                                               </>
                                                           )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {(isEditing ? editOrderItems : orderItems).map((item, iIdx) => (
                                                        <div key={iIdx} className="flex justify-between items-center text-[10px] px-2 py-1.5 bg-gray-900/20 rounded group/row">
                                                            <div className="flex items-center gap-2 flex-1">
                                                                {isEditing && (
                                                                    <button onClick={() => handleRemoveItemFromEdit(item.id)} className="text-red-400/50 hover:text-red-500 p-1" title="حذف المادة من الفاتورة">
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                )}
                                                                <span className="text-gray-300 font-bold min-w-[80px]">{item.name}</span>
                                                                {isEditing && (
                                                                    <div className="flex items-center gap-2">
                                                                      <div className="flex flex-col">
                                                                        <label className="text-[7px] text-gray-500 font-bold uppercase">الكمية</label>
                                                                        <input 
                                                                          type="number" 
                                                                          value={item.quantity} 
                                                                          onChange={e => handleEditItemChange(item.id, 'quantity', e.target.value)} 
                                                                          className="w-14 bg-gray-950 border border-gray-700 text-white rounded px-1 text-center py-0.5 outline-none focus:border-[#FA8072]" 
                                                                        />
                                                                      </div>
                                                                      <div className="flex flex-col">
                                                                        <label className="text-[7px] text-gray-500 font-bold uppercase">السعر</label>
                                                                        <input 
                                                                          type="number" 
                                                                          value={item.price} 
                                                                          onChange={e => handleEditItemChange(item.id, 'price', e.target.value)} 
                                                                          className="w-20 bg-gray-950 border border-gray-700 text-[#FA8072] rounded px-1 text-center py-0.5 outline-none focus:border-[#FA8072]" 
                                                                        />
                                                                      </div>
                                                                    </div>
                                                                )}
                                                                {!isEditing && <span className="text-gray-500 font-normal">({item.quantity} {item.unitType === 'kg' ? 'كغ' : 'قطعة'})</span>}
                                                            </div>
                                                            <span className={`tabular-nums font-bold ${isEditing ? 'text-green-400' : 'text-gray-400'}`}>{(item.price * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderProfitReport = () => (
    <div className="flex flex-col h-full animate-fade-up">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-4 flex items-start gap-3">
            <span className="shrink-0 mt-0.5"><Info size={20} className="text-blue-400" /></span>
            <p className="text-xs text-gray-400 leading-relaxed font-bold">هذا التقرير يحلل صافي أرباح كل منتج بشكل منفصل بناءً على الفرق بين (سعر البيع) و (سعر التكلفة) المسجل عند وقت البيع.</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-xs">
                    <thead className="bg-gray-800 text-gray-400 font-black uppercase text-[9px] tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 border-b border-gray-700">اسم المنتج</th>
                            <th className="p-4 border-b border-gray-700 text-center">أرباح اليوم</th>
                            <th className="p-4 border-b border-gray-700 text-center">أرباح الشهر</th>
                            <th className="p-4 border-b border-gray-700 text-center">أرباح السنة</th>
                            <th className="p-4 border-b border-gray-700 text-center bg-[#FA8072]/10 text-[#FA8072]">إجمالي الربح</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {profitReport.map(([name, data], idx) => (
                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 font-black text-white">{name}</td>
                                <td className="p-4 text-center tabular-nums text-gray-400">{data.today.toLocaleString()}</td>
                                <td className="p-4 text-center tabular-nums text-gray-400">{data.month.toLocaleString()}</td>
                                <td className="p-4 text-center tabular-nums text-gray-400">{data.year.toLocaleString()}</td>
                                <td className="p-4 text-center tabular-nums font-black text-green-400 bg-green-400/5">{data.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-700 flex flex-col h-[85vh] overflow-hidden animate-fade-up">
        <div className="p-4 md:p-5 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center bg-gray-900/50 gap-4 shrink-0">
            <div className="w-full md:w-auto order-3 md:order-1 flex justify-start">
                <button onClick={onClose} className="flex items-center gap-2 bg-gray-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 group">
                    <span>إغلاق</span>
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                </button>
            </div>
            <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-700 w-full md:w-auto order-2">
                <button onClick={() => setTab('archive')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${tab === 'archive' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Folder size={14} /> تصفح الأرشيف</button>
                <button onClick={() => setTab('profit-report')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${tab === 'profit-report' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><PieChart size={14} /> تقرير الأرباح</button>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-3 justify-end">
                <h3 className="font-black text-lg md:text-xl text-white">أرشيف المبيعات</h3>
                {tab === 'archive' && step !== 'years' && (
                    <button onClick={() => { if (step === 'days') { setStep('months'); setSelectedMonth(-1); } else if (step === 'months') { setStep('years'); setSelectedYear(''); } }} className="bg-gray-700 hover:bg-[#FA8072] p-2 rounded-full text-white transition-colors shrink-0 shadow-lg"><ArrowRight size={20} /></button>
                )}
            </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">{tab === 'archive' ? renderArchive() : renderProfitReport()}</div>
      </div>
    </div>
  );
};
