
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
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const date = items[0]?.time || new Date().toLocaleTimeString('ar-SY');
  const dayDate = new Date().toLocaleDateString('ar-SY');
  const customerName = items[0]?.customerName || 'زبون عام';

  const handleDownloadExcel = () => {
    const data = items.map(i => ({ "المادة": i.name, "الكمية": i.quantity, "السعر": i.price, "الإجمالي": i.price * i.quantity }));
    data.push({ "المادة": "المجموع الكلي", "الكمية": 0, "السعر": 0, "الإجمالي": total });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Invoice");
    writeFile(wb, `فاتورة-${customerName}-${Date.now()}.xlsx`);
  };

  const handleCopy = () => {
    const text = `فاتورة مخبز كوكيز\nالتاريخ: ${dayDate}\nالعميل: ${customerName}\nالمجموع: ${total} ل.س`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Hidden on Print */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 no-print">
          <h3 className="font-black text-xl text-white">معاينة الفاتورة</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* Invoice Body - Optimized for Printing and Previewing */}
        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-8 shadow-inner">
          <div id="invoice-content" className="bg-white text-black p-4 sm:p-6 rounded-lg min-h-full">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h2 className="text-3xl font-black mb-1 text-black">مخبز كوكيز</h2>
              <p className="text-black text-sm font-bold opacity-80 uppercase tracking-widest">فاتورة مبيعات</p>
            </div>

            <div className="flex justify-between mb-8 text-sm font-bold text-black border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <p className="text-black opacity-60">العميل:</p>
                <p className="text-lg font-black">{customerName}</p>
              </div>
              <div className="text-left space-y-1">
                <p className="text-black opacity-60">التاريخ:</p>
                <p className="tabular-nums font-black">{dayDate}</p>
                <p className="tabular-nums text-xs opacity-60">{date}</p>
              </div>
            </div>

            <table className="w-full text-right mb-10 text-black">
              <thead className="border-b-2 border-black">
                <tr className="text-xs uppercase font-black">
                  <th className="py-2 px-1 text-right">المادة</th>
                  <th className="py-2 px-1 text-center">الكمية</th>
                  <th className="py-2 px-1 text-left">السعر</th>
                  <th className="py-2 px-1 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={idx} className="font-bold">
                    <td className="py-4 px-1 text-right">{item.name}</td>
                    <td className="py-4 px-1 text-center tabular-nums">{item.quantity}</td>
                    <td className="py-4 px-1 text-left tabular-nums">{item.price.toLocaleString()}</td>
                    <td className="py-4 px-1 text-left font-black tabular-nums">{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-black pt-6">
              <div className="flex justify-between items-center text-2xl font-black text-black">
                <span>المجموع النهائي:</span>
                <span className="tabular-nums">{total.toLocaleString()} <small className="text-xs font-normal">ل.س</small></span>
              </div>
            </div>

            <div className="mt-20 text-center text-xs text-black font-bold border-t border-dashed border-gray-300 pt-6 opacity-60">
              نشكركم على اختياركم مخبز كوكيز - يرجى الاحتفاظ بالفاتورة
            </div>
          </div>
        </div>

        {/* Actions - Hidden on Print */}
        <div className="p-6 bg-gray-900/80 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
            <button onClick={handlePrint} className="bg-[#FA8072] hover:bg-orange-500 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95">
                <Printer size={18} /> طباعة PDF
            </button>
            <button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95">
                <FileSpreadsheet size={18} /> ملف Excel
            </button>
            <button onClick={handleCopy} className={`py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all border border-gray-700 ${copied ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'تم النسخ' : 'نسخ نصي'}
            </button>
        </div>
      </div>
    </div>
  );
};
