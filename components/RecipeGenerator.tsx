
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Settings, Edit3, Trash2, CheckCircle, Plus, Minus, UserPlus, X, Check, Calculator, Barcode, Search, Sparkles } from 'lucide-react';
import { Product, UnitType, SaleType, Customer } from '../types';

export const POSInterface: React.FC<any> = ({ 
    onCompleteOrder, products, customers, onOpenProductManager, onOpenCustomerManager 
}) => {
  const [cart, setCart] = useState<any[]>([]);
  const [saleType, setSaleType] = useState<SaleType>('retail');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState(''); 
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '', cost: '', unit: 'piece' as UnitType, barcode: '' });
  
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [barcodeSuccess, setBarcodeSuccess] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingTotalId, setEditingTotalId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    setCart((prev: any[]) => prev.map((item: any) => {
      const productDef = products.find((p: Product) => p.name === item.name && p.unitType === item.unitType);
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
        unitType: p.unitType,
        barcode: p.barcode
      }];
    });
  };

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeSearch.trim()) return;

    const foundProduct = products.find((p: Product) => p.barcode === barcodeSearch.trim());
    if (foundProduct) {
        addToCart(foundProduct);
        setBarcodeSearch('');
        setBarcodeSuccess(true);
        setTimeout(() => {
            setBarcodeSuccess(false);
            barcodeInputRef.current?.focus();
        }, 800);
    } else {
        setBarcodeSearch('');
    }
  };

  const addCustomToCart = () => {
    if (!customForm.name || !customForm.price) return;
    setCart(prev => [...prev, { 
        tempId: Math.random().toString(36).substr(2,9), 
        name: customForm.name, 
        price: parseFloat(customForm.price) || 0, 
        costPrice: parseFloat(customForm.cost) || 0,
        quantity: 1,
        unitType: customForm.unit,
        barcode: customForm.barcode
    }]);
    setCustomForm({ name: '', price: '', cost: '', unit: 'piece', barcode: '' });
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
    const items = cart.map(({ name, price, costPrice, quantity, unitType, barcode }) => ({ name, price, costPrice, quantity, unitType, barcode }));
    const name = saleType === 'wholesale' ? customers.find((c: any) => c.id === selectedCustomerId)?.name : manualCustomerName;
    onCompleteOrder(items, name, selectedCustomerId || undefined, saleType);
    setCart([]); setManualCustomerName(''); setSelectedCustomerId(''); setSaleType('retail');
  };

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {/* Header & Quick Actions */}
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
             <h2 className="font-bold text-white flex items-center gap-2">
                <div className="bg-[#FA8072]/20 p-1.5 rounded-lg"><ShoppingCart size={18} className="text-[#FA8072]" /></div>
                <span>قائمة المنتجات</span>
             </h2>
             <button onClick={onOpenProductManager} className="text-[10px] font-black uppercase bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-xl transition-all border border-gray-600">تعريف الأصناف</button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[550px] overflow-y-auto custom-scrollbar p-1">
            {products.map((p: any) => (
                <button key={p.id} onClick={() => addToCart(p)} className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-[#FA8072] text-white rounded-[1.5rem] transition-all shadow-sm active:scale-95 h-32 relative group overflow-hidden">
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black ${p.unitType === 'kg' ? 'bg-yellow-400 text-black' : 'bg-blue-300 text-black'}`}>{p.unitType === 'kg' ? 'كغ' : 'قطعة'}</div>
                    <span className="font-black text-xs text-center mb-1 group-hover:text-[#FA8072] line-clamp-2 leading-tight">{p.name}</span>
                    <span className="text-[11px] font-bold text-gray-400 tabular-nums">
                      {(saleType === 'wholesale' ? (p.wholesalePrice || p.price) : p.price).toLocaleString('en-US')}
                    </span>
                    {p.barcode && <Barcode size={10} className="absolute bottom-2 left-2 text-gray-600 opacity-30" />}
                </button>
            ))}
            <button onClick={() => setShowCustomInput(true)} className="flex flex-col items-center justify-center p-4 bg-gray-900/40 border border-dashed border-gray-700 hover:border-[#FA8072] text-gray-500 hover:text-[#FA8072] rounded-[1.5rem] h-32 transition-all group">
                <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black">مادة حرة</span>
            </button>
        </div>

        {/* Custom Item Input */}
        {showCustomInput && (
            <div className="bg-gray-800 p-5 rounded-2xl border border-[#FA8072] animate-fade-up relative shadow-2xl">
                <button onClick={() => setShowCustomInput(false)} className="absolute left-4 top-4 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
                <h4 className="text-xs font-black text-white mb-4 flex items-center gap-2"><Sparkles size={14} className="text-yellow-400" /> إضافة مادة يدوية سريعة</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <input type="text" value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} placeholder="اسم المادة" className="md:col-span-3 bg-gray-900 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold" autoFocus />
                    <input type="text" value={customForm.barcode} onChange={e => setCustomForm({...customForm, barcode: e.target.value})} placeholder="الباركود (اختياري)" className="md:col-span-2 bg-gray-900 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-[10px] dir-ltr text-right" />
                    <input type="number" value={customForm.cost} onChange={e => setCustomForm({...customForm, cost: e.target.value})} placeholder="التكلفة" className="md:col-span-2 bg-gray-900 border border-gray-700 text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold" />
                    <input type="number" value={customForm.price} onChange={e => setCustomForm({...customForm, price: e.target.value})} placeholder="سعر البيع" className="md:col-span-2 bg-gray-900 border border-gray-700 text-green-400 px-4 py-2.5 rounded-xl text-sm font-bold" />
                    <select value={customForm.unit} onChange={e => setCustomForm({...customForm, unit: e.target.value as UnitType})} className="md:col-span-1 bg-gray-900 border border-gray-700 text-white px-1 py-2.5 rounded-xl text-[10px] font-bold">
                        <option value="piece">قطعة</option>
                        <option value="kg">كغ</option>
                    </select>
                    <button onClick={addCustomToCart} className="md:col-span-2 bg-[#FA8072] text-white rounded-xl font-black text-xs hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/20">تأكيد الإضافة</button>
                </div>
            </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className={`bg-gray-800 rounded-[2.5rem] border ${barcodeSuccess ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-gray-700'} shadow-2xl overflow-hidden flex flex-col h-full min-h-[580px] transition-all duration-300`}>
            
            {/* Cart Header Section */}
            <div className="bg-gray-900/80 p-6 border-b border-gray-700 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-white flex items-center gap-3">
                        <div className="bg-[#FA8072]/10 p-2 rounded-xl"><ShoppingCart size={22} className="text-[#FA8072]" /></div>
                        <span>سلة المبيعات</span>
                    </h3>
                    {cart.length > 0 && <button onClick={() => setCart([])} className="text-[10px] font-black text-red-400 hover:text-red-300 transition-colors bg-red-400/5 px-2 py-1 rounded-lg">تفريغ السلة</button>}
                </div>
                <div className="grid grid-cols-2 bg-gray-800 p-1.5 rounded-2xl border border-gray-700">
                    <button onClick={() => setSaleType('retail')} className={`py-2 text-xs font-black rounded-xl transition-all ${saleType === 'retail' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-300'}`}>مـفـرق</button>
                    <button onClick={() => setSaleType('wholesale')} className={`py-2 text-xs font-black rounded-xl transition-all ${saleType === 'wholesale' ? 'bg-[#FA8072] text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-300'}`}>جـمـلـة</button>
                </div>
                {saleType === 'retail' ? (
                     <input type="text" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} placeholder="اسم الزبون (اختياري)..." className="w-full bg-gray-950 border border-gray-700 text-white text-xs rounded-2xl px-5 py-2.5 outline-none focus:border-[#FA8072] font-bold" />
                ) : (
                    <div className="flex gap-2">
                         <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className={`w-full bg-gray-950 border text-white text-xs rounded-2xl px-5 py-2.5 outline-none transition-all font-bold ${!selectedCustomerId && cart.length > 0 ? 'border-orange-500 animate-pulse' : 'border-gray-700 focus:border-[#FA8072]'}`}>
                            <option value="">اختر عميل الجملة...</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                        <button onClick={onOpenCustomerManager} className="bg-blue-600 text-white px-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 active:scale-90"><UserPlus size={18} /></button>
                    </div>
                )}
            </div>

            {/* BARCODE INPUT: Under Header, Above Added Items */}
            <div className="px-5 pt-4">
                <div className={`relative group/barcode transition-all border-b border-gray-700/50 pb-4`}>
                    <form onSubmit={handleBarcodeSearch} className="relative w-full">
                        <input 
                          ref={barcodeInputRef}
                          type="text" 
                          value={barcodeSearch}
                          onChange={e => setBarcodeSearch(e.target.value)}
                          placeholder="امسح الباركود للإضافة السريعة..."
                          className={`w-full bg-gray-900/50 border ${barcodeSuccess ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.15)]' : 'border-gray-700 focus:border-[#FA8072]'} text-white rounded-xl pl-4 pr-10 py-3 text-[11px] outline-none transition-all dir-ltr text-right font-bold`}
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-hover/barcode:text-[#FA8072] transition-colors">
                            <Barcode size={18} />
                        </div>
                        {barcodeSuccess && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 animate-fade-up">
                                <CheckCircle size={18} />
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Added Items List */}
            <div className="flex-grow p-5 overflow-y-auto space-y-4 custom-scrollbar">
                {!cart.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 py-16">
                        <div className="bg-gray-900/50 p-8 rounded-full mb-5 border border-gray-700">
                            <ShoppingCart size={48} className="opacity-10" />
                        </div>
                        <p className="font-black text-[10px] uppercase tracking-widest opacity-30 text-center">بانتظار إضافة المنتجات</p>
                    </div>
                ) : (
                    cart.map(i => (
                        <div key={i.tempId} className="bg-gray-900/40 p-5 rounded-3xl flex flex-col gap-4 border border-gray-700/50 hover:border-[#FA8072]/30 transition-all group/item shadow-sm animate-fade-up">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-black text-[12px] group-hover/item:text-[#FA8072] transition-colors">{i.name}</span>
                                        {i.barcode && <Barcode size={10} className="text-gray-600 opacity-40" />}
                                    </div>
                                    {editingPriceId === i.tempId ? (
                                        <div className="flex items-center gap-1 mt-1.5 animate-fade-up">
                                            <input 
                                                type="number" 
                                                value={tempValue} 
                                                onChange={e => setTempValue(e.target.value)} 
                                                onBlur={() => handleSaveEdit(i.tempId)} 
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(i.tempId)} 
                                                className="w-24 bg-gray-950 border border-[#FA8072] text-white text-xs px-2 py-1 font-black rounded-lg" 
                                                autoFocus 
                                            />
                                            <span className="text-[9px] text-gray-500 font-bold">ل.س</span>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-center gap-1.5 cursor-pointer group/price w-fit" onClick={() => handleStartEditUnitPrice(i)}>
                                            <span className="text-[10px] text-gray-600 font-bold tabular-nums">
                                              {i.unitType === 'kg' ? 'سعر الكغ: ' : 'السعر: '}
                                              <span className="text-gray-400 group-hover/price:text-[#FA8072] transition-colors">{i.price.toLocaleString('en-US')} ل.س</span>
                                            </span>
                                            <Edit3 size={10} className="text-[#FA8072] opacity-0 group-hover/price:opacity-60 transition-opacity" />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setCart(p => p.filter(it => it.tempId !== i.tempId))} className="text-gray-700 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-gray-950/80 rounded-2xl px-2 py-1.5 border border-gray-700/50">
                                    <button onClick={() => updateQty(i.tempId, -1)} className="text-gray-600 hover:text-white transition-colors p-1.5"><Minus size={14} /></button>
                                    <input 
                                        type="number" 
                                        value={i.quantity} 
                                        onChange={(e) => handleManualQtyChange(i.tempId, e.target.value)}
                                        className="w-14 bg-transparent text-white text-sm font-black text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        step={i.unitType === 'kg' ? '0.001' : '1'}
                                    />
                                    <button onClick={() => updateQty(i.tempId, 1)} className="text-gray-600 hover:text-white transition-colors p-1.5"><Plus size={14} /></button>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    {editingTotalId === i.tempId ? (
                                        <div className="flex items-center gap-1 animate-fade-up">
                                            <input 
                                                type="number" 
                                                value={tempValue} 
                                                onChange={e => setTempValue(e.target.value)} 
                                                onBlur={() => handleSaveEdit(i.tempId)} 
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(i.tempId)} 
                                                className="w-24 bg-gray-950 border border-green-500 text-white text-xs px-2 py-1.5 rounded-xl text-center font-black" 
                                                autoFocus 
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                          onClick={() => handleStartEditTotalAmount(i)}
                                          className={`flex flex-col items-end group/total ${i.unitType === 'kg' ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                              {i.unitType === 'kg' && <Calculator size={10} className="text-[#FA8072] opacity-0 group-hover/total:opacity-60 transition-opacity" />}
                                              <span className="text-[#FA8072] font-black text-lg tabular-nums tracking-tight">{(i.price * i.quantity).toLocaleString('en-US')} <small className="text-[10px] font-bold opacity-60">ل.س</small></span>
                                            </div>
                                            <span className="text-[8px] text-gray-700 font-black uppercase tracking-wider">الإجمالي</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Footer */}
            <div className="p-8 bg-gray-900/90 border-t border-gray-700 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-600 font-black text-[9px] uppercase tracking-[0.3em]">Total Value</span>
                    <div className="text-right">
                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{total.toLocaleString('en-US')}</span>
                        <span className="text-[10px] text-gray-600 font-bold mr-2 uppercase">SYP</span>
                    </div>
                </div>
                <button 
                  onClick={handleCheckout} 
                  disabled={isCheckoutDisabled} 
                  className={`w-full py-5 rounded-[2rem] font-black text-base flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl ${!isCheckoutDisabled ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-900/30' : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-40'}`}
                >
                  <CheckCircle size={22} /> تأكيد وحفظ الفاتورة
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
