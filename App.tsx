import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay, SaleType, Customer, PurchaseInvoice, Supplier, StockItem, Employee, SalaryPayment, GeneralExpense } from './types';
import { Loader2, X, ShieldCheck, Wifi, WifiOff, CloudDownload, CheckCircle2, AlertCircle, Download, AlertTriangle, Clock } from 'lucide-react';

const InvoiceModal = React.lazy(() => import('./components/InvoiceModal').then(m => ({ default: m.InvoiceModal })));
const ProductManager = React.lazy(() => import('./components/ProductManager').then(m => ({ default: m.ProductManager })));
const HistoryModal = React.lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const DataManagementModal = React.lazy(() => import('./components/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const CustomerManager = React.lazy(() => import('./components/CustomerManager').then(m => ({ default: m.CustomerManager })));
const ExpensesModal = React.lazy(() => import('./components/ExpensesModal').then(m => ({ default: m.ExpensesModal })));
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal').then(m => ({ default: m.AnalyticsModal })));

const ModalLoader = () => <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"><div className="bg-gray-800 p-4 rounded-full border border-gray-700"><Loader2 className="animate-spin text-[#FA8072]" size={32} /></div></div>;

const WelcomeLoader: React.FC<{ onComplete: () => void; lastSessionTime: string | null }> = ({ onComplete, lastSessionTime }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 4;
      });
    }, 80);
    
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[300] flex flex-col items-center justify-center p-6 text-center overflow-hidden font-['Cairo']">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#FA8072_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="mb-10 relative">
           <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FA8072]/20 to-transparent opacity-50"></div>
              <ShieldCheck className="text-[#FA8072] relative z-10" size={44} strokeWidth={1.5} />
           </div>
        </div>
        <div className="space-y-4 mb-14">
            <h1 className="text-5xl font-black text-white tracking-tighter animate-fade-up">مرحباً</h1>
            <div className="h-0.5 w-12 bg-[#FA8072] mx-auto rounded-full opacity-60"></div>
        </div>
        {lastSessionTime && (
          <div className="mb-10 flex items-center gap-3 px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl animate-fade-up">
            <Clock size={16} className="text-[#FA8072]" />
            <div className="flex flex-col items-start leading-none text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">آخر نشاط مسجل</span>
              <span className="text-xs text-slate-300 font-black tabular-nums">{lastSessionTime}</span>
            </div>
          </div>
        )}
        <div className="w-full max-w-xs px-4">
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800/50 p-0 mb-4">
              <div className="h-full bg-[#FA8072] rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">System Authentication</span>
                <span className="text-[#FA8072] font-black tabular-nums text-[10px]">{progress}%</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [previousSessionTime] = useState(() => localStorage.getItem('lastSessionTime'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuth') === 'true');
  const [isInitializing, setIsInitializing] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());
  const [showLock, setShowLock] = useState<{ target: string; data?: any } | null>(null);
  const [lockPass, setLockPass] = useState('');
  const [lockError, setLockError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [loginPassword, setLoginPassword] = useState(() => localStorage.getItem('loginPassword') || '2026');
  const [systemPassword, setSystemPassword] = useState(() => localStorage.getItem('systemPassword') || '@@A2026A@@');

  // State Management
  const [sales, setSales] = useState<SaleItem[]>(() => JSON.parse(localStorage.getItem('dailySales') || '[]'));
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => JSON.parse(localStorage.getItem('dailyPurchaseInvoices') || '[]'));
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(() => JSON.parse(localStorage.getItem('dailySalaries') || '[]'));
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>(() => JSON.parse(localStorage.getItem('dailyGeneralExpenses') || '[]'));
  const [history, setHistory] = useState<ArchivedDay[]>(() => JSON.parse(localStorage.getItem('salesHistory') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('customers') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem('suppliers') || '[]'));
  const [employees, setEmployees] = useState<Employee[]>(() => JSON.parse(localStorage.getItem('employees') || '[]'));
  const [inventory, setInventory] = useState<StockItem[]>(() => JSON.parse(localStorage.getItem('inventory') || '[]'));
  
  // New: Expense Categories Management
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('expenseCategories');
    return saved ? JSON.parse(saved) : ['كهرباء', 'ماء', 'نظافة', 'صيانة', 'مواصلات', 'قرطاسية', 'إيجار', 'إنترنت', 'أخرى'];
  });

  const [invoiceItems, setInvoiceItems] = useState<SaleItem[] | null>(null);
  const [modals, setModals] = useState({ products: false, customers: false, history: false, data: false, expenses: false, analytics: false });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('dailySales', JSON.stringify(sales));
    localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
    localStorage.setItem('dailySalaries', JSON.stringify(salaryPayments));
    localStorage.setItem('dailyGeneralExpenses', JSON.stringify(generalExpenses));
    localStorage.setItem('salesHistory', JSON.stringify(history));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    localStorage.setItem('loginPassword', loginPassword);
    localStorage.setItem('systemPassword', systemPassword);
    
    const now = new Date();
    localStorage.setItem('lastSessionTime', now.toLocaleString('en-US'));
    setLastSyncTime(now);
  }, [sales, purchaseInvoices, salaryPayments, generalExpenses, history, products, customers, suppliers, employees, inventory, expenseCategories, loginPassword, systemPassword]);

  const handleLogout = () => { sessionStorage.removeItem('isAuth'); setIsAuthenticated(false); };
  const handleOpenProtected = (target: string, data?: any) => { setShowLock({ target, data }); };
  const handleLoginSuccess = () => { sessionStorage.setItem('isAuth', 'true'); setIsAuthenticated(true); };
  const finalizeWelcome = () => setIsInitializing(false);

  const completeOrder = useCallback((items: any[], customerName?: string, customerId?: string, saleType: SaleType = 'retail') => {
    const orderId = Date.now().toString();
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayDate = new Date().toLocaleDateString('en-US');
    const activeMax = sales.filter(s => s.date === todayDate).reduce((max, s) => Math.max(max, s.customerNumber), 0);
    const archivedToday = history.find(h => h.date === todayDate);
    const archivedMax = archivedToday ? archivedToday.items.reduce((max, s) => Math.max(max, s.customerNumber), 0) : 0;
    const nextCustomerNumber = Math.max(activeMax, archivedMax) + 1;

    const newItems: SaleItem[] = items.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      orderId,
      customerNumber: nextCustomerNumber,
      customerName,
      customerId,
      saleType,
      time,
      date: todayDate
    }));

    setSales(prev => [...prev, ...newItems]);
    setInvoiceItems(newItems);
  }, [sales, history]);

  const handleArchiveDay = useCallback(() => {
      if (sales.length === 0 && purchaseInvoices.length === 0 && salaryPayments.length === 0 && generalExpenses.length === 0) return alert('لا توجد بيانات للترحيل');
      const confirmed = window.confirm('ترحيل مبيعات ومصاريف اليوم للأرشيف؟');
      if (!confirmed) return;

      const dateStr = new Date().toLocaleDateString('en-US');
      setHistory(prev => [{
          id: `arch-${Date.now()}`,
          date: dateStr,
          timestamp: Date.now(),
          items: sales,
          purchaseInvoices: purchaseInvoices,
          salaryPayments: salaryPayments,
          generalExpenses: generalExpenses,
          totalRevenue: sales.reduce((s, i) => s + (i.price * i.quantity), 0),
          totalExpenses: purchaseInvoices.reduce((s, i) => s + i.totalAmount, 0) + salaryPayments.reduce((s, i) => s + i.amount, 0) + generalExpenses.reduce((s, i) => s + i.amount, 0),
          totalItems: sales.length
      }, ...prev]);

      setSales([]);
      setPurchaseInvoices([]);
      setSalaryPayments([]);
      setGeneralExpenses([]);
      alert('تم الترحيل بنجاح');
  }, [sales, purchaseInvoices, salaryPayments, generalExpenses]);

  const handleExportData = async () => {
    const backup = { sales, purchaseInvoices, salaryPayments, generalExpenses, history, products, customers, suppliers, employees, inventory, expenseCategories, loginPassword, systemPassword };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cookies-bakery-backup-${new Date().toLocaleDateString()}.json`;
    link.click();
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (data.sales) setSales(data.sales);
            if (data.inventory) setInventory(data.inventory);
            if (data.products) setProducts(data.products);
            if (data.history) setHistory(data.history);
            if (data.purchaseInvoices) setPurchaseInvoices(data.purchaseInvoices);
            if (data.salaryPayments) setSalaryPayments(data.salaryPayments);
            if (data.generalExpenses) setGeneralExpenses(data.generalExpenses);
            if (data.customers) setCustomers(data.customers);
            if (data.suppliers) setSuppliers(data.suppliers);
            if (data.employees) setEmployees(data.employees);
            if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
            if (data.loginPassword) setLoginPassword(data.loginPassword);
            if (data.systemPassword) setSystemPassword(data.systemPassword);
            alert('تم استيراد البيانات');
        } catch (err) { alert('خطأ في الملف'); }
    };
    reader.readAsText(file);
  };

  const verifyLock = () => {
    if (lockPass === systemPassword) {
      if (showLock?.target === 'full_reset') { localStorage.clear(); window.location.reload(); }
      else if (showLock) setModals(m => ({ ...m, [showLock.target]: true }));
      setShowLock(null); setLockPass(''); setLockError(false);
    } else setLockError(true);
  };

  if (isInitializing) return <WelcomeLoader onComplete={finalizeWelcome} lastSessionTime={previousSessionTime} />;
  if (!isAuthenticated) return <Login onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 print:bg-white relative">
      <Header 
        onOpenHistory={() => handleOpenProtected('history')} 
        onOpenDataManagement={() => handleOpenProtected('data')} 
        onOpenExpenses={() => handleOpenProtected('expenses')}
        onOpenAnalytics={() => handleOpenProtected('analytics')}
        onLogout={handleLogout}
        isOnline={isOnline} 
        lastSyncTime={lastSyncTime} 
        onManualSync={() => { setIsSyncing(true); setTimeout(() => setIsSyncing(false), 800); }} 
        onQuickBackup={handleExportData} 
        isSyncing={isSyncing}
      />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl no-print">
        <Summary items={sales} onPreview={() => setInvoiceItems(sales)} systemPassword={systemPassword} />
        <POSInterface products={products} customers={customers} onCompleteOrder={completeOrder} onOpenProductManager={() => setModals(m => ({...m, products: true}))} onOpenCustomerManager={() => setModals(m => ({...m, customers: true}))} />
        <div className="mt-8">
            <SalesTable items={sales} onDeleteItem={(id: string) => setSales(s => s.filter(i => i.id !== id))} onDeleteOrder={(oid: string) => setSales(s => s.filter(i => i.orderId !== oid))} onPreviewInvoice={setInvoiceItems} onUpdateItemPrice={(id: string, p: number) => setSales(s => s.map(i => i.id === id ? {...i, price: p} : i))} />
        </div>
      </main>

      <Suspense fallback={<ModalLoader />}>
        {modals.analytics && <AnalyticsModal 
          history={history} 
          currentSales={sales} 
          currentPurchases={purchaseInvoices} 
          currentSalaries={salaryPayments} 
          currentGeneralExpenses={generalExpenses}
          onClose={() => setModals(m => ({ ...m, analytics: false }))} 
        />}
        {modals.expenses && <ExpensesModal 
          isOpen={modals.expenses} 
          onClose={() => setModals(m => ({...m, expenses: false}))} 
          currentPurchases={purchaseInvoices} 
          archivedHistory={history} 
          onAddInvoice={v => setPurchaseInvoices(p => [...p, v])} 
          onUpdateInvoice={v => setPurchaseInvoices(p => p.map(inv => inv.id === v.id ? v : inv))} 
          onDeleteInvoice={id => setPurchaseInvoices(p => p.filter(v => v.id !== id))} 
          suppliers={suppliers} 
          onAddSupplier={s => setSuppliers(p => [...p, {...s, id: Date.now().toString()}])} 
          onDeleteSupplier={id => setSuppliers(p => p.filter(s => s.id !== id))} 
          employees={employees}
          onAddEmployee={e => setEmployees(prev => [...prev, {...e, id: Date.now().toString()}])}
          onDeleteEmployee={id => setEmployees(prev => prev.filter(e => e.id !== id))}
          salaryPayments={salaryPayments}
          onAddSalaryPayment={p => setSalaryPayments(prev => [...prev, {...p, id: Date.now().toString()}])}
          onDeleteSalaryPayment={id => setSalaryPayments(prev => prev.filter(p => p.id !== id))}
          generalExpenses={generalExpenses}
          onAddGeneralExpense={e => setGeneralExpenses(prev => [...prev, {...e, id: Date.now().toString()}])}
          onDeleteGeneralExpense={id => setGeneralExpenses(prev => prev.filter(e => e.id !== id))}
          expenseCategories={expenseCategories}
          onAddExpenseCategory={cat => setExpenseCategories(prev => Array.from(new Set([...prev, cat])))}
          onDeleteExpenseCategory={cat => setExpenseCategories(prev => prev.filter(c => c !== cat))}
          inventory={inventory} 
          setInventory={setInventory} 
        />}
        {modals.history && <HistoryModal history={history} currentSales={sales} onClose={() => setModals(m => ({...m, history: false}))} onPreviewInvoice={setInvoiceItems} onUpdateOrder={(dayId, orderId, items, name) => setHistory(prev => prev.map(day => day.id === dayId ? {...day, items: [...day.items.filter(it => it.orderId !== orderId), ...items]} : day))} onDeleteArchivedOrder={(dayId, orderId) => setHistory(prev => prev.map(day => day.id === dayId ? {...day, items: day.items.filter(it => it.orderId !== orderId)} : day))} onDeleteArchivedDay={id => setHistory(prev => prev.filter(d => d.id !== id))} />}
        {modals.products && <ProductManager isOpen={modals.products} onClose={() => setModals(m => ({...m, products: false}))} products={products} onAddProduct={p => setProducts(s => [...s, {...p, id: Date.now().toString()}])} onUpdateProduct={(id, up) => setProducts(p => p.map(it => it.id === id ? {...it, ...up} : it))} onDeleteProduct={id => setProducts(s => s.filter(p => p.id !== id))} />}
        {modals.customers && <CustomerManager isOpen={modals.customers} onClose={() => setModals(m => ({...m, customers: false}))} customers={customers} onAddCustomer={c => setCustomers(s => [...s, {...c, id: Date.now().toString()}])} onDeleteCustomer={id => setCustomers(s => s.filter(c => c.id !== id))} />}
        {modals.data && <DataManagementModal onClose={() => setModals(m => ({...m, data: false}))} onExport={handleExportData} onImport={handleImportData} onArchiveDay={handleArchiveDay} systemPassword={systemPassword} setSystemPassword={setSystemPassword} loginPassword={loginPassword} setLoginPassword={setLoginPassword} />}
        {invoiceItems && <InvoiceModal items={invoiceItems} onClose={() => setInvoiceItems(null)} />}
      </Suspense>

      {showLock && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-fade-up relative">
            <button onClick={() => { setShowLock(null); setLockPass(''); setLockError(false); }} className="absolute top-4 left-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#FA8072]/20 rounded-full flex items-center justify-center mx-auto mb-3"><Loader2 className="text-[#FA8072] animate-pulse" size={24} /></div>
                <h3 className="text-white font-black text-lg">تأكيد الإجراء</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">أدخل كلمة المرور للمتابعة</p>
            </div>
            <input type="password" value={lockPass} onChange={e => setLockPass(e.target.value)} placeholder="رمز الدخول" className={`w-full bg-gray-900 border ${lockError ? 'border-red-500' : 'border-gray-700'} text-white p-4 rounded-2xl mb-4 text-center outline-none focus:border-[#FA8072] text-xl tracking-widest`} autoFocus onKeyDown={e => e.key === 'Enter' && verifyLock()} />
            {lockError && <p className="text-red-500 text-[10px] text-center mb-4 font-bold animate-pulse">رمز الدخول غير صحيح!</p>}
            <button onClick={verifyLock} className="w-full bg-gradient-to-r from-[#FA8072] to-orange-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all">تأكيد الإجراء</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;