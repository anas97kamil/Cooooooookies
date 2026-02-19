import React, { useState, useMemo, Suspense } from 'react';
import { Plus, Trash2, X, ShoppingCart, UserPlus, Printer, FileText, Store, Folder, CalendarDays, ArrowRight, Zap, ChevronDown, ChevronUp, Edit3, RotateCcw, Search, Package, ArrowDownLeft, AlertTriangle, Layers, Info, Users, Banknote, ChevronLeft, Calendar, Receipt } from 'lucide-react';
import { PurchaseInvoice, PurchaseItem, ArchivedDay, PaymentStatus, Supplier, StockItem, Employee, SalaryPayment, GeneralExpense } from '../types';

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
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
  salaryPayments: SalaryPayment[];
  onAddSalaryPayment: (payment: Omit<SalaryPayment, 'id'>) => void;
  onDeleteSalaryPayment: (id: string) => void;
  generalExpenses: GeneralExpense[];
  onAddGeneralExpense: (expense: Omit<GeneralExpense, 'id'>) => void;
  onDeleteGeneralExpense: (id: string) => void;
  expenseCategories: string[];
  onAddExpenseCategory: (category: string) => void;
  onDeleteExpenseCategory: (category: string) => void;
  inventory: StockItem[];
  setInventory: React.Dispatch<React.SetStateAction<StockItem[]>>;
}

type DrillView = 'categories' | 'years' | 'months' | 'days';

