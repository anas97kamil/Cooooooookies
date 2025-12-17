
import React, { useState } from 'react';
import { Plus, Trash2, Settings, X, Scale, Box, Edit2, Check, RotateCcw, Store } from 'lucide-react';
import { Product, UnitType } from '../types';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct,
  onDeleteProduct,
  isOpen,
  onClose
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('piece');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', wholesalePrice: '', costPrice: '', unitType: 'piece' as UnitType });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !costPrice || !wholesalePrice) return;

    onAddProduct({
      name,
      price: parseFloat(price),
      wholesalePrice: parseFloat(wholesalePrice),
      costPrice: parseFloat(costPrice),
      unitType
    });

    setName('');
    setPrice('');
    setWholesalePrice('');
    setCostPrice('');
    setUnitType('piece');
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({ 
      name: p.name, 
      price: p.price.toString(), 
      wholesalePrice: (p.wholesalePrice || p.price).toString(), 
      costPrice: p.costPrice.toString(), 
      unitType: p.unitType 
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    onUpdateProduct(editingId, {
      name: editForm.name,
      price: parseFloat(editForm.price),
      wholesalePrice: parseFloat(editForm.wholesalePrice),
      costPrice: parseFloat(editForm.costPrice),
      unitType: editForm.unitType
    });
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col max-h-[85vh]">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <Settings size={20} className="text-[#FA8072]" />
            <h3 className="font-bold text-lg">إدارة المواد (التسعير والتكلفة)</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!editingId && (
              <form onSubmit={handleSubmit} className="mb-6 bg-gray-700/30 p-4 rounded-xl border border-gray-600">
                <h4 className="text-sm font-bold text-gray-300 mb-3">إضافة مادة جديدة</h4>
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اسم المادة..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg outline-none text-sm"
                        required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold pr-1">التكلفة</label>
                            <input
                                type="number"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                placeholder="التكلفة"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-red-400 rounded-lg outline-none text-sm font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold pr-1">سعر المفرق</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="سعر المفرق"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-green-400 rounded-lg outline-none text-sm font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold pr-1">سعر الجملة</label>
                            <input
                                type="number"
                                value={wholesalePrice}
                                onChange={(e) => setWholesalePrice(e.target.value)}
                                placeholder="سعر الجملة"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-blue-400 rounded-lg outline-none text-sm font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600 shrink-0">
                            <button type="button" onClick={() => setUnitType('piece')} className={`px-3 py-1.5 rounded-md text-xs transition-colors ${unitType === 'piece' ? 'bg-[#FA8072] text-white font-bold' : 'text-gray-400'}`}>قطعة</button>
                            <button type="button" onClick={() => setUnitType('kg')} className={`px-3 py-1.5 rounded-md text-xs transition-colors ${unitType === 'kg' ? 'bg-[#FA8072] text-white font-bold' : 'text-gray-400'}`}>كيلو</button>
                        </div>
                        <button type="submit" className="flex-grow bg-[#FA8072] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg"><Plus size={18} /> إضافة</button>
                    </div>
                </div>
              </form>
          )}

          {editingId && (
              <div className="mb-6 bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 animate-fade-up">
                  <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2"><Edit2 size={16} /> تعديل بيانات: {editForm.name}</h4>
                  <div className="space-y-3">
                      <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 text-white p-2 rounded-lg text-sm" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-400">التكلفة</label>
                              <input type="number" value={editForm.costPrice} onChange={e => setEditForm({...editForm, costPrice: e.target.value})} className="w-full bg-gray-900 border border-gray-600 text-[#FA8072] p-2 rounded-lg font-bold" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-400">المفرق</label>
                              <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full bg-gray-900 border border-gray-600 text-green-400 p-2 rounded-lg font-bold" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-400">الجملة</label>
                              <input type="number" value={editForm.wholesalePrice} onChange={e => setEditForm({...editForm, wholesalePrice: e.target.value})} className="w-full bg-gray-900 border border-gray-600 text-blue-400 p-2 rounded-lg font-bold" />
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={handleUpdate} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Check size={18} /> حفظ التغييرات</button>
                          <button onClick={() => setEditingId(null)} className="px-4 bg-gray-700 text-gray-300 py-2 rounded-lg"><RotateCcw size={18} /></button>
                      </div>
                  </div>
              </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-400 mb-2">قائمة المنتجات ({products.length})</h4>
            <div className="grid gap-2">
                {products.map(product => (
                  <div key={product.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-xl border border-gray-600 group">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{product.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded text-black font-bold ${product.unitType === 'kg' ? 'bg-yellow-400' : 'bg-blue-300'}`}>{product.unitType === 'kg' ? 'كغ' : 'قطعة'}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex flex-col"><span className="text-[9px] text-gray-500 uppercase">التكلفة:</span><span className="text-red-400 text-xs font-bold">{product.costPrice.toLocaleString()}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-gray-500 uppercase">المفرق:</span><span className="text-green-400 text-xs font-bold">{product.price.toLocaleString()}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-gray-500 uppercase">الجملة:</span><span className="text-blue-400 text-xs font-bold">{(product.wholesalePrice || product.price).toLocaleString()}</span></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(product)} className="text-gray-400 hover:text-blue-400 p-2"><Edit2 size={18} /></button>
                        {confirmDeleteId === product.id ? (
                            <div className="flex items-center gap-1">
                                <button onClick={() => { onDeleteProduct(product.id); setConfirmDeleteId(null); }} className="bg-red-500 text-white px-2 py-1 rounded text-xs">تأكيد</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 text-xs">إلغاء</button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmDeleteId(product.id)} className="text-gray-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                        )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
