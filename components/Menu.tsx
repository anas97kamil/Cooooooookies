
import React, { useState, useMemo } from 'react';
import { Trash2, Search, User, Download, Store, Edit3, Receipt, Clock, Package, ChevronDown, ChevronUp, LayoutList, Hash, AlertTriangle } from 'lucide-react';
import { SaleItem } from '../types';

export const SalesTable: React.FC<any> = ({ items, onDeleteItem, onDeleteOrder, onPreviewInvoice, onUpdateItemPrice }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: SaleItem[] } = {};
    items.forEach((item: SaleItem) => {
        const key = item.orderId;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });
    return Object.values(groups).sort((a, b) => b[0].orderId.localeCompare(a[0].orderId));
  }, [items]);

  const filteredOrders = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) {
          return isExpanded ? groupedOrders : groupedOrders.slice(0, 1);
      }
      return groupedOrders.filter(g => 
          (g[0].customerName?.toLowerCase() || '').includes(term) ||
          g[0].orderId.includes(term) ||
          g[0].customerNumber.toString() === term
      );
  }, [groupedOrders, searchTerm, isExpanded]);

  const savePrice = (itemId: string) => {
    const price = parseFloat(tempPrice);
    if (!isNaN(price) && onUpdateItemPrice) onUpdateItemPrice(itemId, price);
    setEditingPriceId(null);
  };

  const handleDeleteOrderWithConfirm = (orderId: string, customerName: string) => {
    if (window.confirm(`تنبيه: هل أنت متأكد من حذف فاتورة "${customerName || 'زبون عام'}" بالكامل من مبيعات اليوم؟\n\nلا يمكن التراجع عن هذا الإجراء.`)) {
      onDeleteOrder && onDeleteOrder(orderId);
    }
  };

  const handleDeleteItemWithConfirm = (itemId: string, itemName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مادة "${itemName}" من الفاتورة؟`)) {
      onDeleteItem(itemId);
    }
  };

  if (items.length === 0) return (
    <div className="p-16 text-center flex flex-col items-center gap-4 bg-gray-800/30 rounded-[2.5rem] border border-dashed border-gray-700">
        <Receipt size={48} className="text-gray-700" />
        <p className="text-gray-500 font-bold text-sm">لا توجد مبيعات نشطة حالياً.</p>
    </div>
  );

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between no-print px-2">
            <div className="relative w-full md:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="بحث باسم الزبون أو رقم الفاتورة..." 
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-[#FA8072] transition-all shadow-lg" 
                />
            </div>
            {!searchTerm && groupedOrders.length > 1 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isExpanded ? 'bg-gray-700 text-white' : 'bg-[#FA8072] text-white animate-pulse'}`}
                >
                    {isExpanded ? (
                        <><ChevronUp size={14} /> إخفاء الفواتير القديمة</>
                    ) : (
                        <><LayoutList size={14} /> عرض كافة فواتير اليوم ({groupedOrders.length})</>
                    )}
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((group, index) => {
                const total = group.reduce((s, i) => s + (i.price * i.quantity), 0);
                const first = group[0];
                const isLatest = index === 0 && !searchTerm && !isExpanded;

                return (
                    <div 
                      key={first.orderId} 
                      className={`bg-gray-800 rounded-[2rem] border overflow-hidden shadow-2xl animate-fade-up flex flex-col transition-all group ${isLatest ? 'border-[#FA8072] ring-2 ring-[#FA8072]/20' : 'border-gray-700 opacity-90'}`}
                    >
                        <div className={`p-4 flex justify-between items-start border-b ${isLatest ? 'bg-[#FA8072]/5 border-[#FA8072]/20' : 'bg-gray-900/50 border-gray-700/50'}`}>
                            <div className="flex gap-3">
                                <div className={`p-2 rounded-xl ${first.saleType === 'wholesale' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {first.saleType === 'wholesale' ? <Store size={18} /> : <User size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-gray-700" title="رقم الفاتورة">
                                            <Hash size={10} className="text-[#FA8072]" />
                                            <span className="text-sm font-black text-white tabular-nums">{first.customerNumber}</span>
                                        </div>
                                        <span className="font-black text-white text-sm">{first.customerName || 'زبون عام'}</span>
                                        {isLatest && <span className="bg-[#FA8072] text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">الأحدث</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold">
                                            <Clock size={10} /> {first.time}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className={`font-black text-base tabular-nums ${isLatest ? 'text-[#FA8072]' : 'text-green-400'}`}>{total.toLocaleString('en-US')} <small className="text-[10px] opacity-70">ل.س</small></span>
                                <span className="text-[8px] text-gray-600 font-bold uppercase">إجمالي الفاتورة</span>
                            </div>
                        </div>

                        <div className="p-3 space-y-2">
                            {group.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-gray-900/30 rounded-xl border border-gray-700/30 hover:bg-gray-900/60 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-200 font-bold text-[11px]">{item.name}</span>
                                            <span className="text-[9px] text-gray-500">الكمية: <span className="text-gray-300">{item.quantity}</span> {item.unitType === 'kg' ? 'كغ' : 'قطعة'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end">
                                            {editingPriceId === item.id ? (
                                                <input 
                                                  type="number" 
                                                  value={tempPrice} 
                                                  onChange={e => setTempPrice(e.target.value)} 
                                                  onBlur={() => savePrice(item.id)} 
                                                  onKeyDown={e => e.key === 'Enter' && savePrice(item.id)}
                                                  className="w-14 bg-gray-950 border border-[#FA8072] text-white rounded px-1 text-center text-[10px] outline-none" 
                                                  autoFocus 
                                                />
                                            ) : (
                                                <div className="flex items-center gap-1 cursor-pointer group/price" onClick={() => { setEditingPriceId(item.id); setTempPrice(item.price.toString()); }}>
                                                    <span className="text-[10px] text-gray-500 tabular-nums">{item.price.toLocaleString('en-US')} ل.س</span>
                                                    <Edit3 size={8} className="text-[#FA8072] opacity-0 group-hover/price:opacity-100" />
                                                </div>
                                            )}
                                            <span className="font-black text-white text-[11px] tabular-nums">{(item.price * item.quantity).toLocaleString('en-US')} ل.س</span>
                                        </div>
                                        <button onClick={() => handleDeleteItemWithConfirm(item.id, item.name)} className="text-gray-700 hover:text-red-500 transition-colors p-1"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 py-3 bg-gray-900/20 border-t border-gray-700/30 flex justify-between items-center no-print">
                            <button 
                              onClick={() => onPreviewInvoice(group)} 
                              className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <Download size={12} /> تصدير
                            </button>
                            <button 
                              onClick={() => handleDeleteOrderWithConfirm(first.orderId, first.customerName || 'زبون عام')} 
                              className="flex items-center gap-1.5 text-[10px] font-black text-red-400/50 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={12} /> حذف الفاتورة
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
        
        {!searchTerm && !isExpanded && groupedOrders.length > 1 && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 no-print">
                <div className="h-px w-24 bg-gray-800"></div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">هناك {groupedOrders.length - 1} فواتير أخرى مخفية</p>
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-[#FA8072] font-black text-xs hover:underline"
                >
                    عرض سجل اليوم بالكامل
                </button>
            </div>
        )}
    </div>
  );
};
