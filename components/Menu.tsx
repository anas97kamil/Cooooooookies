import React, { useState, useMemo } from 'react';
import { Trash2, ShoppingBag, Search, User, ChevronDown, ChevronUp } from 'lucide-react';
import { SaleItem } from '../types';

interface SalesTableProps {
  items: SaleItem[];
  onDeleteItem: (id: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ items, onDeleteItem, onDeleteOrder }) => {
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  
  // State for inline deletion confirmation
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  
  // Group items by orderId/customerNumber
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: SaleItem[] } = {};
    items.forEach(item => {
        // Fallback for old data without orderId
        const key = item.orderId || `legacy-${item.time}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });
    
    // Convert to array and sort by time (newest first)
    return Object.values(groups).sort((a, b) => {
        // Try to sort by customer number descending
        const custA = a[0]?.customerNumber || 0;
        const custB = b[0]?.customerNumber || 0;
        return custB - custA;
    });
  }, [items]);

  // Filter logic
  const filteredOrders = useMemo(() => {
      if (!filterCustomer) return groupedOrders;
      return groupedOrders.filter(group => 
          group[0].customerNumber.toString() === filterCustomer
      );
  }, [groupedOrders, filterCustomer]);

  if (items.length === 0) {
    return (
      <div className="bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-700 text-center flex flex-col items-center justify-center min-h-[200px] print:hidden">
        <div className="bg-gray-700 p-4 rounded-full mb-3">
            <ShoppingBag className="text-gray-400 w-8 h-8" />
        </div>
        <p className="text-gray-400 font-medium">لا توجد مبيعات مسجلة اليوم حتى الآن.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4 no-print">
            <div className="flex items-center gap-2 text-gray-400">
                <Search size={20} />
                <span className="text-sm font-bold">فلترة حسب:</span>
            </div>
            <select 
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#FA8072] flex-grow md:flex-grow-0 md:w-64"
            >
                <option value="">جميع الزبائن</option>
                {groupedOrders.map(group => (
                    <option key={group[0].orderId} value={group[0].customerNumber}>
                        الزبون رقم {group[0].customerNumber || 'غير محدد'} {group[0].customerName ? `(${group[0].customerName})` : ''}
                    </option>
                ))}
            </select>
            
            {filterCustomer && (
                <button 
                    onClick={() => setFilterCustomer('')}
                    className="text-sm text-[#FA8072] hover:underline"
                >
                    إلغاء الفلترة
                </button>
            )}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
            {filteredOrders.map((group, index) => {
                const firstItem = group[0];
                const orderTotal = group.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const orderId = firstItem.orderId;
                const displayName = firstItem.customerName ? `${firstItem.customerName}` : `زبون رقم ${firstItem.customerNumber || '?'}`;
                
                return (
                    <div key={orderId || index} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden animate-fade-up">
                        {/* Order Header */}
                        <div className="bg-gray-900/50 p-4 flex flex-wrap items-center justify-between border-b border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#FA8072]/10 text-[#FA8072] px-3 py-1 rounded-lg font-bold border border-[#FA8072]/20 flex items-center gap-2">
                                    <User size={16} />
                                    <span>
                                        {displayName}
                                        {/* If name exists, show number in small text */}
                                        {firstItem.customerName && <span className="text-xs opacity-70 mr-2">#{firstItem.customerNumber}</span>}
                                    </span>
                                </div>
                                <span className="text-gray-400 text-sm font-mono">{firstItem.time}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 md:mt-0">
                                <div className="text-white font-bold">
                                    <span className="text-gray-400 text-sm font-normal ml-2">إجمالي الفاتورة:</span>
                                    {orderTotal.toLocaleString()} ل.س
                                </div>
                                {onDeleteOrder && (
                                    confirmOrderId === orderId ? (
                                        <div className="flex items-center gap-2 no-print">
                                            <span className="text-xs text-red-300 hidden md:inline">حذف الكل؟</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteOrder(orderId);
                                                    setConfirmOrderId(null);
                                                }}
                                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                            >
                                                نعم
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmOrderId(null);
                                                }}
                                                className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                                            >
                                                إلغاء
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmOrderId(orderId);
                                            }}
                                            className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors no-print"
                                            title="حذف الطلب بالكامل"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-700/20 text-xs text-gray-400">
                                    <tr>
                                        <th className="py-2 px-4">المادة</th>
                                        <th className="py-2 px-4 text-center">الكمية</th>
                                        <th className="py-2 px-4">سعر البيع</th>
                                        <th className="py-2 px-4">الإجمالي</th>
                                        <th className="py-2 px-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50 text-sm">
                                    {group.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-700/20 transition-colors">
                                            <td className="py-2 px-4 font-medium text-gray-200">
                                                {item.name}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">
                                                    {item.quantity} {item.unitType === 'kg' ? 'كغ' : 'قطعة'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 text-gray-400">{item.price.toLocaleString()}</td>
                                            <td className="py-2 px-4 text-[#FA8072] font-medium">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </td>
                                            <td className="py-2 px-4 text-left">
                                                {confirmItemId === item.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                onDeleteItem(item.id);
                                                                setConfirmItemId(null);
                                                            }}
                                                            className="text-red-500 text-xs font-bold hover:underline"
                                                        >
                                                            تأكيد
                                                        </button>
                                                        <span className="text-gray-600">/</span>
                                                        <button
                                                            onClick={() => setConfirmItemId(null)}
                                                            className="text-gray-400 text-xs hover:text-white"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmItemId(item.id);
                                                        }}
                                                        className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                                                        title="حذف مادة"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
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