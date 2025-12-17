
import React, { useState, useMemo, Suspense } from 'react';
import { Plus, Trash2, X, ShoppingCart, UserPlus, Printer, FileText, Store } from 'lucide-react';
import { PurchaseInvoice, PurchaseItem, ArchivedDay, PaymentStatus, Supplier } from '../types';

const PurchasePrintModal = React.lazy(() => import('./PurchasePrintModal').then(module => ({ default: module.PurchasePrintModal })));

interface ExpensesModalProps {
  currentPurchases: PurchaseInvoice[];
  archivedHistory: ArchivedDay[]; 
  onAddInvoice: (invoice: PurchaseInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onDeleteSupplier: (id: string) => void;
}

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ 
  currentPurchases, archivedHistory, onAddInvoice, onDeleteInvoice, isOpen, onClose, suppliers = [], onAddSupplier, onDeleteSupplier
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'suppliers'>('new');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid'); 
  const [itemInputs, setItemInputs] = useState({ name: '', quantity: '', unitPrice: '' });
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<PurchaseInvoice | null>(null);
  const [newSup, setNewSup] = useState({ name: '', phone: '' });

  const addItem = () => {
      if (!itemInputs.name || !itemInputs.quantity || !itemInputs.unitPrice) return;
      const q = parseFloat(itemInputs.quantity); 
      const price = parseFloat(itemInputs.unitPrice);
      setCurrentInvoiceItems(prev => [...prev, { id: Date.now().toString(), name: itemInputs.name, quantity: q, cost: price, total: q * price }]);
      setItemInputs({ name: '', quantity: '', unitPrice: '' });
  };

