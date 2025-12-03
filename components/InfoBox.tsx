import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram } from 'lucide-react';

export const InfoBox: React.FC = () => {
  return (
    <div className="bg-white/30 backdrop-blur-2xl w-full max-w-3xl mx-auto p-8 rounded-[2.5rem] shadow-2xl border border-white/50 transform transition-all duration-200 hover:shadow-orange-200/20 hover:scale-[1.01] active:scale-[0.99] cursor-default relative overflow-hidden group/box">
      
      {/* Glossy reflection effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

      <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-8 border-b border-white/40 pb-4 select-none relative z-10 drop-shadow-sm">
        معلومات التواصل
      </h2>

      <div className="space-y-6 relative z-10">
        {/* Phone Section */}
        <div className="flex items-start gap-4 text-gray-800 group cursor-pointer active:scale-95 transition-transform p-3 rounded-2xl hover:bg-white/40 border border-transparent hover:border-white/50 bg-white/20 shadow-sm backdrop-blur-sm">
          <div className="bg-white/60 p-3 rounded-2xl group-hover:bg-[#FA8072] group-hover:text-white transition-colors shrink-0 mt-1 shadow-inner">
            <Phone className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start w-full gap-1">
            <a 
              href="tel:+963957432958" 
              className="text-base font-bold text-gray-800 tracking-wide hover:text-[#FA8072] transition-colors"
              style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'right' }}
            >
              +963 957 432 958
            </a>
            <a 
              href="tel:+963993986953" 
              className="text-base font-bold text-gray-800 tracking-wide hover:text-[#FA8072] transition-colors"
              style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'right' }}
            >
              +963 993 986 953
            </a>
          </div>
        </div>

        {/* Email Section */}
        <div className="flex items-center gap-4 text-gray-800 group cursor-pointer active:scale-95 transition-transform p-3 rounded-2xl hover:bg-white/40 border border-transparent hover:border-white/50 bg-white/20 shadow-sm backdrop-blur-sm">
          <div className="bg-white/60 p-3 rounded-2xl group-hover:bg-[#FA8072] group-hover:text-white transition-colors shrink-0 shadow-inner">
            <Mail className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <a 
            href="mailto:cookies.sy@tuta.io" 
            className="text-base font-bold text-gray-800 break-all hover:text-[#FA8072] transition-colors"
          >
            cookies.sy@tuta.io
          </a>
        </div>

        {/* Address Section */}
        <div className="flex items-center gap-4 text-gray-800 group cursor-pointer active:scale-95 transition-transform p-3 rounded-2xl hover:bg-white/40 border border-transparent hover:border-white/50 bg-white/20 shadow-sm backdrop-blur-sm">
          <div className="bg-white/60 p-3 rounded-2xl group-hover:bg-[#FA8072] group-hover:text-white transition-colors shrink-0 shadow-inner">
            <MapPin className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-800 group-hover:text-[#FA8072] transition-colors">
              سوريا – حماة – شارع الزاغة
            </span>
            <span className="text-sm font-bold text-gray-800 group-hover:text-[#FA8072] transition-colors mt-1">
              مقابل سنتر الجمان
            </span>
          </div>
        </div>
      </div>

      {/* Social & WhatsApp Section */}
      <div className="mt-10 pt-8 border-t border-white/40 flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
        
        {/* WhatsApp Button */}
        <a 
          href="https://wa.me/963957432958"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:w-auto flex-1 flex items-center justify-center gap-3 bg-[#25D366]/90 hover:bg-[#20bd5a] backdrop-blur-md text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-green-900/10 transition-all hover:-translate-y-1 active:scale-95 border border-green-400/30"
        >
          <MessageCircle className="w-6 h-6 animate-pulse" strokeWidth={2.5} />
          <span className="text-xl">راسلنا عبر واتساب</span>
        </a>

        {/* Social Icons Container */}
        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            {/* Icons */}
            <div className="flex justify-center items-center gap-6 w-full">
                <a 
                  href="https://www.facebook.com/share/1EVGzxvb3y/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex flex-col items-center gap-2 transition-transform active:scale-90"
                >
                    <div className="p-4 bg-white/60 rounded-2xl group-hover:bg-[#1877F2] transition-colors shadow-sm ring-1 ring-white/50 backdrop-blur-sm">
                        <Facebook className="w-6 h-6 text-[#1877F2] group-hover:text-white transition-colors" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs text-gray-700 font-bold group-hover:text-[#1877F2]">فيسبوك</span>
                </a>
                
                <a 
                  href="https://www.instagram.com/cookies.hama?igsh=bWx0YWIydjRiOGZn" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex flex-col items-center gap-2 transition-transform active:scale-90"
                >
                    <div className="p-4 bg-white/60 rounded-2xl group-hover:bg-gradient-to-tr group-hover:from-yellow-400 group-hover:via-red-500 group-hover:to-purple-500 transition-all shadow-sm ring-1 ring-white/50 backdrop-blur-sm">
                        <Instagram className="w-6 h-6 text-[#E4405F] group-hover:text-white transition-colors" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs text-gray-700 font-bold group-hover:text-[#E4405F]">انستغرام</span>
                </a>
            </div>
            
            {/* New Text */}
            <p className="text-gray-600 text-sm font-bold opacity-90 select-none text-center drop-shadow-sm">
                تابعنا عبر وسائل التواصل الإجتماعي
            </p>
        </div>
      </div>
    </div>
  );
};
