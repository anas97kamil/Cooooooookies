
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay, SaleType, Customer, PurchaseInvoice, Supplier } from './types';
import { Loader2 } from 'lucide-react';

const InvoiceModal = React.lazy(() => import('./components/InvoiceModal').then(m => ({ default: m.InvoiceModal })));
const ProductManager = React.lazy(() => import('./components/ProductManager').then(m => ({ default: m.ProductManager })));
const HistoryModal = React.lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const DataManagementModal = React.lazy(() => import('./components/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const CustomerManager = React.lazy(() => import('./components/CustomerManager').then(m => ({ default: m.CustomerManager })));
const ExpensesModal = React.lazy(() => import('./components/ExpensesModal').then(m => ({ default: m.ExpensesModal })));
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal').then(m => ({ default: m.AnalyticsModal })));

const ModalLoader = () => <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"><div className="bg-gray-800 p-4 rounded-full border border-gray-700"><Loader2 className="animate-spin text-[#FA8072]" size={32} /></div></div>;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuth') === 'true');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());
  const [showLock, setShowLock] = useState<{ target: string } | null>(null);
  const [lockPass, setLockPass] = useState('');
  const [lockError, setLockError] = useState(false);

  // Core Data States with fail-safe initialization
  const [sales, setSales] = useState<SaleItem[]>(() => JSON.parse(localStorage.getItem('dailySales') || '[]'));
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => JSON.parse(localStorage.getItem('dailyPurchaseInvoices') || '[]'));
  const [history, setHistory] = useState<ArchivedDay[]>(() => JSON.parse(localStorage.getItem('salesHistory') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('customers') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem('suppliers') || '[]'));
  
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[] | null>(null);
  const [modals, setModals] = useState({ products: false, customers: false, history: false, data: false, expenses: false, analytics: false });

  // Real-time Persistence
  useEffect(() => {
    localStorage.setItem('dailySales', JSON.stringify(sales));
    localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
    localStorage.setItem('salesHistory', JSON.stringify(history));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    setLastSyncTime(new Date());
  }, [sales, purchaseInvoices, history, products, customers, suppliers]);

  const handleOpenProtected = (target: string) => setShowLock({ target });

  const verifyLock = () => {
    if (lockPass === '1997') {
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

  const completeOrder = useCallback((items: any[], name?: string, id?: string, type: SaleType = 'retail') => {
      const orderId = Date.now().toString();
      const time = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
      const nextNum = sales.length > 0 ? Math.max(...sales.map(s => s.customerNumber || 0)) + 1 : 1;
      
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
      setInvoiceItems(finalItems);
  }, [sales]);

  if (!isAuthenticated) return <Login onLogin={() => { sessionStorage.setItem('isAuth', 'true'); setIsAuthenticated(true); }} />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 print:bg-white">
      <Header 
        onOpenHistory={() => handleOpenProtected('history')} 
        onOpenDataManagement={() => handleOpenProtected('data')} 
        onOpenExpenses={() => handleOpenProtected('expenses')}
        onOpenAnalytics={() => setModals(m => ({...m, analytics: true}))}
        isOnline={navigator.onLine} 
        lastSyncTime={lastSyncTime} 
        onManualSync={() => setIsSyncing(true)} 
        onQuickBackup={() => {}} 
        isSyncing={isSyncing}
      />
      
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl">
        <Summary items={sales} onPreview={() => setInvoiceItems(sales)} />
        <POSInterface 
            onCompleteOrder={completeOrder} 
            products={products} 
            customers={customers} 
            onOpenProductManager={() => setModals(m => ({...m, products: true}))} 
            onOpenCustomerManager={() => setModals(m => ({...m, customers: true}))} 
        />
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

      <footer className="mt-12 py-8 border-t border-gray-800/50 text-center no-print">
         <button onClick={() => handleOpenProtected('full_reset')} className="text-gray-700 text-[10px] font-bold tracking-widest">نظام المبيعات v1.7 • 2026</button>
      </footer>

      <Suspense fallback={<ModalLoader />}>
        {modals.analytics && <AnalyticsModal history={history} currentSales={sales} currentPurchases={purchaseInvoices} onClose={() => setModals(m => ({ ...m, analytics: false }))} />}
        {modals.expenses && (
            <ExpensesModal 
                isOpen={modals.expenses} 
                onClose={() => setModals(m => ({...m, expenses: false}))} 
                currentPurchases={purchaseInvoices} 
                archivedHistory={history} 
                onAddInvoice={v => setPurchaseInvoices(p => [...p, v])} 
                onDeleteInvoice={id => setPurchaseInvoices(p => p.filter(v => v.id !== id))} 
                suppliers={suppliers} 
                onAddSupplier={s => setSuppliers(p => [...p, {...s, id: Date.now().toString()}])} 
                onDeleteSupplier={id => setSuppliers(p => p.filter(s => s.id !== id))} 
            />
        )}
        {modals.history && <HistoryModal history={history} onClose={() => setModals(m => ({...m, history: false}))} onClearHistory={() => setHistory([])} onPreviewInvoice={setInvoiceItems} onUpdateOrder={(d, o, i) => setHistory(h => h.map(day => day.date === d ? {...day, items: day.items.map(item => item.orderId === o ? i.find(x => x.id === item.id) || item : item)} : day))} />}
        {modals.products && <ProductManager isOpen={modals.products} onClose={() => setModals(m => ({...m, products: false}))} products={products} onAddProduct={p => setProducts(s => [...s, {...p, id: Date.now().toString()}])} onUpdateProduct={(id, u) => setProducts(s => s.map(p => p.id === id ? {...p, ...u} : p))} onDeleteProduct={id => setProducts(s => s.filter(p => p.id !== id))} />}
        {modals.customers && <CustomerManager isOpen={modals.customers} onClose={() => setModals(m => ({...m, customers: false}))} customers={customers} onAddCustomer={c => setCustomers(s => [...s, {...c, id: Date.now().toString()}])} onDeleteCustomer={id => setCustomers(s => s.filter(c => c.id !== id))} />}
        {modals.data && <DataManagementModal onClose={() => setModals(m => ({...m, data: false}))} onExport={() => {}} onImport={() => {}} />}
        {invoiceItems && <InvoiceModal items={invoiceItems} onClose={() => setInvoiceItems(null)} />}
      </Suspense>

      {showLock && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-xs shadow-2xl">
            <h3 className="text-white font-bold mb-4">القسم محمي</h3>
            <input type="password" value={lockPass} onChange={e => setLockPass(e.target.value)} placeholder="أدخل كلمة المرور" className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-xl mb-3 text-center outline-none focus:border-[#FA8072]" autoFocus onKeyDown={e => e.key === 'Enter' && verifyLock()} />
            {lockError && <p className="text-red-500 text-xs text-center mb-3">كلمة مرور خاطئة</p>}
            <button onClick={verifyLock} className="w-full bg-[#FA8072] text-white py-3 rounded-xl font-bold">تأكيد الدخول</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
