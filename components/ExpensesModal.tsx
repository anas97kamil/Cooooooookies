
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
  onUpdatePurchase?: (date: string, purchaseId: string, updatedInvoice: PurchaseInvoice) => void;
}

type Tab = 'new' | 'history' | 'suppliers';
type NavStep = 'years' | 'months' | 'days';

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ 
  currentPurchases, 
  archivedHistory,
  onAddInvoice, 
  onDeleteInvoice,
  isOpen,
  onClose,
  suppliers = [],
  onAddSupplier,
  onDeleteSupplier,
  onUpdatePurchase
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [supplierName, setSupplierName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid'); 
  const [itemInputs, setItemInputs] = useState({ name: '', quantity: '', cost: '' });
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);

  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupNotes, setNewSupNotes] = useState('');

  const [navStep, setNavStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState('');

  const [invoiceToPrint, setInvoiceToPrint] = useState<PurchaseInvoice | null>(null);

  // FIX: Collect all unique invoices by ID to prevent duplication between current purchases and history
  const allInvoices = useMemo(() => {
    const invoiceMap = new Map<string, PurchaseInvoice>();
    
    // First, add archived invoices
    archivedHistory.forEach(day => {
      day.purchaseInvoices?.forEach(inv => {
        invoiceMap.set(inv.id, inv);
      });
    });

    // Then, add/overwrite with current day's purchases to ensure latest data
    currentPurchases.forEach(inv => {
      invoiceMap.set(inv.id, inv);
    });

    return Array.from(invoiceMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [currentPurchases, archivedHistory]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>(allInvoices.map(inv => new Date(inv.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [allInvoices]);

  const months = useMemo(() => {
    if (!selectedYear) return [];
    const uniqueMonths = new Set<number>(allInvoices.filter(inv => new Date(inv.timestamp).getFullYear().toString() === selectedYear).map(inv => new Date(inv.timestamp).getMonth()));
    return Array.from(uniqueMonths).sort((a, b) => b - a);
  }, [allInvoices, selectedYear]);

  const filteredInvoices = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    return allInvoices.filter(inv => { const d = new Date(inv.timestamp); return d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth; });
  }, [allInvoices, selectedYear, selectedMonth]);

  const getMonthName = (m: number) => new Date(2000, m).toLocaleString('ar-SY', { month: 'long' });

  const searchResults = useMemo(() => {
    if (!searchTerm) return null;
    const lower = searchTerm.toLowerCase();
    return allInvoices.filter(i => i.supplierName.toLowerCase().includes(lower) || i.items.some(it => it.name.toLowerCase().includes(lower)));
  }, [allInvoices, searchTerm]);

  const handleSaveInvoice = () => {
      if (!supplierName || currentInvoiceItems.length === 0) return alert('بيانات ناقصة');
      const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      onAddInvoice({ id: Date.now().toString(), supplierName, date: new Date().toLocaleDateString('en-GB'), timestamp: Date.now(), items: currentInvoiceItems, totalAmount, paymentStatus });
      setSupplierName(''); setCurrentInvoiceItems([]); alert('تم الحفظ.');
  };

  const handleUpdateArchived = () => {
      if (!editingInvoice || !onUpdatePurchase) return;
      const totalAmount = editingInvoice.items.reduce((sum, item) => sum + item.total, 0);
      onUpdatePurchase(editingInvoice.date, editingInvoice.id, { ...editingInvoice, totalAmount });
      setEditingInvoice(null); alert('تم تعديل الفاتورة.');
  };

  const addItem = (isEdit: boolean) => {
      if (!itemInputs.name || !itemInputs.quantity || !itemInputs.cost) return;
      const q = parseFloat(itemInputs.quantity); const c = parseFloat(itemInputs.cost);
      const newItem = { id: Date.now().toString(), name: itemInputs.name, quantity: q, cost: c, total: q * c };
      if (isEdit && editingInvoice) {
          setEditingInvoice({ ...editingInvoice, items: [...editingInvoice.items, newItem] });
      } else {
          setCurrentInvoiceItems(prev => [...prev, newItem]);
      }
      setItemInputs({ name: '', quantity: '', cost: '' });
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col h-[85vh]">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-white"><ShoppingCart size={20} className="text-[#FA8072]" /><h3 className="font-bold text-lg">المشتريات والموردين</h3></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-700/20">
            <button onClick={() => {setActiveTab('new'); setEditingInvoice(null);}} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'new' && !editingInvoice ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>جديدة</button>
            <button onClick={() => {setActiveTab('history'); setEditingInvoice(null);}} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'history' && !editingInvoice ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>سجل المشتريات</button>
            <button onClick={() => {setActiveTab('suppliers'); setEditingInvoice(null);}} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'suppliers' && !editingInvoice ? 'bg-[#FA8072] text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الموردين</button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-900/30">
          
          {editingInvoice ? (
              <div className="space-y-4 animate-fade-up">
                  <div className="flex justify-between items-center bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                      <h4 className="text-blue-400 font-bold flex items-center gap-2"><Edit3 size={18}/> تعديل الفاتورة: {editingInvoice.supplierName}</h4>
                      <button onClick={() => setEditingInvoice(null)} className="text-gray-400"><X size={18}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <select value={editingInvoice.supplierName} onChange={e => setEditingInvoice({...editingInvoice, supplierName: e.target.value})} className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none">
                        {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <div className="flex bg-gray-900 p-1 rounded-lg">
                        <button onClick={() => setEditingInvoice({...editingInvoice, paymentStatus: 'paid'})} className={`flex-1 py-1 text-xs rounded transition-colors ${editingInvoice.paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>نقدي</button>
                        <button onClick={() => setEditingInvoice({...editingInvoice, paymentStatus: 'credit'})} className={`flex-1 py-1 text-xs rounded transition-colors ${editingInvoice.paymentStatus === 'credit' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>آجل</button>
                      </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-2">
                      <input type="text" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="المادة" className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                      <input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="الكمية" className="w-20 bg-gray-900 border border-gray-600 rounded-lg text-center text-white text-sm" />
                      <input type="number" value={itemInputs.cost} onChange={e => setItemInputs({...itemInputs, cost: e.target.value})} placeholder="السعر" className="w-24 bg-gray-900 border border-gray-600 rounded-lg text-center text-white text-sm" />
                      <button onClick={() => addItem(true)} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={18} /></button>
                  </div>
                  <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 max-h-40 overflow-y-auto">
                      <table className="w-full text-sm text-right">
                          <tbody className="divide-y divide-gray-700">
                              {editingInvoice.items.map((item, idx) => (
                                  <tr key={item.id}><td className="p-2 text-white">{item.name}</td><td className="p-2 text-center text-gray-400">{item.quantity}</td><td className="p-2 font-bold text-red-400">{item.total.toLocaleString()}</td><td className="p-2 text-left"><button onClick={() => setEditingInvoice({...editingInvoice, items: editingInvoice.items.filter((_, i) => i !== idx)})} className="text-red-500"><Trash2 size={14} /></button></td></tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <button onClick={handleUpdateArchived} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={20}/> حفظ التغييرات</button>
              </div>
          ) : activeTab === 'new' ? (
              <div className="space-y-4 animate-fade-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700"><label className="text-[10px] text-gray-500 font-bold block mb-1">المورد</label><select value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none"><option value="">اختر مورد</option>{suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700"><label className="text-[10px] text-gray-500 font-bold block mb-1">الدفع</label><div className="flex bg-gray-900 p-1 rounded-lg"><button onClick={() => setPaymentStatus('paid')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>نقدي</button><button onClick={() => setPaymentStatus('credit')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${paymentStatus === 'credit' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>آجل</button></div></div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-2"><input type="text" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="المادة" className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /><input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="الكمية" className="w-20 bg-gray-900 border border-gray-600 rounded-lg text-center text-white text-sm" /><input type="number" value={itemInputs.cost} onChange={e => setItemInputs({...itemInputs, cost: e.target.value})} placeholder="السعر" className="w-24 bg-gray-900 border border-gray-600 rounded-lg text-center text-white text-sm" /><button onClick={() => addItem(false)} className="bg-red-600 text-white p-2 rounded-lg"><Plus size={18} /></button></div>
                  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden min-h-[100px]"><table className="w-full text-sm text-right"><tbody className="divide-y divide-gray-700">{currentInvoiceItems.map(item => (<tr key={item.id}><td className="p-2 text-white">{item.name}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 font-bold text-red-400">{item.total.toLocaleString()}</td><td className="p-2 text-left"><button onClick={() => setCurrentInvoiceItems(s => s.filter(i => i.id !== item.id))} className="text-gray-500 hover:text-red-500"><Trash2 size={14} /></button></td></tr>))}</tbody></table></div>
                  <div className="flex items-center justify-between"><div className="text-xl font-bold text-red-400">{currentInvoiceItems.reduce((s,i) => s+i.total, 0).toLocaleString()}</div><button onClick={handleSaveInvoice} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><FileText size={18} /> حفظ</button></div>
              </div>
          ) : activeTab === 'history' ? (
              <div className="space-y-4 animate-fade-up">
                  <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث..." className="w-full bg-gray-800 border border-gray-700 rounded-xl pr-10 pl-4 py-2 text-white text-sm outline-none" /></div>
                  {searchTerm ? (
                      <div className="space-y-2">{searchResults?.map(inv => (<div key={inv.id} className="bg-gray-800 rounded-xl border border-gray-700 p-3 flex items-center justify-between"><div><span className="font-bold text-white block text-sm">{inv.supplierName}</span><span className="text-[10px] text-gray-500">{inv.date}</span></div><div className="flex gap-2"><button onClick={() => setEditingInvoice(inv)} className="bg-blue-600/20 text-blue-400 p-2 rounded-lg"><Edit3 size={16}/></button><button onClick={() => setInvoiceToPrint(inv)} className="bg-gray-700 text-white p-2 rounded-lg"><Printer size={16}/></button></div></div>))}</div>
                  ) : (
                    <>
                        <div className="flex items-center gap-2 mb-2">{navStep !== 'years' && (<button onClick={() => setNavStep(navStep === 'days' ? 'months' : 'years')} className="p-1.5 bg-gray-700 rounded-lg text-white hover:bg-[#FA8072] transition-colors"><ArrowRight size={14} /></button>)}<h4 className="text-white font-bold text-xs">{navStep === 'years' ? 'أرشيف السنوات' : navStep === 'months' ? selectedYear : getMonthName(selectedMonth)}</h4></div>
                        {navStep === 'years' && (<div className="grid grid-cols-2 md:grid-cols-3 gap-3">{years.map(y => (<button key={y} onClick={() => { setSelectedYear(y); setNavStep('months'); }} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-[#FA8072] flex flex-col items-center gap-2 transition-all"><Folder size={24} className="text-[#FA8072]" /><span className="font-bold text-sm text-white">{y}</span></button>))}</div>)}
                        {navStep === 'months' && (<div className="grid grid-cols-2 md:grid-cols-3 gap-3">{months.map(m => (<button key={m} onClick={() => { setSelectedMonth(m); setNavStep('days'); }} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-[#FA8072] flex flex-col items-center gap-2 transition-all"><CalendarDays size={24} className="text-blue-400" /><span className="font-bold text-sm text-white">{getMonthName(m)}</span></button>))}</div>)}
                        {navStep === 'days' && (<div className="space-y-2">{filteredInvoices.map(inv => (<div key={inv.id} className="bg-gray-800 rounded-xl border border-gray-700 p-3 flex items-center justify-between group"><div><span className="font-bold text-white block text-sm">{inv.supplierName}</span><span className="text-[9px] text-gray-500">{inv.date}</span></div><div className="flex items-center gap-2"><span className="font-bold text-red-400 text-sm">{inv.totalAmount.toLocaleString()}</span><button onClick={() => setEditingInvoice(inv)} className="bg-blue-600/20 text-blue-400 p-2 rounded-lg"><Edit3 size={14}/></button><button onClick={() => setInvoiceToPrint(inv)} className="bg-gray-700 hover:bg-[#FA8072] text-white p-2 rounded-lg transition-all"><Printer size={14} /></button></div></div>))}</div>)}
                    </>
                  )}
              </div>
          ) : (
              <div className="space-y-6 animate-fade-up">
                  <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4">
                      <h4 className="text-[#FA8072] font-bold text-sm">إضافة مورد</h4>
                      <input type="text" value={newSupName} onChange={e => setNewSupName(e.target.value)} placeholder="الاسم" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                      <input type="text" value={newSupPhone} onChange={e => setNewSupPhone(e.target.value)} placeholder="الهاتف" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm dir-ltr text-right outline-none" />
                      <button onClick={() => { if(!newSupName) return; onAddSupplier?.({ name: newSupName, phone: newSupPhone, notes: newSupNotes }); setNewSupName(''); setNewSupPhone(''); }} className="w-full bg-[#FA8072] text-white py-3 rounded-xl font-bold">حفظ المورد</button>
                  </div>
                  <div className="space-y-2">{suppliers.map(s => (<div key={s.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex justify-between items-center"><span className="text-white font-bold">{s.name}</span><button onClick={() => onDeleteSupplier?.(s.id)} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={16} /></button></div>))}</div>
              </div>
          )}
        </div>
      </div>
    </div>
    {invoiceToPrint && <Suspense fallback={null}><PurchasePrintModal invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} /></Suspense>}
    </>
  );
};
