
import React, { useState, useMemo, Suspense } from 'react';
import { Plus, Trash2, X, ShoppingCart, Folder, FileText, CheckCircle, Clock, Download, Printer, UserPlus, ArrowRight, CalendarDays, TrendingDown, Search, Phone, FileSignature, Wallet, Edit3, Save } from 'lucide-react';
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
  onAddSupplier?: (supplier: Omit<Supplier, 'id'>) => void;
  onDeleteSupplier?: (id: string) => void;
}

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ 
  currentPurchases, 
  archivedHistory,
  onAddInvoice, 
  onDeleteInvoice,
  isOpen,
  onClose,
  suppliers = [],
  onAddSupplier,
  onDeleteSupplier
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'suppliers'>('new');
  const [supplierName, setSupplierName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid'); 
  const [itemInputs, setItemInputs] = useState({ name: '', quantity: '', unitPrice: '' });
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<PurchaseInvoice | null>(null);

  const addItem = () => {
      if (!itemInputs.name || !itemInputs.quantity || !itemInputs.unitPrice) return;
      const q = parseFloat(itemInputs.quantity); 
      const price = parseFloat(itemInputs.unitPrice);
      const newItem = { 
          id: Date.now().toString(), 
          name: itemInputs.name, 
          quantity: q, 
          cost: price, 
          total: q * price 
      };
      setCurrentInvoiceItems(prev => [...prev, newItem]);
      setItemInputs({ name: '', quantity: '', unitPrice: '' });
  };

  const handleSaveInvoice = () => {
      if (!supplierName || currentInvoiceItems.length === 0) return alert('يرجى اختيار مورد وإضافة مواد');
      const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      onAddInvoice({ 
          id: Date.now().toString(), 
          supplierName, 
          date: new Date().toLocaleDateString('ar-SY'), 
          timestamp: Date.now(), 
          items: currentInvoiceItems, 
          totalAmount, 
          paymentStatus 
      });
      setSupplierName(''); 
      setCurrentInvoiceItems([]); 
      alert('تم حفظ فاتورة المشتريات');
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col h-[85vh]">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-white"><ShoppingCart size={20} className="text-[#FA8072]" /><h3 className="font-bold text-lg">المشتريات</h3></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-700/20">
            <button onClick={() => setActiveTab('new')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'new' ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>فاتورة جديدة</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'history' ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>سجل الفواتير</button>
            <button onClick={() => setActiveTab('suppliers')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'suppliers' ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الموردين</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'new' ? (
              <div className="space-y-4 animate-fade-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">المورد:</label>
                        <select value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none"><option value="">اختر مورد</option>{suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">طريقة الدفع:</label>
                        <div className="flex bg-gray-900 p-1 rounded-lg"><button onClick={() => setPaymentStatus('paid')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>نقدي</button><button onClick={() => setPaymentStatus('credit')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${paymentStatus === 'credit' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>آجل</button></div>
                    </div>
                  </div>

                  <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold">اسم الصنف:</label>
                              <input type="text" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="مثلاً: طحين" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold">العدد / الكمية:</label>
                              <input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="0" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm text-center font-bold" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold">سعر الوحدة:</label>
                              <input type="number" value={itemInputs.unitPrice} onChange={e => setItemInputs({...itemInputs, unitPrice: e.target.value})} placeholder="0" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-[#FA8072] text-sm text-center font-bold" />
                          </div>
                      </div>
                      <button onClick={addItem} className="w-full bg-gray-700 hover:bg-[#FA8072] text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"><Plus size={16}/> إضافة مادة للفاتورة</button>
                  </div>

                  <div className="bg-gray-900/20 border border-gray-700 rounded-xl overflow-hidden min-h-[150px]">
                      <table className="w-full text-xs text-right">
                          <thead className="bg-gray-800 text-gray-500">
                              <tr>
                                  <th className="p-2">الصنف</th>
                                  <th className="p-2 text-center">الكمية</th>
                                  <th className="p-2">سعر الوحدة</th>
                                  <th className="p-2">الإجمالي</th>
                                  <th className="p-2 w-8"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                              {currentInvoiceItems.map(item => (
                                  <tr key={item.id}>
                                      <td className="p-2 text-white font-bold">{item.name}</td>
                                      <td className="p-2 text-center text-gray-400">{item.quantity}</td>
                                      <td className="p-2 text-gray-400">{item.cost.toLocaleString()}</td>
                                      <td className="p-2 text-red-400 font-bold">{item.total.toLocaleString()}</td>
                                      <td className="p-2"><button onClick={() => setCurrentInvoiceItems(s => s.filter(i => i.id !== item.id))} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <div className="text-xl font-bold text-red-400">
                          <span className="text-xs text-gray-500 ml-2">المجموع:</span>
                          {currentInvoiceItems.reduce((s,i) => s + i.total, 0).toLocaleString()} ل.س
                      </div>
                      <button onClick={handleSaveInvoice} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><FileText size={18} /> حفظ الفاتورة</button>
                  </div>
              </div>
          ) : activeTab === 'history' ? (
              <div className="space-y-4">
                  {currentPurchases.concat(archivedHistory.flatMap(h => h.purchaseInvoices || [])).sort((a,b) => b.timestamp - a.timestamp).map(inv => (
                      <div key={inv.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-[#FA8072] transition-colors">
                          <div>
                              <span className="font-bold text-white block">{inv.supplierName}</span>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-500 font-mono">{inv.date}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${inv.paymentStatus === 'paid' ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>{inv.paymentStatus === 'paid' ? 'كاش' : 'دين'}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="font-bold text-red-400">{inv.totalAmount.toLocaleString()}</span>
                              <button onClick={() => setInvoiceToPrint(inv)} className="p-2 bg-gray-700 rounded-lg text-white hover:bg-[#FA8072] transition-colors"><Printer size={16}/></button>
                              <button onClick={() => onDeleteInvoice(inv.id)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="text-center py-10 text-gray-500">قسم إدارة الموردين متاح تحت قائمة الفرز.</div>
          )}
        </div>
      </div>
    </div>
    {invoiceToPrint && <Suspense fallback={null}><PurchasePrintModal invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} /></Suspense>}
    </>
  );
};
