
import React, { useState, useMemo, Suspense } from 'react';
import { Plus, Trash2, X, ShoppingCart, Folder, FileText, CheckCircle, Clock, Download, Printer, UserPlus, ArrowRight, CalendarDays, TrendingDown, Search, Phone, FileSignature, Wallet } from 'lucide-react';
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
  onDeleteSupplier
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  
  // -- New Invoice State --
  const [supplierName, setSupplierName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid'); 
  const [itemInputs, setItemInputs] = useState({ name: '', quantity: '', cost: '' });
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);

  // -- Supplier Form State (Exclusive to Suppliers Tab) --
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupNotes, setNewSupNotes] = useState('');

  // -- Archive Step State (Matches Sales Archive) --
  const [navStep, setNavStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState('');

  const [invoiceToPrint, setInvoiceToPrint] = useState<PurchaseInvoice | null>(null);

  // --- Archive Logic ---
  const allInvoices = useMemo(() => {
    let all = [...currentPurchases];
    archivedHistory.forEach(day => { if (day.purchaseInvoices) all = [...all, ...day.purchaseInvoices]; });
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [currentPurchases, archivedHistory]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>(allInvoices.map(inv => new Date(inv.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [allInvoices]);

  const months = useMemo(() => {
    if (!selectedYear) return [];
    const uniqueMonths = new Set<number>(
        allInvoices
        .filter(inv => new Date(inv.timestamp).getFullYear().toString() === selectedYear)
        .map(inv => new Date(inv.timestamp).getMonth())
    );
    return Array.from(uniqueMonths).sort((a, b) => b - a);
  }, [allInvoices, selectedYear]);

  const filteredInvoices = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    return allInvoices.filter(inv => {
        const d = new Date(inv.timestamp);
        return d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [allInvoices, selectedYear, selectedMonth]);

  const getMonthName = (m: number) => new Date(2000, m).toLocaleString('ar-SY', { month: 'long' });

  // --- Search Logic ---
  const searchResults = useMemo(() => {
    if (!searchTerm) return null;
    const lower = searchTerm.toLowerCase();
    return allInvoices.filter(i => 
        i.supplierName.toLowerCase().includes(lower) || 
        i.items.some(it => it.name.toLowerCase().includes(lower))
    );
  }, [allInvoices, searchTerm]);

  // --- Handlers ---
  const handleSaveInvoice = () => {
      if (!supplierName || currentInvoiceItems.length === 0) {
          alert('يرجى اختيار مورد وإضافة مادة واحدة على الأقل.');
          return;
      }
      const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      onAddInvoice({
          id: Date.now().toString(),
          supplierName,
          date: new Date().toLocaleDateString('en-GB'),
          timestamp: Date.now(),
          items: currentInvoiceItems,
          totalAmount,
          paymentStatus
      });
      setSupplierName('');
      setCurrentInvoiceItems([]);
      alert('تم حفظ الفاتورة بنجاح.');
  };

  const addItem = () => {
      if (!itemInputs.name || !itemInputs.quantity || !itemInputs.cost) return;
      const q = parseFloat(itemInputs.quantity);
      const c = parseFloat(itemInputs.cost);
      setCurrentInvoiceItems(prev => [...prev, { id: Date.now().toString(), name: itemInputs.name, quantity: q, cost: c, total: q * c }]);
      setItemInputs({ name: '', quantity: '', cost: '' });
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart size={20} className="text-[#FA8072]" />
            <h3 className="font-bold text-lg">إدارة المشتريات والموردين</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-700/20">
            <button onClick={() => {setActiveTab('new'); setSearchTerm('');}} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'new' ? 'bg-[#FA8072] text-white shadow-inner' : 'text-gray-400 hover:bg-gray-700'}`}><Plus size={16} /> فاتورة شراء</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-[#FA8072] text-white shadow-inner' : 'text-gray-400 hover:bg-gray-700'}`}><Folder size={16} /> أرشيف المشتريات</button>
            <button onClick={() => {setActiveTab('suppliers'); setSearchTerm('');}} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'suppliers' ? 'bg-[#FA8072] text-white shadow-inner' : 'text-gray-400 hover:bg-gray-700'}`}><UserPlus size={16} /> الموردين</button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-900/30">
          
          {/* TAB 1: NEW INVOICE */}
          {activeTab === 'new' && (
              <div className="space-y-4 animate-fade-up">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex-grow">
                        <label className="text-xs text-gray-500 font-bold mb-2 block text-right">المورد</label>
                        <select 
                            value={supplierName} 
                            onChange={e => setSupplierName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FA8072]"
                        >
                            <option value="">-- اختر مورد --</option>
                            {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>)}
                        </select>
                        <p className="text-[10px] text-gray-500 mt-2">* لإضافة مورد جديد، انتقل لتبويب "الموردين".</p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 min-w-[200px]">
                        <label className="text-xs text-gray-500 font-bold mb-2 block text-right">طريقة الدفع</label>
                        <div className="flex bg-gray-900 p-1 rounded-lg">
                            <button 
                                onClick={() => setPaymentStatus('paid')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                            >نقدي</button>
                            <button 
                                onClick={() => setPaymentStatus('credit')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${paymentStatus === 'credit' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
                            >آجل</button>
                        </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-2">
                      <input type="text" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="اسم المادة..." className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                      <input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="الكمية" className="w-24 bg-gray-900 border border-gray-600 rounded-lg px-2 text-center text-white text-sm" />
                      <input type="number" value={itemInputs.cost} onChange={e => setItemInputs({...itemInputs, cost: e.target.value})} placeholder="السعر" className="w-24 bg-gray-900 border border-gray-600 rounded-lg px-2 text-center text-white text-sm" />
                      <button onClick={addItem} className="bg-red-600 text-white p-2 rounded-lg"><Plus size={20} /></button>
                  </div>

                  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden min-h-[150px]">
                      <table className="w-full text-sm text-right">
                          <thead className="bg-gray-900 text-gray-400 text-xs"><tr><th className="p-3">المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3">السعر</th><th className="p-3">الإجمالي</th><th className="p-3"></th></tr></thead>
                          <tbody className="divide-y divide-gray-700">
                              {currentInvoiceItems.map(item => (
                                  <tr key={item.id}><td className="p-3 text-white">{item.name}</td><td className="p-3 text-center">{item.quantity}</td><td className="p-3">{item.cost.toLocaleString()}</td><td className="p-3 font-bold text-red-400">{item.total.toLocaleString()}</td><td className="p-3 text-left"><button onClick={() => setCurrentInvoiceItems(s => s.filter(i => i.id !== item.id))} className="text-gray-500 hover:text-red-500"><Trash2 size={14} /></button></td></tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-xl font-bold text-red-400">{currentInvoiceItems.reduce((s,i) => s+i.total, 0).toLocaleString()} <span className="text-xs text-gray-500">ل.س</span></div>
                      <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><FileText size={18} /> حفظ الفاتورة</button>
                  </div>
              </div>
          )}

          {/* TAB 2: ARCHIVE (Year -> Month -> Invoices) */}
          {activeTab === 'history' && (
              <div className="space-y-4 animate-fade-up">
                  {/* Search Bar */}
                  <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث في المشتريات (مورد أو مادة)..." className="w-full bg-gray-800 border border-gray-700 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white outline-none focus:border-[#FA8072]" /></div>
                  
                  {searchTerm ? (
                       <div className="space-y-3">
                        {searchResults?.map(inv => (
                            <div key={inv.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-white block">{inv.supplierName}</span>
                                    <span className="text-[10px] text-gray-500">{inv.date} - {inv.paymentStatus === 'paid' ? 'نقدي' : 'آجل'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-400">{inv.totalAmount.toLocaleString()}</span>
                                    <button onClick={() => setInvoiceToPrint(inv)} className="bg-gray-700 text-white p-2 rounded-lg hover:bg-[#FA8072] transition-colors"><Printer size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                  ) : (
                    <>
                         <div className="flex items-center gap-2 mb-2">
                            {navStep !== 'years' && (
                                <button onClick={() => setNavStep(navStep === 'days' ? 'months' : 'years')} className="p-1.5 bg-gray-700 rounded-lg text-white hover:bg-[#FA8072] transition-colors">
                                    <ArrowRight size={18} />
                                </button>
                            )}
                            <h4 className="text-white font-bold text-sm">
                                {navStep === 'years' && 'أرشيف السنوات'}
                                {navStep === 'months' && `سنة ${selectedYear} - المشتريات`}
                                {navStep === 'days' && `فواتير ${getMonthName(selectedMonth)} ${selectedYear}`}
                            </h4>
                        </div>

                        {navStep === 'years' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {years.length === 0 ? <p className="col-span-full text-center py-10 text-gray-500">لا يوجد بيانات مشتريات مؤرشفة.</p> :
                                years.map(y => (
                                    <button key={y} onClick={() => { setSelectedYear(y); setNavStep('months'); }} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-[#FA8072] flex flex-col items-center gap-2 transition-all">
                                        <Folder size={32} className="text-[#FA8072]" />
                                        <span className="font-bold text-lg text-white">{y}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {navStep === 'months' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {months.map(m => (
                                    <button key={m} onClick={() => { setSelectedMonth(m); setNavStep('days'); }} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-[#FA8072] flex flex-col items-center gap-2 transition-all">
                                        <CalendarDays size={32} className="text-blue-400" />
                                        <span className="font-bold text-lg text-white">{getMonthName(m)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {navStep === 'days' && (
                            <div className="space-y-3">
                                {filteredInvoices.map(inv => (
                                    <div key={inv.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center justify-between group">
                                        <div>
                                            <span className="font-bold text-white block">{inv.supplierName}</span>
                                            <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                                                <span>{inv.date}</span>
                                                <span className={`px-1.5 rounded ${inv.paymentStatus === 'paid' ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>
                                                    {inv.paymentStatus === 'paid' ? 'مدفوعة' : 'آجل'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                             <div className="font-bold text-red-400 text-lg">{inv.totalAmount.toLocaleString()}</div>
                                             <button onClick={() => setInvoiceToPrint(inv)} className="bg-gray-700 hover:bg-[#FA8072] text-white p-2 rounded-lg transition-all shadow"><Printer size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                  )}
              </div>
          )}

          {/* TAB 3: SUPPLIERS MANAGEMENT */}
          {activeTab === 'suppliers' && (
              <div className="space-y-6 animate-fade-up">
                  <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4">
                      <h4 className="text-[#FA8072] font-bold text-sm flex items-center gap-2"><UserPlus size={18} /> إضافة مورد جديد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold pr-1">اسم المورد</label>
                              <input type="text" value={newSupName} onChange={e => setNewSupName(e.target.value)} placeholder="اسم الشركة أو المورد..." className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#FA8072]" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold pr-1">رقم الهاتف (اختياري)</label>
                              <div className="relative">
                                <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input type="text" value={newSupPhone} onChange={e => setNewSupPhone(e.target.value)} placeholder="09xxxxxx" className="w-full bg-gray-900 border border-gray-600 rounded-lg pr-10 pl-3 py-2.5 text-white text-sm dir-ltr text-right outline-none focus:border-[#FA8072]" />
                              </div>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold pr-1">ملاحظات (اختياري)</label>
                          <textarea value={newSupNotes} onChange={e => setNewSupNotes(e.target.value)} placeholder="تفاصيل إضافية..." rows={2} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FA8072]"></textarea>
                      </div>
                      <button onClick={() => {
                          if (!newSupName) return;
                          onAddSupplier?.({ name: newSupName, phone: newSupPhone, notes: newSupNotes });
                          setNewSupName(''); setNewSupPhone(''); setNewSupNotes('');
                          alert('تم إضافة المورد للقائمة.');
                      }} className="w-full bg-[#FA8072] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#e67365] transition-all"><CheckCircle size={18} /> حفظ المورد</button>
                  </div>

                  <div className="space-y-2">
                      <h4 className="text-xs text-gray-500 font-bold px-1 mb-2">الموردين المسجلين ({suppliers.length})</h4>
                      <div className="grid gap-2">
                          {suppliers.map(s => (
                              <div key={s.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-start">
                                  <div>
                                      <span className="text-white font-bold block">{s.name}</span>
                                      {s.phone && <span className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-mono"><Phone size={10} /> {s.phone}</span>}
                                      {s.notes && <p className="text-[10px] text-gray-500 italic mt-1 max-w-[300px]">{s.notes}</p>}
                                  </div>
                                  <button onClick={() => onDeleteSupplier?.(s.id)} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
    {invoiceToPrint && <Suspense fallback={null}><PurchasePrintModal invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} /></Suspense>}
    </>
  );
};
