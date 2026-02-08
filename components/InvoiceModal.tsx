import React, { useState } from 'react';
import { X, Copy, Check, FileSpreadsheet, Printer } from 'lucide-react';
import { SaleItem } from '../types';
import { utils, writeFile } from 'xlsx';

export const InvoiceModal: React.FC<any> = ({ items, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const timeStr = items[0]?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayDate = new Date().toLocaleDateString('en-US');
  const customerName = items[0]?.customerName || 'زبون عام';
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
    writeFile(wb, `فاتورة-${customerNumber}-${customerName}-${dayDate}.xlsx`);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('pos-invoice-content');
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
    const text = `مخبز كوكيز - فاتورة مبيعات\nرقم الفاتورة: ${customerNumber}\nالتاريخ: ${dayDate}\nالعميل: ${customerName}\nالمواد: ${items.map((i: any) => `${i.name} (${i.quantity})`).join(' - ')}\nالمجموع: ${total} ل.س`;
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
           <div id="pos-invoice-content" className="bg-white text-black px-8 pt-8 pb-10 w-[80mm] shadow-2xl h-fit print:w-full print:shadow-none print:px-0">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black mb-1 text-black">مخبز كوكيز</h2>
              <p className="text-[12px] font-black text-black uppercase tracking-widest">فاتورة مبيعات</p>
              <div className="flex justify-between items-center mt-4 text-[11px] font-black px-1 tabular-nums text-black">
                 <span>رقم الفاتورة: #{customerNumber}</span>
                 <span>{dayDate} - {timeStr}</span>
              </div>
            </div>

            <div className="mb-6 border-b border-black/10 pb-2">
              <span className="text-[10px] font-black block text-black">اسم الزبون:</span>
              <p className="text-xl font-black text-black leading-tight">{customerName}</p>
            </div>

            <table className="w-full text-right mb-8 border-t border-black">
              <thead>
                <tr className="text-[12px] font-black border-b border-black text-black">
                  <th className="py-3">المادة</th>
                  <th className="py-3 text-center">الكمية</th>
                  <th className="py-3 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="text-[13px] font-bold border-b border-black/10 tabular-nums text-black">
                    <td className="py-3 leading-tight pr-1">{item.name}</td>
                    <td className="py-3 text-center font-black">{item.quantity}</td>
                    <td className="py-3 text-left font-black text-[12px] whitespace-nowrap pl-1">
                      { (item.price * item.quantity).toLocaleString('en-US') } <span className="text-[9px] font-normal">ل.س</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-black pt-4 mb-10">
              <div className="flex justify-between items-center text-2xl font-black total-text tabular-nums px-1 text-black">
                <span>المجموع الكلي:</span>
                <span>{total.toLocaleString('en-US')} ل.س</span>
              </div>
            </div>

            <div className="text-center text-[12px] font-black border-t border-dashed border-black pt-6 mb-12 italic text-black">
              صُنع يدوياً بكل حُب
            </div>
            
            <div className="h-14 print:block hidden"></div>
          </div>
        </div>

        <div className="p-6 bg-gray-900 border-t border-gray-700 shrink-0">
            <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={handlePrint} className="bg-[#FA8072] hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Printer size={20} /> طباعة الآن
                </button>
                <button onClick={handleDownloadExcel} className="bg-green-700 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <FileSpreadsheet size={20} /> Excel
                </button>
            </div>
            <button onClick={handleCopy} className={`w-full py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 transition-all border border-gray-700 ${copied ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {copied ? <Check size={18} /> : <Copy size={18} />} 
                {copied ? 'تم النسخ بنجاح' : 'نسخ الفاتورة كـنص'}
            </button>
        </div>
      </div>
    </div>
  );
};