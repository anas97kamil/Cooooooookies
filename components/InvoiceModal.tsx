import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Printer, FileSpreadsheet } from 'lucide-react';
import { SaleItem } from '../types';
import { utils, writeFile } from 'xlsx';

interface InvoiceModalProps {
  items: SaleItem[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ items, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [confirmPrint, setConfirmPrint] = useState(false);
  
  const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const dateStr = new Date().toLocaleDateString('ar-SY');
  
  // Get customer details from the first item (assuming all items in invoice are for same customer context, or general summary)
  // Note: 'Summary' view passes ALL items for the day, so this might be mixed.
  // However, usually invoice is per order. If this is the "Daily Report" (which InfoBox calls), we keep it generic.
  // But if we want to support single order invoice later, this logic holds.
  // For now, let's just check if it's a mix or single. 
  // Since the current 'Summary' component passes ALL daily sales, we shouldn't put a specific customer name unless it's a single order view.
  // BUT, since the current UX is "Daily Report Invoice", we won't force a single name. 
  // If you want to print a SPECIFIC order, that feature would be in SalesTable. 
  // Currently InvoiceModal is used for "Daily Summary".
  
  // Let's check if the request implies per-order invoice or just general.
  // The user asked "allow naming customer". Usually this implies per-customer invoice.
  // Current app structure only has "Preview Invoice" for the WHOLE DAY in Summary.
  // I will add the customer name logic here anyway, but it will mostly likely be undefined for the daily report unless filter is used.
  
  // Actually, to fully support "Customer Invoice", we should probably allow printing from the SalesTable too.
  // But for now, let's just update the view.

  const firstItem = items[0];
  const uniqueCustomers = new Set(items.map(i => i.customerNumber));
  const isSingleCustomer = uniqueCustomers.size === 1;
  const customerName = isSingleCustomer && firstItem?.customerName ? firstItem.customerName : null;


  // Add a class to body when modal is open to help print styles target the modal content
  useEffect(() => {
    document.body.classList.add('print-mode');
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, []);

  const getInvoiceText = () => {
    let text = `*تقرير مبيعات - مخبز كوكيز*\n`;
    text += `التاريخ: ${dateStr}\n`;
    if (customerName) text += `الزبون: ${customerName}\n`;
    text += `------------------\n`;
    
    items.forEach(item => {
      const unit = item.unitType === 'kg' ? 'كغ' : 'قطع';
      text += `- ${item.name}: ${item.quantity} ${unit} × ${item.price} = ${(item.price * item.quantity).toLocaleString()}\n`;
    });
    
    text += `------------------\n`;
    text += `*الإجمالي النهائي: ${totalRevenue.toLocaleString()} ل.س*\n`;
    return text;
  };

  const handleCopy = () => {
    const text = getInvoiceText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadExcel = () => {
    // 1. Prepare data for Excel
    const rows = items.map(item => ({
        "المادة": item.name,
        "الزبون": item.customerName || `زبون ${item.customerNumber}`,
        "الكمية": item.quantity,
        "الوحدة": item.unitType === 'kg' ? 'كغ' : 'قطعة',
        "السعر الإفرادي": item.price,
        "الإجمالي": item.price * item.quantity
    }));

    // 2. Add Summary Row at the end
    rows.push({
        "المادة": "المجموع الكلي",
        "الزبون": "",
        "الكمية": 0, // Placeholder to keep types consistent if needed, or leave empty
        "الوحدة": "",
        "السعر الإفرادي": 0,
        "الإجمالي": totalRevenue
    });

    // 3. Create Worksheet
    const ws = utils.json_to_sheet(rows);
    
    // Adjust column widths for better visibility
    const wscols = [
        {wch: 25}, // Width for Material Name
        {wch: 15}, // Customer
        {wch: 10}, // Quantity
        {wch: 10}, // Unit
        {wch: 15}, // Price
        {wch: 15}  // Total
    ];
    ws['!cols'] = wscols;

    // 4. Create Workbook and Append Sheet
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "الفاتورة");
    
    // 5. Trigger Download
    const fileName = `فاتورة-كوكيز-${Date.now()}.xlsx`;
    writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
    setConfirmPrint(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-fade-up border border-gray-700">
        
        {/* Header (Screen Only) */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl no-print">
          <h3 className="font-bold text-lg text-white">معاينة الفاتورة</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-sm leading-relaxed text-gray-300 bg-white/5" id="invoice-content">
          
          {/* Invoice Header with Logo */}
          <div className="text-center mb-6 border-b-2 border-gray-600 print:border-black pb-4">
            <div className="flex justify-center mb-3">
                <img 
                  src="/logo.png" 
                  alt="شعار مخبز كوكيز" 
                  className="h-24 w-auto object-contain drop-shadow-md print:filter-none"
                  onError={(e) => {
                    // Fallback if image fails to load (optional, just hide it)
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
            </div>
            <h2 className="text-2xl font-bold mb-1 text-white print:text-black">مخبز كوكيز</h2>
            <p className="text-gray-400 font-bold print:text-gray-600">تقرير مبيعات / فاتورة</p>
            <p className="text-gray-500 print:text-gray-600 dir-ltr">{dateStr}</p>
            
            {customerName && (
                <div className="mt-2 border border-dashed border-gray-600 print:border-black p-2 rounded">
                    <p className="text-white print:text-black font-bold">الزبون: {customerName}</p>
                </div>
            )}
          </div>

          <table className="w-full mb-4 text-right">
             <thead>
                 <tr className="border-b border-gray-600 print:border-black">
                     <th className="py-2 text-gray-300 print:text-black">المادة</th>
                     <th className="py-2 text-center text-gray-300 print:text-black">الكمية</th>
                     <th className="py-2 text-gray-300 print:text-black">السعر</th>
                     <th className="py-2 text-gray-300 print:text-black">الإجمالي</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-gray-700 print:divide-gray-300">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-gray-300 print:text-black font-medium">
                        {item.name}
                        {!isSingleCustomer && item.customerName && (
                            <span className="block text-[10px] text-gray-500 print:text-gray-600">({item.customerName})</span>
                        )}
                    </td>
                    <td className="py-2 text-center text-gray-300 print:text-black">
                        {item.quantity} {item.unitType === 'kg' ? 'كغ' : ''}
                    </td>
                    <td className="py-2 text-gray-300 print:text-black">{item.price.toLocaleString()}</td>
                    <td className="py-2 font-bold text-white print:text-black">{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
             </tbody>
          </table>

          <div className="border-t-2 border-gray-600 print:border-black pt-4 mt-6">
            <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-white print:text-black">المجموع الكلي:</span>
                <span className="text-[#FA8072] print:text-black">{totalRevenue.toLocaleString()} ل.س</span>
            </div>
            <div className="flex justify-between items-center text-gray-500 text-sm mt-1 print:text-black">
                <span>عدد المواد (كعناصر):</span>
                <span>{items.length}</span>
            </div>
          </div>

          {/* Signature Section (Visible in Print) */}
          <div className="mt-16 hidden print:flex justify-between items-end px-8">
               <div className="text-center">
                   <p className="mb-10 font-bold text-black text-base">المستلم</p>
                   <div className="w-40 border-b-2 border-black border-dotted"></div>
               </div>
               <div className="text-center">
                   <p className="mb-10 font-bold text-black text-base">التوقيع / الختم</p>
                   <div className="w-40 border-b-2 border-black border-dotted"></div>
               </div>
          </div>
          
          <div className="mt-12 text-center text-xs text-gray-500 print:block hidden font-medium">
             شكراً لزيارتكم مخبز كوكيز - نتمنى لكم يوماً سعيداً
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 flex flex-col gap-3 bg-gray-900/50 rounded-b-2xl no-print">
            <div className="grid grid-cols-2 gap-3">
                {/* Print Button */}
                {confirmPrint ? (
                    <div className="col-span-1 flex items-center gap-2">
                        <button 
                        onClick={handlePrint}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl font-bold text-sm transition-colors"
                        >
                        تأكيد
                        </button>
                        <button 
                        onClick={() => setConfirmPrint(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-xl font-bold text-sm transition-colors"
                        >
                        إلغاء
                        </button>
                    </div>
                ) : (
                    <button 
                    onClick={() => setConfirmPrint(true)}
                    className="col-span-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold transition-all text-white shadow-md bg-[#FA8072] hover:bg-[#e67365]"
                    >
                    <Printer size={18} />
                    <span>طباعة PDF</span>
                    </button>
                )}
                
                {/* Download Excel Button */}
                <button 
                    onClick={handleDownloadExcel}
                    className="col-span-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold transition-all text-white shadow-md bg-green-700 hover:bg-green-600"
                >
                    <FileSpreadsheet size={18} />
                    <span>تصدير Excel</span>
                </button>
            </div>
            
            <button 
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold transition-all text-white shadow-md ${copied ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'تم النسخ للحافظة' : 'نسخ النص (واتساب)'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};