
import React, { useRef, useState } from 'react';
import { X, Download, Upload, Database, AlertTriangle, FileJson, Check, Trash2, Cloud, Share2, MessageCircle } from 'lucide-react';

interface DataManagementModalProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ onExport, onImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!selectedFile) return;
    onImport(selectedFile);
    onClose();
  };

  const prepareBackupFile = () => {
    const backup = {
      version: '1.4',
      timestamp: Date.now(),
      backupDate: new Date().toLocaleDateString('ar-SY'),
      sales: JSON.parse(localStorage.getItem('dailySales') || '[]'),
      purchaseInvoices: JSON.parse(localStorage.getItem('dailyPurchaseInvoices') || '[]'),
      history: JSON.parse(localStorage.getItem('salesHistory') || '[]'),
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      customers: JSON.parse(localStorage.getItem('customers') || '[]'),
      suppliers: JSON.parse(localStorage.getItem('suppliers') || '[]')
    };
    
    const fileName = `cookies-bakery-backup-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`;
    return new File([JSON.stringify(backup, null, 2)], fileName, { type: 'application/json' });
  };

  const handleShareToWhatsApp = async () => {
    setIsSharing(true);
    try {
      const file = prepareBackupFile();

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'نسخة احتياطية - مخبز كوكيز',
          text: `النسخة الاحتياطية بتاريخ ${new Date().toLocaleDateString('ar-SY')}`,
        });
      } else {
        // Fallback for desktop or non-supporting browsers
        onExport();
        alert('تم تحميل النسخة على جهازك. يمكنك الآن إرسال الملف يدوياً عبر واتساب.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // If sharing is cancelled by user, don't show alert
      if ((error as Error).name !== 'AbortError') {
        onExport();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-700 animate-fade-up flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-2 text-white">
            <Database size={20} className="text-[#FA8072]" />
            <h3 className="font-bold text-lg">إدارة المزامنة والنسخ</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                <div className="flex items-start gap-4 mb-5">
                    <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Download size={24} /></div>
                    <div>
                        <h4 className="text-white font-bold">تصدير النسخة الاحتياطية</h4>
                        <p className="text-gray-500 text-xs mt-1">يمكنك حفظ البيانات أو إرسالها مباشرة.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button 
                        onClick={handleShareToWhatsApp} 
                        disabled={isSharing}
                        className="bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <MessageCircle size={18} />
                        {isSharing ? 'جاري التحضير...' : 'مشاركة عبر واتساب'}
                    </button>
                    
                    <button 
                        onClick={onExport} 
                        className="bg-gray-700 hover:bg-gray-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-gray-600 active:scale-95"
                    >
                        <Download size={18} />
                        تحميل يدوي
                    </button>
                </div>
            </div>

            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                <div className="flex items-start gap-4 mb-5">
                    <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><Upload size={24} /></div>
                    <div><h4 className="text-white font-bold">استعادة من ملف</h4><p className="text-gray-500 text-xs mt-1">اختر ملف النسخة الاحتياطية لاسترجاع البيانات.</p></div>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 shrink-0" />
                    <p className="text-[11px] text-red-200 font-bold leading-relaxed">تنبيه: استعادة البيانات ستمسح كافة السجلات الحالية على هذا الجهاز وتستبدلها ببيانات الملف.</p>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                
                {!selectedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm border border-gray-600 border-dashed flex items-center justify-center gap-2 transition-colors">
                        <Upload size={18} />
                        اختيار ملف النسخة
                    </button>
                ) : (
                    <div className="space-y-3 animate-fade-up">
                        <div className="bg-gray-800 p-4 rounded-xl border border-green-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileJson className="text-green-400" size={24} />
                                <div className="flex flex-col">
                                    <span className="text-xs text-white font-medium truncate max-w-[150px]">{selectedFile.name}</span>
                                    <span className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFile(null)} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                        <button onClick={handleConfirmImport} className="w-full bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95">
                            <Check size={18} />
                            تأكيد الاستعادة الآن
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
