import React from 'react';
import { Home, Grid } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'menu';
  onNavigate: (view: 'home' | 'menu') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="bg-[#FA8072] text-white py-4 shadow-md fixed top-0 w-full z-50 transition-all hover:shadow-lg">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title Area - Clickable to go home */}
        <div 
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => onNavigate('home')}
        >
            <div className="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
               <img 
                 src="/logo.png" 
                 alt="شعار مخبز كوكيز" 
                 className="w-10 h-10 object-contain drop-shadow-md" 
               />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide transition-transform group-hover:scale-105">مخبز كوكيز</h1>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-white/20 p-1.5 rounded-2xl backdrop-blur-sm shadow-inner">
            <button 
                onClick={() => onNavigate('home')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 ${currentView === 'home' ? 'bg-white text-[#FA8072] shadow-md font-bold scale-105' : 'text-white hover:bg-white/10 font-medium'}`}
            >
                <Home size={18} strokeWidth={2.5} />
                <span>الرئيسية</span>
            </button>
            <div className="w-px h-6 bg-white/30 mx-1"></div>
            <button 
                onClick={() => onNavigate('menu')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 ${currentView === 'menu' ? 'bg-white text-[#FA8072] shadow-md font-bold scale-105' : 'text-white hover:bg-white/10 font-medium'}`}
            >
                <Grid size={18} strokeWidth={2.5} />
                <span>المنيو</span>
            </button>
        </nav>
      </div>
    </header>
  );
};