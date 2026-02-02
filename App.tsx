import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay, SaleType, Customer, PurchaseInvoice, Supplier } from './types';
import { Loader2, X, ShieldCheck, Wifi, WifiOff, CloudDownload, CheckCircle2, AlertCircle, Download, AlertTriangle } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCEPyc4ojMA0VY7NlHAbc4EJOeNNg7AmDY",
  authDomain: "cookies-b96d3.firebaseapp.com",
  projectId: "cookies-b96d3",
  storageBucket: "cookies-b96d3.firebasestorage.app",
  messagingSenderId: "532458388984",
  appId: "1:532458388984:web:ce9db19d1c3130fb80aa0d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FA8072]/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
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
          {progress < 100 ? "جارٍ تحميل النظام..." : "النظام جاهز للعمل الآن"}
        </p>
        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-gray-700 mb-4 p-0.5">
          <div className="h-full bg-gradient-to-r from-[#FA8072] to-orange-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-orange-500/30" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
             {isOnline ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500 animate-pulse" />}
             <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-gray-500' : 'text-red-500'}`}>
               {isOnline ? 'ONLINE' : 'OFFLINE'}
             </span>
          </div>
          <span className="text-[#FA8072] font-black tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuth') === 'true');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Firebase Live Data
  const [sales, setSales] = useState<SaleItem[]>([]);
  const salesRef = collection(db, "sales");

  // Firestore - live sync
  useEffect(() => {
    const unsub = onSnapshot(salesRef, snapshot => {
      const data: SaleItem[] = [];
      snapshot.forEach(doc => data.push({ ...doc.data(), id: doc.id } as SaleItem));
      setSales(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuth', 'true');
    setIsInitializing(true);
  };
  const finalizeLogin = () => setIsInitializing(false); setIsAuthenticated(true);

  const completeOrder = useCallback(async (items: SaleItem[], name?: string) => {
    const orderId = Date.now().toString();
    const now = new Date();
    const finalItems = items.map(i => ({
      ...i,
      id: Math.random().toString(36).substring(2, 11),
      orderId,
      customerName: name || '',
      time: now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('ar-SY')
    }));

    for (const item of finalItems) {
      await addDoc(salesRef, item); // Firestore live add
    }
  }, []);

  if (isInitializing) return <WelcomeLoader onComplete={finalizeLogin} />;
  if (!isAuthenticated) return <Login onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 print:bg-white relative">
      <Header onLogout={() => { sessionStorage.removeItem('isAuth'); setIsAuthenticated(false); }} isOnline={isOnline} lastSyncTime={new Date()} />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl no-print">
        <Summary items={sales} onPreview={() => {}} onArchiveDay={() => {}} />
        <POSInterface products={[]} customers={[]} onCompleteOrder={completeOrder} onOpenProductManager={() => {}} onOpenCustomerManager={() => {}} />
        <div className="mt-8">
          <SalesTable items={sales} onDeleteItem={async (id) => {
            const docRef = doc(db, "sales", id);
            await updateDoc(docRef, { deleted: true }); // soft delete
          }} onDeleteOrder={() => {}} onPreviewInvoice={() => {}} onUpdateItemPrice={() => {}} />
        </div>
      </main>
      <Suspense fallback={<ModalLoader />}>
        <InvoiceModal items={sales} onClose={() => {}} />
      </Suspense>
    </div>
  );
};

export default App;
