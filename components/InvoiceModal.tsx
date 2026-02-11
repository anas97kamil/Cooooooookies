import React, { useState } from 'react';
import { X, Copy, Check, FileSpreadsheet, Printer } from 'lucide-react';
import { SaleItem } from '../types';
import { utils, writeFile } from 'xlsx';

export const InvoiceModal: React.FC<any> = ({ items, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const timeStr = items[0]?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dayDate = new Date().toLocaleDateString('en-US');
  const customerNumber = items[0]?.customerNumber || 0;

  const handleDownloadExcel = () => {
    const data = items.map((i: any) => ({ 
      "المادة": i.name, 
      "الكمية": i.quantity, 
      "السعر": i.price, 
      "الإجمالي": i.price * i.quantity 
    }));
    data.push({ "المادة": "المجموع الكلي", "الكمية": 0, "السعر": 0, "الإجمالي": total });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Invoice");
    writeFile(wb, `فاتورة-${customerNumber}-${dayDate}.xlsx`);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('pos-invoice-print-wrapper');
    const printArea = document.getElementById('print-area');
    
    if (printContent && printArea) {
      printArea.innerHTML = printContent.innerHTML;
      printArea.className = 'print-mode-80mm';
      
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          printArea.innerHTML = ''; 
          printArea.className = '';
        }, 500);
      }, 300);
    }
  };

  const handleCopy = () => {
    const text = `مخبز كوكيز - فاتورة مبيعات\nرقم الفاتورة: ${customerNumber}\nالتاريخ: ${dayDate}\nالمواد: ${items.map((i: any) => `${i.name} (${i.quantity})`).join(' - ')}\nالمجموع: ${total} ل.س`;
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
            <h3 className="font-black text-sm text-white">معاينة وطباعة الفاتورة</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-950/50 p-6 flex justify-center">
           {/* Wrapper for Print Area to ensure everything is one block */}
           <div id="pos-invoice-print-wrapper" className="w-full max-w-[80mm]">
             <div id="pos-invoice-content" className="bg-white text-black px-3 pt-3 pb-6 w-full shadow-2xl h-fit print:shadow-none print:p-0">
                <div className="text-center mb-2 border-b-2 border-black pb-1">
                  <h2 className="text-[10px] font-black mb-0 text-black">مخبز كوكيز</h2>
                  <p className="text-[10px] font-black text-black">فاتورة مبيعات</p>
                  <div className="flex justify-between items-center mt-1 text-[9px] font-bold px-1 tabular-nums text-black">
                     <span>رقم: #{customerNumber}</span>
                     <span>{dayDate} - {timeStr}</span>
                  </div>
                </div>

                <table className="w-full text-right mb-2 border-b border-black">
                  <thead>
                    <tr className="text-[8px] font-black border-b border-black text-black">
                      <th className="py-1">المادة</th>
                      <th className="py-1 text-center">الكمية</th>
                      <th className="py-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="text-[8px] font-bold border-b border-black/5 tabular-nums text-black">
                        <td className="py-1 leading-tight pr-1">{item.name}</td>
                        <td className="py-1 text-center font-black">{item.quantity}</td>
                        <td className="py-1 text-left font-black pl-1">
                          { (item.price * item.quantity).toLocaleString('en-US') }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mb-4">
                  <div className="flex justify-between items-center text-[10px] font-black tabular-nums px-1 text-black">
                    <span>المجموع الكلي:</span>
                    <span>{total.toLocaleString('en-US')} ل.س</span>
                  </div>
                </div>

                <div className="text-center text-[8px] font-bold border-t border-dashed border-black pt-2 text-black">
                  شكراً لزيارتكم
                </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-gray-900 border-t border-gray-700 shrink-0">
            <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={handlePrint} className="bg-[#FA8072] hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Printer size={20} /> طباعة
                </button>
                <button onClick={handleDownloadExcel} className="bg-green-700 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <FileSpreadsheet size={20} /> Excel
                </button>
            </div>
            <button onClick={handleCopy} className={`w-full py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 transition-all border border-gray-700 ${copied ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {copied ? <Check size={18} /> : <Copy size={18} />} 
                {copied ? 'تم النسخ' : 'نسخ النص'}
            </button>
        </div>
      </div>
    </div>
  );
};