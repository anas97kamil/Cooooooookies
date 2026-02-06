
import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { PurchaseInvoice } from '../types';
import { utils, writeFile } from 'xlsx';

interface PurchasePrintModalProps {
  invoice: PurchaseInvoice;
  onClose: () => void;
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({ invoice, onClose }) => {
  const [confirmPrint, setConfirmPrint] = useState(false);
  
  const handleDownloadExcel = () => {
    const rows = invoice.items.map(item => ({
        "المادة": item.name,
        "الكمية": item.quantity,
        "التكلفة": item.cost,
        "الإجمالي": item.total
    }));
    rows.push({
        "المادة": "المجموع الكلي",
        "الكمية": 0,
        "التكلفة": 0,
        "الإجمالي": invoice.totalAmount
    });
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "فاتورة شراء");
    writeFile(wb, `شراء-${invoice.supplierName}-${invoice.date.replace(/\//g, '-')}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
    setConfirmPrint(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-2 overflow-y-auto no-print-overlay">
      <div className="bg-gray-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-up border border-gray-700 print:bg-white print:border-none print:shadow-none print:w-[80mm] print:max-h-none print:overflow-visible">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-2xl no-print">
          <h3 className="font-black text-sm text-white">معاينة مشتريات 80mm</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-gray-950/50 print:p-0 print:bg-white print:overflow-visible">
          <div id="invoice-content" className="bg-white text-black p-6 mx-auto w-[80mm] print:w-[80mm] print:p-4 print:min-h-0 print:box-border">
            <div className="text-center mb-5 border-b-2 border-black pb-3">
              <h2 className="text-xl font-black mb-1 text-black">مخبز كوكيز</h2>
              <p className="text-black font-black text-[10px] uppercase">سند استلام مشتريات</p>
              <p className="text-black text-[10px] font-black dir-ltr mt-1">{invoice.date}</p>
              <div className="mt-3 border-2 border-black p-2 rounded">
                  <p className="text-black font-black text-sm">{invoice.supplierName}</p>
                  <p className="text-black text-[9px] font-black mt-1 uppercase">{invoice.paymentStatus === 'paid' ? 'مدفوع نقداً' : 'ذمم (آجل)'}</p>
              </div>
            </div>

            <table className="w-full mb-5 text-right">
               <thead>
                   <tr className="border-b-2 border-black">
                       <th className="py-2 text-[10px] font-black text-black">المادة</th>
                       <th className="py-2 text-center text-[10px] font-black text-black">الكمية</th>
                       <th className="py-2 text-left text-[10px] font-black text-black">الإجمالي</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-black/10 print:divide-black">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 text-[11px] font-black text-black">{item.name}</td>
                      <td className="py-2 text-center text-[11px] font-black text-black">{item.quantity}</td>
                      <td className="py-2 text-left font-black text-[11px] text-black">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
               </tbody>
            </table>

            <div className="border-t-2 border-black pt-3 mt-4">
              <div className="flex justify-between items-center text-lg font-black text-black">
                  <span>المجموع:</span>
                  <span className="underline decoration-2">{invoice.totalAmount.toLocaleString()} ل.س</span>
              </div>
            </div>

            <div className="mt-8 text-center text-[9px] font-black border-t border-dashed border-black pt-3 text-black">
              تم الاستلام - مخبز كوكيز
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-700 flex flex-col gap-3 bg-gray-900 no-print shrink-0">
            <div className="grid grid-cols-2 gap-3">
                {confirmPrint ? (
                    <div className="col-span-2 flex items-center gap-2">
                        <button onClick={handlePrint} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-xs animate-pulse">تأكيد الطباعة</button>
                        <button onClick={() => setConfirmPrint(false)} className="px-6 bg-gray-700 text-white py-4 rounded-xl font-black text-xs">إلغاء</button>
                    </div>
                ) : (
                    <button onClick={() => setConfirmPrint(true)} className="col-span-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black transition-all text-white shadow-md bg-[#FA8072] hover:bg-[#e67365] text-xs"><Printer size={16} /><span>طباعة 80mm</span></button>
                )}
                {!confirmPrint && (
                  <button onClick={handleDownloadExcel} className="col-span-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black transition-all text-white shadow-md bg-green-700 hover:bg-green-600 text-xs"><FileSpreadsheet size={16} /><span>تصدير</span></button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
