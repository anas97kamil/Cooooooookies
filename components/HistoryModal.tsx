import React, { useState, useMemo } from 'react';
import { X, Calendar, DollarSign, Package, Trash2, ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { ArchivedDay, SaleItem } from '../types';

interface HistoryModalProps {
  history: ArchivedDay[];
  onClose: () => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  // Helper to get years present in history
  const years = useMemo(() => {
    const uniqueYears = new Set<string>(history.map(day => new Date(day.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a: string, b: string) => b.localeCompare(a)); // Descending
  }, [history]);

  // Helper to get months present in history (for selected year)
  const months = useMemo(() => {
    const uniqueMonths = new Set<number>(
      history
        .filter(day => selectedYear === 'all' || new Date(day.timestamp).getFullYear().toString() === selectedYear)
        .map(day => new Date(day.timestamp).getMonth())
    );
    return Array.from(uniqueMonths).sort((a: number, b: number) => b - a); // Descending
  }, [history, selectedYear]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(day => {
      const date = new Date(day.timestamp);
      const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [history, selectedYear, selectedMonth]);

  // Statistics for visible period
  const stats = useMemo(() => {
    return filteredHistory.reduce((acc, day) => ({
      revenue: acc.revenue + day.totalRevenue,
      items: acc.items + day.totalItems,
      days: acc.days + 1
    }), { revenue: 0, items: 0, days: 0 });
  }, [filteredHistory]);

  const getMonthName = (monthIndex: number) => {
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleString('ar-SY', { month: 'long' });
  };

  const toggleDayDetails = (id: string) => {
    setExpandedDayId(prev => prev === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-[#FA8072]/20 p-2 rounded-lg text-[#FA8072]">
                <Calendar size={22} />
            </div>
            <div>
                <h3 className="font-bold text-lg">سجل المبيعات والأرشيف</h3>
                <p className="text-xs text-gray-400">تصفح المبيعات السابقة حسب التاريخ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Filters & Stats Bar */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filters */}
            <div className="col-span-1 md:col-span-2 flex gap-2">
                <div className="relative flex-1">
                    <select 
                        value={selectedYear}
                        onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth('all'); }}
                        className="w-full bg-gray-900 text-white text-sm border border-gray-600 rounded-lg px-3 py-2 appearance-none outline-none focus:border-[#FA8072]"
                    >
                        <option value="all">كل السنوات</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full bg-gray-900 text-white text-sm border border-gray-600 rounded-lg px-3 py-2 appearance-none outline-none focus:border-[#FA8072]"
                        disabled={selectedYear === 'all' && months.length > 12} // Logic simplification
                    >
                        <option value="all">كل الشهور</option>
                        {months.map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Stats */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-4 text-sm">
                 <div className="bg-gray-700/50 px-4 py-2 rounded-xl border border-gray-600 flex flex-col items-end min-w-[100px]">
                    <span className="text-xs text-gray-400">إيرادات الفترة</span>
                    <span className="font-bold text-[#FA8072]">{stats.revenue.toLocaleString()}</span>
                 </div>
                 <div className="bg-gray-700/50 px-4 py-2 rounded-xl border border-gray-600 flex flex-col items-end min-w-[80px]">
                    <span className="text-xs text-gray-400">عدد الأيام</span>
                    <span className="font-bold text-white">{stats.days}</span>
                 </div>
            </div>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto flex-1 bg-gray-900/20">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <div className="bg-gray-800 p-4 rounded-full mb-4">
                  <Search size={32} className="opacity-50" />
              </div>
              <p className="font-medium">لا توجد سجلات مطابقة للبحث.</p>
              <p className="text-xs mt-1">تأكد من اختيار السنة والشهر بشكل صحيح.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((day) => (
                <div key={day.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all hover:border-gray-500">
                    {/* Row Header */}
                    <div 
                        onClick={() => toggleDayDetails(day.id)}
                        className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-700/30"
                    >
                        <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${expandedDayId === day.id ? 'bg-[#FA8072] text-white' : 'bg-gray-700 text-gray-300'}`}>
                                {expandedDayId === day.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                             </div>
                             <div>
                                <div className="flex items-center gap-2 text-white font-bold text-lg">
                                     {day.date}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                    <span>وقت الإغلاق: {new Date(day.timestamp).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>•</span>
                                    <span>{day.totalItems} قطعة مباعة</span>
                                </div>
                             </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="block text-xs text-gray-400">إجمالي اليوم</span>
                                <span className="block font-bold text-[#FA8072] text-lg">{day.totalRevenue.toLocaleString()} <span className="text-xs">ل.س</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Dropdown */}
                    {expandedDayId === day.id && (
                        <div className="bg-gray-900/50 border-t border-gray-700 p-4 animate-fade-up">
                            <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <Package size={12} />
                                تفاصيل المواد المباعة
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="text-xs text-gray-500 bg-gray-800/50 border-b border-gray-700">
                                        <tr>
                                            <th className="py-2 px-3">المادة</th>
                                            <th className="py-2 px-3">الزبون</th>
                                            <th className="py-2 px-3 text-center">الكمية</th>
                                            <th className="py-2 px-3">السعر</th>
                                            <th className="py-2 px-3">المجموع</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {day.items.map((item, idx) => (
                                            <tr key={`${day.id}-${idx}`} className="hover:bg-gray-800/30">
                                                <td className="py-2 px-3 text-white">{item.name}</td>
                                                <td className="py-2 px-3 text-gray-400 text-xs">
                                                    {item.customerName || `زبون ${item.customerNumber}`}
                                                </td>
                                                <td className="py-2 px-3 text-center text-gray-300">
                                                    {item.quantity} {item.unitType === 'kg' ? 'كغ' : ''}
                                                </td>
                                                <td className="py-2 px-3 text-gray-400">{item.price.toLocaleString()}</td>
                                                <td className="py-2 px-3 text-[#FA8072] font-medium">
                                                    {(item.price * item.quantity).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-2xl flex justify-between items-center">
            <span className="text-xs text-gray-500">
                يتم حفظ الأرشيف تلقائياً في ذاكرة المتصفح
            </span>
            {history.length > 0 && (
                <button 
                    onClick={() => {
                        if(confirm('هل أنت متأكد من حذف كامل سجل الأرشيف؟ لا يمكن التراجع عن هذا الإجراء.')) {
                            onClearHistory();
                        }
                    }}
                    className="text-red-400 text-sm hover:text-red-300 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-900/20 transition-colors"
                >
                    <Trash2 size={16} />
                    مسح كل الأرشيف
                </button>
            )}
        </div>
      </div>
    </div>
  );
};