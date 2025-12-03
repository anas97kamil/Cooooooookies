import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`${className} relative flex items-center justify-center cursor-pointer select-none group`}>
      {/* Glow Effect Layer (التوهج) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-white/20 via-white/70 to-orange-100/20 blur-[40px] rounded-full pointer-events-none z-0 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"></div>
      
      {/* Logo Image */}
      <img 
        src="/logo.png" 
        alt="شعار المتجر" 
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-105 group-active:scale-95"
      />
    </div>
  );
};