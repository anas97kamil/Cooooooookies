
import React, { useRef, useState } from 'react';
import { X, Download, Upload, Database, AlertTriangle, FileJson, Trash2, Lock, KeyRound, CheckCircle2 } from 'lucide-react';

interface DataManagementModalProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
  systemPassword: string;
  setSystemPassword: (pass: string) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ onExport, onImport, onClose, systemPassword, setSystemPassword }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassField, setShowPassField] = useState(false);
  const [restorePass, setRestorePass] = useState('');
  const [passError, setPassError] = useState(false);

  // حالة تغيير كلمة المرور
  const [passChange, setPassChange] = useState({ old: '', new: '', confirm: '' });
  const [passChangeMsg, setPassChangeMsg] = useState({ text: '', type: '' as 'err' | 'success' | '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (restorePass === systemPassword) {
      if (!selectedFile) return;
      onImport(selectedFile);
      onClose();
    } else {
      setPassError(true);
      setRestorePass('');
    }
  };

  const handlePasswordChange = () => {
      if (passChange.old !== systemPassword) {
          setPassChangeMsg({ text: 'كلمة المرور الحالية غير صحيحة', type: 'err' });
          return;
      }
      if (passChange.new.length < 4) {
          setPassChangeMsg({ text: 'كلمة المرور الجديدة يجب أن تكون 4 أرقام على الأقل', type: 'err' });
          return;
      }
      if (passChange.new !== passChange.confirm) {
          setPassChangeMsg({ text: 'كلمة المرور الجديدة غير متطابقة', type: 'err' });
          return;
      }

      setSystemPassword(passChange.new);
      setPassChange({ old: '', new: '', confirm: '' });
      setPassChangeMsg({ text: 'تم تغيير كلمة المرور بنجاح', type: 'success' });
      setTimeout(() => setPassChangeMsg({ text: '', type: '' }), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-fade-up max-h-[90vh]">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-2 text-white">
            <Database size={20} className="text-[#FA8072]" />
            <h3 className="font-bold text-lg">إعدادات النظام والبيانات</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {/* قسم تغيير كلمة المرور */}
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700 space-y-4">
                <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                    <KeyRound size={16} className="text-orange-400" /> تغيير كلمة المرور
                </h4>
                <div className="space-y-3">
                    <input 
                      type="password" 
                      value={passChange.old} 
                      onChange={e => setPassChange({...passChange, old: e.target.value})} 
                      placeholder="كلمة المرور الحالية" 
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#FA8072]" 
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="password" 
                          value={passChange.new} 
                          onChange={e => setPassChange({...passChange, new: e.target.value})} 
                          placeholder="الرمز الجديد" 
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#FA8072]" 
                        />
                        <input 
                          type="password" 
                          value={passChange.confirm} 
                          onChange={e => setPassChange({...passChange, confirm: e.target.value})} 
                          placeholder="تأكيد الرمز" 
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#FA8072]" 
                        />
                    </div>
                    {passChangeMsg.text && (
                        <div className={`text-[10px] font-bold text-center flex items-center justify-center gap-1 ${passChangeMsg.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>
                            {passChangeMsg.type === 'success' && <CheckCircle2 size={12} />}
                            {passChangeMsg.text}
                        </div>
                    )}
                    <button onClick={handlePasswordChange} className="w-full bg-gray-700 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95">
                        حفظ رمز المرور الجديد
                    </button>
                </div>
            </div>

            {/* قسم التصدير */}
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                    <Download size={16} className="text-blue-400" /> نسخة احتياطية احترافية
                </h4>
                <p className="text-gray-500 text-[10px] mb-4 font-bold leading-relaxed">تصدير قاعدة البيانات بصيغة مضغوطة عالية الكفاءة (GZIP) توفر مساحة كبيرة جداً.</p>
                <button onClick={onExport} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                    <FileJson size={20} /> تصدير نسخة مضغوطة (.bak)
                </button>
            </div>

            {/* قسم الاستيراد */}
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                    <Upload size={16} className="text-green-400" /> استعادة البيانات
                </h4>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-1" />
                    <p className="text-[10px] text-red-200 font-bold leading-relaxed">تنبيه: استعادة البيانات ستحذف كل شيء حالي وتستبدله بمحتوى الملف.</p>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".bak,.json" className="hidden" />
                {!selectedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm border border-gray-600 border-dashed flex items-center justify-center gap-2 transition-colors">
                        اختيار ملف النسخة (.bak أو .json)
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-gray-800 p-4 rounded-xl border border-green-500/30 flex items-center justify-between">
                            <span className="text-xs text-white truncate max-w-[150px] font-bold">{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)} className="text-red-400"><Trash2 size={18} /></button>
                        </div>
                        
                        {!showPassField ? (
                           <button onClick={() => setShowPassField(true)} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg">بدء عملية الاستعادة</button>
                        ) : (
                           <div className="space-y-3 p-3 bg-gray-950 rounded-xl border border-gray-600">
                               <input 
                                 type="password" 
                                 value={restorePass} 
                                 onChange={e => { setRestorePass(e.target.value); setPassError(false); }} 
                                 placeholder="أدخل رمز مرور النظام الحالي" 
                                 className={`w-full bg-gray-800 border ${passError ? 'border-red-500' : 'border-gray-700'} text-white rounded-lg py-2 text-center outline-none`} 
                                 autoFocus 
                               />
                               {passError && <p className="text-red-500 text-[9px] text-center font-bold">الرمز غير صحيح!</p>}
                               <button onClick={handleConfirmRestore} className="w-full bg-red-600 text-white py-2 rounded-lg font-bold">تأكيد الاستبدال النهائي</button>
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
