
import React, { useState, useMemo, Suspense } from 'react';
import { Plus, Trash2, X, ShoppingCart, UserPlus, Printer, FileText, Store, Folder, CalendarDays, ArrowRight, Zap, ChevronDown, ChevronUp, Edit3, RotateCcw } from 'lucide-react';
import { PurchaseInvoice, PurchaseItem, ArchivedDay, PaymentStatus, Supplier } from '../types';

const PurchasePrintModal = React.lazy(() => import('./PurchasePrintModal').then(module => ({ default: module.PurchasePrintModal })));

interface ExpensesModalProps {
  currentPurchases: PurchaseInvoice[];
  archivedHistory: ArchivedDay[]; 
  onAddInvoice: (invoice: PurchaseInvoice) => void;
  onUpdateInvoice: (invoice: PurchaseInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onDeleteSupplier: (id: string) => void;
}

type NavStep = 'years' | 'months' | 'days';

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ 
  currentPurchases, archivedHistory, onAddInvoice, onUpdateInvoice, onDeleteInvoice, isOpen, onClose, suppliers = [], onAddSupplier, onDeleteSupplier
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'suppliers'>('new');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid'); 
  const [itemInputs, setItemInputs] = useState({ name: '', quantity: '', unitPrice: '' });
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<PurchaseInvoice | null>(null);
  const [newSup, setNewSup] = useState({ name: '', phone: '' });
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  // Navigation state for History Tab
  const [step, setStep] = useState<NavStep>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const fullHistory = useMemo(() => {
    const merged = [...archivedHistory];
    if (currentPurchases.length > 0) {
        const today = new Date();
        const todayStr = today.toLocaleDateString('ar-SY');
        const existingTodayIdx = merged.findIndex(d => d.date.includes(todayStr));
        
        const todayEntry: ArchivedDay = {
            id: 'today-active-purchases',
            date: `${todayStr} (مباشر)`,
            timestamp: Date.now(),
            totalRevenue: 0,
            totalExpenses: currentPurchases.reduce((s, i) => s + i.totalAmount, 0),
            totalItems: 0,
            items: [],
            purchaseInvoices: currentPurchases
        };

        if (existingTodayIdx > -1) merged[existingTodayIdx] = { ...merged[existingTodayIdx], purchaseInvoices: [...(merged[existingTodayIdx].purchaseInvoices || []), ...currentPurchases] };
        else merged.push(todayEntry);
    }
    return merged;
  }, [archivedHistory, currentPurchases]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>(fullHistory.filter(d => (d.purchaseInvoices || []).length > 0).map(day => new Date(day.timestamp).getFullYear().toString()));
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [fullHistory]);

  const months = useMemo(() => {
    if (!selectedYear) return [];
    const uniqueMonths = new Set<number>(
      fullHistory
        .filter(day => (day.purchaseInvoices || []).length > 0 && new Date(day.timestamp).getFullYear().toString() === selectedYear)
        .map(day => new Date(day.timestamp).getMonth())
    );
    return Array.from(uniqueMonths).sort((a, b) => b - a);
  }, [fullHistory, selectedYear]);

