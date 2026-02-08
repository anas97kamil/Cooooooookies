
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Settings, Edit3, Trash2, CheckCircle, Plus, Minus, UserPlus, X, Check, Calculator } from 'lucide-react';
import { Product, UnitType, SaleType, Customer } from '../types';

export const POSInterface: React.FC<any> = ({ 
    onCompleteOrder, products, customers, onOpenProductManager, onOpenCustomerManager 
}) => {
  const [cart, setCart] = useState<any[]>([]);
  const [saleType, setSaleType] = useState<SaleType>('retail');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState(''); 
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '', cost: '', unit: 'piece' as UnitType });
  
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingTotalId, setEditingTotalId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    setCart(prev => prev.map(item => {
      const productDef = products.find(p => p.name === item.name && p.unitType === item.unitType);
      if (productDef) {
        return {
          ...item,
          price: saleType === 'wholesale' ? (productDef.wholesalePrice || productDef.price) : productDef.price
        };
      }
      return item;
    }));
  }, [saleType, products]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.name === p.name && i.unitType === p.unitType);
      const activePrice = saleType === 'wholesale' ? (p.wholesalePrice || p.price) : p.price;
      
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (p.unitType === 'kg' ? 0.1 : 1), price: activePrice };
        return next;
      }
      return [...prev, { 
        tempId: Math.random().toString(36).substr(2,9), 
        name: p.name, 
        price: activePrice, 
        costPrice: p.costPrice || 0, 
        quantity: p.unitType === 'kg' ? 1 : 1, 
        unitType: p.unitType 
      }];
    });
  };

  const addCustomToCart = () => {
    if (!customForm.name || !customForm.price) return;
    setCart(prev => [...prev, { 
        tempId: Math.random().toString(36).substr(2,9), 
        name: customForm.name, 
        price: parseFloat(customForm.price) || 0, 
        costPrice: parseFloat(customForm.cost) || 0,
        quantity: 1,
        unitType: customForm.unit
    }]);
    setCustomForm({ name: '', price: '', cost: '', unit: 'piece' });
    setShowCustomInput(false);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.tempId === id ? { ...i, quantity: Math.max(0, parseFloat((i.quantity + delta * (i.unitType === 'kg' ? 0.1 : 1)).toFixed(3))) } : i));
  };

  const handleManualQtyChange = (id: string, value: string) => {
    const newQty = parseFloat(value);
    if (!isNaN(newQty)) {
        setCart(prev => prev.map(i => i.tempId === id ? { ...i, quantity: newQty } : i));
    } else if (value === '') {
        setCart(prev => prev.map(i => i.tempId === id ? { ...i, quantity: 0 } : i));
    }
  };

  const handleStartEditUnitPrice = (item: any) => {
    setEditingPriceId(item.tempId);
    setEditingTotalId(null);
    setTempValue(item.price.toString());
  };

  const handleStartEditTotalAmount = (item: any) => {
    if (item.unitType !== 'kg') return;
    setEditingTotalId(item.tempId);
    setEditingPriceId(null);
    setTempValue((item.price * item.quantity).toString());
  };

  const handleSaveEdit = (tempId: string) => {
    const val = parseFloat(tempValue);
    if (!isNaN(val) && val >= 0) {
      setCart(prev => prev.map(i => {
        if (i.tempId === tempId) {
          if (editingTotalId) {
            const newQty = parseFloat((val / i.price).toFixed(3));
            return { ...i, quantity: newQty };
          } else {
            return { ...i, price: val };
          }
        }
        return i;
      }));
    }
    setEditingPriceId(null);
    setEditingTotalId(null);
  };

  const isCheckoutDisabled = cart.length === 0 || (saleType === 'wholesale' && !selectedCustomerId);

  const handleCheckout = () => {
    if (isCheckoutDisabled) return;
    const items = cart.map(({ name, price, costPrice, quantity, unitType }) => ({ name, price, costPrice, quantity, unitType }));
    const name = saleType === 'wholesale' ? customers.find((c: any) => c.id === selectedCustomerId)?.name : manualCustomerName;
    onCompleteOrder(items, name, selectedCustomerId || undefined, saleType);
    setCart([]); setManualCustomerName(''); setSelectedCustomerId(''); setSaleType('retail');
  };

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
             <h2 className="font-bold text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#FA8072]" /> قائمة المنتجات</h2>
             <button onClick={onOpenProductManager} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">تعديل الأصناف</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p: any) => (
                <button key={p.id} onClick={() => addToCart(p)} className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-[#FA8072] text-white rounded-2xl transition-all shadow-sm active:scale-95 h-32 relative group">
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${p.unitType === 'kg' ? 'bg-yellow-400 text-black' : 'bg-blue-300 text-black'}`}>{p.unitType === 'kg' ? 'كغ' : 'قطعة'}</div>
                    <span className="font-bold text-sm text-center mb-1 group-hover:text-[#FA8072]">{p.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded-md">
                      {(saleType === 'wholesale' ? (p.wholesalePrice || p.price) : p.price).toLocaleString('en-US')} ل.س
                    </span>
                </button>
            ))}
            <button onClick={() => setShowCustomInput(true)} className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-dashed border-gray-600 hover:bg-gray-700 text-gray-400 rounded-2xl h-32"><Plus size={24} className="mb-2" /><span className="text-xs">مادة حرة</span></button>
        </div>

        {showCustomInput && (
            <div className="bg-gray-800 p-4 rounded-xl border border-[#FA8072] animate-fade-up relative">
                <button onClick={() => setShowCustomInput(false)} className="absolute left-3 top-3 text-gray-500 hover:text-white"><X size={18} /></button>
                <h4 className="text-sm font-bold text-white mb-3">إضافة مادة حرة</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input type="text" value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} placeholder="المادة" className="md:col-span-4 bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm" autoFocus />
                    <input type="number" value={customForm.cost} onChange={e => setCustomForm({...customForm, cost: e.target.value})} placeholder="التكلفة" className="md:col-span-2 bg-gray-900 border border-gray-600 text-red-400 px-3 py-2 rounded-lg text-sm" />
                    <input type="number" value={customForm.price} onChange={e => setCustomForm({...customForm, price: e.target.value})} placeholder="البيع" className="md:col-span-2 bg-gray-900 border border-gray-600 text-green-400 px-3 py-2 rounded-lg text-sm" />
                    <select value={customForm.unit} onChange={e => setCustomForm({...customForm, unit: e.target.value as UnitType})} className="md:col-span-2 bg-gray-900 border border-gray-600 text-white px-2 py-2 rounded-lg text-sm"><option value="piece">قطعة</option><option value="kg">كغ</option></select>
                    <button onClick={addCustomToCart} className="md:col-span-2 bg-[#FA8072] text-white rounded-lg font-bold">إضافة</button>
                </div>
            </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-gray-800 rounded-[2rem] border border-gray-700 shadow-2xl overflow-hidden flex flex-col h-full min-h-[550px]">
            <div className="bg-gray-900/80 p-5 border-b border-gray-700 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-white flex items-center gap-2"><ShoppingCart size={22} className="text-[#FA8072]" /> سلة المبيعات</h3>
                    {cart.length > 0 && <button onClick={() => setCart([])} className="text-[10px] font-black text-red-400 hover:underline">تفريغ السلة</button>}
                </div>
                <div className="grid grid-cols-2 bg-gray-700 p-1 rounded-xl">
                    <button onClick={() => setSaleType('retail')} className={`py-2 text-xs font-black rounded-lg transition-all ${saleType === 'retail' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>مفرق</button>
                    <button onClick={() => setSaleType('wholesale')} className={`py-2 text-xs font-black rounded-lg transition-all ${saleType === 'wholesale' ? 'bg-[#FA8072] text-white shadow-sm' : 'text-gray-400'}`}>جملة</button>
                </div>
                {saleType === 'retail' ? (
                     <input type="text" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} placeholder="اسم الزبون (اختياري)..." className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#FA8072]" />
                ) : (
                    <div className="flex gap-2">
                         <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className={`w-full bg-gray-800 border text-white text-sm rounded-xl px-4 py-2.5 outline-none transition-all ${!selectedCustomerId && cart.length > 0 ? 'border-orange-500 animate-pulse' : 'border-gray-700 focus:border-[#FA8072]'}`}>
                            <option value="">اختر عميل الجملة...</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                        <button onClick={onOpenCustomerManager} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><UserPlus size={18} /></button>
                    </div>
                )}
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {!cart.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 py-10">
                        <div className="bg-gray-700/20 p-6 rounded-full mb-4">
                            <ShoppingCart size={48} className="opacity-20" />
                        </div>
                        <p className="font-bold">السلة فارغة</p>
                    </div>
                ) : (
                    cart.map(i => (
                        <div key={i.tempId} className="bg-gray-700/30 p-4 rounded-2xl flex flex-col gap-3 border border-gray-700/50 hover:border-[#FA8072]/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col flex-1">
                                    <span className="text-white font-black text-sm">{i.name}</span>
                                    {editingPriceId === i.tempId ? (
                                        <div className="flex items-center gap-1 mt-1">
                                            <input 
                                                type="number" 
                                                value={tempValue} 
                                                onChange={e => setTempValue(e.target.value)} 
                                                onBlur={() => handleSaveEdit(i.tempId)} 
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(i.tempId)} 
                                                className="w-24 bg-gray-900 border border-[#FA8072] text-white text-xs px-2 py-1 rounded-lg" 
                                                autoFocus 
                                            />
                                            <span className="text-[10px] text-gray-500 font-bold">ل.س</span>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-center gap-1.5 cursor-pointer group/price" onClick={() => handleStartEditUnitPrice(i)}>
                                            <span className="text-[10px] text-gray-500">
                                              {i.unitType === 'kg' ? 'سعر الكيلو: ' : 'السعر: '}
                                              <span className="text-gray-300 font-bold tabular-nums">{i.price.toLocaleString('en-US')}</span>
                                            </span>
                                            <Edit3 size={10} className="text-[#FA8072] opacity-30 group-hover/price:opacity-100" />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setCart(p => p.filter(it => it.tempId !== i.tempId))} className="text-gray-600 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-gray-900/50 rounded-xl px-2 py-1.5 border border-gray-700">
                                    <button onClick={() => updateQty(i.tempId, -1)} className="text-gray-500 hover:text-white transition-colors p-1"><Minus size={14} /></button>
                                    <input 
                                        type="number" 
                                        value={i.quantity} 
                                        onChange={(e) => handleManualQtyChange(i.tempId, e.target.value)}
                                        className="w-16 bg-transparent text-white text-sm font-black text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        step={i.unitType === 'kg' ? '0.001' : '1'}
                                    />
                                    <button onClick={() => updateQty(i.tempId, 1)} className="text-gray-500 hover:text-white transition-colors p-1"><Plus size={14} /></button>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    {editingTotalId === i.tempId ? (
                                        <div className="flex items-center gap-1">
                                            <input 
                                                type="number" 
                                                value={tempValue} 
                                                onChange={e => setTempValue(e.target.value)} 
                                                onBlur={() => handleSaveEdit(i.tempId)} 
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(i.tempId)} 
                                                className="w-20 bg-gray-950 border border-green-500 text-white text-xs px-2 py-1 rounded-lg text-center font-black" 
                                                autoFocus 
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                          onClick={() => handleStartEditTotalAmount(i)}
                                          className={`flex flex-col items-end group/total ${i.unitType === 'kg' ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className="flex items-center gap-1">
                                              {i.unitType === 'kg' && <Calculator size={10} className="text-[#FA8072] opacity-0 group-hover/total:opacity-100 transition-opacity" />}
                                              <span className="text-[#FA8072] font-black text-lg tabular-nums">{(i.price * i.quantity).toLocaleString('en-US')}</span>
                                            </div>
                                            <span className="text-[8px] text-gray-600 font-bold uppercase">{i.unitType === 'kg' ? 'انقر لطلب مبلغ محدد' : 'إجمالي المادة'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-gray-900/90 border-t border-gray-700 shrink-0">
                <div className="flex justify-between items-center mb-5">
                    <span className="text-gray-500 font-black text-xs uppercase tracking-widest">إجمالي السلة</span>
                    <div className="text-right">
                        <span className="text-3xl font-black text-white tabular-nums">{total.toLocaleString('en-US')}</span>
                        <span className="text-[10px] text-gray-500 font-bold mr-1">ل.س</span>
                    </div>
                </div>
                <button 
                  onClick={handleCheckout} 
                  disabled={isCheckoutDisabled} 
                  className={`w-full py-4 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl ${!isCheckoutDisabled ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-900/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}`}
                >
                  <CheckCircle size={24} /> تأكيد وحفظ الفاتورة
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