  const handleSaveInvoice = () => {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (!supplier || currentInvoiceItems.length === 0) return alert('يرجى تحديد مورد وإضافة مواد للفاتورة');
      
      const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      onAddInvoice({ 
          id: Date.now().toString(), 
          supplierName: supplier.name, 
          date: new Date().toLocaleDateString('ar-SY'), 
          timestamp: Date.now(), 
          items: currentInvoiceItems, 
          totalAmount, 
          paymentStatus 
      });
      setSelectedSupplierId(''); 
      setCurrentInvoiceItems([]); 
      setActiveTab('history');
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col h-[85vh]">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-white"><ShoppingCart size={20} className="text-[#FA8072]" /><h3 className="font-bold text-lg">إدارة المشتريات</h3></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-700/20">
            <button onClick={() => setActiveTab('new')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'new' ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>فاتورة جديدة</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'history' ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>أرشيف المشتريات</button>
            <button onClick={() => setActiveTab('suppliers')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'suppliers' ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الموردين</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'new' ? (
              <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase pr-1">تحديد المورد:</label>
                        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-white text-sm outline-none transition-all ${!selectedSupplierId && suppliers.length > 0 ? 'border-orange-500 animate-pulse' : 'border-gray-600'}`}>
                            <option value="">اختر مورد...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {suppliers.length === 0 && <p className="text-orange-400 text-[10px] mt-1 font-bold">يرجى إضافة مورد من تبويب الموردين أولاً</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase pr-1">حالة الدفع:</label>
                        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-600">
                            <button onClick={() => setPaymentStatus('paid')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>نقدي</button>
                            <button onClick={() => setPaymentStatus('credit')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${paymentStatus === 'credit' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>آجل</button>
                        </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input type="text" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="المادة المشتراة" className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                          <input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="الكمية" className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm text-center" />
                          <input type="number" value={itemInputs.unitPrice} onChange={e => setItemInputs({...itemInputs, unitPrice: e.target.value})} placeholder="سعر التكلفة" className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-[#FA8072] text-sm text-center" />
                      </div>
                      <button onClick={addItem} className="w-full bg-gray-700 hover:bg-[#FA8072] text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"><Plus size={16}/> إضافة بند للفاتورة</button>
                  </div>

                  <div className="bg-gray-900/20 border border-gray-700 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-right">
                          <thead className="bg-gray-800 text-gray-500">
                              <tr><th className="p-2">الصنف</th><th className="p-2 text-center">الكمية</th><th className="p-2">الإجمالي</th><th className="p-2 w-8"></th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                              {currentInvoiceItems.map(item => (
                                  <tr key={item.id}><td className="p-2 text-white">{item.name}</td><td className="p-2 text-center text-gray-400">{item.quantity}</td><td className="p-2 text-[#FA8072] font-bold">{item.total.toLocaleString()}</td><td className="p-2"><button onClick={() => setCurrentInvoiceItems(s => s.filter(i => i.id !== item.id))} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button></td></tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="text-xl font-bold text-red-400">{currentInvoiceItems.reduce((s,i) => s + i.total, 0).toLocaleString()} <span className="text-xs text-gray-500">ل.س</span></div>
                      <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-500 transition-colors"><FileText size={18} /> حفظ الفاتورة</button>
                  </div>
              </div>
          ) : activeTab === 'suppliers' ? (
              <div className="space-y-6">
                  <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700 space-y-3">
                      <h4 className="text-white font-bold text-sm">إضافة مورد جديد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input type="text" value={newSup.name} onChange={e => setNewSup({...newSup, name: e.target.value})} placeholder="اسم المورد أو الشركة" className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                          <input type="text" value={newSup.phone} onChange={e => setNewSup({...newSup, phone: e.target.value})} placeholder="رقم الهاتف" className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm dir-ltr text-right" />
                      </div>
                      <button onClick={() => { if(!newSup.name) return; onAddSupplier(newSup); setNewSup({name:'', phone:''}); }} className="w-full bg-[#FA8072] text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><UserPlus size={16}/> إضافة مورد</button>
                  </div>

                  <div className="space-y-2">
                      <h4 className="text-gray-400 font-bold text-xs uppercase tracking-widest">الموردين المسجلين ({suppliers.length})</h4>
                      {suppliers.map(s => (
                          <div key={s.id} className="bg-gray-700/50 p-3 rounded-xl border border-gray-600 flex justify-between items-center group hover:border-[#FA8072]/50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="bg-gray-800 p-2 rounded-lg text-[#FA8072]"><Store size={18} /></div>
                                  <div><span className="text-white font-bold text-sm block">{s.name}</span><span className="text-[10px] text-gray-500">{s.phone || 'لا يوجد هاتف'}</span></div>
                              </div>
                              <button onClick={() => onDeleteSupplier(s.id)} className="text-gray-500 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                          </div>
                      ))}
                      {suppliers.length === 0 && <p className="text-center py-4 text-gray-600 text-xs italic">لا يوجد موردين مضافين</p>}
                  </div>
              </div>
          ) : (
              <div className="space-y-3">
                  {[...currentPurchases, ...archivedHistory.flatMap(h => h.purchaseInvoices || [])].sort((a,b) => b.timestamp - a.timestamp).map(inv => (
                      <div key={inv.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:border-blue-500/30 transition-colors group">
                          <div className="flex items-center gap-3">
                             <div className="bg-gray-900 p-2 rounded-lg text-red-400 group-hover:scale-110 transition-transform"><ShoppingCart size={18} /></div>
                             <div>
                                <span className="font-bold text-white block">{inv.supplierName}</span>
                                <span className="text-[10px] text-gray-500 font-mono uppercase">{inv.date}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="font-bold text-red-400">{inv.totalAmount.toLocaleString()}</span>
                              <button onClick={() => setInvoiceToPrint(inv)} className="p-2 bg-gray-700 rounded-lg text-white hover:bg-blue-600 transition-colors"><Printer size={16}/></button>
                              <button onClick={() => onDeleteInvoice(inv.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
                  {currentPurchases.length === 0 && archivedHistory.length === 0 && <p className="text-center py-10 text-gray-600 text-sm italic">لا توجد مبيعات مؤرشفة</p>}
              </div>
          )}
        </div>
      </div>
    </div>
    {invoiceToPrint && <Suspense fallback={null}><PurchasePrintModal invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} /></Suspense>}
    </>
  );
};
