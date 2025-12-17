
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay, SaleType, Customer, PurchaseInvoice, Supplier } from './types';
import { Loader2, Lock, X, DownloadCloud, Database, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

const InvoiceModal = React.lazy(() => import('./components/InvoiceModal').then(m => ({ default: m.InvoiceModal })));
const ProductManager = React.lazy(() => import('./components/ProductManager').then(m => ({ default: m.ProductManager })));
const HistoryModal = React.lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const DataManagementModal = React.lazy(() => import('./components/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const CustomerManager = React.lazy(() => import('./components/CustomerManager').then(m => ({ default: m.CustomerManager })));
const ExpensesModal = React.lazy(() => import('./components/ExpensesModal').then(m => ({ default: m.ExpensesModal })));
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal').then(m => ({ default: m.AnalyticsModal })));

const ModalLoader = () => <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"><div className="bg-gray-800 p-4 rounded-full border border-gray-700"><Loader2 className="animate-spin text-[#FA8072]" size={32} /></div></div>;

const LoadingScreen = ({ progress, message }: { progress: number, message: string }) => (
    <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-12 relative">
            <div className="absolute inset-0 bg-[#FA8072]/20 blur-3xl rounded-full"></div>
            <h1 className="relative text-4xl font-black text-[#FA8072] mb-1 tracking-tighter">مخبز كوكيز</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">نظام المحاسبة الذكي</p>
        </div>
        
        <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700">
            <div 
                className="h-full bg-gradient-to-r from-[#FA8072] to-orange-400 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        
        <div className="text-white font-black text-3xl mb-1">{progress}%</div>
        <p className="text-gray-400 font-bold text-[10px] animate-pulse">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuth') === 'true');
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [loading, setLoading] = useState({ progress: 0, message: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => {
    const saved = localStorage.getItem('lastSyncTime');
    return saved ? new Date(saved) : new Date();
  });
  
  const [showLock, setShowLock] = useState<{ target: string } | null>(null);
  const [lockPass, setLockPass] = useState('');
  const [lockError, setLockError] = useState(false);

  const [sales, setSales] = useState<SaleItem[]>(() => JSON.parse(localStorage.getItem('dailySales') || '[]'));
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => JSON.parse(localStorage.getItem('dailyPurchaseInvoices') || '[]'));
  const [history, setHistory] = useState<ArchivedDay[]>(() => JSON.parse(localStorage.getItem('salesHistory') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('customers') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem('suppliers') || '[]'));
  
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[] | null>(null);
  const [modals, setModals] = useState({ products: false, customers: false, history: false, data: false, expenses: false, analytics: false });

  // Instant persistence on any state change
  useEffect(() => {
    const saveData = () => {
      localStorage.setItem('dailySales', JSON.stringify(sales));
      localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
      localStorage.setItem('salesHistory', JSON.stringify(history));
      localStorage.setItem('products', JSON.stringify(products));
      localStorage.setItem('customers', JSON.stringify(customers));
      localStorage.setItem('suppliers', JSON.stringify(suppliers));
    };
    saveData();
  }, [sales, purchaseInvoices, history, products, customers, suppliers]);

  const handleOpenProtected = (target: string) => {
    setShowLock({ target });
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    // Explicitly re-save everything and simulate sync animation
    setTimeout(() => {
        const now = new Date();
        localStorage.setItem('dailySales', JSON.stringify(sales));
        localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
        localStorage.setItem('salesHistory', JSON.stringify(history));
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        localStorage.setItem('lastSyncTime', now.toISOString());
        
        setLastSyncTime(now);
        setIsSyncing(false);
    }, 1000);
  };

  const fullReset = useCallback(() => {
    if (confirm('هل أنت متأكد تماماً؟ سيتم مسح كافة البيانات (أصناف، عملاء، سجل، مبيعات) بشكل نهائي!')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('تم تصفير كافة بيانات الموقع بنجاح.');
        window.location.reload();
    }
  }, []);

  const verifyLock = () => {
    if (lockPass === '1997') {
      if (showLock?.target === 'full_reset') {
          fullReset();
      } else if (showLock) {
          setModals(m => ({ ...m, [showLock.target]: true }));
      }
      setShowLock(null);
      setLockPass('');
      setLockError(false);
    } else {
      setLockError(true);
    }
  };

  const handleExport = useCallback(() => {
    const data = { 
        version: '1.5', 
        backupDate: new Date().toISOString(),
        sales, purchaseInvoices, history, products, customers, suppliers 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cookies-bakery-backup-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sales, purchaseInvoices, history, products, customers, suppliers]);

  const handleImport = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.sales) localStorage.setItem('dailySales', JSON.stringify(data.sales));
              if (data.purchaseInvoices) localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(data.purchaseInvoices));
              if (data.history) localStorage.setItem('salesHistory', JSON.stringify(data.history));
              if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
              if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
              if (data.suppliers) localStorage.setItem('suppliers', JSON.stringify(data.suppliers));
              alert('تم استعادة البيانات بنجاح!');
              window.location.reload();
          } catch (err) { alert('فشل الاستعادة!'); }
      };
      reader.readAsText(file);
  }, []);

  const handleLogin = () => {
      setIsAppLoading(true);
      const stages = [
          { p: 15, m: 'جاري التحقق من الصلاحيات...' },
          { p: 40, m: 'تحميل قائمة المنتجات...' },
          { p: 65, m: 'جلب سجلات المبيعات اليومية...' },
          { p: 90, m: 'تحضير واجهة المستخدم...' },
          { p: 100, m: 'اكتمل التحميل' }
      ];

      stages.forEach((stage, index) => {
          setTimeout(() => {
              setLoading({ progress: stage.p, message: stage.m });
              if (index === stages.length - 1) {
                  setTimeout(() => {
                      sessionStorage.setItem('isAuth', 'true');
                      setIsAuthenticated(true);
                      setIsAppLoading(false);
                  }, 400);
              }
          }, (index + 1) * 300);
      });
  };

  const completeOrder = useCallback((items: any[], name?: string, id?: string, type: SaleType = 'retail') => {
      const orderId = Date.now().toString();
      const time = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
      const currentNums = sales.map(s => Number(s.customerNumber)).filter(n => !isNaN(n));
      const nextNum = currentNums.length > 0 ? Math.max(...currentNums) + 1 : 1;
      const finalItems = items.map(i => ({ 
        ...i, 
        id: Math.random().toString(36).substring(2, 11), 
        orderId, 
        customerNumber: nextNum, 
        customerName: name || '', 
        customerId: id || '', 
        saleType: type, 
        time 
      }));
      setSales(prev => [...prev, ...finalItems]);
  }, [sales]);

  if (isAppLoading) return <LoadingScreen progress={loading.progress} message={loading.message} />;
  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 print:bg-white">
      <Header 
        onOpenHistory={() => handleOpenProtected('history')} 
        onOpenDataManagement={() => handleOpenProtected('data')} 
        onOpenExpenses={() => handleOpenProtected('expenses')}
        onOpenAnalytics={() => handleOpenProtected('analytics')}
        isOnline={navigator.onLine} 
        lastSyncTime={lastSyncTime} 
        onManualSync={handleManualSync} 
        onQuickBackup={handleExport}
        isSyncing={isSyncing}
      />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl">
        
        <div className="mb-6">
            <Summary items={sales} onPreview={() => setInvoiceItems(sales)} />
        </div>

        <POSInterface onCompleteOrder={completeOrder} products={products} customers={customers} onOpenProductManager={() => setModals(m => ({...m, products: true}))} onOpenCustomerManager={() => setModals(m => ({...m, customers: true}))} />
        
        <div className="mt-8">
            <SalesTable 
                items={sales} 
                onDeleteItem={id => setSales(s => s.filter(i => i.id !== id))} 
                onDeleteOrder={oid => setSales(s => s.filter(i => i.orderId !== oid))} 
                onPreviewInvoice={setInvoiceItems}
                onUpdateItemPrice={(id, p) => setSales(s => s.map(i => i.id === id ? {...i, price: p} : i))}
            />
        </div>
      </main>

      <footer className="mt-12 py-8 border-t border-gray-800/50 bg-gray-900/50 no-print">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-4">
             <div className="flex items-center gap-3">
                 <button 
                    onClick={() => handleOpenProtected('full_reset')}
                    className="text-gray-500 text-xs font-bold hover:text-gray-400 transition-colors"
                 >
                    نسخة النظام v1.5 &copy; 2026
                 </button>
             </div>
             <div className="flex items-center gap-2 text-gray-700 text-[10px] font-bold">
                <Database size={10} />
                <span>البيانات مخزنة محلياً في المتصفح وتعمل بدون انترنت</span>
             </div>
        </div>
      </footer>

      <Suspense fallback={<ModalLoader />}>
        {modals.analytics && <AnalyticsModal history={history} currentSales={sales} currentPurchases={purchaseInvoices} onClose={() => setModals(m => ({ ...m, analytics: false }))} />}
        {modals.expenses && <ExpensesModal isOpen={modals.expenses} onClose={() => setModals(m => ({...m, expenses: false}))} currentPurchases={purchaseInvoices} archivedHistory={history} onAddInvoice={v => setPurchaseInvoices(p => [...p, v])} onDeleteInvoice={id => setPurchaseInvoices(p => p.filter(v => v.id !== id))} suppliers={suppliers} onAddSupplier={s => setSuppliers(p => [...p, {...s, id: Date.now().toString()}])} onDeleteSupplier={id => setSuppliers(p => p.filter(s => s.id !== id))} />}
        {modals.history && <HistoryModal history={history} onClose={() => setModals(m => ({...m, history: false}))} onClearHistory={() => setHistory([])} onPreviewInvoice={setInvoiceItems} onUpdateOrder={(d, o, i) => setHistory(h => h.map(day => day.date === d ? {...day, items: day.items.map(item => item.orderId === o ? i.find(x => x.id === item.id) || item : item)} : day))} />}
        {modals.products && <ProductManager isOpen={modals.products} onClose={() => setModals(m => ({...m, products: false}))} products={products} onAddProduct={p => setProducts(s => [...s, {...p, id: Date.now().toString()}])} onUpdateProduct={(id, u) => setProducts(s => s.map(p => p.id === id ? {...p, ...u} : p))} onDeleteProduct={id => setProducts(s => s.filter(p => p.id !== id))} />}
        {modals.customers && <CustomerManager isOpen={modals.customers} onClose={() => setModals(m => ({...m, customers: false}))} customers={customers} onAddCustomer={c => setCustomers(s => [...s, {...c, id: Date.now().toString()}])} onDeleteCustomer={id => setCustomers(s => s.filter(c => c.id !== id))} />}
        {modals.data && <DataManagementModal onClose={() => setModals(m => ({...m, data: false}))} onExport={handleExport} onImport={handleImport} />}
        {invoiceItems && <InvoiceModal items={invoiceItems} onClose={() => setInvoiceItems(null)} />}
      </Suspense>

      {showLock && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-xs shadow-2xl animate-fade-up">
            <div className="flex justify-between items-center mb-4">
                <Lock className="text-[#FA8072]" size={24} />
                <button onClick={() => {setShowLock(null); setLockPass('');}} className="text-gray-500"><X size={20}/></button>
            </div>
            <h3 className="text-white font-bold mb-4">
                {showLock.target === 'full_reset' ? 'تصفير شامل للبيانات' : 'القسم مقفل'}
            </h3>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                {showLock.target === 'full_reset' ? 'تحذير: هذا الخيار سيمسح كل شيء في الموقع (الأصناف، العملاء، السجل). أدخل كلمة السر للمتابعة.' : 
                 'أدخل كلمة المرور للمتابعة.'}
            </p>
            {showLock.target === 'full_reset' && (
                <div className="flex items-center gap-2 bg-red-900/20 p-2 rounded-lg border border-red-500/20 mb-4 text-red-400">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-bold">هذه العملية لا يمكن التراجع عنها!</span>
                </div>
            )}
            <input 
              type="password" 
              value={lockPass} 
              onChange={e => setLockPass(e.target.value)} 
              placeholder="أدخل كلمة المرور"
              className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-xl mb-3 text-center outline-none focus:border-[#FA8072]"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && verifyLock()}
            />
            {lockError && <p className="text-red-500 text-xs text-center mb-3">خطأ في كلمة المرور!</p>}
            <button onClick={verifyLock} className="w-full bg-[#FA8072] text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-orange-900/20">تأكيد العملية</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
