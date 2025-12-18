
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { SaleItem } from '../types';
import { utils, writeFile } from 'xlsx';

interface InvoiceModalProps {
  items: SaleItem[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ items, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [confirmPrint, setConfirmPrint] = useState(false);
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const timeStr = items[0]?.time || new Date().toLocaleTimeString('ar-SY');
  const dayDate = new Date().toLocaleDateString('ar-SY');
  const customerName = items[0]?.customerName || 'زبون عام';
  const orderId = items[0]?.orderId || '0000';

  useEffect(() => {
    // إضافة فئة الطباعة للجسم لضمان عمل @media print في index.html بشكل صحيح
    document.body.classList.add('print-mode');
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, []);

  const handleDownloadExcel = () => {
    const data = items.map(i => ({ 
      "المادة": i.name, 
      "الكمية": i.quantity, 
      "السعر": i.price, 
      "الإجمالي": i.price * i.quantity 
    }));
    data.push({ "المادة": "المجموع الكلي", "الكمية": 0, "السعر": 0, "الإجمالي": total });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Invoice");
    writeFile(wb, `فاتورة-${customerName}-${dayDate}.xlsx`);
  };

  const handleCopy = () => {
    const text = `مخبز كوكيز - فاتورة مبيعات\nالتاريخ: ${dayDate}\nالعميل: ${customerName}\nالمواد: ${items.map(i => `${i.name} (${i.quantity})`).join(' - ')}\nالمجموع: ${total} ل.س`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
    setConfirmPrint(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Hidden on Print */}
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 no-print">
          <div className="flex items-center gap-2">
            <Printer size={20} className="text-[#FA8072]" />
            <h3 className="font-black text-lg text-white">طباعة فاتورة مبيعات</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* Invoice Body - Optimized for Printing */}
        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-10" id="invoice-content">
          <div className="bg-white text-black p-2 min-h-full">
            {/* Logo & Info */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h2 className="text-3xl font-black mb-1">مخبز كوكيز</h2>
              <p className="text-sm font-bold opacity-70 uppercase tracking-widest">فاتورة مبيعات / سند تسليم</p>
              <p className="text-xs font-bold mt-2 tabular-nums">{dayDate} - {timeStr}</p>
              <div className="mt-4 inline-block px-4 py-1 border border-black rounded-full text-xs font-black">
                رقم الطلب: #{orderId.slice(-6)}
              </div>
            </div>

            {/* Customer & Date */}
            <div className="flex justify-between mb-8 items-end border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">السيد/ة المحترمـ/ة:</span>
                <p className="text-xl font-black">{customerName}</p>
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-gray-500 block text-left">نوع البيع:</span>
                <p className="font-black text-sm">{items[0]?.saleType === 'wholesale' ? 'جـمـلـة' : 'مـفـرق'}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-right mb-10">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-3 px-1 text-right font-black text-sm uppercase">المادة</th>
                  <th className="py-3 px-1 text-center font-black text-sm uppercase">الكمية</th>
                  <th className="py-3 px-1 text-left font-black text-sm uppercase">السعر</th>
                  <th className="py-3 px-1 text-left font-black text-sm uppercase">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={idx} className="font-bold text-sm">
                    <td className="py-4 px-1 text-right">{item.name}</td>
                    <td className="py-4 px-1 text-center tabular-nums">{item.quantity}</td>
                    <td className="py-4 px-1 text-left tabular-nums">{item.price.toLocaleString()}</td>
                    <td className="py-4 px-1 text-left font-black tabular-nums">{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Section */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex justify-between items-center text-2xl font-black">
                <span>المجموع النهائي:</span>
                <span className="tabular-nums text-red-600">{total.toLocaleString()} <small className="text-xs font-normal">ل.س</small></span>
              </div>
            </div>

            {/* Signature Area (Matches Purchase Style) */}
            <div className="mt-24 hidden print:flex justify-between items-end px-8">
               <div className="text-center">
                   <p className="mb-10 font-bold text-black text-sm">توقيع المستلم</p>
                   <div className="w-40 border-b-2 border-black border-dotted"></div>
               </div>
               <div className="text-center">
                   <p className="mb-10 font-bold text-black text-sm">ختم وتوقيع المخبز</p>
                   <div className="w-40 border-b-2 border-black border-dotted"></div>
               </div>
            </div>

            <div className="mt-16 text-center text-[10px] font-bold border-t border-dashed border-gray-300 pt-6 opacity-40">
              نشكركم على ثقتكم بمخبز كوكيز - يرجى الاحتفاظ بالفاتورة كضمان لحقكم
            </div>
          </div>
        </div>

        {/* Actions - Hidden on Print */}
        <div className="p-6 bg-gray-900/80 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-4 gap-3 no-print">
            {confirmPrint ? (
                <div className="sm:col-span-2 flex items-center gap-2">
                    <button onClick={handlePrint} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl active:scale-95">تأكيد الطباعة</button>
                    <button onClick={() => setConfirmPrint(false)} className="flex-1 bg-gray-700 text-white py-3.5 rounded-2xl font-black text-xs">إلغاء</button>
                </div>
            ) : (
                <button onClick={() => setConfirmPrint(true)} className="sm:col-span-2 bg-[#FA8072] hover:bg-orange-500 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95">
                    <Printer size={18} /> طباعة الفاتورة (PDF)
                </button>
            )}
            <button onClick={handleDownloadExcel} className="bg-green-700 hover:bg-green-600 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95">
                <FileSpreadsheet size={18} /> Excel
            </button>
            <button onClick={handleCopy} className={`py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all border border-gray-700 ${copied ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'تم النسخ' : 'نصي'}
            </button>
        </div>
      </div>
    </div>
  );
};
