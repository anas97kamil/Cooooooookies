import React from 'react';
import { ChefHat, Timer, Cookie, Sparkles, ArrowRight } from 'lucide-react';

export const Menu: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 text-orange-200 animate-pulse delay-700">
        <Cookie size={60} className="rotate-12" />
      </div>
      <div className="absolute bottom-10 right-10 text-orange-200 animate-pulse delay-1000">
        <Cookie size={80} className="-rotate-12" />
      </div>

      <div className="bg-white/30 backdrop-blur-2xl p-8 md:p-14 rounded-[3rem] shadow-2xl border border-white/50 max-w-3xl w-full transform transition-all hover:scale-[1.02] relative z-10 group overflow-hidden">
        
        {/* Glossy reflection */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>

        {/* Glow Effect behind the icon */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#FA8072]/30 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="flex justify-center mb-10 relative">
            <div className="relative">
                <div className="p-10 bg-white/40 backdrop-blur-md rounded-full shadow-lg ring-1 ring-white/60 relative z-10">
                    <ChefHat size={100} className="text-[#FA8072] drop-shadow-md transform group-hover:rotate-6 transition-transform duration-500" strokeWidth={1.5} />
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -bottom-4 -right-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                    <Timer size={18} className="text-[#FA8072]" />
                    <span className="text-sm font-bold text-gray-700">قريباً..</span>
                </div>

                {/* Sparkles */}
                <div className="absolute -top-2 -right-4 text-yellow-400 animate-pulse">
                    <Sparkles size={32} strokeWidth={2.5} />
                </div>
            </div>
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-sm bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent relative z-10">
          المنيو في الفـرن!
        </h2>

        <div className="space-y-6 max-w-lg mx-auto relative z-10">
            <p className="text-2xl text-[#FA8072] font-bold drop-shadow-sm">
              نخبز لكم شيئاً مميزاً.. 🍪
            </p>
            <p className="text-gray-700 font-medium leading-loose text-lg">
              نقوم حالياً بتجهيز قائمة بألذ وصفات الكوكيز، البراونيز، والحلويات الغربية وتصويرها لتليق بذائقتكم. 
              <br/>
              <span className="opacity-70 text-sm">يرجى العودة لاحقاً لرؤية المفاجآت.</span>
            </p>

            {/* Hint/Action */}
            <div className="pt-6">
                <a 
                   href="https://wa.me/963957432958" 
                   target="_blank"
                   rel="noreferrer"
                   className="inline-flex items-center gap-3 px-8 py-4 bg-white/70 backdrop-blur-md text-gray-800 rounded-2xl font-bold shadow-md hover:shadow-xl hover:text-[#FA8072] hover:-translate-y-1 transition-all border border-white/50 group/btn"
                >
                    <span>اطلب الآن عبر واتساب</span>
                    <ArrowRight size={20} className="rtl:rotate-180 group-hover/btn:-translate-x-1 transition-transform" />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};