  const currentDaysData = useMemo(() => {
    if (!selectedYear || selectedMonth === -1) return [];
    return fullHistory.filter(day => {
      const d = new Date(day.timestamp);
      return (day.purchaseInvoices || []).length > 0 && d.getFullYear().toString() === selectedYear && d.getMonth() === selectedMonth;
    }).sort((a,b) => b.timestamp - a.timestamp);
  }, [fullHistory, selectedYear, selectedMonth]);

  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex).toLocaleString('ar-SY', { month: 'long' });
  };

  const addItem = () => {
      if (!itemInputs.name || !itemInputs.quantity || !itemInputs.unitPrice) return;
      const q = parseFloat(itemInputs.quantity); 
      const price = parseFloat(itemInputs.unitPrice);
      setCurrentInvoiceItems(prev => [...prev, { id: Date.now().toString(), name: itemInputs.name, quantity: q, cost: price, total: q * price }]);
      setItemInputs({ name: '', quantity: '', unitPrice: '' });
  };

  const handleSaveInvoice = () => {
      const supplier = suppliers.find(s => s.id === selectedSupplierId || s.name === selectedSupplierId);
      if (!supplier || currentInvoiceItems.length === 0) return alert('يرجى تحديد مورد وإضافة مواد للفاتورة');
      
      const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      
      const invoiceData: PurchaseInvoice = { 
          id: editingInvoiceId || Date.now().toString(), 
          supplierName: supplier.name, 
          date: new Date().toLocaleDateString('ar-SY'), 
          timestamp: Date.now(), 
          items: currentInvoiceItems, 
          totalAmount, 
          paymentStatus 
      };

      if (editingInvoiceId) {
          onUpdateInvoice(invoiceData);
          setEditingInvoiceId(null);
      } else {
          onAddInvoice(invoiceData);
      }

      setSelectedSupplierId(''); 
      setCurrentInvoiceItems([]); 
      setActiveTab('history');
      setStep('years');
  };

  const startEditInvoice = (inv: PurchaseInvoice) => {
      const supplier = suppliers.find(s => s.name === inv.supplierName);
      setEditingInvoiceId(inv.id);
      setSelectedSupplierId(supplier?.id || inv.supplierName);
      setPaymentStatus(inv.paymentStatus);
      setCurrentInvoiceItems(inv.items);
      setActiveTab('new');
  };

  const cancelEdit = () => {
      setEditingInvoiceId(null);
      setSelectedSupplierId('');
      setCurrentInvoiceItems([]);
      setPaymentStatus('paid');
  };

  const renderHistoryContent = () => {
    if (step === 'years') return (
        <div className="grid grid-cols-2 gap-4 animate-fade-up">
            {years.length > 0 ? years.map(year => (
                <button key={year} onClick={() => { setSelectedYear(year); setStep('months'); }} className="bg-gray-900/40 hover:bg-gray-700/50 border border-gray-700 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <Folder size={40} className="text-[#FA8072] group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black text-white">{year}</span>
                </button>
            )) : (
              <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <div className="bg-gray-900/30 p-6 rounded-full"><Zap size={48} className="text-gray-700" /></div>
                  <p className="text-gray-500 font-bold">لا توجد مشتريات مؤرشفة</p>
              </div>
            )}
        </div>
    );

    if (step === 'months') return (
        <div className="grid grid-cols-2 gap-4 animate-fade-up">
            {months.map(monthIdx => (
                <button key={monthIdx} onClick={() => { setSelectedMonth(monthIdx); setStep('days'); }} className="bg-gray-900/40 hover:bg-gray-700/50 border border-gray-700 p-8 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                    <CalendarDays size={40} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-bold text-white">{getMonthName(monthIdx)}</span>
                </button>
            ))}
        </div>
    );

    if (step === 'days') return (
        <div className="flex flex-col gap-3 animate-fade-up h-full">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {currentDaysData.map(day => {
                    const isToday = day.id === 'today-active-purchases';
                    return (
                        <div key={day.id} className={`rounded-xl border overflow-hidden transition-all ${isToday ? 'border-orange-500/30 bg-orange-500/5' : 'border-gray-700 bg-gray-900/20'}`}>
                            <div onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className={`p-4 flex justify-between items-center cursor-pointer ${isToday ? 'bg-orange-500/10' : 'bg-gray-900/50 hover:bg-gray-900'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-500">{expandedDayId === day.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                                    <span className={`font-bold text-sm ${isToday ? 'text-orange-400' : 'text-white'}`}>{day.date}</span>
                                </div>
                                <span className="font-black text-red-400">{(day.purchaseInvoices || []).reduce((s,i) => s + i.totalAmount, 0).toLocaleString()} <small className="text-[9px] text-gray-600 font-normal">ل.س</small></span>
                            </div>
                            
                            {expandedDayId === day.id && (
                                <div className="p-3 bg-black/20 border-t border-gray-700 animate-fade-up space-y-2">
                                    {(day.purchaseInvoices || []).map((inv) => (
                                        <div key={inv.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-900 p-1.5 rounded text-red-400"><Store size={14} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white text-xs font-bold">{inv.supplierName}</span>
                                                    <span className="text-[9px] text-gray-500">{inv.paymentStatus === 'paid' ? 'نقدي' : 'آجل'} • {inv.items.length} مواد</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white font-bold text-xs ml-2">{inv.totalAmount.toLocaleString()}</span>
                                                <button onClick={() => setInvoiceToPrint(inv)} className="p-1.5 bg-gray-700 rounded hover:bg-blue-600 text-white transition-colors" title="طباعة"><Printer size={12}/></button>
                                                <button onClick={() => startEditInvoice(inv)} className="p-1.5 bg-gray-700 rounded hover:bg-yellow-600 text-white transition-colors" title="تعديل"><Edit3 size={12}/></button>
                                                <button onClick={() => onDeleteInvoice(inv.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors" title="حذف"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col h-[85vh] overflow-hidden">
        
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-3">
            {activeTab === 'history' && step !== 'years' && (
                <button onClick={() => {
                    if (step === 'days') { setStep('months'); setSelectedMonth(-1); } 
                    else if (step === 'months') { setStep('years'); setSelectedYear(''); }
                }} className="bg-gray-700 hover:bg-[#FA8072] p-1.5 rounded-full text-white transition-colors"><ArrowRight size={18} /></button>
            )}
            <div className="flex items-center gap-2 text-white">
                <ShoppingCart size={22} className="text-[#FA8072]" />
                <h3 className="font-black text-xl">إدارة المشتريات</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={onClose} className="hidden md:flex items-center gap-2 bg-gray-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                  <span>خروج</span>
                  <X size={18} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 md:hidden"><X size={24} /></button>
          </div>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-900/30">
            <button onClick={() => setActiveTab('new')} className={`flex-1 py-4 text-xs font-black transition-all ${activeTab === 'new' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-800'}`}>
              {editingInvoiceId ? 'تعديل الفاتورة' : 'فاتورة جديدة'}
            </button>
            <button onClick={() => { setActiveTab('history'); setStep('years'); }} className={`flex-1 py-4 text-xs font-black transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-800'}`}>سجل المشتريات</button>
            <button onClick={() => setActiveTab('suppliers')} className={`flex-1 py-4 text-xs font-black transition-all ${activeTab === 'suppliers' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>قائمة الموردين</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'new' ? (
              <div className="space-y-6">
                  {editingInvoiceId && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-yellow-500 text-xs font-bold flex items-center gap-2">
                           <Edit3 size={14} /> أنت الآن في وضع تعديل فاتورة قديمة
                        </span>
                        <button onClick={cancelEdit} className="text-[10px] bg-gray-700 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                           <RotateCcw size={10} /> إلغاء التعديل
                        </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase pr-1">تحديد المورد:</label>
                        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className={`w-full bg-gray-900 border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all ${!selectedSupplierId && suppliers.length > 0 ? 'border-orange-500' : 'border-gray-700 focus:border-[#FA8072]'}`}>
                            <option value="">اختر مورد...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase pr-1">حالة الدفع:</label>
                        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
                            <button onClick={() => setPaymentStatus('paid')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${paymentStatus === 'paid' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}>نقدي</button>
                            <button onClick={() => setPaymentStatus('credit')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${paymentStatus === 'credit' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500'}`}>آجل</button>
                        </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input type="text" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="المادة المشتراة" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" />
                          <input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="الكمية" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm text-center font-bold" />
                          <input type="number" value={itemInputs.unitPrice} onChange={e => setItemInputs({...itemInputs, unitPrice: e.target.value})} placeholder="سعر التكلفة" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-[#FA8072] text-sm text-center font-bold" />
                      </div>
                      <button onClick={addItem} className="w-full bg-gray-700 hover:bg-[#FA8072] text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95"><Plus size={18}/> إضافة بند للفاتورة</button>
                  </div>

                  <div className="bg-gray-950/30 border border-gray-700 rounded-2xl overflow-hidden shadow-inner">
                      <table className="w-full text-xs text-right">
                          <thead className="bg-gray-900 text-gray-500">
                              <tr><th className="p-3">الصنف</th><th className="p-3 text-center">الكمية</th><th className="p-3">الإجمالي</th><th className="p-3 w-8"></th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                              {currentInvoiceItems.map(item => (
                                  <tr key={item.id} className="hover:bg-gray-800/50"><td className="p-3 text-white font-medium">{item.name}</td><td className="p-3 text-center text-gray-400 font-bold">{item.quantity}</td><td className="p-3 text-[#FA8072] font-black">{item.total.toLocaleString()}</td><td className="p-3"><button onClick={() => setCurrentInvoiceItems(s => s.filter(i => i.id !== item.id))} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></td></tr>
                              ))}
                              {currentInvoiceItems.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-gray-600 italic">لا توجد مواد في هذه الفاتورة</td></tr>}
                          </tbody>
                      </table>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">إجمالي الفاتورة</span>
                        <div className="text-3xl font-black text-red-500">{currentInvoiceItems.reduce((s,i) => s + i.total, 0).toLocaleString()} <span className="text-xs text-gray-500 font-normal">ل.س</span></div>
                      </div>
                      <div className="flex gap-2">
                        {editingInvoiceId && (
                           <button onClick={cancelEdit} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">إلغاء</button>
                        )}
                        <button onClick={handleSaveInvoice} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-green-900/20 active:scale-95 transition-all">
                          <FileText size={20} /> {editingInvoiceId ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
                        </button>
                      </div>
                  </div>
              </div>
          ) : activeTab === 'suppliers' ? (
              <div className="space-y-8">
                  <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-700 space-y-4">
                      <h4 className="text-white font-black text-sm">إضافة مورد جديد للنظام</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input type="text" value={newSup.name} onChange={e => setNewSup({...newSup, name: e.target.value})} placeholder="اسم المورد أو الشركة" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm" />
                          <input type="text" value={newSup.phone} onChange={e => setNewSup({...newSup, phone: e.target.value})} placeholder="رقم الهاتف" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm dir-ltr text-right" />
                      </div>
                      <button onClick={() => { if(!newSup.name) return; onAddSupplier(newSup); setNewSup({name:'', phone:''}); }} className="w-full bg-[#FA8072] text-white py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><UserPlus size={18}/> إضافة مورد</button>
                  </div>

                  <div className="space-y-3">
                      <h4 className="text-gray-500 font-black text-[10px] uppercase tracking-widest pl-2">الموردين المسجلين ({suppliers.length})</h4>
                      <div className="grid gap-3">
                        {suppliers.map(s => (
                            <div key={s.id} className="bg-gray-900/40 p-4 rounded-[1.5rem] border border-gray-700 flex justify-between items-center group hover:border-[#FA8072]/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-800 p-3 rounded-2xl text-[#FA8072] group-hover:scale-110 transition-transform"><Store size={20} /></div>
                                    <div className="flex flex-col"><span className="text-white font-black text-sm">{s.name}</span><span className="text-[10px] text-gray-500 font-bold">{s.phone || 'بدون رقم هاتف'}</span></div>
                                </div>
                                <button onClick={() => onDeleteSupplier(s.id)} className="text-gray-600 hover:text-red-400 p-2 transition-colors"><Trash2 size={20}/></button>
                            </div>
                        ))}
                      </div>
                      {suppliers.length === 0 && <p className="text-center py-10 text-gray-700 text-sm italic">لا يوجد موردين مضافين حالياً</p>}
                  </div>
              </div>
          ) : (
              <div className="h-full">
                  {renderHistoryContent()}
              </div>
          )}
        </div>
      </div>
    </div>
    {invoiceToPrint && <Suspense fallback={null}><PurchasePrintModal invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} /></Suspense>}
    </>
  );
};
