import React, { useState, useEffect, Suspense } from 'react';
import { Header } from './components/Header';
import { POSInterface } from './components/RecipeGenerator';
import { SalesTable } from './components/Menu';
import { Summary } from './components/InfoBox';
import { Login } from './components/Login';
import { SaleItem, Product, ArchivedDay } from './types';
import { Save, RotateCcw, X, Loader2 } from 'lucide-react';

// Lazy Load Heavy Components (Code Splitting)
// These components won't be downloaded until the user needs them
const InvoiceModal = React.lazy(() => import('./components/InvoiceModal').then(module => ({ default: module.InvoiceModal })));
const ProductManager = React.lazy(() => import('./components/ProductManager').then(module => ({ default: module.ProductManager })));
const HistoryModal = React.lazy(() => import('./components/HistoryModal').then(module => ({ default: module.HistoryModal })));
const DataManagementModal = React.lazy(() => import('./components/DataManagementModal').then(module => ({ default: module.DataManagementModal })));

// Default initial products - Empty list as requested
const DEFAULT_PRODUCTS: Product[] = [];

// --- ROBUST ONLINE STATUS HOOK ---
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // 1. Listen to browser events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Poll navigator.onLine every 2 seconds as a fallback
    const intervalId = setInterval(() => {
      if (navigator.onLine !== isOnline) {
        setIsOnline(navigator.onLine);
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return isOnline;
};

// Loading Spinner for Lazy Components
const ModalLoader = () => (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
        <div className="bg-gray-800 p-4 rounded-full shadow-xl border border-gray-700">
            <Loader2 className="animate-spin text-[#FA8072]" size={32} />
        </div>
    </div>
);

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuth') === 'true';
  });

  // Connectivity State
  const isOnline = useOnlineStatus();

  // Sync State
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Sales State (Current Day)
  const [sales, setSales] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem('dailySales');
    return saved ? JSON.parse(saved) : [];
  });

  // History State (Archived Days)
  const [history, setHistory] = useState<ArchivedDay[]>(() => {
    const saved = localStorage.getItem('salesHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Products State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  // Undo State
  const [undoState, setUndoState] = useState<{ items: SaleItem[], timerId: ReturnType<typeof setTimeout> } | null>(null);

  // --- PERSISTENCE & STORAGE HANDLERS (AUTO SYNC) ---
  
  // Ask browser for Persistent Storage
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) console.log("Storage persistence granted");
      });
    }
  }, []);

  // --- PWA INSTALL HANDLER ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      console.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null);
  };

  // Sync Handler helper
  const updateLastSync = () => {
    setLastSyncTime(new Date());
  };

  // Instant Save Listeners + Auto Sync Timestamp
  useEffect(() => {
    localStorage.setItem('dailySales', JSON.stringify(sales));
    updateLastSync();
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('salesHistory', JSON.stringify(history));
    updateLastSync();
  }, [history]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    updateLastSync();
  }, [products]);

  // Manual Sync Handler
  const handleManualSync = () => {
    setIsSyncing(true);
    // Simulate a check/save process
    setTimeout(() => {
      // Re-save everything to be absolutely sure
      localStorage.setItem('dailySales', JSON.stringify(sales));
      localStorage.setItem('salesHistory', JSON.stringify(history));
      localStorage.setItem('products', JSON.stringify(products));
      
      setLastSyncTime(new Date());
      setIsSyncing(false);
    }, 800); // Visual delay for feedback
  };

  // Auth Handler
  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuth', 'true');
  };

  // Logic to calculate next customer number based on existing sales
  const getNextCustomerNumber = () => {
      if (sales.length === 0) return 1;
      const maxNum = Math.max(...sales.map(s => s.customerNumber || 0));
      return maxNum + 1;
  };

  // Handler for adding a complete order (Multiple items)
  const handleCompleteOrder = (newItems: Omit<SaleItem, 'id' | 'time' | 'customerNumber' | 'orderId'>[], customerName?: string) => {
    const currentTime = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
    const orderId = Date.now().toString(); 
    const customerNumber = getNextCustomerNumber(); 

    const itemsWithIds: SaleItem[] = newItems.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9), 
        orderId: orderId,
        customerNumber: customerNumber,
        customerName: customerName || undefined,
        time: currentTime
    }));

    setSales(prev => [...prev, ...itemsWithIds]);
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = sales.find(item => String(item.id) === String(id));
    if (!itemToDelete) return;

    if (undoState?.timerId) clearTimeout(undoState.timerId);

    setSales(prev => prev.filter(item => String(item.id) !== String(id)));

    const timerId = setTimeout(() => {
        setUndoState(null);
    }, 5000);

    setUndoState({ items: [itemToDelete], timerId });
  };

  const handleDeleteOrder = (orderId: string) => {
    const itemsToDelete = sales.filter(item => String(item.orderId) === String(orderId));
    if (itemsToDelete.length === 0) return;

    if (undoState?.timerId) clearTimeout(undoState.timerId);

    setSales(prev => prev.filter(item => String(item.orderId) !== String(orderId)));

    const timerId = setTimeout(() => {
        setUndoState(null);
    }, 5000);

    setUndoState({ items: itemsToDelete, timerId });
  };

  const handleUndo = () => {
      if (!undoState) return;
      if (undoState.timerId) clearTimeout(undoState.timerId);
      
      setSales(prev => [...prev, ...undoState.items]);
      setUndoState(null);
  };

  const handleEndDay = () => {
    if (sales.length === 0) {
        alert('لا توجد مبيعات لترحيلها.');
        return;
    }

    if (confirm('سيتم إغلاق اليوم الحالي وترحيل جميع المبيعات إلى الأرشيف. هل أنت متأكد؟')) {
        const totalRevenue = sales.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = sales.reduce((sum, item) => sum + item.quantity, 0);

        const daySummary: ArchivedDay = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('ar-SY'),
            timestamp: Date.now(),
            totalRevenue,
            totalItems,
            items: [...sales] // Keep a copy of items
        };

        setHistory(prev => [daySummary, ...prev]);
        setSales([]); // Safe to clear now
        setUndoState(null); // Clear undo stack on end day
        alert('تم إغلاق اليوم وحفظ البيانات في الأرشيف بنجاح.');
    }
  };

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const product: Product = {
        ...newProduct,
        id: Date.now().toString()
    };
    setProducts(prev => [...prev, product]);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
  };

  // --- EXPORT / IMPORT LOGIC ---
  const handleExportData = () => {
    const data = {
        appVersion: '1.0',
        timestamp: Date.now(),
        sales,
        history,
        products
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toLocaleDateString('ar-SY').replace(/\//g, '-');
    link.href = url;
    link.download = `cookies-bakery-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              if (!data || typeof data !== 'object') {
                  throw new Error('Invalid file format');
              }

              let updatedCount = 0;

              if (Array.isArray(data.sales)) {
                  setSales(data.sales);
                  updatedCount++;
              }
              if (Array.isArray(data.history)) {
                  setHistory(data.history);
                  updatedCount++;
              }
              if (Array.isArray(data.products)) {
                  setProducts(data.products);
                  updatedCount++;
              }
              
              if (updatedCount > 0) {
                  alert('تم استعادة البيانات وتحديث الواجهة بنجاح!');
              } else {
                  alert('لم يتم العثور على بيانات صالحة في الملف.');
              }
              
          } catch (error) {
              console.error('Import Error:', error);
              alert('حدث خطأ أثناء قراءة الملف. يرجى التأكد من أن الملف صالح.');
          }
      };
      reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 print:bg-white">
      <Header 
        onOpenHistory={() => setShowHistory(true)} 
        onOpenDataManagement={() => setShowDataModal(true)}
        isOnline={isOnline}
        lastSyncTime={lastSyncTime}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        installPrompt={installPrompt}
        onInstall={handleInstallClick}
      />
      
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl">
        
        <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold mb-2 text-black">تقرير المبيعات اليومي</h1>
            <p className="text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-SY')}</p>
            <p className="text-gray-600">مخبز كوكيز</p>
        </div>

        <Summary items={sales} onPreview={() => setShowInvoice(true)} />

        <div className="mb-8">
            <POSInterface 
                onCompleteOrder={handleCompleteOrder} 
                products={products}
                onOpenProductManager={() => setShowProductManager(true)}
            />
        </div>

        <div className="mb-20 print:mb-0 border-t border-gray-700 pt-8">
            <div className="flex items-center justify-between mb-4 no-print">
                <h3 className="text-xl font-bold text-white">سجل الزبائن والمبيعات (اليوم الحالي)</h3>
                {sales.length > 0 && (
                    <button 
                        onClick={handleEndDay}
                        className="flex items-center gap-2 bg-green-900/40 hover:bg-green-900/60 text-green-400 px-4 py-2 rounded-xl transition-colors border border-green-800"
                    >
                        <Save size={18} />
                        <span className="font-bold">إغلاق اليوم (أرشفة وحفظ)</span>
                    </button>
                )}
            </div>
            
            <SalesTable 
                items={sales} 
                onDeleteItem={handleDeleteItem} 
                onDeleteOrder={handleDeleteOrder}
            />
        </div>
      </main>

      {undoState && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-6 z-50 animate-fade-up min-w-[300px] justify-between">
              <span className="text-sm font-medium">تم حذف {undoState.items.length > 1 ? 'الطلب' : 'العنصر'}</span>
              <div className="flex items-center gap-4">
                  <button 
                      onClick={handleUndo}
                      className="text-[#FA8072] font-bold text-sm flex items-center gap-1 hover:text-[#ff9a8d] transition-colors"
                  >
                      <RotateCcw size={16} />
                      تراجع
                  </button>
                  <button 
                      onClick={() => {
                          if (undoState.timerId) clearTimeout(undoState.timerId);
                          setUndoState(null);
                      }}
                      className="text-gray-500 hover:text-white transition-colors border-r border-gray-600 pr-4 mr-1"
                  >
                      <X size={16} />
                  </button>
              </div>
          </div>
      )}

      {showInvoice && (
        <Suspense fallback={<ModalLoader />}>
            <InvoiceModal items={sales} onClose={() => setShowInvoice(false)} />
        </Suspense>
      )}

      {showHistory && (
        <Suspense fallback={<ModalLoader />}>
            <HistoryModal 
                history={history} 
                onClose={() => setShowHistory(false)} 
                onClearHistory={() => setHistory([])}
            />
        </Suspense>
      )}
      
      {showProductManager && (
         <Suspense fallback={<ModalLoader />}>
            <ProductManager 
                isOpen={showProductManager}
                onClose={() => setShowProductManager(false)}
                products={products}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
            />
         </Suspense>
      )}

      {showDataModal && (
        <Suspense fallback={<ModalLoader />}>
            <DataManagementModal 
                onClose={() => setShowDataModal(false)}
                onExport={handleExportData}
                onImport={handleImportData}
            />
        </Suspense>
      )}

      <footer className="text-center py-6 text-gray-500 text-sm no-print mt-auto">
        <p>نظام محاسبة مخبز كوكيز - نسخة الويب</p>
      </footer>
    </div>
  );
};

export default App;