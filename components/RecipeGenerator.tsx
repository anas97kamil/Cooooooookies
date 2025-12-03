import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle, MessageCircle } from 'lucide-react';

export const RecipeGenerator: React.FC = () => {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;

    // تجهيز نص الرسالة لرابط واتساب
    const text = encodeURIComponent(message);
    // الرقم الدولي بدون أصفار أو إشارات
    const phoneNumber = "963957432958"; 
    
    // فتح رابط واتساب
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');

    // إظهار رسالة الشكر
    setSubmitted(true);
  };

  const handleReset = () => {
    setMessage('');
    setSubmitted(false);
  };

  return (
    <div 
      className="w-full max-w-3xl mx-auto mt-12 relative z-20 mb-20"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Container Box - Glassmorphism */}
      <div className="bg-white/30 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50 transition-all duration-300 hover:shadow-green-200/20 hover:scale-[1.005]">
        
        {/* Header Section */}
        <div className="bg-white/10 p-6 md:p-8 text-center border-b border-white/30 relative">
          <div className="inline-block p-4 bg-[#25D366]/90 backdrop-blur-md rounded-2xl text-white mb-4 shadow-lg shadow-green-900/10 transform transition-transform hover:rotate-6 border border-white/20">
            {submitted ? <CheckCircle className="w-10 h-10" strokeWidth={2.5} /> : <MessageCircle className="w-10 h-10" strokeWidth={2.5} />}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 drop-shadow-sm">
            {submitted ? "تم التحويل بنجاح!" : "أرسل طلبك مباشرة"}
          </h2>
          <p className="text-gray-700 font-semibold text-lg">
            {submitted ? "شكراً لتواصلك معنا، ننتظر رسالتك على واتساب." : "اكتب طلبك أو استفسارك هنا وسيتم تحويلك مباشرة لمحادثة واتساب."}
          </p>
        </div>

        <div className="p-6 md:p-8">
          
          {!submitted ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="مرحباً، أرغب بطلب..."
                  className="w-full p-5 h-48 text-lg font-bold border border-white/60 rounded-2xl focus:border-[#25D366] focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-inner bg-white/40 text-gray-800 placeholder-gray-500 resize-none backdrop-blur-sm"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-full bg-[#25D366]/90 hover:bg-[#20bd5a] disabled:bg-gray-400/50 disabled:cursor-not-allowed text-white py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-900/10 text-xl border border-green-400/30 backdrop-blur-md"
              >
                <Send className="w-6 h-6 rtl:-scale-x-100" strokeWidth={2.5} />
                <span>إرسال عبر واتساب</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-6 animate-in zoom-in duration-500">
              <div className="bg-white/40 text-green-800 p-8 rounded-2xl border border-white/50 shadow-inner backdrop-blur-md">
                <p className="text-xl font-bold leading-relaxed">
                  تم فتح تطبيق واتساب لإكمال عملية الإرسال.
                  <br/>
                  <span className="text-2xl mt-2 block drop-shadow-sm">شكراً لاختيارك مخبز كوكيز! 🍪</span>
                </p>
              </div>
              
              <button
                onClick={handleReset}
                className="text-[#25D366] hover:text-[#20bd5a] font-bold text-lg underline decoration-2 decoration-dotted underline-offset-4 transition-colors hover:decoration-solid drop-shadow-sm"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
