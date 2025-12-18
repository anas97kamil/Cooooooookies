
import React, { useRef, useState } from 'react';
import { X, Download, Upload, Database, AlertTriangle, FileJson, Trash2, Lock } from 'lucide-react';

interface DataManagementModalProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ onExport, onImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassField, setShowPassField] = useState(false);
  const [restorePass, setRestorePass] = useState('');
  const [passError, setPassError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (restorePass === '2026') {
      if (!selectedFile) return;
      onImport(selectedFile);
      onClose();
    } else {
      setPassError(true);
      setRestorePass('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-fade-up">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-2 text-white">
            <Database size={20} className="text-[#FA8072]" />
            <h3 className="font-bold text-lg">النسخ الاحتياطي والبيانات</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                <h4 className="text-white font-bold mb-3 text-center">تصدير قاعدة البيانات</h4>
                <p className="text-gray-500 text-[10px] mb-4 text-center font-bold">قم بحفظ نسخة كاملة من كافة المبيعات، المنتجات، والعملاء.</p>
                <button onClick={onExport} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                    <Download size={20} /> تصدير ملف النسخة (JSON)
                </button>
            </div>

            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                <h4 className="text-white font-bold mb-3 text-center">استعادة قاعدة البيانات</h4>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-1" />
                    <p className="text-[10px] text-red-200 font-bold leading-relaxed">تنبيه: سيتم استبدال كافة البيانات الحالية ببيانات الملف المختار بشكل نهائي.</p>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                {!selectedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm border border-gray-600 border-dashed flex items-center justify-center gap-2 transition-colors">
                        <Upload size={18} /> اختيار الملف...
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-gray-800 p-4 rounded-xl border border-green-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileJson className="text-green-400" size={24} />
                                <span className="text-xs text-white truncate max-w-[150px]">{selectedFile.name}</span>
                            </div>
                            <button onClick={() => setSelectedFile(null)} className="text-red-400"><Trash2 size={18} /></button>
                        </div>
                        
                        {!showPassField ? (
                           <button onClick={() => setShowPassField(true)} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg">المتابعة للاستعادة</button>
                        ) : (
                           <div className="space-y-3 p-3 bg-gray-900 rounded-xl border border-gray-600">
                               <div className="relative">
                                   <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                   <input 
                                     type="password" 
                                     value={restorePass} 
                                     onChange={e => { setRestorePass(e.target.value); setPassError(false); }} 
                                     placeholder="أدخل رمز التحقق" 
                                     className={`w-full bg-gray-800 border ${passError ? 'border-red-500' : 'border-gray-700'} text-white rounded-lg py-2 text-center outline-none`} 
                                     autoFocus 
                                   />
                               </div>
                               <button onClick={handleConfirmRestore} className="w-full bg-red-600 text-white py-2 rounded-lg font-bold">تأكيد الاستبدال</button>
                           </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
