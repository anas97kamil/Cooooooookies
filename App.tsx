
import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay, SaleType, Customer, PurchaseInvoice, Supplier } from './types';
import { Loader2, X, ShieldCheck, Wifi, WifiOff, CloudDownload, CheckCircle2, AlertCircle, Download, AlertTriangle } from 'lucide-react';

const InvoiceModal = React.lazy(() => import('./components/InvoiceModal').then(m => ({ default: m.InvoiceModal })));
const ProductManager = React.lazy(() => import('./components/ProductManager').then(m => ({ default: m.ProductManager })));
const HistoryModal = React.lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const DataManagementModal = React.lazy(() => import('./components/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const CustomerManager = React.lazy(() => import('./components/CustomerManager').then(m => ({ default: m.CustomerManager })));
const ExpensesModal = React.lazy(() => import('./components/ExpensesModal').then(m => ({ default: m.ExpensesModal })));
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal').then(m => ({ default: m.AnalyticsModal })));

const ModalLoader = () => <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"><div className="bg-gray-800 p-4 rounded-full border border-gray-700"><Loader2 className="animate-spin text-[#FA8072]" size={32} /></div></div>;

const WelcomeLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-[300] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-[#FA8072]/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="relative z-10 max-w-sm w-full">
        <div className="mb-8 relative">
           <div className="w-24 h-24 bg-gradient-to-tr from-[#FA8072] to-orange-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/20 animate-bounce">
              <ShieldCheck className="text-white" size={48} />
           </div>
           {progress === 100 && (
             <div className="absolute -right-2 -bottom-2 bg-green-500 text-white p-1 rounded-full animate-fade-up">
                <CheckCircle2 size={24} />
             </div>
           )}
        </div>
        <h2 className="text-2xl font-black text-white mb-2 animate-fade-up">أهلاً بك في مخبز كوكيز</h2>
        <p className="text-gray-400 text-sm font-bold mb-8 h-10">
          {progress < 40 && "جاري الاتصال بقاعدة البيانات المحلية..."}
          {progress >= 40 && progress < 80 && "تأمين الملفات للعمل بوضعية الأوفلاين..."}
          {progress >= 80 && progress < 100 && "مزامنة البيانات السحابية..."}
          {progress === 100 && "النظام جاهز للعمل الآن"}
        </p>
        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-gray-700 mb-4 p-0.5">
          <div className="h-full bg-gradient-to-r from-[#FA8072] to-orange-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-orange-500/30" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
             {isOnline ? (
               <Wifi size={14} className={progress < 100 ? "animate-pulse text-blue-400" : "text-green-500"} />
             ) : (
               <WifiOff size={14} className="text-red-500 animate-pulse" />
             )}
             <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-gray-500' : 'text-red-500'}`}>
               {isOnline ? 'OFFLINE READY' : 'WORKING OFFLINE'}
             </span>
          </div>
          <span className="text-[#FA8072] font-black tabular-nums">{progress}%</span>
        </div>
      </div>
      <div className="absolute bottom-10 flex items-center gap-2 text-gray-600">
          <CloudDownload size={14} />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">Downloading System Assets</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuth') === 'true');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());
  const [showLock, setShowLock] = useState<{ target: string } | null>(null);
  const [lockPass, setLockPass] = useState('');
  const [lockError, setLockError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [systemPassword, setSystemPassword] = useState(() => localStorage.getItem('systemPassword') || '2026');

  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const lastBackupTimestamp = useRef<number>(Date.now());

  const [sales, setSales] = useState<SaleItem[]>(() => JSON.parse(localStorage.getItem('dailySales') || '[]'));
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => JSON.parse(localStorage.getItem('dailyPurchaseInvoices') || '[]'));
  const [history, setHistory] = useState<ArchivedDay[]>(() => JSON.parse(localStorage.getItem('salesHistory') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('customers') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem('suppliers') || '[]'));
  
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[] | null>(null);
  const [modals, setModals] = useState({ products: false, customers: false, history: false, data: false, expenses: false, analytics: false });

  const handleLogout = () => {
    sessionStorage.removeItem('isAuth');
    setIsAuthenticated(false);
  };

  const handleOpenProtected = (target: string) => {
    setShowLock({ target });
  };

  const completeOrder = useCallback((items: any[], customerName?: string, customerId?: string, saleType: SaleType = 'retail') => {
    const orderId = Date.now().toString();
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const todayDate = new Date().toLocaleDateString('ar-SY');
    
    // الحل الجديد: حساب رقم الفاتورة بناءً على المبيعات الحالية + الأرشيف لهذا اليوم
    // 1. البحث عن أعلى رقم في المبيعات النشطة لليوم
    const activeTodaySales = sales.filter(s => s.date === todayDate);
    const activeMax = activeTodaySales.length > 0 
      ? Math.max(...activeTodaySales.map(s => s.customerNumber)) 
      : 0;

    // 2. البحث عن أعلى رقم في الأرشيف لنفس تاريخ اليوم
    const archivedToday = history.find(h => h.date === todayDate);
    const archivedMax = (archivedToday && archivedToday.items.length > 0)
      ? Math.max(...archivedToday.items.map(s => s.customerNumber))
      : 0;

    // 3. الرقم التالي هو الأكبر بينهما + 1
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
  }, [sales, history]); // أضفنا التاريخ للتبع

  const handleUpdateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const handleUpdateArchivedOrder = (dayId: string, orderId: string, updatedItems: SaleItem[], newCustomerName?: string) => {
    setHistory(prev => prev.map(day => {
      if (day.id === dayId) {
        const otherItems = day.items.filter(item => item.orderId !== orderId);
        const finalItems = [...otherItems, ...updatedItems.map(it => ({ ...it, customerName: newCustomerName || it.customerName }))];
        return {
          ...day,
          items: finalItems,
          totalRevenue: finalItems.reduce((s, i) => s + (i.price * i.quantity), 0),
          totalItems: finalItems.length
        };
      }
      return day;
    }));
  };

  const handleDeleteArchivedOrder = (dayId: string, orderId: string) => {
    setHistory(prev => {
      const updated = prev.map(day => {
        if (day.id === dayId) {
          const finalItems = day.items.filter(item => item.orderId !== orderId);
          return {
            ...day,
            items: finalItems,
            totalRevenue: finalItems.reduce((s, i) => s + (i.price * i.quantity), 0),
            totalItems: finalItems.length
          };
        }
        return day;
      });
      return updated.filter(day => day.items.length > 0 || (day.purchaseInvoices && day.purchaseInvoices.length > 0));
    });
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuth', 'true');
    setIsInitializing(true);
  };

  const finalizeLogin = () => {
    setIsInitializing(false);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const CHECK_INTERVAL = 60 * 1000; 
    const REMINDER_INTERVAL = 60 * 60 * 1000; 
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastBackupTimestamp.current >= REMINDER_INTERVAL) {
        setShowBackupReminder(true);
      }
    }, CHECK_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('dailySales', JSON.stringify(sales));
    localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
    localStorage.setItem('salesHistory', JSON.stringify(history));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('systemPassword', systemPassword);
    setLastSyncTime(new Date());
  }, [sales, purchaseInvoices, history, products, customers, suppliers, systemPassword]);

  const verifyLock = () => {
    if (lockPass === systemPassword) {
      if (showLock?.target === 'full_reset') {
          localStorage.clear();
          window.location.reload();
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

  const handleArchiveDay = useCallback(() => {
      if (sales.length === 0 && purchaseInvoices.length === 0) {
          alert('لا توجد عمليات مبيعات أو مشتريات نشطة حالياً لترحيلها.');
          return;
      }
      
      const confirmed = window.confirm('هل أنت متأكد من ترحيل المبيعات للأرشيف وتصفير اليوم؟ \n\nسيتم توزيع كل فاتورة حسب تاريخها الأصلي في السجلات التاريخية.');
      if (!confirmed) return;

      try {
          const currentSales = [...sales];
          const currentPurchases = [...purchaseInvoices];

          const salesMap = new Map<string, SaleItem[]>();
          currentSales.forEach(s => {
              const d = s.date;
              if (!salesMap.has(d)) salesMap.set(d, []);
              salesMap.get(d)!.push(s);
          });

          const purchaseMap = new Map<string, PurchaseInvoice[]>();
          currentPurchases.forEach(p => {
              const d = p.date;
              if (!purchaseMap.has(d)) purchaseMap.set(d, []);
              purchaseMap.get(d)!.push(p);
          });

          const allUniqueDates = Array.from(new Set([...salesMap.keys(), ...purchaseMap.keys()]));

          setHistory(prev => {
              const newHistory = [...prev];
              
              allUniqueDates.forEach(dateStr => {
                  const daySales = salesMap.get(dateStr) || [];
                  const dayPurchases = purchaseMap.get(dateStr) || [];
                  
                  const rev = daySales.reduce((s, i) => s + (i.price * i.quantity), 0);
                  const exp = dayPurchases.reduce((s, i) => s + i.totalAmount, 0);
                  
                  const existingIdx = newHistory.findIndex(h => h.date === dateStr);
                  
                  if (existingIdx !== -1) {
                      newHistory[existingIdx] = {
                          ...newHistory[existingIdx],
                          items: [...newHistory[existingIdx].items, ...daySales],
                          purchaseInvoices: [...(newHistory[existingIdx].purchaseInvoices || []), ...dayPurchases],
                          totalRevenue: newHistory[existingIdx].totalRevenue + rev,
                          totalExpenses: newHistory[existingIdx].totalExpenses + exp,
                          totalItems: newHistory[existingIdx].totalItems + daySales.length
                      };
                  } else {
                      const refItem = daySales[0];
                      const ts = refItem ? parseInt(refItem.orderId) : Date.now();
                      
                      newHistory.push({
                          id: `arch-${dateStr.replace(/[^0-9]/g, '')}-${Date.now()}`,
                          date: dateStr,
                          timestamp: ts,
                          items: daySales,
                          purchaseInvoices: dayPurchases,
                          totalRevenue: rev,
                          totalExpenses: exp,
                          totalItems: daySales.length
                      });
                  }
              });

              return newHistory.sort((a, b) => b.timestamp - a.timestamp);
          });

          setSales([]);
          setPurchaseInvoices([]);
          alert('تم ترحيل البيانات وتصفير اليوم بنجاح!');
      } catch (error) {
          console.error('Archive Error:', error);
          alert('حدث خطأ أثناء الترحيل.');
      }
  }, [sales, purchaseInvoices]);

  const handleExportData = async () => {
    const backup = { 
      dailySales: sales, 
      dailyPurchaseInvoices: purchaseInvoices, 
      salesHistory: history, 
      products, 
      customers, 
      suppliers, 
      systemPassword,
      exportDate: new Date().toISOString() 
    };
    const jsonString = JSON.stringify(backup);
    try {
      const stream = new Blob([jsonString]).stream();
      const compressedStream = stream.pipeThrough(new (window as any).CompressionStream('gzip'));
      const response = new Response(compressedStream);
      const compressedBlob = await response.blob();
      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cookies-bakery-pro-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.bak`;
      link.click();
      URL.revokeObjectURL(url);
      lastBackupTimestamp.current = Date.now();
      setShowBackupReminder(false);
    } catch (err) {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cookies-bakery-legacy-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportData = async (file: File) => {
    try {
      let jsonString = '';
      if (file.name.endsWith('.bak')) {
        const stream = file.stream();
        const decompressedStream = stream.pipeThrough(new (window as any).DecompressionStream('gzip'));
        const response = new Response(decompressedStream);
        jsonString = await response.text();
      } else {
        jsonString = await file.text();
      }
      const data = JSON.parse(jsonString);
      if (data.dailySales) setSales(data.dailySales);
      if (data.dailyPurchaseInvoices) setPurchaseInvoices(data.dailyPurchaseInvoices);
      if (data.salesHistory) setHistory(data.salesHistory);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.systemPassword) setSystemPassword(data.systemPassword);
      alert('تمت استعادة البيانات بنجاح.');
    } catch (err) { 
      alert('خطأ في استعادة البيانات.'); 
    }
  };

  if (isInitializing) return <WelcomeLoader onComplete={finalizeLogin} />;
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
            <SalesTable items={sales} onDeleteItem={id => setSales(s => s.filter(i => i.id !== id))} onDeleteOrder={oid => setSales(s => s.filter(i => i.orderId !== oid))} onPreviewInvoice={setInvoiceItems} onUpdateItemPrice={(id, p) => setSales(s => s.map(i => i.id === id ? {...i, price: p} : i))} />
        </div>
      </main>
      
      {showBackupReminder && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 bg-gray-800 border border-orange-500/50 p-5 rounded-[2rem] shadow-2xl z-[150] animate-fade-up flex flex-col gap-4 no-print">
            <div className="flex items-start gap-4">
                <div className="bg-orange-500/20 p-3 rounded-2xl text-orange-500 shrink-0"><AlertCircle size={24} /></div>
                <div className="flex-1">
                    <h4 className="text-white font-black text-sm">تذكير أمان البيانات</h4>
                    <p className="text-gray-400 text-[10px] font-bold mt-1 leading-relaxed">لقد مر وقت طويل منذ آخر نسخة احتياطية.</p>
                </div>
                <button onClick={() => setShowBackupReminder(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <button onClick={handleExportData} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all"><Download size={14} /> نسخ مضغوط الآن</button>
        </div>
      )}

      <footer className="mt-12 py-8 border-t border-gray-800/50 text-center no-print">
         <button onClick={() => handleOpenProtected('full_reset')} className="text-gray-700 text-[10px] font-bold tracking-widest uppercase">نظام مبيعات كوكيز v2.6 • 2026</button>
      </footer>
      <Suspense fallback={<ModalLoader />}>
        {modals.analytics && <AnalyticsModal history={history} currentSales={sales} currentPurchases={purchaseInvoices} onClose={() => setModals(m => ({ ...m, analytics: false }))} />}
        {modals.expenses && <ExpensesModal isOpen={modals.expenses} onClose={() => setModals(m => ({...m, expenses: false}))} currentPurchases={purchaseInvoices} archivedHistory={history} onAddInvoice={v => setPurchaseInvoices(p => [...p, v])} onUpdateInvoice={v => setPurchaseInvoices(p => p.map(inv => inv.id === v.id ? v : inv))} onDeleteInvoice={id => setPurchaseInvoices(p => p.filter(v => v.id !== id))} suppliers={suppliers} onAddSupplier={s => setSuppliers(p => [...p, {...s, id: Date.now().toString()}])} onDeleteSupplier={id => setSuppliers(p => p.filter(s => s.id !== id))} />}
        {modals.history && <HistoryModal history={history} currentSales={sales} onClose={() => setModals(m => ({...m, history: false}))} onClearHistory={() => setHistory([])} onPreviewInvoice={setInvoiceItems} onUpdateOrder={handleUpdateArchivedOrder} onDeleteArchivedOrder={handleDeleteArchivedOrder} />}
        {modals.products && <ProductManager isOpen={modals.products} onClose={() => setModals(m => ({...m, products: false}))} products={products} onAddProduct={p => setProducts(s => [...s, {...p, id: Date.now().toString()}])} onUpdateProduct={handleUpdateProduct} onDeleteProduct={id => setProducts(s => s.filter(p => p.id !== id))} />}
        {modals.customers && <CustomerManager isOpen={modals.customers} onClose={() => setModals(m => ({...m, customers: false}))} customers={customers} onAddCustomer={c => setCustomers(s => [...s, {...c, id: Date.now().toString()}])} onDeleteCustomer={id => setCustomers(s => s.filter(c => c.id !== id))} />}
        {modals.data && <DataManagementModal onClose={() => setModals(m => ({...m, data: false}))} onExport={handleExportData} onImport={handleImportData} onArchiveDay={handleArchiveDay} systemPassword={systemPassword} setSystemPassword={setSystemPassword} />}
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
