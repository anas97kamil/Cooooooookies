
import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

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
      <div className="bg-[#111827] w-full max-w-md p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-gray-800 animate-fade-up relative overflow-hidden">
        
        {/* Simplified Header */}
        <div className="text-center mb-12 relative">
          <h1 className="text-3xl font-black text-white mb-2">الرجاء تسجيل الدخول</h1>
          <div className="h-1 w-16 bg-[#FA8072] mx-auto rounded-full mt-4 opacity-50"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 pr-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 text-white rounded-2xl px-6 py-4 outline-none focus:border-[#FA8072] focus:ring-1 focus:ring-[#FA8072]/20 transition-all text-left dir-ltr placeholder:text-right placeholder:text-gray-700"
              placeholder="Username"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 pr-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 text-white rounded-2xl px-6 py-4 outline-none focus:border-[#FA8072] focus:ring-1 focus:ring-[#FA8072]/20 transition-all text-left dir-ltr placeholder:text-right placeholder:text-gray-700"
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
            className="w-full bg-gradient-to-br from-gray-800 to-gray-900 hover:from-[#FA8072] hover:to-orange-600 text-white font-black py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] mt-6 border border-gray-700 hover:border-orange-500/50"
          >
            <LogIn size={20} />
            دخول للنظام
          </button>
        </form>

        <div className="mt-12 text-center text-[9px] text-gray-700 font-bold uppercase tracking-[0.3em] opacity-40">
          SECURE ACCESS • SYSTEM V2.2
        </div>
      </div>
    </div>
  );
};
