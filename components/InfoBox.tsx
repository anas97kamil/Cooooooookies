
import React, { useState } from 'react';
import { DollarSign, Lock, Eye, EyeOff, X, TrendingUp } from 'lucide-react';
import { SaleItem } from '../types';

interface SummaryProps {
  items: SaleItem[];
  onPreview: () => void;
  systemPassword: string; 
}

export const Summary: React.FC<SummaryProps> = ({ items, onPreview, systemPassword }) => {
  const [showRevenue, setShowRevenue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === systemPassword) {
          setShowRevenue(true);
          setShowModal(false);
          setPassword('');
          setError(false);
      } else {
          setError(true);
          setPassword('');
      }
  };

  return (
    <>
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-up">
                <div className="bg-gray-800 border border-gray-600 w-full max-w-xs p-6 rounded-2xl shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold">إلغاء إخفاء الأرقام</h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div>
                            <input 
                                type="password" 
                                autoFocus
                                placeholder="أدخل كلمة المرور"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(false);
                                }}
                                className={`w-full bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-600'} text-white px-4 py-2 rounded-xl text-center outline-none focus:border-[#FA8072]`}
                            />
                            {error && <p className="text-red-400 text-xs mt-2 text-center">كلمة المرور غير صحيحة</p>}
                        </div>
                        <button type="submit" className="w-full bg-[#FA8072] hover:bg-[#e67365] text-white font-bold py-2 rounded-xl transition-colors">
                            تأكيد
                        </button>
                    </form>
                </div>
            </div>
        )}

        <div className="mb-6 flex flex-col gap-4 no-print">
            {/* Stats Row Only */}
            <div className="bg-gray-800 text-white p-6 rounded-[2.5rem] shadow-xl border border-gray-700 relative overflow-hidden flex items-center justify-between">
                {/* Decoration Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FA8072]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">إجمالي المبيعات النشطة (اليوم)</p>
                        {showRevenue ? (
                            <button onClick={() => setShowRevenue(false)} className="text-gray-600 hover:text-white transition-colors" title="إخفاء">
                                <EyeOff size={14} />
                            </button>
                        ) : (
                            <Lock size={12} className="text-gray-600" />
                        )}
                    </div>
                    
                    <div className="relative">
                        <h3 className={`text-4xl font-black text-[#FA8072] transition-all duration-700 flex items-baseline gap-2 ${showRevenue ? '' : 'blur-xl select-none opacity-20'}`}>
                            {totalRevenue.toLocaleString('en-US')} 
                            <span className="text-sm text-gray-600 font-bold">ل.س</span>
                        </h3>
                        {!showRevenue && (
                            <button 
                                onClick={() => setShowModal(true)} 
                                className="absolute inset-0 w-full h-full z-20 cursor-pointer flex items-center justify-start group/lock"
                            >
                                <div className="bg-gray-700/50 px-3 py-1 rounded-lg text-[10px] font-black text-gray-300 group-hover/lock:bg-[#FA8072] group-hover/lock:text-white transition-all">انقر لإظهار المبلغ</div>
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-gray-900/50 p-5 rounded-[2rem] border border-gray-700 shadow-inner group transition-all">
                    <TrendingUp size={32} className="text-green-500 group-hover:scale-110 transition-transform" />
                </div>
            </div>
        </div>
    </>
  );
};
