import React, { useState } from 'react';
import { Lock, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { SaleItem } from '../types';

interface SummaryProps {
  items: SaleItem[];
  onPreview: () => void;
  systemPassword: string; 
}

export const Summary: React.FC<SummaryProps> = ({ items, onPreview, systemPassword }) => {
  // جعل المبلغ ظاهراً بشكل افتراضي
  const [showRevenue, setShowRevenue] = useState(true);
  
  const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="mb-6 flex flex-col gap-4 no-print">
        <div className="bg-gray-800 text-white p-6 rounded-[2.5rem] shadow-xl border border-gray-700 relative overflow-hidden flex items-center justify-between">
            {/* Decoration Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FA8072]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">إجمالي المبيعات النشطة (اليوم)</p>
                    <button 
                        onClick={() => setShowRevenue(!showRevenue)} 
                        className="text-gray-600 hover:text-[#FA8072] transition-colors p-1" 
                        title={showRevenue ? "إخفاء المبلغ" : "إظهار المبلغ"}
                    >
                        {showRevenue ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
                
                <div className="relative">
                    <h3 className={`text-4xl font-black text-[#FA8072] transition-all duration-500 flex items-baseline gap-2 ${showRevenue ? '' : 'blur-xl select-none opacity-20'}`}>
                        {totalRevenue.toLocaleString('en-US')} 
                        <span className="text-sm text-gray-600 font-bold">ل.س</span>
                    </h3>
                    {!showRevenue && (
                        <button 
                            onClick={() => setShowRevenue(true)} 
                            className="absolute inset-0 w-full h-full z-20 cursor-pointer flex items-center justify-start group/lock"
                        >
                            <div className="bg-gray-700/50 px-3 py-1 rounded-lg text-[10px] font-black text-gray-300 group-hover/lock:bg-[#FA8072] group-hover/lock:text-white transition-all">انقر للإظهار</div>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-gray-900/50 p-5 rounded-[2rem] border border-gray-700 shadow-inner group transition-all">
                <TrendingUp size={32} className="text-green-500 group-hover:scale-110 transition-transform" />
            </div>
        </div>
    </div>
  );
};