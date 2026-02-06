
import React, { useState } from 'react';
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
  const customerNumber = items[0]?.customerNumber || 0;

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
    writeFile(wb, `فاتورة-${customerNumber}-${customerName}-${dayDate}.xlsx`);
  };

  const handleCopy = () => {
    const text = `مخبز كوكيز - فاتورة مبيعات\nرقم الفاتورة: ${customerNumber}\nالتاريخ: ${dayDate}\nالعميل: ${customerName}\nالمواد: ${items.map(i => `${i.name} (${i.quantity})`).join(' - ')}\nالمجموع: ${total} ل.س`;
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-2 overflow-y-auto no-print-overlay">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:w-[80mm] print:overflow-visible">
        
        {/* Header - Hidden on Print */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-[#FA8072]" />
            <h3 className="font-black text-sm text-white">معاينة فاتورة 80mm</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* Invoice Body */}
        <div className="flex-1 overflow-y-auto bg-gray-900/50 p-4 print:p-0 print:overflow-visible print:bg-white">
           <div id="invoice-content" className="bg-white text-black p-6 mx-auto w-[80mm] shadow-2xl print:shadow-none print:w-[80mm] print:p-4 print:min-h-0 print:box-border">
            
            {/* Logo & Header */}
            <div className="text-center mb-4 border-b-2 border-black pb-3">
              <h2 className="text-2xl font-black mb-0 text-black">مخبز كوكيز</h2>
              <p className="text-[11px] font-black uppercase text-black">فاتورة مبيعات</p>
              
              <div className="mt-2 text-center">
                <span className="text-[10px] font-black text-black">رقم الفاتورة: #{customerNumber}</span>
              </div>

              <div className="flex justify-between items-center mt-3 px-1">
                 <p className="text-[10px] font-black text-black tabular-nums">{dayDate}</p>
                 <p className="text-[10px] font-black text-black tabular-nums">{timeStr}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col gap-1 mb-5 border-b border-black pb-3">
              <span className="text-[9px] font-black text-black">الزبون:</span>
              <p className="text-lg font-black text-black">{customerName}</p>
            </div>

            {/* Items Table */}
            <table className="w-full text-right mb-6">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2 px-1 text-right font-black text-[11px] text-black">المادة</th>
                  <th className="py-2 px-1 text-center font-black text-[11px] text-black">الكمية</th>
                  <th className="py-2 px-1 text-left font-black text-[11px] text-black">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20 print:divide-black">
                {items.map((item, idx) => (
                  <tr key={idx} className="font-black text-[12px] text-black">
                    <td className="py-2.5 px-1 text-right leading-tight">{item.name}</td>
                    <td className="py-2.5 px-1 text-center tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 px-1 text-left tabular-nums">{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-black pt-3 mb-8">
              <div className="flex justify-between items-center text-xl font-black text-black">
                <span>المجموع:</span>
                <span className="tabular-nums underline decoration-2">{total.toLocaleString()} ل.س</span>
              </div>
            </div>

            <div className="mt-8 text-center text-[9px] font-black border-t border-dashed border-black pt-3 text-black">
              شكراً لزيارتكم - مخبز كوكيز
            </div>
          </div>
        </div>

        {/* Actions - Hidden on Print */}
        <div className="p-6 bg-gray-900 border-t border-gray-700 no-print shrink-0">
            <div className="grid grid-cols-2 gap-3 mb-3">
                {confirmPrint ? (
                    <div className="col-span-2 flex items-center gap-2">
                        <button onClick={handlePrint} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-xs transition-all shadow-xl active:scale-95 animate-pulse">تأكيد الطباعة (80mm)</button>
                        <button onClick={() => setConfirmPrint(false)} className="px-6 bg-gray-700 text-white py-4 rounded-2xl font-black text-xs">إلغاء</button>
                    </div>
                ) : (
                    <button onClick={() => setConfirmPrint(true)} className="col-span-1 bg-[#FA8072] hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95">
                        <Printer size={18} /> طباعة حرارية
                    </button>
                )}
                
                {!confirmPrint && (
                   <button onClick={handleDownloadExcel} className="col-span-1 bg-green-700 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95">
                       <FileSpreadsheet size={18} /> تصدير Excel
                   </button>
                )}
            </div>
            
            <button 
                onClick={handleCopy} 
                className={`w-full py-3.5 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 transition-all border border-gray-700 ${copied ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
                {copied ? <Check size={16} /> : <Copy size={16} />} 
                {copied ? 'تم نسخ بيانات الفاتورة' : 'نسخ الفاتورة كنص'}
            </button>
        </div>
      </div>
    </div>
  );
};
