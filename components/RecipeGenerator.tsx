import React, { useState } from 'react';
import { ShoppingCart, Settings, Edit3, Trash2, CheckCircle, Plus, Minus, Calculator, UserPen } from 'lucide-react';
import { SaleItem, Product, UnitType } from '../types';

interface POSInterfaceProps {
  onCompleteOrder: (items: Omit<SaleItem, 'id' | 'time' | 'customerNumber' | 'orderId'>[], customerName?: string) => void;
  products: Product[];
  onOpenProductManager: () => void;
}

// Internal type for the local cart
interface CartItem {
    tempId: string;
    name: string;
    price: number; // This is now the "Sold Price" (editable)
    quantity: number;
    unitType: UnitType;
    isCustom?: boolean;
}

export const POSInterface: React.FC<POSInterfaceProps> = ({ onCompleteOrder, products, onOpenProductManager }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer Name State
  const [customerName, setCustomerName] = useState('');
  
  // Custom item modal/inline state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customUnit, setCustomUnit] = useState<UnitType>('piece');

  // 1. Add Product to Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      // Find item with same name AND unit type.
      const existing = prev.find(item => item.name === product.name && item.unitType === product.unitType);
      
      if (existing) {
        return prev.map(item => 
          (item.tempId === existing.tempId) 
            ? { ...item, quantity: item.quantity + (item.unitType === 'kg' ? 1 : 1) } 
            : item
        );
      }
      return [...prev, { 
          tempId: Date.now().toString(), 
          name: product.name, 
          price: product.price, 
          quantity: 1, 
          unitType: product.unitType || 'piece' 
      }];
    });
  };

  // 2. Add Custom Item to Cart
  const addCustomToCart = () => {
    if (!customName || !customPrice) return;
    setCart(prev => [...prev, { 
        tempId: Date.now().toString(), 
        name: customName, 
        price: parseFloat(customPrice), 
        quantity: 1,
        unitType: customUnit,
        isCustom: true
    }]);
    setCustomName('');
    setCustomPrice('');
    setShowCustomInput(false);
  };

  // 3. Cart Management
  const updateQuantity = (tempId: string, change: number) => {
    setCart(prev => prev.map(item => {
        if (item.tempId === tempId) {
            const step = item.unitType === 'kg' ? 0.1 : 1;
            const newQty = Math.max(step, parseFloat((item.quantity + (change * step)).toFixed(2)));
            return { ...item, quantity: newQty };
        }
        return item;
    }));
  };

  const updateQuantityDirectly = (tempId: string, val: string) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) return;
      setCart(prev => prev.map(item => item.tempId === tempId ? { ...item, quantity: num } : item));
  };

  const updatePriceDirectly = (tempId: string, val: string) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) return;
      setCart(prev => prev.map(item => item.tempId === tempId ? { ...item, price: num } : item));
  };

  // NEW: Update Total Price directly -> Calculates Quantity
  const updateTotalDirectly = (tempId: string, val: string) => {
      const newTotal = parseFloat(val);
      if (isNaN(newTotal) || newTotal < 0) return;

      setCart(prev => prev.map(item => {
          if (item.tempId === tempId) {
              if (item.price === 0) return item; // Avoid division by zero
              
              // Reverse calculation: Quantity = Total / Unit Price
              const newQty = newTotal / item.price;
              
              // Use more precision for KG (3 decimals), less for pieces if needed (but keep decimals for math consistency)
              return { ...item, quantity: parseFloat(newQty.toFixed(3)) };
          }
          return item;
      }));
  };

  const removeFromCart = (tempId: string) => {
    setCart(prev => prev.filter(item => item.tempId !== tempId));
  };

  const clearCart = () => {
      setCart([]);
      setCustomerName('');
  };

  // 4. Finalize Order
  const handleCheckout = () => {
      if (cart.length === 0) return;
      
      const salesItems = cart.map(({ name, price, quantity, unitType }) => ({
          name,
          price,
          quantity,
          unitType
      }));

      onCompleteOrder(salesItems, customerName);
      clearCart();
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
      
      {/* LEFT SECTION: Product Grid (Menu) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
             <h2 className="font-bold text-white flex items-center gap-2">
                <Settings className="text-[#FA8072]" size={20} />
                قائمة المنتجات
             </h2>
             <button 
                onClick={onOpenProductManager}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
             >
                تعديل القائمة
             </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map(product => (
                <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-[#FA8072] text-white rounded-2xl transition-all shadow-sm active:scale-95 group h-32 relative"
                >
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${product.unitType === 'kg' ? 'bg-yellow-400 text-black' : 'bg-blue-300 text-black'}`}>
                        {product.unitType === 'kg' ? 'KG' : 'قطعة'}
                    </div>
                    
                    <span className="font-bold text-sm text-center mb-1 line-clamp-2 group-hover:text-[#FA8072] transition-colors">{product.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded-md">{product.price.toLocaleString()} ل.س</span>
                </button>
            ))}

            {/* Custom Item Button */}
            <button
                onClick={() => setShowCustomInput(true)}
                className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-dashed border-gray-600 hover:bg-gray-700 text-gray-400 rounded-2xl transition-all active:scale-95 h-32"
            >
                <Edit3 size={20} className="mb-2" />
                <span className="text-xs font-medium">مادة حرة</span>
            </button>
        </div>

        {/* Inline Custom Item Form */}
        {showCustomInput && (
            <div className="bg-gray-800 p-4 rounded-xl border border-[#FA8072] animate-fade-up">
                <h4 className="text-sm font-bold text-white mb-3">إضافة مادة غير مدرجة</h4>
                <div className="flex flex-col md:flex-row gap-2">
                    <input 
                        type="text" 
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder="اسم المادة"
                        className="flex-grow bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm outline-none focus:border-[#FA8072]"
                        autoFocus
                    />
                    
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600 w-fit">
                        <button
                            onClick={() => setCustomUnit('piece')}
                            className={`px-3 py-1 rounded text-xs ${customUnit === 'piece' ? 'bg-[#FA8072] text-white' : 'text-gray-400'}`}
                        >قطعة</button>
                        <button
                            onClick={() => setCustomUnit('kg')}
                            className={`px-3 py-1 rounded text-xs ${customUnit === 'kg' ? 'bg-[#FA8072] text-white' : 'text-gray-400'}`}
                        >كيلو</button>
                    </div>

                    <input 
                        type="number" 
                        value={customPrice}
                        onChange={e => setCustomPrice(e.target.value)}
                        placeholder="السعر"
                        className="w-24 bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm outline-none focus:border-[#FA8072]"
                    />
                    <button 
                        onClick={addCustomToCart}
                        className="bg-[#FA8072] text-white px-4 rounded-lg font-bold hover:bg-[#e67365] py-2"
                    >
                        إضافة
                    </button>
                    <button 
                        onClick={() => setShowCustomInput(false)}
                        className="bg-gray-700 text-gray-300 px-3 rounded-lg hover:bg-gray-600 py-2"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* RIGHT SECTION: Current Customer Bill (Cart) */}
      <div className="lg:col-span-1">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Cart Header */}
            <div className="bg-gray-900/80 p-4 border-b border-gray-700 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ShoppingCart size={20} className="text-[#FA8072]" />
                        زبون حالي
                    </h3>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 underline">
                            إلغاء الطلب
                        </button>
                    )}
                </div>

                {/* Customer Name Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <UserPen size={14} />
                    </div>
                    <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="اسم الزبون (اختياري)..."
                        className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg pr-9 pl-3 py-2 focus:border-[#FA8072] focus:ring-1 focus:ring-[#FA8072] outline-none transition-all placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-grow p-3 overflow-y-auto space-y-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <ShoppingCart size={48} className="mb-2" />
                        <p>اضغط على المنتجات لإضافتها</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.tempId} className="bg-gray-700/50 p-3 rounded-xl flex flex-col gap-2 border border-gray-700 relative group">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex flex-col">
                                    <span className="text-white font-medium text-sm">{item.name}</span>
                                    <span className={`text-[10px] w-fit px-1.5 rounded-md ${item.unitType === 'kg' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {item.unitType === 'kg' ? 'وزن (كيلو)' : 'عدد (قطعة)'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Inputs Container - Stacked Vertically */}
                            <div className="flex flex-col gap-2 mt-1 bg-gray-800/50 p-2 rounded-lg">
                                
                                {/* Row 1: Price Editor */}
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-[10px] text-gray-500 w-16">سعر الإفرادي:</label>
                                    <input 
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => updatePriceDirectly(item.tempId, e.target.value)}
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center focus:border-[#FA8072] outline-none"
                                    />
                                </div>

                                {/* Row 2: Quantity Editor (Below Price) */}
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-[10px] text-gray-500 w-16">الكمية:</label>
                                    <div className="flex items-center gap-1 flex-1">
                                        <button 
                                            onClick={() => updateQuantity(item.tempId, -1)}
                                            className="w-8 h-7 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input 
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantityDirectly(item.tempId, e.target.value)}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded px-1 py-1 text-sm text-white text-center focus:border-[#FA8072] outline-none h-7"
                                            step={item.unitType === 'kg' ? "0.1" : "1"}
                                        />
                                        <button 
                                            onClick={() => updateQuantity(item.tempId, 1)}
                                            className="w-8 h-7 flex items-center justify-center bg-[#FA8072] text-white rounded hover:bg-[#e67365]"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Row 3: Total Price Editor (New - Calculates Quantity) */}
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700/50 mt-1">
                                    <div className="flex items-center gap-1 w-16">
                                        <Calculator size={10} className="text-[#FA8072]" />
                                        <label className="text-[10px] text-[#FA8072] font-bold">الإجمالي:</label>
                                    </div>
                                    <input 
                                        type="number"
                                        // Display rounded total if integer, or 2 decimals
                                        value={Math.round(item.price * item.quantity * 100) / 100}
                                        onChange={(e) => updateTotalDirectly(item.tempId, e.target.value)}
                                        placeholder="المبلغ"
                                        className="flex-1 bg-gray-900 border border-[#FA8072]/50 rounded px-2 py-1 text-sm text-[#FA8072] font-bold text-center focus:border-[#FA8072] outline-none"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={() => removeFromCart(item.tempId)}
                                className="absolute -left-2 -top-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Footer (Total & Checkout) */}
            <div className="p-4 bg-gray-900 border-t border-gray-700 mt-auto">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">الإجمالي المطلوب:</span>
                    <span className="text-2xl font-bold text-white">{cartTotal.toLocaleString()} <span className="text-sm font-normal text-gray-500">ل.س</span></span>
                </div>
                
                <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className={`
                        w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                        ${cart.length > 0 
                            ? 'bg-green-600 hover:bg-green-500 text-white transform active:scale-95' 
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                    `}
                >
                    <CheckCircle size={24} />
                    <span>تأكيد البيع (موافق)</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};