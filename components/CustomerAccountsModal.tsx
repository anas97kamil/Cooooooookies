import React, { useState } from 'react';
import { X, User, CreditCard, History, Search, ArrowDownCircle, ArrowUpCircle, Plus, CheckCircle } from 'lucide-react';
import { Customer, SaleItem, ArchivedDay, CustomerPayment } from '../types';

interface CustomerAccountsModalProps {
  customers: Customer[];
  history: ArchivedDay[];
  currentSales: SaleItem[];
  onUpdateCustomer: (customer: Customer) => void;
  onClose: () => void;
}

export const CustomerAccountsModal: React.FC<CustomerAccountsModalProps> = ({
  customers,
  history,
  currentSales,
  onUpdateCustomer,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);

  const customersWithTransactions = new Set([
    ...currentSales.map(s => s.customerId).filter(Boolean),
    ...history.flatMap(day => day.items.map(s => s.customerId)).filter(Boolean),
    ...customers.filter(c => (c.payments?.length || 0) > 0).map(c => c.id)
  ]);

  const accountCustomers = customers.filter(c => 
    c.isAccount || c.balance > 0 || customersWithTransactions.has(c.id)
  );
  const nonAccountCustomers = customers.filter(c => 
    !c.isAccount && c.balance === 0 && !customersWithTransactions.has(c.id)
  );
  const filteredCustomers = accountCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Get all transactions for the selected customer
  const getCustomerTransactions = (customerId: string, customer: Customer) => {
    const transactions: any[] = [];
    
    // Check current sales
    currentSales.forEach(sale => {
      if (sale.customerId === customerId) {
        transactions.push({
          id: sale.id,
          date: sale.date,
          time: sale.time,
          amount: sale.price * sale.quantity,
          type: sale.paymentStatus === 'credit' ? 'debt' : 'cash',
          description: `شراء: ${sale.name}`
        });
      }
    });

    // Check history
    history.forEach(day => {
      day.items.forEach(sale => {
        if (sale.customerId === customerId) {
          transactions.push({
            id: sale.id,
            date: sale.date,
            time: sale.time,
            amount: sale.price * sale.quantity,
            type: sale.paymentStatus === 'credit' ? 'debt' : 'cash',
            description: `شراء: ${sale.name}`
          });
        }
      });
    });

    // Check payments
    if (customer.payments) {
      customer.payments.forEach(p => {
        transactions.push({
          id: p.id,
          date: p.date,
          time: p.time,
          amount: p.amount,
          type: 'payment',
          description: 'تسديد دفعة'
        });
      });
    }

    return transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.time.localeCompare(a.time);
    });
  };

  const handlePayment = () => {
    if (!selectedCustomer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newPayment: CustomerPayment = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      date: new Date().toLocaleDateString('en-US'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      balance: Math.max(0, selectedCustomer.balance - amount),
      payments: [...(selectedCustomer.payments || []), newPayment]
    };

    onUpdateCustomer(updatedCustomer);
    setPaymentAmount('');
    alert('تم تسجيل الدفعة بنجاح');
  };

  const handleAddAccount = (customer: Customer) => {
    onUpdateCustomer({ ...customer, isAccount: true });
    setShowAddAccount(false);
    setSelectedCustomerId(customer.id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-700 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-indigo-500/20 p-2 rounded-xl">
              <CreditCard size={24} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-xl">كشف حسابات العملاء</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">متابعة المبيعات (نقدي / ذمم) والتحصيلات</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar: Customer List */}
          <div className="w-full md:w-80 border-l border-gray-700 flex flex-col bg-gray-900/30">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث عن عميل..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <button 
                onClick={() => setShowAddAccount(true)}
                className="w-full flex items-center justify-center gap-2 p-3 mb-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all font-black text-xs"
              >
                <Plus size={16} />
                إضافة حساب جديد
              </button>
              
              {filteredCustomers.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`w-full flex flex-col p-4 rounded-2xl transition-all text-right ${selectedCustomerId === cust.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-700/50 text-gray-400'}`}
                >
                  <span className="font-black text-sm mb-1">{cust.name}</span>
                  <span className={`text-xs font-bold ${selectedCustomerId === cust.id ? 'text-indigo-100' : cust.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {cust.balance > 0 ? `المطلوب: ${cust.balance.toLocaleString('en-US')} ل.س` : 'الحساب مسدد'}
                  </span>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center py-10 text-gray-600">
                  <User size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold">لا يوجد حسابات نشطة</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content: Details & Transactions */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-800/50">
            {selectedCustomer ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 bg-gray-900/40 border-b border-gray-700">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-2xl font-black text-white mb-1">{selectedCustomer.name}</h4>
                      <div className="flex items-center gap-2 text-red-400 font-black text-lg">
                        <span>إجمالي الدين:</span>
                        <span>{selectedCustomer.balance.toLocaleString('en-US')} ل.س</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-2xl border border-gray-700">
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="مبلغ الدفعة..."
                        className="bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-4 py-2 w-32 outline-none focus:border-green-500"
                      />
                      <button
                        onClick={handlePayment}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                      >
                        <ArrowDownCircle size={16} />
                        تسديد
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {/* Summary Cards */}
                  {(() => {
                    const transactions = getCustomerTransactions(selectedCustomer.id, selectedCustomer);
                    const totalCash = transactions.filter(t => t.type === 'cash').reduce((s, t) => s + t.amount, 0);
                    const totalDebt = transactions.filter(t => t.type === 'debt').reduce((s, t) => s + t.amount, 0);
                    const totalPaid = transactions.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);

                    return (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-green-400 mb-1">إجمالي النقدي</p>
                          <p className="text-sm font-black text-white">{totalCash.toLocaleString('en-US')}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-red-400 mb-1">إجمالي الديون</p>
                          <p className="text-sm font-black text-white">{totalDebt.toLocaleString('en-US')}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-blue-400 mb-1">إجمالي المسدد</p>
                          <p className="text-sm font-black text-white">{totalPaid.toLocaleString('en-US')}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <h5 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <History size={14} /> سجل الحركات (نقد / دين / تسديد)
                  </h5>
                  {getCustomerTransactions(selectedCustomer.id, selectedCustomer).map((t, idx) => (
                    <div key={idx} className="bg-gray-900/40 p-4 rounded-2xl border border-gray-700/50 flex justify-between items-center hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${t.type === 'debt' ? 'bg-red-500/10 text-red-400' : t.type === 'payment' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                          {t.type === 'debt' ? <ArrowUpCircle size={20} /> : t.type === 'payment' ? <ArrowDownCircle size={20} /> : <CheckCircle size={20} />}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{t.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-gray-500 font-bold">{t.date} - {t.time}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${t.type === 'debt' ? 'bg-red-500/20 text-red-400' : t.type === 'payment' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {t.type === 'debt' ? 'دين' : t.type === 'payment' ? 'تسديد' : 'نقد'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${t.type === 'debt' ? 'text-red-400' : t.type === 'payment' ? 'text-blue-400' : 'text-green-400'}`}>
                          {t.type === 'debt' ? '+' : t.type === 'payment' ? '-' : ''}{t.amount.toLocaleString('en-US')}
                        </p>
                        <p className="text-[8px] text-gray-600 font-black uppercase">SYP</p>
                      </div>
                    </div>
                  ))}
                  {getCustomerTransactions(selectedCustomer.id, selectedCustomer).length === 0 && (
                    <div className="text-center py-20 text-gray-600">
                      <p className="text-sm font-bold">لا يوجد حركات مسجلة</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-10">
                <div className="bg-gray-900/50 p-10 rounded-full mb-6 border border-gray-700">
                  <User size={64} className="opacity-10" />
                </div>
                <h4 className="text-lg font-black text-gray-500">اختر عميلاً لمعاينة حسابه</h4>
                <p className="text-xs font-bold mt-2">سيتم عرض جميع الديون والتحصيلات هنا</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Account Modal Overlay */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl border border-gray-700 animate-fade-up">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-black">إضافة حساب عميل</h3>
              <button onClick={() => setShowAddAccount(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
              {nonAccountCustomers.length > 0 ? (
                nonAccountCustomers.map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => handleAddAccount(cust)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-900/50 hover:bg-gray-700 transition-all border border-gray-700/50"
                  >
                    <span className="text-white font-bold">{cust.name}</span>
                    <Plus size={16} className="text-indigo-400" />
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-10 font-bold text-sm">لا يوجد عملاء متاحين للإضافة</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
