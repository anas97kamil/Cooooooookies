
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Settings, Edit3, Trash2, CheckCircle, Plus, Minus, UserPen, Store, UserPlus, X, BadgeDollarSign, Check } from 'lucide-react';
import { SaleItem, Product, UnitType, SaleType, Customer } from '../types';

interface POSInterfaceProps {
  onCompleteOrder: (items: any[], customerName?: string, customerId?: string, saleType?: SaleType) => void;
  products: Product[];
  customers: Customer[];
  onOpenProductManager: () => void;
  onOpenCustomerManager: () => void;
}

export const POSInterface: React.FC<POSInterfaceProps> = ({ 
    onCompleteOrder, products, customers, onOpenProductManager, onOpenCustomerManager 
}) => {
  const [cart, setCart] = useState<any[]>([]);
  const [saleType, setSaleType] = useState<SaleType>('retail');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState(''); 
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '', cost: '', unit: 'piece' as UnitType });
  
  // States for inline editing in cart
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<string>('');

  // Update existing cart prices when saleType changes
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
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1, price: activePrice };
        return next;
      }
      return [...prev, { 
        tempId: Math.random().toString(36).substr(2,9), 
        name: p.name, 
        price: activePrice, 
        costPrice: p.costPrice || 0, 
        quantity: 1, 
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
    setCart(prev => prev.map(i => i.tempId === id ? { ...i, quantity: Math.max(0.1, parseFloat((i.quantity + delta * (i.unitType === 'kg' ? 0.1 : 1)).toFixed(2))) } : i));
  };

  const handleStartEditPrice = (item: any) => {
    setEditingPriceId(item.tempId);
    setTempPrice(item.price.toString());
    setEditingQtyId(null);
  };

  const handleSavePrice = (tempId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setCart(prev => prev.map(i => i.tempId === tempId ? { ...i, price: newPrice } : i));
    }
    setEditingPriceId(null);
  };

  const handleStartEditQty = (item: any) => {
    setEditingQtyId(item.tempId);
    setTempQty(item.quantity.toString());
    setEditingPriceId(null);
  };

  const handleSaveQty = (tempId: string) => {
    const newQty = parseFloat(tempQty);
    if (!isNaN(newQty) && newQty > 0) {
      setCart(prev => prev.map(i => i.tempId === tempId ? { ...i, quantity: newQty } : i));
    }
    setEditingQtyId(null);
  };

  const updateByPrice = (id: string, totalAmount: string) => {
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setCart(prev => prev.map(i => {
      if (i.tempId === id && i.unitType === 'kg') {
        const newQty = parseFloat((amount / i.price).toFixed(3));
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const isCheckoutDisabled = cart.length === 0 || (saleType === 'wholesale' && !selectedCustomerId);

  const handleCheckout = () => {
    if (isCheckoutDisabled) return;
    
    const items = cart.map(({ name, price, costPrice, quantity, unitType }) => ({ name, price, costPrice, quantity, unitType }));
    const name = saleType === 'wholesale' ? customers.find(c => c.id === selectedCustomerId)?.name : manualCustomerName;
    
    onCompleteOrder(items, name, selectedCustomerId || undefined, saleType);
    
    setCart([]); 
    setManualCustomerName(''); 
    setSelectedCustomerId(''); 
    setSaleType('retail');
  };

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
             <h2 className="font-bold text-white flex items-center gap-2"><Settings className="text-[#FA8072]" size={20} /> قائمة المنتجات</h2>
             <button onClick={onOpenProductManager} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">تعديل الأصناف</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-[#FA8072] text-white rounded-2xl transition-all shadow-sm active:scale-95 h-32 relative group">
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${p.unitType === 'kg' ? 'bg-yellow-400 text-black' : 'bg-blue-300 text-black'}`}>{p.unitType === 'kg' ? 'كغ' : 'قطعة'}</div>
                    <span className="font-bold text-sm text-center mb-1 group-hover:text-[#FA8072]">{p.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded-md">
                      {(saleType === 'wholesale' ? (p.wholesalePrice || p.price) : p.price).toLocaleString()} ل.س
                    </span>
                </button>
            ))}
            <button onClick={() => setShowCustomInput(true)} className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-dashed border-gray-600 hover:bg-gray-700 text-gray-400 rounded-2xl h-32"><Edit3 size={20} className="mb-2" /><span className="text-xs">مادة حرة</span></button>
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
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="bg-gray-900/80 p-4 border-b border-gray-700 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#FA8072]" /> سلة المبيعات</h3>
                    {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-400 underline">إلغاء السلة</button>}
                </div>
                <div className="grid grid-cols-2 bg-gray-700 p-1 rounded-lg">
                    <button onClick={() => setSaleType('retail')} className={`py-1.5 text-xs font-bold rounded-md transition-colors ${saleType === 'retail' ? 'bg-white text-black' : 'text-gray-400'}`}>مفرق</button>
                    <button onClick={() => setSaleType('wholesale')} className={`py-1.5 text-xs font-bold rounded-md transition-colors ${saleType === 'wholesale' ? 'bg-[#FA8072] text-white' : 'text-gray-400'}`}>جملة</button>
                </div>
                {saleType === 'retail' ? (
                     <input type="text" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} placeholder="الاسم (اختياري)..." className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#FA8072]" />
                ) : (
                    <div className="flex gap-2">
                         <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className={`w-full bg-gray-800 border text-white text-sm rounded-lg px-3 py-2 outline-none transition-all ${!selectedCustomerId && cart.length > 0 ? 'border-orange-500 animate-pulse' : 'border-gray-600 focus:border-[#FA8072]'}`}>
                            <option value="">اختر العميل...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                        <button onClick={onOpenCustomerManager} className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-500 transition-colors" title="إضافة عميل"><UserPlus size={18} /></button>
                    </div>
                )}
            </div>

            <div className="flex-grow p-3 overflow-y-auto space-y-2">
                {!cart.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 py-10"><ShoppingCart size={48} className="mb-2" /><p>سلة المبيعات فارغة</p></div>
                ) : (
                    cart.map(i => (
                        <div key={i.tempId} className="bg-gray-700/50 p-3 rounded-xl flex flex-col gap-2 border border-gray-700 relative group/item hover:border-gray-500 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col flex-1">
                                    <span className="text-white font-bold text-sm">{i.name}</span>
                                    
                                    {/* Inline Price Editor */}
                                    <div className="mt-1">
                                        {editingPriceId === i.tempId ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] text-gray-500">سعر الوحدة:</span>
                                                <input 
                                                    type="number" 
                                                    value={tempPrice} 
                                                    onChange={e => setTempPrice(e.target.value)}
                                                    onKeyDown={e => { 
                                                        if(e.key === 'Enter') handleSavePrice(i.tempId); 
                                                        if(e.key === 'Escape') setEditingPriceId(null); 
                                                    }}
                                                    onBlur={() => handleSavePrice(i.tempId)}
                                                    className="w-20 bg-gray-900 border border-[#FA8072] text-white text-[10px] px-1.5 py-0.5 rounded outline-none font-bold"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSavePrice(i.tempId)} className="text-green-500 hover:text-green-400 transition-colors"><Check size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 cursor-pointer group/price" onClick={() => handleStartEditPrice(i)} title="تعديل سعر الوحدة">
                                                <span className="text-[10px] text-gray-400">سعر الوحدة: <span className="text-gray-300 font-bold">{i.price.toLocaleString()}</span></span>
                                                <Edit3 size={11} className="text-[#FA8072] opacity-30 group-hover/price:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setCart(p => p.filter(it => it.tempId !== i.tempId))} className="text-gray-500 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-1 bg-gray-900 rounded-lg px-2 py-1 border border-gray-700">
                                    <button onClick={() => updateQty(i.tempId, -1)} className="text-gray-400 hover:text-white transition-colors p-0.5"><Minus size={12} /></button>
                                    
                                    {editingQtyId === i.tempId ? (
                                        <input 
                                            type="number"
                                            step={i.unitType === 'kg' ? "0.01" : "1"}
                                            value={tempQty}
                                            onChange={(e) => setTempQty(e.target.value)}
                                            onBlur={() => handleSaveQty(i.tempId)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveQty(i.tempId);
                                                if (e.key === 'Escape') setEditingQtyId(null);
                                            }}
                                            className="w-14 bg-gray-800 border border-[#FA8072] text-white text-sm font-bold text-center rounded outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <span 
                                            onClick={() => handleStartEditQty(i)}
                                            className="text-white text-sm font-bold min-w-[35px] text-center cursor-pointer hover:bg-gray-800 px-1 rounded transition-colors"
                                            title="تعديل الكمية يدوياً"
                                        >
                                            {i.quantity}
                                        </span>
                                    )}

                                    <button onClick={() => updateQty(i.tempId, 1)} className="text-gray-400 hover:text-white transition-colors p-0.5"><Plus size={12} /></button>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    {i.unitType === 'kg' ? (
                                        <div className="flex flex-col items-end">
                                            <label className="text-[8px] text-gray-500 font-bold mb-0.5">تغيير حسب المبلغ:</label>
                                            <input 
                                                type="number" 
                                                value={Math.round(i.price * i.quantity)}
                                                onChange={(e) => updateByPrice(i.tempId, e.target.value)}
                                                className="w-20 bg-gray-900 border border-[#FA8072]/40 rounded px-1.5 py-1 text-right text-xs text-[#FA8072] font-bold outline-none focus:border-[#FA8072] transition-colors"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-[#FA8072] font-bold text-base">{(i.price * i.quantity).toLocaleString()} <span className="text-[10px] opacity-70">ل.س</span></span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-gray-900 border-t border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 font-bold">المجموع النهائي:</span>
                    <span className="text-2xl font-bold text-white tracking-tight">{total.toLocaleString()} <span className="text-xs text-gray-500 font-normal">ل.س</span></span>
                </div>
                
                {saleType === 'wholesale' && !selectedCustomerId && cart.length > 0 && (
                    <div className="flex items-center justify-center gap-2 text-orange-400 text-[10px] mb-3 font-bold bg-orange-400/10 py-1.5 rounded-lg border border-orange-500/20 animate-pulse">
                        <BadgeDollarSign size={12} />
                        يرجى تحديد عميل للمتابعة بالجملة
                    </div>
                )}

                <button 
                  onClick={handleCheckout} 
                  disabled={isCheckoutDisabled} 
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${!isCheckoutDisabled ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/40' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  <CheckCircle size={22} /> 
                  تأكيد الطلب
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
