
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

const ModalLoader = () => <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"><div className="bg-gray-800 p-4 rounded-full border border-gray-700"><Loader2 className="animate-spin text-[#FA8072]" size={32} /></div></div>;

const LoadingScreen = ({ progress, message }: { progress: number, message: string }) => {
    const radius = 70;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    return (
      <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-12"><h1 className="text-3xl font-black text-[#FA8072] mb-1">مخبز كوكيز</h1><p className="text-gray-500 text-xs font-bold uppercase">Optimized Engine</p></div>
        <div className="relative flex items-center justify-center mb-10">
            <svg height={radius * 2} width={radius * 2} className="transform rotate-[-90deg]">
                <circle stroke="#1e293b" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} fill="transparent" />
                <circle stroke="#FA8072" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.3s ease' }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} fill="transparent" />
            </svg>
            <div className="absolute text-white font-black text-2xl">{progress}%</div>
        </div>
        <div className="max-w-xs w-full bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-[#FA8072] mb-1"><Loader2 size={14} className="animate-spin" /><span className="text-[10px] font-bold tracking-widest uppercase">Syncing</span></div>
            <p className="text-gray-300 font-bold text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuth') === 'true');
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [loading, setLoading] = useState({ progress: 0, message: '' });

  const [sales, setSales] = useState<SaleItem[]>(() => JSON.parse(localStorage.getItem('dailySales') || '[]'));
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => JSON.parse(localStorage.getItem('dailyPurchaseInvoices') || '[]'));
  const [history, setHistory] = useState<ArchivedDay[]>(() => JSON.parse(localStorage.getItem('salesHistory') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('customers') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem('suppliers') || '[]'));
  
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[] | null>(null);
  const [modals, setModals] = useState({ products: false, customers: false, history: false, data: false, expenses: false });

  useEffect(() => {
    localStorage.setItem('dailySales', JSON.stringify(sales));
    localStorage.setItem('dailyPurchaseInvoices', JSON.stringify(purchaseInvoices));
    localStorage.setItem('salesHistory', JSON.stringify(history));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  }, [sales, purchaseInvoices, history, products, customers, suppliers]);

  // Optimized Syncing
  useEffect(() => {
    const date = new Date().toLocaleDateString('en-GB');
    setHistory(prev => {
      const idx = prev.findIndex(d => d.date === date);
      const data: ArchivedDay = {
        id: idx !== -1 ? prev[idx].id : Date.now().toString(),
        date, timestamp: idx !== -1 ? prev[idx].timestamp : Date.now(),
        totalRevenue: sales.reduce((s, i) => s + (i.price * i.quantity), 0),
        totalExpenses: purchaseInvoices.reduce((s, i) => s + i.totalAmount, 0),
        totalItems: sales.reduce((s, i) => s + i.quantity, 0),
        items: sales, purchaseInvoices
      };
      if (idx !== -1) { const n = [...prev]; n[idx] = data; return n; }
      return [data, ...prev];
    });
  }, [sales, purchaseInvoices]);

  const handleLogin = () => {
      setIsAppLoading(true);
      const steps = [
        { p: 30, m: 'تحميل البيانات...' },
        { p: 70, m: 'مزامنة الأرشيف...' },
        { p: 100, m: 'جاهز للعمل...' }
      ];
      let i = 0;
      const interval = setInterval(() => {
          if (i < steps.length) { setLoading({ progress: steps[i].p, message: steps[i].m }); i++; } 
          else { clearInterval(interval); sessionStorage.setItem('isAuth', 'true'); setIsAuthenticated(true); setIsAppLoading(false); }
      }, 400);
  };

  const completeOrder = useCallback((items: any[], name?: string, id?: string, type: SaleType = 'retail') => {
      const orderId = Date.now().toString();
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const customerNumber = sales.length ? Math.max(...sales.map(s => s.customerNumber)) + 1 : 1;
      const finalItems = items.map(i => ({ ...i, id: Math.random().toString(36).substr(2,9), orderId, customerNumber, customerName: name, customerId: id, saleType: type, time }));
      setSales(prev => [...prev, ...finalItems]);
  }, [sales]);

  if (isAppLoading) return <LoadingScreen progress={loading.progress} message={loading.message} />;
  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 print:bg-white">
      <Header 
        onOpenHistory={() => setModals({...modals, history: true})} onOpenDataManagement={() => setModals({...modals, data: true})} onOpenExpenses={() => setModals({...modals, expenses: true})}
        isOnline={navigator.onLine} lastSyncTime={new Date()} onManualSync={() => {}} isSyncing={false}
      />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl">
        <Summary items={sales} onPreview={() => setInvoiceItems(sales)} />
        <POSInterface onCompleteOrder={completeOrder} products={products} customers={customers} onOpenProductManager={() => setModals({...modals, products: true})} onOpenCustomerManager={() => setModals({...modals, customers: true})} />
        <div className="mt-8"><SalesTable items={sales} onDeleteItem={id => setSales(s => s.filter(i => i.id !== id))} onDeleteOrder={oid => setSales(s => s.filter(i => i.orderId !== oid))} onPreviewInvoice={setInvoiceItems} /></div>
      </main>

      <Suspense fallback={<ModalLoader />}>
        {modals.expenses && <ExpensesModal isOpen={modals.expenses} onClose={() => setModals({...modals, expenses: false})} currentPurchases={purchaseInvoices} archivedHistory={history} onAddInvoice={v => setPurchaseInvoices(p => [...p, v])} onDeleteInvoice={id => setPurchaseInvoices(p => p.filter(v => v.id !== id))} suppliers={suppliers} onAddSupplier={s => setSuppliers(p => [...p, {...s, id: Date.now().toString()}])} onDeleteSupplier={id => setSuppliers(p => p.filter(s => s.id !== id))} />}
        {modals.history && <HistoryModal history={history} onClose={() => setModals({...modals, history: false})} onClearHistory={() => setHistory([])} onPreviewInvoice={setInvoiceItems} />}
        {modals.products && <ProductManager isOpen={modals.products} onClose={() => setModals({...modals, products: false})} products={products} onAddProduct={p => setProducts(s => [...s, {...p, id: Date.now().toString()}])} onUpdateProduct={(id, u) => setProducts(p => p.map(it => it.id === id ? {...it, ...u} : it))} onDeleteProduct={id => setProducts(s => s.filter(p => p.id !== id))} />}
        {modals.customers && <CustomerManager isOpen={modals.customers} onClose={() => setModals({...modals, customers: false})} customers={customers} onAddCustomer={c => setCustomers(s => [...s, {...c, id: Date.now().toString()}])} onDeleteCustomer={id => setCustomers(s => s.filter(c => c.id !== id))} />}
        {modals.data && <DataManagementModal onClose={() => setModals({...modals, data: false})} onExport={() => {}} onImport={() => {}} />}
        {invoiceItems && <InvoiceModal items={invoiceItems} onClose={() => setInvoiceItems(null)} />}
      </Suspense>
      <footer className="text-center py-6 text-gray-500 text-sm no-print"><p>v1.4 Optimized</p></footer>
    </div>
  );
};

export default App;
