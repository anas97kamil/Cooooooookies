
import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Credentials as requested: Admin / 1997
    if (username === 'Admin' && password === '1997') {
      setError('');
      onLogin();
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-['Cairo']" dir="rtl">
      <div className="bg-[#1F2937] w-full max-w-md p-8 md:p-12 rounded-[2rem] shadow-2xl border border-gray-700/50 animate-fade-up relative overflow-hidden">
        
        {/* Decorative background pulse */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FA8072]/5 rounded-full blur-[60px] animate-pulse"></div>

        {/* Header */}
        <div className="text-center mb-10 relative">
          <div className="inline-flex justify-center mb-6">
             <div className="bg-gray-900/50 p-4 rounded-3xl border border-gray-700 shadow-inner group">
                 <ShieldCheck size={48} className="text-[#FA8072] group-hover:scale-110 transition-transform duration-500" />
             </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">الرجاء تسجيل الدخول</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">نظام إدارة المبيعات الموحد</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 pr-2">
              <User size={12} className="text-[#FA8072]" />
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900/40 border border-gray-700 text-white rounded-2xl px-5 py-4 outline-none focus:border-[#FA8072] focus:ring-1 focus:ring-[#FA8072]/30 transition-all text-left dir-ltr placeholder:text-right placeholder:text-gray-700"
              placeholder="Username"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 pr-2">
              <Lock size={12} className="text-[#FA8072]" />
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/40 border border-gray-700 text-white rounded-2xl px-5 py-4 outline-none focus:border-[#FA8072] focus:ring-1 focus:ring-[#FA8072]/30 transition-all text-left dir-ltr placeholder:text-right placeholder:text-gray-700"
              placeholder="••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-shake">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FA8072] to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-950/20 active:scale-[0.98] mt-4"
          >
            <LogIn size={18} />
            دخول للنظام
          </button>
        </form>

        <div className="mt-10 text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest opacity-50">
          v2.1 Stable • Secured Environment
        </div>
      </div>
    </div>
  );
};
