
import React, { useState } from 'react';
import { DollarSign, Lock, Eye, EyeOff, X, TrendingUp, Archive } from 'lucide-react';
import { SaleItem } from '../types';

interface SummaryProps {
  items: SaleItem[];
  onPreview: () => void;
  onArchiveDay: () => void; // إضافة وظيفة الأرشفة
}

export const Summary: React.FC<SummaryProps> = ({ items, onPreview, onArchiveDay }) => {
  const [showRevenue, setShowRevenue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === '2026') {
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

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
            {/* Sales Card */}
            <div className="md:col-span-2 bg-gray-800 text-white p-5 rounded-3xl shadow-lg border border-gray-700 relative overflow-hidden flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">إجمالي المبيعات النشطة</p>
                        {showRevenue ? (
                            <button onClick={() => setShowRevenue(false)} className="text-gray-500 hover:text-white print:hidden" title="إخفاء">
                                <EyeOff size={14} />
                            </button>
                        ) : (
                            <Lock size={12} className="text-gray-500" />
                        )}
                    </div>
                    
                    <div className="relative">
                        <h3 className={`text-3xl font-black text-[#FA8072] transition-all duration-500 ${showRevenue ? '' : 'blur-md select-none opacity-40'}`}>
                            {totalRevenue.toLocaleString('en-US')} 
                            <span className="text-sm text-gray-500 font-normal mr-1"> ل.س</span>
                        </h3>
                        {!showRevenue && (
                            <button onClick={() => setShowModal(true)} className="absolute inset-0 w-full h-full z-10 outline-none cursor-pointer bg-transparent border-none"></button>
                        )}
                    </div>
                </div>
                <div className="bg-[#FA8072]/10 p-3 rounded-2xl">
                    <TrendingUp size={28} className="text-[#FA8072]" />
                </div>
            </div>

            {/* Archive / End Day Button */}
            <button 
              onClick={onArchiveDay}
              className="bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white p-5 rounded-3xl shadow-xl shadow-orange-900/20 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group border border-white/10"
            >
                <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Archive size={24} />
                </div>
                <div className="text-center">
                    <span className="block font-black text-sm">إغلاق اليوم</span>
                    <span className="block text-[8px] font-bold opacity-70 uppercase tracking-widest">ترحيل المبيعات للأرشيف</span>
                </div>
            </button>
        </div>
    </>
  );
};
