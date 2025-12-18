
import React, { useState, useMemo } from 'react';
import { Trash2, Search, User, Download, Store, Edit3 } from 'lucide-react';
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

  if (items.length === 0) return <div className="p-20 text-center text-gray-500 font-bold bg-gray-800 rounded-3xl border border-gray-700">لا توجد مبيعات مسجلة حالياً.</div>;

  return (
    <div className="space-y-5">
        <div className="relative max-w-md mx-auto no-print">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث باسم العميل..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl pr-12 pl-4 py-3 outline-none focus:border-[#FA8072] transition-all" />
        </div>

        <div className="space-y-4">
            {filteredOrders.map(group => {
                const total = group.reduce((s, i) => s + (i.price * i.quantity), 0);
                const first = group[0];
                return (
                    <div key={first.orderId} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-lg animate-fade-up">
                        <div className="p-4 bg-gray-900/50 flex justify-between items-center border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                {first.saleType === 'wholesale' ? <Store size={16} className="text-orange-400" /> : <User size={16} className="text-blue-400" />}
                                <span className="font-bold text-white">{first.customerName || 'زبون عام'}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{first.time}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-[#FA8072]">{total.toLocaleString()} <small className="text-[9px] text-gray-600 font-normal">ل.س</small></span>
                                <button onClick={() => onPreviewInvoice(group)} className="text-gray-400 hover:text-white transition-colors" title="تحميل الفاتورة"><Download size={18} /></button>
                                <button onClick={() => onDeleteOrder && onDeleteOrder(first.orderId)} className="text-gray-600 hover:text-red-400 transition-colors" title="حذف الطلب"><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <table className="w-full text-right text-xs">
                            <tbody className="divide-y divide-gray-700/50">
                                {group.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-700/20">
                                        <td className="p-3 text-white font-medium">{item.name}</td>
                                        <td className="p-3 text-gray-400 text-center">الكمية: {item.quantity}</td>
                                        <td className="p-3">
                                            {editingPriceId === item.id ? (
                                                <input 
                                                  type="number" 
                                                  value={tempPrice} 
                                                  onChange={e => setTempPrice(e.target.value)} 
                                                  onBlur={() => savePrice(item.id)} 
                                                  onKeyDown={e => e.key === 'Enter' && savePrice(item.id)}
                                                  className="w-20 bg-gray-950 border border-[#FA8072] text-white rounded px-2 outline-none text-center" 
                                                  autoFocus 
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 cursor-pointer group/price" onClick={() => { setEditingPriceId(item.id); setTempPrice(item.price.toString()); }}>
                                                    <span className="text-gray-300">{item.price.toLocaleString()}</span>
                                                    <Edit3 size={12} className="text-gray-600 group-hover/price:text-[#FA8072] transition-colors" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-white font-black">{(item.price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
