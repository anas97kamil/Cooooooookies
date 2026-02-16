import React, { useRef, useState } from 'react';
import { X, Download, Upload, Database, AlertTriangle, FileJson, Trash2, Lock, KeyRound, CheckCircle2, Archive, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface DataManagementModalProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onArchiveDay: () => void;
  onClose: () => void;
  systemPassword: string;
  setSystemPassword: (pass: string) => void;
  loginPassword: string;
  setLoginPassword: (pass: string) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ 
  onExport, onImport, onArchiveDay, onClose, systemPassword, setSystemPassword, loginPassword, setLoginPassword 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassField, setShowPassField] = useState(false);
  const [restorePass, setRestorePass] = useState('');
  const [passError, setPassError] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'security'>('main');

  const [passChange, setPassChange] = useState({ old: '', new: '', confirm: '' });
  const [sysPassChange, setSysPassChange] = useState({ old: '', new: '', confirm: '' });
  const [passChangeMsg, setPassChangeMsg] = useState({ text: '', type: '' as 'err' | 'success' | '' });
  const [sysPassChangeMsg, setSysPassChangeMsg] = useState({ text: '', type: '' as 'err' | 'success' | '' });

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

  const handleLoginPasswordChange = () => {
      if (passChange.old !== loginPassword) {
          setPassChangeMsg({ text: 'كلمة مرور الدخول الحالية غير صحيحة', type: 'err' });
          return;
      }
      if (passChange.new.length < 4) {
          setPassChangeMsg({ text: 'كلمة المرور يجب أن تكون 4 رموز على الأقل', type: 'err' });
          return;
      }
      if (passChange.new !== passChange.confirm) {
          setPassChangeMsg({ text: 'تأكيد كلمة المرور غير متطابق', type: 'err' });
          return;
      }

      setLoginPassword(passChange.new);
      setPassChange({ old: '', new: '', confirm: '' });
      setPassChangeMsg({ text: 'تم تغيير كلمة مرور الدخول بنجاح', type: 'success' });
      setTimeout(() => setPassChangeMsg({ text: '', type: '' }), 3000);
  };

  const handleSystemPasswordChange = () => {
      if (sysPassChange.old !== systemPassword) {
          setSysPassChangeMsg({ text: 'كلمة مرور العمليات الحالية غير صحيحة', type: 'err' });
          return;
      }
      if (sysPassChange.new.length < 4) {
          setSysPassChangeMsg({ text: 'كلمة المرور يجب أن تكون 4 رموز على الأقل', type: 'err' });
          return;
      }
      if (sysPassChange.new !== sysPassChange.confirm) {
          setSysPassChangeMsg({ text: 'تأكيد كلمة المرور غير متطابق', type: 'err' });
          return;
      }

      setSystemPassword(sysPassChange.new);
      setSysPassChange({ old: '', new: '', confirm: '' });
      setSysPassChangeMsg({ text: 'تم تغيير كلمة مرور العمليات بنجاح', type: 'success' });
      setTimeout(() => setSysPassChangeMsg({ text: '', type: '' }), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-fade-up max-h-[90vh]">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Database size={20} className="text-[#FA8072]" />
            <h3 className="font-black text-lg">إعدادات النظام والبيانات</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            
            {activeSection === 'main' ? (
              <>
                <div className="bg-[#FA8072]/10 p-5 rounded-2xl border border-[#FA8072]/20 space-y-4">
                    <h4 className="text-white font-black flex items-center gap-2 text-sm">
                        <Archive size={16} className="text-orange-500" /> إغلاق وترحيل اليوم
                    </h4>
                    <p className="text-gray-400 text-[10px] font-bold leading-relaxed">سيتم نقل جميع مبيعات ومشتريات اليوم النشطة إلى السجلات التاريخية وتصفير النظام.</p>
                    <button onClick={() => { onArchiveDay(); onClose(); }} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3.5 rounded-xl font-black text-xs transition-all shadow-xl active:scale-95">ترحيل مبيعات اليوم وتصفير النظام</button>
                </div>

                <button 
                  onClick={() => setActiveSection('security')}
                  className="w-full bg-gray-900/60 p-5 rounded-2xl border border-gray-700 flex items-center justify-between hover:border-[#FA8072] transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><ShieldCheck size={24} /></div>
                        <div className="text-right">
                            <h4 className="text-white font-black text-sm">الأمان والخصوصية</h4>
                            <p className="text-gray-500 text-[10px] font-bold mt-0.5">تغيير كلمات مرور الدخول والتبويبات</p>
                        </div>
                    </div>
                    <ChevronDown size={18} className="text-gray-600 group-hover:text-[#FA8072] -rotate-90" />
                </button>

                <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                    <h4 className="text-white font-black mb-3 text-sm flex items-center gap-2"><Download size={16} className="text-blue-400" /> نسخة احتياطية (.bak)</h4>
                    <p className="text-gray-500 text-[10px] mb-4 font-bold leading-relaxed">تصدير قاعدة البيانات بصيغة مضغوطة تشمل (المبيعات، المشتريات، المنتجات، وكلمات المرور).</p>
                    <button onClick={onExport} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"><FileJson size={20} /> تصدير نسخة مضغوطة</button>
                </div>

                <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700">
                    <h4 className="text-white font-black mb-3 text-sm flex items-center gap-2"><Upload size={16} className="text-green-400" /> استعادة البيانات</h4>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-1" />
                        <p className="text-[10px] text-red-200 font-bold leading-relaxed">تنبيه: استعادة البيانات ستحذف كل شيء حالي وتستبدله بمحتوى الملف.</p>
                    </div>

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".bak,.json" className="hidden" />
                    {!selectedFile ? (
                        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-black text-xs border border-gray-600 border-dashed flex items-center justify-center gap-2 transition-colors">اختيار ملف النسخة (.bak)</button>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-gray-800 p-4 rounded-xl border border-green-500/30 flex items-center justify-between"><span className="text-xs text-white truncate max-w-[150px] font-black">{selectedFile.name}</span><button onClick={() => setSelectedFile(null)} className="text-red-400"><Trash2 size={18} /></button></div>
                            {!showPassField ? (
                               <button onClick={() => setShowPassField(true)} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-black shadow-lg">بدء عملية الاستعادة</button>
                            ) : (
                               <div className="space-y-3 p-3 bg-gray-950 rounded-xl border border-gray-600">
                                   <input type="password" value={restorePass} onChange={e => { setRestorePass(e.target.value); setPassError(false); }} placeholder="أدخل كلمة مرور العمليات للتأكيد" className={`w-full bg-gray-800 border ${passError ? 'border-red-500' : 'border-gray-700'} text-white rounded-lg py-3 text-center outline-none`} autoFocus />
                                   {passError && <p className="text-red-500 text-[9px] text-center font-bold">الرمز غير صحيح!</p>}
                                   <button onClick={handleConfirmRestore} className="w-full bg-red-600 text-white py-2.5 rounded-lg font-black text-xs">تأكيد الاستبدال النهائي</button>
                               </div>
                            )}
                        </div>
                    )}
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-fade-up">
                  <button onClick={() => setActiveSection('main')} className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2"><ArrowRight size={14} /> العودة للبيانات</button>
                  
                  {/* Password Level 1: Login */}
                  <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700 space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500"><Lock size={16} /></div>
                          <h4 className="text-white font-black text-sm">كلمة مرور تسجيل الدخول</h4>
                      </div>
                      <div className="space-y-3">
                          <input type="password" value={passChange.old} onChange={e => setPassChange({...passChange, old: e.target.value})} placeholder="كلمة المرور الحالية" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none" />
                          <div className="grid grid-cols-2 gap-2">
                              <input type="password" value={passChange.new} onChange={e => setPassChange({...passChange, new: e.target.value})} placeholder="الرمز الجديد" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none" />
                              <input type="password" value={passChange.confirm} onChange={e => setPassChange({...passChange, confirm: e.target.value})} placeholder="تأكيد الرمز" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none" />
                          </div>
                          {passChangeMsg.text && <div className={`text-[10px] font-bold text-center flex items-center justify-center gap-1 ${passChangeMsg.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{passChangeMsg.text}</div>}
                          <button onClick={handleLoginPasswordChange} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-black text-xs transition-all">تحديث كلمة مرور الدخول</button>
                      </div>
                  </div>

                  {/* Password Level 2: Tabs/System */}
                  <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700 space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-[#FA8072]/10 p-2 rounded-lg text-[#FA8072]"><KeyRound size={16} /></div>
                          <h4 className="text-white font-black text-sm">كلمة مرور العمليات والتبويبات</h4>
                      </div>
                      <div className="space-y-3">
                          <input type="password" value={sysPassChange.old} onChange={e => setSysPassChange({...sysPassChange, old: e.target.value})} placeholder="كلمة مرور العمليات الحالية" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none" />
                          <div className="grid grid-cols-2 gap-2">
                              <input type="password" value={sysPassChange.new} onChange={e => setSysPassChange({...sysPassChange, new: e.target.value})} placeholder="الرمز الجديد" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none" />
                              <input type="password" value={sysPassChange.confirm} onChange={e => setSysPassChange({...sysPassChange, confirm: e.target.value})} placeholder="تأكيد الرمز" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none" />
                          </div>
                          {sysPassChangeMsg.text && <div className={`text-[10px] font-bold text-center flex items-center justify-center gap-1 ${sysPassChangeMsg.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{sysPassChangeMsg.text}</div>}
                          <button onClick={handleSystemPasswordChange} className="w-full bg-[#FA8072] hover:bg-orange-600 text-white py-2.5 rounded-xl font-black text-xs transition-all">تحديث كلمة مرور العمليات</button>
                      </div>
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
const ArrowRight = ({ size, className }: { size: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;