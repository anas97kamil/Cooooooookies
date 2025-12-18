
import React, { useState, useMemo } from 'react';
import { Trash2, Search, User, Download, Store, Edit3, Receipt, Clock, Package } from 'lucide-react';
import { SaleItem } from '../types';

interface SalesTableProps {
  items: SaleItem[];
  onDeleteItem: (id: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onPreviewInvoice: (items: SaleItem[]) => void;
  onUpdateItemPrice?: (itemId: string, newPrice: number) => void; 
}

export const SalesTable: React.FC<SalesTableProps> = ({ items, onDeleteItem, onDeleteOrder, onPreviewInvoice, onUpdateItemPrice }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: SaleItem[] } = {};
    items.forEach(item => {
        const key = item.orderId;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });
    return Object.values(groups).sort((a, b) => b[0].orderId.localeCompare(a[0].orderId));
  }, [items]);

  const filteredOrders = useMemo(() => {
      if (!searchTerm) return groupedOrders;
      const term = searchTerm.toLowerCase();
      return groupedOrders.filter(g => (g[0].customerName?.toLowerCase() || '').includes(term));
  }, [groupedOrders, searchTerm]);

  const savePrice = (itemId: string) => {
    const price = parseFloat(tempPrice);
    if (!isNaN(price) && onUpdateItemPrice) onUpdateItemPrice(itemId, price);
    setEditingPriceId(null);
  };

  if (items.length === 0) return (
    <div className="p-20 text-center flex flex-col items-center gap-4 bg-gray-800/50 rounded-[3rem] border border-dashed border-gray-700">
        <Receipt size={64} className="text-gray-700" />
        <p className="text-gray-500 font-bold text-lg">لا توجد فواتير مبيعات مسجلة اليوم.</p>
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto no-print">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="بحث باسم الزبون أو الفاتورة..." 
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl pr-12 pl-4 py-3.5 outline-none focus:border-[#FA8072] transition-all shadow-xl" 
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map(group => {
                const total = group.reduce((s, i) => s + (i.price * i.quantity), 0);
                const first = group[0];
                return (
                    <div key={first.orderId} className="bg-gray-800 rounded-[2.5rem] border border-gray-700 overflow-hidden shadow-2xl animate-fade-up flex flex-col border-b-4 border-b-gray-700 hover:border-b-[#FA8072] transition-all group">
                        {/* Invoice Card Header */}
                        <div className="p-5 bg-gray-900/50 flex justify-between items-start border-b border-gray-700/50">
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-2xl ${first.saleType === 'wholesale' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {first.saleType === 'wholesale' ? <Store size={24} /> : <User size={24} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-white text-lg leading-tight">{first.customerName || 'زبون عام (كاش)'}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-bold tabular-nums">#{first.orderId.slice(-5)}</span>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                                            <Clock size={10} />
                                            {first.time}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="text-xl font-black text-green-400 tabular-nums">{total.toLocaleString()}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ليرة سورية</span>
                            </div>
                        </div>

                        {/* Items List (Invoice Body) */}
                        <div className="flex-1 p-5 space-y-3">
                            {group.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm p-3 bg-gray-900/30 rounded-2xl border border-gray-700/30 group/item hover:bg-gray-900/60 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-200 font-bold">{item.name}</span>
                                            <span className="text-[10px] text-gray-500">الكمية: <span className="text-gray-300">{item.quantity}</span> {item.unitType === 'kg' ? 'كغ' : 'قطعة'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            {editingPriceId === item.id ? (
                                                <input 
                                                  type="number" 
                                                  value={tempPrice} 
                                                  onChange={e => setTempPrice(e.target.value)} 
                                                  onBlur={() => savePrice(item.id)} 
                                                  onKeyDown={e => e.key === 'Enter' && savePrice(item.id)}
                                                  className="w-16 bg-gray-950 border border-[#FA8072] text-white rounded px-1 text-center text-xs outline-none" 
                                                  autoFocus 
                                                />
                                            ) : (
                                                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setEditingPriceId(item.id); setTempPrice(item.price.toString()); }}>
                                                    <span className="text-xs text-gray-400 tabular-nums">{item.price.toLocaleString()}</span>
                                                    <Edit3 size={10} className="text-[#FA8072] opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                            <span className="font-black text-white text-xs tabular-nums">{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => onDeleteItem(item.id)} className="text-gray-700 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Invoice Actions Footer */}
                        <div className="px-5 py-4 bg-gray-900/20 border-t border-gray-700/30 flex justify-between items-center no-print">
                            <button 
                              onClick={() => onPreviewInvoice(group)} 
                              className="flex items-center gap-2 text-[11px] font-black text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <Download size={14} />
                                تصدير الفاتورة
                            </button>
                            <button 
                              onClick={() => onDeleteOrder && onDeleteOrder(first.orderId)} 
                              className="flex items-center gap-2 text-[11px] font-black text-red-400/60 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                                حذف الفاتورة
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
