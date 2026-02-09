import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay, SaleType, Customer, PurchaseInvoice, Supplier } from './types';
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
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FA8072]/5 rounded-full blur-[150px]"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="mb-10 relative">
           <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FA8072]/20 to-transparent opacity-50"></div>
              <ShieldCheck className="text-[#FA8072] relative z-10" size={44} strokeWidth={1.5} />
           </div>
           <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FA8072] rounded-full blur-xl opacity-50 animate-pulse"></div>
        </div>

        <div className="space-y-4 mb-14">
            <h1 className="text-5xl font-black text-white tracking-tighter animate-fade-up">
                مرحباً
            </h1>
            <div className="h-0.5 w-12 bg-[#FA8072] mx-auto rounded-full opacity-60"></div>
        </div>

        {lastSessionTime && (
          <div className="mb-10 flex items-center gap-3 px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Clock size={16} className="text-[#FA8072]" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">آخر ظهور</span>
              <span className="text-xs text-slate-300 font-black tabular-nums">{lastSessionTime}</span>
            </div>
          </div>
        )}

        <div className="w-full max-w-xs px-4">
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800/50 p-0 mb-4">
              <div 
                className="h-full bg-[#FA8072] rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(250,128,114,0.3)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">System Authentication</span>
                <span className="text-[#FA8072] font-black tabular-nums text-[10px]">{progress}%</span>
            </div>
        </div>
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-1 opacity-40">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.5em]">
              Cookie Bakery Enterprise OS
          </div>
          <div className="text-slate-700 text-[8px] font-bold">Build v2.6.4-Pro • Secured</div>
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
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };
  
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

  const handleOpenProtected = (target: string, data?: any) => {
    setShowLock({ target, data });
  };

  const completeOrder = useCallback((items: any[], customerName?: string, customerId?: string, saleType: SaleType = 'retail') => {
    const orderId = Date.now().toString();
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayDate = new Date().toLocaleDateString('en-US');
    
    const activeTodaySales = sales.filter(s => s.date === todayDate);
    const activeMax = activeTodaySales.length > 0 
      ? Math.max(...activeTodaySales.map(s => s.customerNumber)) 
      : 0;

    const archivedToday = history.find(h => h.date === todayDate);
    const archivedMax = (archivedToday && archivedToday.items.length > 0)
      ? Math.max(...archivedToday.items.map(s => s.customerNumber))
      : 0;

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

  const handleDeleteArchivedDay = (dayId: string) => {
    setHistory(prev => prev.filter(day => day.id !== dayId));
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuth', 'true');
    setIsAuthenticated(true);
  };

  const finalizeWelcome = () => {
    setIsInitializing(false);
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
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    localStorage.setItem('dailySales', JSON.stringify(sales));
    localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
    localStorage.setItem('salesHistory', JSON.stringify(history));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('systemPassword', systemPassword);
    localStorage.setItem('lastSessionTime', formattedDate);
    
    setLastSyncTime(now);
  }, [sales, purchaseInvoices, history, products, customers, suppliers, systemPassword]);

  const verifyLock = () => {
    if (lockPass === systemPassword) {
      if (showLock?.target === 'full_reset') {
          localStorage.clear();
          window.location.reload();
      } else if (showLock?.target === 'clear_all_history') {
          setHistory([]);
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
        installPrompt={installPrompt}
        onInstall={handleInstall}
      />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl no-print">
        <Summary items={sales} onPreview={() => setInvoiceItems(sales)} systemPassword={systemPassword} />
        <POSInterface products={products} customers={customers} onCompleteOrder={completeOrder} onOpenProductManager={() => setModals(m => ({...m, products: true}))} onOpenCustomerManager={() => setModals(m => ({...m, customers: true}))} />
        <div className="mt-8">
            <SalesTable 
              items={sales} 
              onDeleteItem={(id: string) => setSales(s => s.filter(i => i.id !== id))} 
              onDeleteOrder={(oid: string) => setSales(s => s.filter(i => i.orderId !== oid))} 
              onPreviewInvoice={setInvoiceItems} 
              onUpdateItemPrice={(id: string, p: number) => setSales(s => s.map(i => i.id === id ? {...i, price: p} : i))} 
            />
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
        {modals.history && <HistoryModal history={history} currentSales={sales} onClose={() => setModals(m => ({...m, history: false}))} onPreviewInvoice={setInvoiceItems} onUpdateOrder={handleUpdateArchivedOrder} onDeleteArchivedOrder={handleDeleteArchivedOrder} onDeleteArchivedDay={handleDeleteArchivedDay} />}
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