import React from 'react';
import { X, FileSpreadsheet, Printer } from 'lucide-react';
import { PurchaseInvoice } from '../types';
import { utils, writeFile } from 'xlsx';

interface PurchasePrintModalProps {
  invoice: PurchaseInvoice;
  onClose: () => void;
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({ invoice, onClose }) => {
  const handleDownloadExcel = () => {
    const rows = invoice.items.map(item => ({
        "المادة": item.name,
        "الكمية": item.quantity,
        "التكلفة": item.cost,
        "الإجمالي": item.total
    }));
    rows.push({ "المادة": "المجموع الكلي", "الكمية": 0, "التكلفة": 0, "الإجمالي": invoice.totalAmount });
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "فاتورة شراء");
    writeFile(wb, `شراء-${invoice.supplierName}-${invoice.date.replace(/\//g, '-')}.xlsx`);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('purchase-invoice-content');
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

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-2 overflow-y-auto no-print">
      <div className="bg-gray-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col h-[90vh] animate-fade-up border border-gray-700">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-2xl">
          <h3 className="font-black text-sm text-white">معاينة مشتريات (80mm)</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-950/50 p-6 flex justify-center">
          {/* تحسين الهوامش الجانبية لمنع قص الفاتورة */}
          <div id="purchase-invoice-content" className="bg-white text-black px-6 pt-8 pb-10 w-[80mm] shadow-2xl h-fit print:w-full print:shadow-none print:px-8">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h2 className="text-xl font-black mb-1 text-black">مخبز كوكيز</h2>
              <p className="text-black font-black text-[10px] uppercase tracking-widest">سند استلام مشتريات</p>
              <div className="flex justify-between items-center mt-4 text-[10px] font-black border border-black p-3 tabular-nums">
                  <span>التاريخ: {invoice.date}</span>
                  <span>#{invoice.id.slice(-4)}</span>
              </div>
              <div className="mt-3 text-center bg-gray-100 p-3 rounded">
                  <p className="text-black font-black text-sm">{invoice.supplierName}</p>
                  <p className="text-[9px] font-black">{invoice.paymentStatus === 'paid' ? 'نقدي' : 'آجل'}</p>
              </div>
            </div>

            <table className="w-full mb-6 text-right border-collapse">
               <thead>
                   <tr className="border-b-2 border-black">
                       <th className="py-3 text-[10px] font-black">المادة</th>
                       <th className="py-3 text-center text-[10px] font-black">الكمية</th>
                       <th className="py-3 text-left text-[10px] font-black">الإجمالي</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-black/10">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="text-[11px] font-black tabular-nums">
                      <td className="py-3 pr-1">{item.name}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-left pl-1">{item.total.toLocaleString('en-US')} ل.س</td>
                    </tr>
                  ))}
               </tbody>
            </table>

            <div className="border-t-2 border-black pt-4 mb-10">
              <div className="flex justify-between items-center text-xl font-black tabular-nums px-1">
                  <span>المجموع:</span>
                  <span>{invoice.totalAmount.toLocaleString('en-US')} ل.س</span>
              </div>
            </div>

            <div className="mt-10 text-center text-[9px] font-black border-t border-dashed border-black pt-5 mb-8">
              تم الاستلام - مخبز كوكيز
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex flex-col gap-3 bg-gray-900 shrink-0">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={handlePrint} className="bg-[#FA8072] text-white py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2">
                    <Printer size={16} /> طباعة المشتريات
                </button>
                <button onClick={handleDownloadExcel} className="bg-green-700 text-white py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2">
                    <FileSpreadsheet size={16} /> تصدير Excel
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};