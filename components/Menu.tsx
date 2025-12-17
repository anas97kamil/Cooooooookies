
import React, { useState, useMemo } from 'react';
import { Trash2, ShoppingBag, Search, User, Download, Store, Edit3, Check, X } from 'lucide-react';
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
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: SaleItem[] } = {};
    items.forEach(item => {
        const key = item.orderId || `ord-${item.customerNumber}-${item.time}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });
    
    // Sort by orderId DESC
    return Object.values(groups).sort((a, b) => {
        const idA = a[0].orderId || "0";
        const idB = b[0].orderId || "0";
        return idB.localeCompare(idA);
    });
  }, [items]);

  const filteredOrders = useMemo(() => {
      if (!searchTerm) return groupedOrders;
      const lowerTerm = searchTerm.toLowerCase();
      return groupedOrders.filter(group => {
          const first = group[0];
          const name = first.customerName?.toLowerCase() || '';
          const number = first.customerNumber?.toString() || '';
          return name.includes(lowerTerm) || number.includes(lowerTerm);
      });
  }, [groupedOrders, searchTerm]);

  const startEditPrice = (item: SaleItem) => {
    setEditingPriceId(item.id);
    setTempPrice(item.price.toString());
  };

  const savePrice = (itemId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0 && onUpdateItemPrice) {
        onUpdateItemPrice(itemId, newPrice);
    }
    setEditingPriceId(null);
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-700 text-center flex flex-col items-center justify-center min-h-[200px] print:hidden">
        <div className="bg-gray-700/50 p-4 rounded-full mb-3">
            <ShoppingBag className="text-gray-500 w-8 h-8" />
        </div>
        <p className="text-gray-500 font-bold text-sm">لا توجد مبيعات نشطة حالياً.</p>
        <p className="text-gray-600 text-[10px] mt-1 font-bold uppercase tracking-widest">انتظار طلب جديد...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-3 no-print">
            <div className="relative w-full md:w-96">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث عن فاتورة..."
                    className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg pr-9 pl-4 py-2 text-sm outline-none focus:border-[#FA8072]"
                />
            </div>
            <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">إجمالي اليوم: {filteredOrders.length}</div>
        </div>

        <div className="space-y-4">
            {filteredOrders.map((group, index) => {
                const firstItem = group[0];
                const orderTotal = group.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const orderId = firstItem.orderId;
                const displayName = firstItem.customerName ? `${firstItem.customerName}` : `زبون رقم ${firstItem.customerNumber || '?'}`;
                const isWholesale = firstItem.saleType === 'wholesale';
                
                return (
                    <div key={orderId || index} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl animate-fade-up">
                        <div className="bg-gray-900/80 p-3 flex flex-wrap items-center justify-between border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded-lg font-bold text-xs border flex items-center gap-1.5 ${isWholesale ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {isWholesale ? <Store size={14} /> : <User size={14} />}
                                    <span>{displayName}</span>
                                </div>
                                <span className="text-gray-500 text-[10px] font-bold">{firstItem.time}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                <span className="text-white font-black ml-2 tabular-nums">{orderTotal.toLocaleString()} <small className="text-[9px] text-gray-500">ل.س</small></span>
                                <button onClick={() => onPreviewInvoice(group)} className="bg-gray-700 hover:bg-green-600 text-white p-2 rounded-lg transition-colors no-print"><Download size={14} /></button>
                                {onDeleteOrder && (
                                    confirmOrderId === orderId ? (
                                        <div className="flex gap-1">
                                            <button onClick={() => onDeleteOrder(orderId)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold">تأكيد</button>
                                            <button onClick={() => setConfirmOrderId(null)} className="bg-gray-600 text-white px-2 py-1 rounded text-[10px] font-bold">X</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmOrderId(orderId)} className="text-gray-600 hover:text-red-400 p-2 no-print transition-colors"><Trash2 size={14} /></button>
                                    )
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-[11px]">
                                <thead className="bg-gray-900/40 text-gray-500 font-bold border-b border-gray-700/50">
                                    <tr>
                                        <th className="p-2 pr-4">المادة</th>
                                        <th className="p-2 text-center">الكمية</th>
                                        <th className="p-2">السعر</th>
                                        <th className="p-2">الإجمالي</th>
                                        <th className="p-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/30">
                                    {group.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-700/10 transition-colors">
                                            <td className="p-2 pr-4 font-bold text-gray-200">{item.name}</td>
                                            <td className="p-2 text-center text-gray-400 font-mono">{item.quantity}</td>
                                            <td className="p-2 tabular-nums">
                                                {editingPriceId === item.id ? (
                                                    <input 
                                                        type="number" 
                                                        value={tempPrice} 
                                                        onChange={e => setTempPrice(e.target.value)} 
                                                        onBlur={() => savePrice(item.id)}
                                                        onKeyDown={e => e.key === 'Enter' && savePrice(item.id)}
                                                        className="w-16 bg-gray-950 border border-[#FA8072] text-white rounded px-1 py-0.5"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span onClick={() => startEditPrice(item)} className="cursor-pointer hover:text-[#FA8072] border-b border-dashed border-gray-700">{item.price.toLocaleString()}</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-[#FA8072] font-black tabular-nums">{(item.price * item.quantity).toLocaleString()}</td>
                                            <td className="p-2"><button onClick={() => onDeleteItem(item.id)} className="text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={12}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
