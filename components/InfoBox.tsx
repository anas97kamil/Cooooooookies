import React, { useState } from 'react';
import { FileText, DollarSign, Package, Lock, Eye, EyeOff, X, Check } from 'lucide-react';
import { SaleItem } from '../types';

interface SummaryProps {
  items: SaleItem[];
  onPreview: () => void;
}

export const Summary: React.FC<SummaryProps> = ({ items, onPreview }) => {
  const [showRevenue, setShowRevenue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === '1997') {
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
        {/* Custom Password Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-up">
                <div className="bg-gray-800 border border-gray-600 w-full max-w-xs p-6 rounded-2xl shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold">إلغاء إخفاء المبيعات</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print-break-inside-avoid">
        {/* Total Revenue Card - Secured */}
        <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between border border-gray-700 print:bg-white print:text-black print:border print:border-black relative overflow-hidden">
            <div>
            <p className="text-gray-400 text-sm mb-1 font-medium print:text-black flex items-center gap-2">
                إجمالي المبيعات
                {showRevenue ? (
                    <button onClick={() => setShowRevenue(false)} className="text-gray-500 hover:text-white print:hidden" title="إخفاء">
                        <EyeOff size={14} />
                    </button>
                ) : (
                    <Lock size={12} className="text-gray-500" />
                )}
            </p>
            
            <div className="relative mt-1">
                {/* The blurred value */}
                <h3 className={`text-3xl font-bold text-[#FA8072] print:text-black transition-all duration-500 ${showRevenue ? '' : 'blur-md select-none opacity-40'}`}>
                    {totalRevenue.toLocaleString()} 
                    <span className="text-base text-gray-400 font-normal print:text-black"> ل.س</span>
                </h3>

                {/* Overlay Button for Unlocking */}
                {!showRevenue && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="absolute inset-0 w-full h-full flex items-center justify-center z-10 group outline-none"
                        title="انقر لإظهار المبلغ"
                    >
                        <div className="bg-gray-900/90 px-4 py-2 rounded-xl border border-gray-600 shadow-xl group-hover:bg-[#FA8072] group-hover:border-[#FA8072] group-hover:text-white transition-all text-gray-300 flex items-center gap-2">
                            <Eye size={16} />
                            <span className="text-sm font-bold">عرض</span>
                        </div>
                    </button>
                )}
            </div>
            </div>
            
            <div className={`p-3 rounded-xl transition-colors print:hidden ${showRevenue ? 'bg-[#FA8072]/20 text-[#FA8072]' : 'bg-gray-700/50 text-gray-500'}`}>
            <DollarSign size={24} />
            </div>
        </div>

        {/* Items Count Card */}
        <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-sm border border-gray-700 flex items-center justify-between print:bg-white print:text-black print:border-black">
            <div>
            <p className="text-gray-400 text-sm mb-1 font-medium print:text-black">عدد القطع المباعة</p>
            <h3 className="text-3xl font-bold text-white print:text-black">{totalCount}</h3>
            </div>
            <div className="bg-blue-900/30 text-blue-400 p-3 rounded-xl print:hidden">
            <Package size={24} />
            </div>
        </div>

        {/* Actions Card */}
        <div className="bg-[#FA8072]/10 border border-[#FA8072]/20 p-5 rounded-2xl flex flex-col justify-center items-center gap-2 no-print relative">
            <button 
                type="button"
                onClick={onPreview}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-md active:scale-95 cursor-pointer relative z-10"
            >
                <FileText size={18} />
                <span>عرض الفاتورة ونسخها</span>
            </button>
            <p className="text-xs text-gray-400 text-center">
                معاينة التقرير للنشر أو الحفظ
            </p>
        </div>
        </div>
    </>
  );
};