
import React, { useState } from 'react';
import { LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Admin' && password === '2026') {
      onLogin();
    } else {
      setError('بيانات الدخول غير صحيحة');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-['Cairo'] relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#FA8072]/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="bg-gray-800/40 backdrop-blur-2xl w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-gray-700/50 animate-fade-up relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#FA8072] to-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/30 rotate-3 transition-transform hover:rotate-6">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">مخبز كوكيز</h1>
          <p className="text-gray-400 text-sm font-bold opacity-70">نظام المحاسبة الموحد</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full bg-gray-900/60 border border-gray-700 text-white rounded-2xl px-6 py-4 outline-none focus:border-[#FA8072] focus:ring-4 focus:ring-[#FA8072]/10 transition-all text-center font-bold placeholder:text-gray-600" 
                placeholder="اسم المستخدم" 
                required 
              />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-gray-900/60 border border-gray-700 text-white rounded-2xl px-6 py-4 outline-none focus:border-[#FA8072] focus:ring-4 focus:ring-[#FA8072]/10 transition-all text-center font-bold tracking-widest placeholder:text-gray-600" 
                placeholder="••••" 
                required 
              />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 animate-bounce">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#FA8072] to-orange-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <LogIn size={20} />
            تـسـجـيـل الـدخـول
          </button>
        </form>

        <p className="mt-12 text-center text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] opacity-40">
          Cookie Accounting System • SECURED
        </p>
      </div>
    </div>
  );
};