export const ExpensesModal: React.FC<ExpensesModalProps> = ({ 
  currentPurchases, archivedHistory, onAddInvoice, onUpdateInvoice, onDeleteInvoice, isOpen, onClose, 
  suppliers = [], onAddSupplier, onDeleteSupplier,
  employees = [], onAddEmployee, onDeleteEmployee,
  salaryPayments = [], onAddSalaryPayment, onDeleteSalaryPayment,
  generalExpenses = [], onAddGeneralExpense, onDeleteGeneralExpense,
  expenseCategories = [], onAddExpenseCategory, onDeleteExpenseCategory,
  inventory, setInventory
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'suppliers' | 'inventory' | 'salaries' | 'general'>('new');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid'); 
  const [itemInputs, setItemInputs] = useState({ name: '', quantity: '', unitPrice: '' });
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<PurchaseInvoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  // General Expenses Navigation State
  const [genView, setGenView] = useState<DrillView>('categories');
  const [navCategory, setNavCategory] = useState<string>('');
  const [navYear, setNavYear] = useState<string>('');
  const [navMonth, setNavMonth] = useState<string>('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // General Expenses Form State
  const [genExpForm, setGenExpForm] = useState({ category: '', amount: '', notes: '' });

  // Salaries Navigation State (Reusing DrillView logic mentally)
  const [salaryView, setSalaryView] = useState<DrillView>('categories');
  const [navEmployee, setNavEmployee] = useState<Employee | null>(null);
  const [salaryNavYear, setSalaryNavYear] = useState<string>('');
  const [salaryNavMonth, setSalaryNavMonth] = useState<string>('');

  const [salaryForm, setSalaryForm] = useState({ employeeId: '', amount: '', notes: '' });
  const [empForm, setEmpForm] = useState({ name: '', position: '' });
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // Inventory logic
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStock, setNewStock] = useState({ name: '', unitType: 'kg' as 'kg'|'piece', minThreshold: 1 });
  const [consumeDialog, setConsumeDialog] = useState<{id: string, name: string, available: number} | null>(null);
  const [editQtyDialog, setEditQtyDialog] = useState<{id: string, name: string, current: number} | null>(null);
  const [actionQty, setActionQty] = useState('');

  // Combined History (Active + Archived) for Drill-downs
  const allGeneralExpenses = useMemo(() => {
    const archived = archivedHistory.flatMap(day => day.generalExpenses || []);
    return [...archived, ...generalExpenses].sort((a, b) => b.id.localeCompare(a.id));
  }, [archivedHistory, generalExpenses]);

  const allSalaryPayments = useMemo(() => {
    const archived = archivedHistory.flatMap(day => day.salaryPayments || []);
    return [...archived, ...salaryPayments].sort((a, b) => b.id.localeCompare(a.id));
  }, [archivedHistory, salaryPayments]);

  // General Expenses Drill-down Logic
  const getGenYears = (category: string) => {
    const years = new Set<string>();
    allGeneralExpenses.filter(e => e.category === category).forEach(e => {
        const year = e.date.split('/').pop() || new Date().getFullYear().toString();
        years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  };

  const getGenMonths = (category: string, year: string) => {
    const months = new Set<string>();
    allGeneralExpenses.filter(e => e.category === category && e.date.endsWith(year)).forEach(e => {
        const dateObj = new Date(e.date);
        const monthName = dateObj.toLocaleString('ar-SY', { month: 'long' });
        months.add(monthName || 'أخرى');
    });
    return Array.from(months);
  };

  const getDetailedGenExpenses = (category: string, year: string, month: string) => {
    return allGeneralExpenses.filter(e => {
        const dateObj = new Date(e.date);
        const mName = dateObj.toLocaleString('ar-SY', { month: 'long' });
        return e.category === category && e.date.endsWith(year) && mName === month;
    });
  };

  // Salary Drill-down Logic
  const getEmployeeYears = (empId: string) => {
    const years = new Set<string>();
    allSalaryPayments.filter(p => p.employeeId === empId).forEach(p => {
        const year = p.date.split('/').pop() || new Date().getFullYear().toString();
        years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  };

  const getEmployeeMonths = (empId: string, year: string) => {
    const months = new Set<string>();
    allSalaryPayments.filter(p => p.employeeId === empId && p.date.endsWith(year)).forEach(p => {
        months.add(p.month);
    });
    return Array.from(months);
  };

  const getDetailedSalaryPayments = (empId: string, year: string, month: string) => {
    return allSalaryPayments.filter(p => p.employeeId === empId && p.date.endsWith(year) && p.month === month);
  };

  const handleAddStockItem = () => {
    if (!newStock.name) return;
    const item: StockItem = {
        id: Date.now().toString(),
        name: newStock.name,
        currentQuantity: 0,
        unitType: newStock.unitType,
        minThreshold: newStock.minThreshold,
        lastUpdated: new Date().toLocaleDateString()
    };
    setInventory(prev => [...prev, item]);
    setNewStock({ name: '', unitType: 'kg', minThreshold: 1 });
    setShowAddStock(false);
  };

  const handleConsume = () => {
    if (!consumeDialog || !actionQty) return;
    const qtyToSubtract = parseFloat(actionQty);
    if (isNaN(qtyToSubtract)) return;
    setInventory(prev => prev.map(item => item.id === consumeDialog.id ? { ...item, currentQuantity: item.currentQuantity - qtyToSubtract, lastUpdated: new Date().toLocaleDateString() } : item));
    setConsumeDialog(null);
    setActionQty('');
  };

  const handleUpdateStockQty = () => {
    if (!editQtyDialog || !actionQty) return;
    const newQty = parseFloat(actionQty);
    if (isNaN(newQty)) return;
    setInventory(prev => prev.map(item => item.id === editQtyDialog.id ? { ...item, currentQuantity: newQty, lastUpdated: new Date().toLocaleDateString() } : item));
    setEditQtyDialog(null);
    setActionQty('');
  };

  const handleSaveInvoice = () => {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (!supplier || currentInvoiceItems.length === 0) return alert('يرجى تحديد مورد وإضافة مواد');
      const totalAmount = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      const invoiceData: PurchaseInvoice = { id: editingInvoiceId || Date.now().toString(), supplierName: supplier.name, date: new Date().toLocaleDateString('ar-SY'), timestamp: Date.now(), items: currentInvoiceItems, totalAmount, paymentStatus };
      setInventory(prev => {
          let updated = [...prev];
          currentInvoiceItems.forEach(purchaseItem => {
              const stockIdx = updated.findIndex(s => s.name === purchaseItem.name);
              if (stockIdx > -1) updated[stockIdx] = { ...updated[stockIdx], currentQuantity: updated[stockIdx].currentQuantity + purchaseItem.quantity, lastUpdated: new Date().toLocaleDateString() };
          });
          return updated;
      });
      if (editingInvoiceId) onUpdateInvoice(invoiceData);
      else onAddInvoice(invoiceData);
      setSelectedSupplierId(''); setCurrentInvoiceItems([]); setEditingInvoiceId(null); setActiveTab('inventory');
  };

  const handleAddEmployee = () => {
    if (!empForm.name) return;
    onAddEmployee(empForm);
    setEmpForm({ name: '', position: '' });
    setShowAddEmployee(false);
  };

  const handleRecordSalary = () => {
    const employee = employees.find(e => e.id === salaryForm.employeeId);
    if (!employee || !salaryForm.amount) return alert('يرجى اختيار الموظف وتحديد المبلغ');
    const now = new Date();
    onAddSalaryPayment({
        employeeId: employee.id,
        employeeName: employee.name,
        amount: parseFloat(salaryForm.amount),
        date: now.toLocaleDateString('ar-SY'),
        month: now.toLocaleString('ar-SY', { month: 'long' }),
        notes: salaryForm.notes
    });
    setSalaryForm({ employeeId: '', amount: '', notes: '' });
  };

  const handleAddGeneralExpense = () => {
      if (!genExpForm.category || !genExpForm.amount) return alert('يرجى ملء البيانات المطلوبة');
      onAddGeneralExpense({
          category: genExpForm.category,
          amount: parseFloat(genExpForm.amount),
          date: new Date().toLocaleDateString('ar-SY'),
          notes: genExpForm.notes
      });
      setGenExpForm({ ...genExpForm, amount: '', notes: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col h-[85vh] overflow-hidden">
        
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#FA8072]/20 p-2.5 rounded-2xl"><Package className="text-[#FA8072]" size={24} /></div>
            <h3 className="font-black text-xl text-white">المستودع والمصاريف</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition-all text-gray-400"><X size={24} /></button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-900/30 overflow-x-auto shrink-0">
            <button onClick={() => setActiveTab('inventory')} className={`flex-1 min-w-[80px] py-4 text-[10px] font-black transition-all flex flex-col items-center gap-1 ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>
                <Layers size={16} /> المستودع
            </button>
            <button onClick={() => setActiveTab('new')} className={`flex-1 min-w-[80px] py-4 text-[10px] font-black transition-all flex flex-col items-center gap-1 ${activeTab === 'new' ? 'bg-[#FA8072] text-white shadow-lg' : 'text-gray-500'}`}>
                <ShoppingCart size={16} /> شراء جديد
            </button>
            <button onClick={() => setActiveTab('salaries')} className={`flex-1 min-w-[80px] py-4 text-[10px] font-black transition-all flex flex-col items-center gap-1 ${activeTab === 'salaries' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500'}`}>
                <Users size={16} /> الرواتب
            </button>
            <button onClick={() => setActiveTab('general')} className={`flex-1 min-w-[80px] py-4 text-[10px] font-black transition-all flex flex-col items-center gap-1 ${activeTab === 'general' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500'}`}>
                <Receipt size={16} /> مصاريف عامة
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 min-w-[80px] py-4 text-[10px] font-black transition-all flex flex-col items-center gap-1 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>
                <CalendarDays size={16} /> السجل
            </button>
            <button onClick={() => setActiveTab('suppliers')} className={`flex-1 min-w-[80px] py-4 text-[10px] font-black transition-all flex flex-col items-center gap-1 ${activeTab === 'suppliers' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>
                <Store size={16} /> الموردين
            </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {activeTab === 'inventory' && (
              <div className="space-y-6 animate-fade-up">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-black text-sm flex items-center gap-2"><Package size={16} className="text-indigo-400" /> جرد المستودع الحالي</h4>
                      <button onClick={() => setShowAddStock(!showAddStock)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all">
                          {showAddStock ? <X size={14} /> : <Plus size={14} />} تعريف مادة خام
                      </button>
                  </div>
                  {showAddStock && (
                      <div className="bg-gray-900 border border-indigo-500/30 p-4 rounded-2xl mb-6 space-y-4 shadow-xl">
                          <div className="grid grid-cols-2 gap-3">
                              <input type="text" value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} placeholder="اسم المادة الخام" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs" />
                              <select value={newStock.unitType} onChange={e => setNewStock({...newStock, unitType: e.target.value as any})} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs">
                                  <option value="kg">كيلو (kg)</option>
                                  <option value="piece">قطعة (pcs)</option>
                              </select>
                          </div>
                          <button onClick={handleAddStockItem} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs">حفظ المادة في المستودع</button>
                      </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {inventory.map(item => (
                          <div key={item.id} className="bg-gray-900/60 p-5 rounded-3xl border border-gray-700 group hover:border-indigo-500/50 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex flex-col">
                                      <span className="text-white font-black text-sm">{item.name}</span>
                                      <span className="text-[9px] text-gray-500 font-bold">آخر تحديث: {item.lastUpdated}</span>
                                  </div>
                                  <button onClick={() => { setEditQtyDialog({id: item.id, name: item.name, current: item.currentQuantity}); setActionQty(item.currentQuantity.toString()); }} className="bg-gray-800 p-2 rounded-xl text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={18} /></button>
                              </div>
                              <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-baseline gap-1">
                                      <span className={`text-3xl font-black tabular-nums ${item.currentQuantity <= item.minThreshold ? 'text-red-500' : 'text-green-500'}`}>
                                          {item.currentQuantity}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-bold">{item.unitType === 'kg' ? 'كيلو' : 'قطعة'}</span>
                                  </div>
                                  <button onClick={() => { setConsumeDialog({id: item.id, name: item.name, available: item.currentQuantity}); setActionQty(''); }} className="bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all border border-red-500/20">
                                      <ArrowDownLeft size={14} /> استهلاك
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-up">
                  {/* Category Management Header */}
                  <div className="flex flex-col gap-4 mb-4">
                      <div className="flex justify-between items-center">
                          <h4 className="text-white font-black text-sm flex items-center gap-2"><Receipt size={16} className="text-pink-400" /> إدارة المصاريف العامة</h4>
                          <button onClick={() => setShowAddCategory(!showAddCategory)} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-gray-600">
                             {showAddCategory ? <X size={14}/> : <Plus size={14} />} إضافة بند مصروف
                          </button>
                      </div>
                      
                      {showAddCategory && (
                        <div className="bg-gray-900 border border-pink-500/30 p-4 rounded-2xl space-y-3 shadow-xl">
                            <input 
                              type="text" 
                              value={newCategoryName} 
                              onChange={e => setNewCategoryName(e.target.value)} 
                              placeholder="اسم بند المصروف (مثلاً: إنترنت، صيانة...)" 
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-pink-500" 
                            />
                            <button 
                              onClick={() => { 
                                if (newCategoryName) { 
                                  onAddExpenseCategory(newCategoryName); 
                                  setNewCategoryName(''); 
                                  setShowAddCategory(false); 
                                } 
                              }} 
                              className="w-full bg-pink-600 text-white py-2.5 rounded-xl font-black text-xs"
                            >
                              حفظ البند
                            </button>
                        </div>
                      )}
                  </div>

                  {/* Breadcrumbs Navigation */}
                  <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-2xl border border-gray-700 mb-4 overflow-x-auto">
                      <button onClick={() => setGenView('categories')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${genView === 'categories' ? 'bg-pink-600 text-white' : 'text-gray-500'}`}>الفئات</button>
                      {navCategory && (
                          <>
                              <ChevronLeft size={12} className="text-gray-700" />
                              <button onClick={() => setGenView('years')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${genView === 'years' ? 'bg-pink-600 text-white' : 'text-gray-500'}`}>{navCategory}</button>
                          </>
                      )}
                      {navYear && (
                          <>
                              <ChevronLeft size={12} className="text-gray-700" />
                              <button onClick={() => setGenView('months')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${genView === 'months' ? 'bg-pink-600 text-white' : 'text-gray-500'}`}>{navYear}</button>
                          </>
                      )}
                      {navMonth && (
                          <>
                              <ChevronLeft size={12} className="text-gray-700" />
                              <button className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-pink-600 text-white">{navMonth}</button>
                          </>
                      )}
                  </div>

                  {/* Main View Area */}
                  <div className="min-h-[300px]">
                      {genView === 'categories' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {expenseCategories.map(cat => {
                                  const totalPaid = allGeneralExpenses.filter(e => e.category === cat).reduce((s,e) => s + e.amount, 0);
                                  return (
                                      <div key={cat} className="bg-gray-900 border border-gray-700 rounded-3xl p-5 hover:border-pink-500 transition-all cursor-pointer group" onClick={() => { setNavCategory(cat); setGenView('years'); }}>
                                          <div className="flex justify-between items-start mb-4">
                                              <div className="bg-pink-600/10 p-3 rounded-2xl text-pink-500 group-hover:bg-pink-600 group-hover:text-white transition-all"><Receipt size={20}/></div>
                                              <button onClick={(e) => { e.stopPropagation(); if(confirm(`حذف فئة "${cat}" نهائياً؟`)) onDeleteExpenseCategory(cat); }} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                          </div>
                                          <h5 className="text-white font-black text-sm mb-1">{cat}</h5>
                                          <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-2">
                                              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">إجمالي المصروف</span>
                                              <span className="text-pink-500 font-black text-xs tabular-nums">{totalPaid.toLocaleString()} ل.س</span>
                                          </div>
                                      </div>
                                  );
                              })}
                              <button onClick={() => setShowAddCategory(true)} className="bg-gray-900 border border-dashed border-gray-700 rounded-3xl p-10 flex flex-col items-center justify-center text-gray-600 hover:text-pink-500 hover:border-pink-500 transition-all">
                                  <Plus size={24} className="mb-2" />
                                  <span className="text-[10px] font-black uppercase">إضافة فئة جديدة</span>
                              </button>
                          </div>
                      )}

                      {genView === 'years' && navCategory && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {getGenYears(navCategory).map(year => (
                                  <button key={year} onClick={() => { setNavYear(year); setGenView('months'); }} className="bg-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:border-pink-500 transition-all group">
                                      <Calendar size={28} className="text-pink-500 mb-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-white font-black text-xl">{year}</span>
                                  </button>
                              ))}
                              {getGenYears(navCategory).length === 0 && (
                                  <div className="col-span-full py-20 text-center text-gray-600 italic">لا توجد مصاريف مسجلة لهذه الفئة</div>
                              )}
                          </div>
                      )}

                      {genView === 'months' && navCategory && navYear && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {getGenMonths(navCategory, navYear).map(month => (
                                  <button key={month} onClick={() => { setNavMonth(month); setGenView('days'); }} className="bg-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:border-pink-500 transition-all group">
                                      <CalendarDays size={28} className="text-pink-500 mb-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-white font-black text-sm">{month}</span>
                                  </button>
                              ))}
                          </div>
                      )}

                      {genView === 'days' && navCategory && navYear && navMonth && (
                          <div className="space-y-3">
                              {getDetailedGenExpenses(navCategory, navYear, navMonth).map(exp => (
                                  <div key={exp.id} className="bg-gray-900 border border-gray-700 p-4 rounded-3xl flex justify-between items-center group">
                                      <div className="flex items-center gap-4">
                                          <div className="bg-pink-600/10 p-3 rounded-2xl text-pink-400"><Banknote size={18}/></div>
                                          <div className="flex flex-col">
                                              <span className="text-white font-black text-xs">{exp.date}</span>
                                              <span className="text-[10px] text-gray-500 font-bold">{exp.notes || 'لا توجد ملاحظات'}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <span className="text-pink-500 font-black text-sm tabular-nums">{exp.amount.toLocaleString()} ل.س</span>
                                          {/* Only allow deleting if it's in today's active list or we have a more global delete logic */}
                                          {generalExpenses.some(active => active.id === exp.id) && (
                                              <button onClick={() => onDeleteGeneralExpense(exp.id)} className="text-gray-700 hover:text-red-500 p-1 transition-colors"><Trash2 size={16}/></button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Add General Expense Form - Fixed at Bottom */}
                  <div className="bg-gray-950 p-6 rounded-[2.5rem] border border-gray-700 mt-8 space-y-4">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Receipt size={14} className="text-pink-500" /> تسجيل مصروف جديد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select 
                            value={genExpForm.category} 
                            onChange={e => setGenExpForm({...genExpForm, category: e.target.value})} 
                            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-pink-500 font-bold"
                          >
                              <option value="">اختر الفئة...</option>
                              {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <input 
                            type="number" 
                            value={genExpForm.amount} 
                            onChange={e => setGenExpForm({...genExpForm, amount: e.target.value})} 
                            placeholder="المبلغ (ل.س)" 
                            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-pink-500 font-black" 
                          />
                      </div>
                      <input 
                        type="text" 
                        value={genExpForm.notes} 
                        onChange={e => setGenExpForm({...genExpForm, notes: e.target.value})} 
                        placeholder="ملاحظات المصروف..." 
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-pink-500" 
                      />
                      <button onClick={handleAddGeneralExpense} className="w-full bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95">تأكيد عملية الصرف</button>
                  </div>
              </div>
          )}

          {activeTab === 'salaries' && (
              <div className="space-y-6 animate-fade-up">
                  {/* Quick Action Header */}
                  <div className="flex flex-col gap-4 mb-4">
                      <div className="flex justify-between items-center">
                          <h4 className="text-white font-black text-sm flex items-center gap-2"><Users size={16} className="text-green-400" /> إدارة العمال والرواتب</h4>
                          <button onClick={() => setShowAddEmployee(!showAddEmployee)} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-gray-600">
                             {showAddEmployee ? <X size={14}/> : <Plus size={14} />} إضافة عامل
                          </button>
                      </div>
                      
                      {showAddEmployee && (
                        <div className="bg-gray-900 border border-green-500/30 p-4 rounded-2xl space-y-3 shadow-xl">
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} placeholder="اسم الموظف" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-green-500" />
                                <input type="text" value={empForm.position} onChange={e => setEmpForm({...empForm, position: e.target.value})} placeholder="المسمى الوظيفي" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-green-500" />
                            </div>
                            <button onClick={handleAddEmployee} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-black text-xs">حفظ الموظف</button>
                        </div>
                      )}
                  </div>

                  {/* Breadcrumbs Navigation */}
                  <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-2xl border border-gray-700 mb-4 overflow-x-auto">
                      <button onClick={() => setSalaryView('categories')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${salaryView === 'categories' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>العمال</button>
                      {navEmployee && (
                          <>
                              <ChevronLeft size={12} className="text-gray-700" />
                              <button onClick={() => setSalaryView('years')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${salaryView === 'years' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>{navEmployee.name}</button>
                          </>
                      )}
                      {salaryNavYear && (
                          <>
                              <ChevronLeft size={12} className="text-gray-700" />
                              <button onClick={() => setSalaryView('months')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${salaryView === 'months' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>{salaryNavYear}</button>
                          </>
                      )}
                      {salaryNavMonth && (
                          <>
                              <ChevronLeft size={12} className="text-gray-700" />
                              <button className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-green-600 text-white">{salaryNavMonth}</button>
                          </>
                      )}
                  </div>

                  {/* Main View Area */}
                  <div className="min-h-[300px]">
                      {salaryView === 'categories' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {employees.map(emp => {
                                  const totalPaid = allSalaryPayments.filter(p => p.employeeId === emp.id).reduce((s,p) => s + p.amount, 0);
                                  return (
                                      <div key={emp.id} className="bg-gray-900 border border-gray-700 rounded-3xl p-5 hover:border-green-500 transition-all cursor-pointer group" onClick={() => { setNavEmployee(emp); setSalaryView('years'); }}>
                                          <div className="flex justify-between items-start mb-4">
                                              <div className="bg-green-600/10 p-3 rounded-2xl text-green-500 group-hover:bg-green-600 group-hover:text-white transition-all"><Users size={20}/></div>
                                              <button onClick={(e) => { e.stopPropagation(); onDeleteEmployee(emp.id); }} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                          </div>
                                          <h5 className="text-white font-black text-sm mb-1">{emp.name}</h5>
                                          <p className="text-[10px] text-gray-500 font-bold mb-4 uppercase">{emp.position || 'موظف'}</p>
                                          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                                              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">إجمالي المستلم</span>
                                              <span className="text-green-500 font-black text-xs tabular-nums">{totalPaid.toLocaleString()} ل.س</span>
                                          </div>
                                      </div>
                                  );
                              })}
                              <button onClick={() => setSalaryView('categories')} className="bg-gray-900 border border-dashed border-gray-700 rounded-3xl p-10 flex flex-col items-center justify-center text-gray-600 hover:text-green-500 hover:border-green-500 transition-all">
                                  <UserPlus size={24} className="mb-2" />
                                  <span className="text-[10px] font-black uppercase">إضافة عامل جديد</span>
                              </button>
                          </div>
                      )}

                      {salaryView === 'years' && navEmployee && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {getEmployeeYears(navEmployee.id).map(year => (
                                  <button key={year} onClick={() => { setSalaryNavYear(year); setSalaryView('months'); }} className="bg-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:border-green-500 transition-all group">
                                      <Calendar size={28} className="text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-white font-black text-xl">{year}</span>
                                  </button>
                              ))}
                              {getEmployeeYears(navEmployee.id).length === 0 && (
                                  <div className="col-span-full py-20 text-center text-gray-600 italic">لا توجد دفعات مسجلة لهذا الموظف</div>
                              )}
                          </div>
                      )}

                      {salaryView === 'months' && navEmployee && salaryNavYear && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {getEmployeeMonths(navEmployee.id, salaryNavYear).map(month => (
                                  <button key={month} onClick={() => { setSalaryNavMonth(month); setSalaryView('days'); }} className="bg-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:border-green-500 transition-all group">
                                      <CalendarDays size={28} className="text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-white font-black text-sm">{month}</span>
                                  </button>
                              ))}
                          </div>
                      )}

                      {salaryView === 'days' && navEmployee && salaryNavYear && salaryNavMonth && (
                          <div className="space-y-3">
                              {getDetailedSalaryPayments(navEmployee.id, salaryNavYear, salaryNavMonth).map(pay => (
                                  <div key={pay.id} className="bg-gray-900 border border-gray-700 p-4 rounded-3xl flex justify-between items-center group">
                                      <div className="flex items-center gap-4">
                                          <div className="bg-green-600/10 p-3 rounded-2xl text-green-500"><Banknote size={18}/></div>
                                          <div className="flex flex-col">
                                              <span className="text-white font-black text-xs">{pay.date}</span>
                                              <span className="text-[10px] text-gray-500 font-bold">{pay.notes || 'لا توجد ملاحظات'}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <span className="text-green-500 font-black text-sm tabular-nums">{pay.amount.toLocaleString()} ل.س</span>
                                          {salaryPayments.some(active => active.id === pay.id) && (
                                              <button onClick={() => onDeleteSalaryPayment(pay.id)} className="text-gray-700 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Add Salary Form - Fixed at Bottom */}
                  <div className="bg-gray-950 p-6 rounded-[2.5rem] border border-gray-700 mt-8 space-y-4">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Banknote size={14} className="text-green-500" /> تسجيل دفعة راتب/سلفة جديدة</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select value={salaryForm.employeeId} onChange={e => setSalaryForm({...salaryForm, employeeId: e.target.value})} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-green-500 font-bold">
                              <option value="">اختر الموظف...</option>
                              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                          <input type="number" value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: e.target.value})} placeholder="المبلغ (ل.س)" className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-green-500 font-black" />
                      </div>
                      <input type="text" value={salaryForm.notes} onChange={e => setSalaryForm({...salaryForm, notes: e.target.value})} placeholder="ملاحظات الصرف..." className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-green-500" />
                      <button onClick={handleRecordSalary} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95">تأكيد عملية الصرف</button>
                  </div>
              </div>
          )}

          {activeTab === 'new' && (
              <div className="space-y-6 animate-fade-up">
                  <div className="bg-indigo-600/10 border border-indigo-600/20 p-4 rounded-2xl mb-4 flex items-start gap-3">
                      <Info size={20} className="text-indigo-400 shrink-0" />
                      <p className="text-[10px] text-indigo-200 font-bold leading-relaxed">تنبيه المشتريات: لن يقبل النظام إضافة أي مادة إلا إذا كانت معرفة في تبويب "المستودع" أولاً.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black pr-1">تحديد المورد:</label>
                        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-[#FA8072]">
                            <option value="">اختر مورد...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black pr-1">حالة الدفع:</label>
                        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
                            <button onClick={() => setPaymentStatus('paid')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${paymentStatus === 'paid' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500'}`}>نقدي</button>
                            <button onClick={() => setPaymentStatus('credit')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${paymentStatus === 'credit' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500'}`}>آجل</button>
                        </div>
                    </div>
                  </div>
                  <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="relative group">
                              <input type="text" list="stock-options" value={itemInputs.name} onChange={e => setItemInputs({...itemInputs, name: e.target.value})} placeholder="اختر مادة من المستودع..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-indigo-500 outline-none" />
                              <datalist id="stock-options">{inventory.map(i => <option key={i.id} value={i.name} />)}</datalist>
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"><Layers size={14} /></div>
                          </div>
                          <input type="number" value={itemInputs.quantity} onChange={e => setItemInputs({...itemInputs, quantity: e.target.value})} placeholder="الكمية" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center font-bold outline-none focus:border-green-500" />
                          <input type="number" value={itemInputs.unitPrice} onChange={e => setItemInputs({...itemInputs, unitPrice: e.target.value})} placeholder="السعر" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center font-bold outline-none focus:border-green-500" />
                      </div>
                      <button onClick={() => { if (!itemInputs.name || !itemInputs.quantity || !itemInputs.unitPrice) return; const q = parseFloat(itemInputs.quantity); const price = parseFloat(itemInputs.unitPrice); setCurrentInvoiceItems(prev => [...prev, { id: Date.now().toString(), name: itemInputs.name, quantity: q, cost: price, total: q * price }]); setItemInputs({ name: '', quantity: '', unitPrice: '' }); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg">إضافة مادة للفاتورة</button>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                      <div className="text-2xl font-black text-red-500 tabular-nums">{currentInvoiceItems.reduce((s,i) => s + i.total, 0).toLocaleString()} <span className="text-[10px] text-gray-600">ل.س</span></div>
                      <button onClick={handleSaveInvoice} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl transition-all">حفظ وتحديث المستودع</button>
                  </div>
              </div>
          )}

          {activeTab === 'history' && (
              <div className="space-y-4 animate-fade-up">
                  {currentPurchases.map(inv => (
                      <div key={inv.id} className="bg-gray-900/40 p-4 rounded-3xl border border-gray-700 flex justify-between items-center group hover:bg-gray-900/60 transition-all">
                          <div className="flex items-center gap-4">
                              <div className="bg-gray-800 p-3 rounded-2xl text-red-400"><ShoppingCart size={18} /></div>
                              <div className="flex flex-col">
                                  <span className="text-white text-xs font-black">{inv.supplierName}</span>
                                  <span className="text-[9px] text-gray-500 font-bold tabular-nums">{inv.date} • {inv.totalAmount.toLocaleString()} ل.س</span>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => setInvoiceToPrint(inv)} className="p-2 bg-gray-800 rounded-xl text-white hover:bg-blue-600 transition-colors shadow-lg"><Printer size={16}/></button>
                              <button onClick={() => onDeleteInvoice(inv.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
                  {currentPurchases.length === 0 && <div className="py-20 text-center text-gray-700 italic">لا توجد فواتير شراء نشطة اليوم</div>}
              </div>
          )}

          {activeTab === 'suppliers' && (
              <div className="space-y-6 animate-fade-up">
                  <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-700 space-y-4">
                      <h4 className="text-white font-black text-sm">إضافة مورد جديد</h4>
                      <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="اسم المورد" id="sup-name" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#FA8072]" />
                          <input type="text" placeholder="الهاتف" id="sup-phone" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#FA8072]" />
                      </div>
                      <button onClick={() => { const n = (document.getElementById('sup-name') as HTMLInputElement).value; const p = (document.getElementById('sup-phone') as HTMLInputElement).value; if(n) { onAddSupplier({name: n, phone: p}); (document.getElementById('sup-name') as HTMLInputElement).value = ''; (document.getElementById('sup-phone') as HTMLInputElement).value = ''; } }} className="w-full bg-[#FA8072] hover:bg-orange-600 text-white py-3 rounded-xl font-black text-xs transition-all shadow-lg">إضافة المورد</button>
                  </div>
                  <div className="grid gap-2">
                      {suppliers.map(s => (
                          <div key={s.id} className="bg-gray-900/40 p-4 rounded-2xl border border-gray-700 flex justify-between items-center group transition-all">
                              <span className="text-white font-black text-xs">{s.name}</span>
                              <button onClick={() => onDeleteSupplier(s.id)} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Consume Quantity Dialog */}
      {consumeDialog && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-gray-800 border border-red-500/50 p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-fade-up">
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3"><ArrowDownLeft className="text-red-500" size={24} /></div>
                      <h3 className="text-white font-black text-lg">استهلاك من المستودع</h3>
                      <p className="text-green-500 text-[10px] font-black mt-1 uppercase">المتوفر حالياً: {consumeDialog.available}</p>
                  </div>
                  <div className="space-y-4">
                      <input type="number" value={actionQty} onChange={e => setActionQty(e.target.value)} placeholder="الكمية المراد سحبها" className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-2xl text-center outline-none focus:border-red-500 font-black text-xl tabular-nums" autoFocus />
                      <div className="flex gap-2">
                        <button onClick={handleConsume} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">تأكيد السحب</button>
                        <button onClick={() => {setConsumeDialog(null); setActionQty('');}} className="flex-1 bg-gray-700 text-white py-4 rounded-2xl font-black text-xs">إلغاء</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Quantity Dialog */}
      {editQtyDialog && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-gray-800 border border-indigo-500/50 p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-fade-up">
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3"><Edit3 className="text-indigo-400" size={24} /></div>
                      <h3 className="text-white font-black text-lg">تعديل رصيد مادة</h3>
                  </div>
                  <div className="space-y-4">
                      <input type="number" value={actionQty} onChange={e => setActionQty(e.target.value)} placeholder="أدخل الكمية الجديدة" className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-2xl text-center outline-none focus:border-indigo-400 font-black text-xl tabular-nums" autoFocus />
                      <div className="flex gap-2">
                        <button onClick={handleUpdateStockQty} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">تحديث الرصيد</button>
                        <button onClick={() => {setEditQtyDialog(null); setActionQty('');}} className="flex-1 bg-gray-700 text-white py-4 rounded-2xl font-black text-xs">إلغاء</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {invoiceToPrint && <Suspense fallback={null}><PurchasePrintModal invoice={invoiceToPrint} onClose={() => setInvoiceToPrint(null)} /></Suspense>}
    </div>
  );
};