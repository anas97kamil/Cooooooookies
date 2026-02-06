
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

  const handlePrint = () => {
    // جلب محتوى الفاتورة ونقله للحاوية الخارجية للطباعة لضمان عدم التكرار
    const printContent = document.getElementById('pos-invoice-content');
    const printArea = document.getElementById('print-area');
    
    if (printContent && printArea) {
      printArea.innerHTML = printContent.innerHTML;
      printArea.className = 'print-mode-80mm';
      window.print();
      printArea.innerHTML = ''; // تنظيف الحاوية بعد الطباعة
    }
  };

  const handleCopy = () => {
    const text = `مخبز كوكيز - فاتورة مبيعات\nرقم الفاتورة: ${customerNumber}\nالتاريخ: ${dayDate}\nالعميل: ${customerName}\nالمواد: ${items.map(i => `${i.name} (${i.quantity})`).join(' - ')}\nالمجموع: ${total} ل.س`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-gray-700 animate-fade-up overflow-hidden flex flex-col h-[90vh]">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#FA8072]/20 p-2 rounded-xl"><Printer size={20} className="text-[#FA8072]" /></div>
            <h3 className="font-black text-sm text-white">معاينة الفاتورة (80mm)</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-950/50 p-6 flex justify-center">
           {/* هذا الجزء سيظهر في الشاشة فقط، وعند الطباعة سيتم نسخه لـ print-area */}
           <div id="pos-invoice-content" className="bg-white text-black p-6 w-[80mm] shadow-2xl">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black mb-1 text-black">مخبز كوكيز</h2>
              <p className="text-[11px] font-black uppercase text-black">فاتورة مبيعات</p>
              <div className="mt-2 text-center text-[10px] font-black">رقم: #{customerNumber}</div>
              <div className="flex justify-between items-center mt-3 text-[10px] font-black">
                 <span>{dayDate}</span>
                 <span>{timeStr}</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-[10px] font-black text-gray-600 block">الزبون:</span>
              <p className="text-xl font-black text-black">{customerName}</p>
            </div>

            <table className="w-full text-right mb-6">
              <thead className="border-b-2 border-black">
                <tr className="text-[11px] font-black">
                  <th className="py-2">المادة</th>
                  <th className="py-2 text-center">الكمية</th>
                  <th className="py-2 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {items.map((item, idx) => (
                  <tr key={idx} className="text-[12px] font-black">
                    <td className="py-3 leading-tight">{item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-left">{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-black pt-4 mb-8">
              <div className="flex justify-between items-center text-2xl font-black">
                <span>المجموع:</span>
                <span className="tabular-nums">{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[9px] font-black border-t border-dashed border-black pt-4">
              شكراً لزيارتكم - مخبز كوكيز
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-900 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={handlePrint} className="bg-[#FA8072] hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl">
                    <Printer size={18} /> طباعة الفاتورة
                </button>
                <button onClick={handleDownloadExcel} className="bg-green-700 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl">
                    <FileSpreadsheet size={18} /> تصدير Excel
                </button>
            </div>
            <button onClick={handleCopy} className={`w-full py-3.5 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 transition-all border border-gray-700 ${copied ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {copied ? <Check size={16} /> : <Copy size={16} />} 
                {copied ? 'تم النسخ' : 'نسخ كـنص'}
            </button>
        </div>
      </div>
    </div>
  );
};
