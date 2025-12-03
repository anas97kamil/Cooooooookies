import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InfoBox } from './components/InfoBox';
import { RecipeGenerator } from './components/RecipeGenerator';
import { Menu } from './components/Menu';
import { Logo } from './components/Logo';
import { Cookie, ChefHat, Utensils, Phone } from 'lucide-react';

const App: React.FC = () => {
  const [clicks, setClicks] = useState<{id: number, x: number, y: number}[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [currentView, setCurrentView] = useState<'home' | 'menu'>('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Add scroll listener with passive option for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGlobalClick = (e: React.MouseEvent) => {
    // Only trigger ripple if not clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea') || target.closest('label')) {
      return;
    }

    const id = Date.now();
    // Add new click coordinate
    setClicks(prev => [...prev, { id, x: e.pageX, y: e.pageY }]);
    
    // Remove it after animation finishes (600ms)
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 600);
  };

  const handleNavigate = (view: 'home' | 'menu') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="min-h-screen flex flex-col cursor-pointer sm:cursor-auto relative overflow-hidden" 
      onClick={handleGlobalClick}
    >
      {/* Parallax Background Layer */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        {/* Top Left Cookie - Moves slowly */}
        <div 
          className="absolute top-[5%] left-[5%] text-[#FA8072] opacity-[0.06]"
          style={{ transform: `translateY(${scrollY * 0.3}px) rotate(15deg)` }}
        >
          <Cookie size={120} />
        </div>

        {/* Top Right Chef Hat - Moves faster */}
        <div 
          className="absolute top-[15%] right-[8%] text-[#D4A76A] opacity-[0.08]"
          style={{ transform: `translateY(${scrollY * 0.5}px) rotate(-10deg)` }}
        >
          <ChefHat size={140} />
        </div>

        {/* Middle Left Utensils - Medium speed */}
        <div 
          className="absolute top-[45%] left-[10%] text-gray-500 opacity-[0.05]"
          style={{ transform: `translateY(${scrollY * 0.4}px) rotate(45deg)` }}
        >
          <Utensils size={100} />
        </div>

        {/* Bottom Right Cookie - Fast */}
        <div 
          className="absolute top-[70%] right-[15%] text-[#4E342E] opacity-[0.04]"
          style={{ transform: `translateY(${scrollY * 0.6}px) rotate(-25deg)` }}
        >
          <Cookie size={160} />
        </div>

        {/* Center Deep Background - Very slow */}
        <div 
          className="absolute top-[30%] left-[40%] text-[#FA8072] opacity-[0.03]"
          style={{ transform: `translateY(${scrollY * 0.15}px) rotate(180deg)` }}
        >
          <ChefHat size={200} />
        </div>
      </div>

      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-grow container mx-auto px-4 pb-8 pt-36 md:pt-32 relative z-10">
        
        {/* Render content based on current view with animation wrapper */}
        <div key={currentView} className="animate-fade-up w-full flex flex-col gap-12">
          {currentView === 'home' ? (
            <>
              {/* Logo Section with Parallax Lift (Only on Home) */}
              <div 
                className="flex justify-center py-4 relative"
                style={{ transform: `translateY(${scrollY * 0.1}px)` }} 
              >
                <div className="relative group">
                  <Logo 
                    className="w-[280px] h-[280px] md:w-[320px] md:h-[320px] drop-shadow-2xl transition-all duration-300 hover:drop-shadow-3xl" 
                  />
                </div>
              </div>

              {/* Contact Info */}
              <InfoBox />

              {/* AI Feature */}
              <RecipeGenerator />
            </>
          ) : (
            <Menu />
          )}
        </div>

      </main>

      <footer className="bg-slate-800 text-slate-300 py-8 mt-auto relative z-10">
        <div className="container mx-auto px-4 text-center transition-transform active:scale-95 duration-200 select-none">
          <p className="mb-2 text-lg">جميع الحقوق محفوظة 2026 - مخبز كوكيز</p>
          <p className="text-sm opacity-75">صُنع يدوياً بكل حُب ❤️</p>
        </div>
      </footer>

      {/* Floating Call Button */}
      <a
        href="tel:+963957432958"
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-green-500 to-green-400 text-white rounded-full shadow-lg shadow-green-300/50 transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-90 group"
        aria-label="اتصل بنا الآن"
      >
        {/* Pulse Effect */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-30 animate-ping"></span>
        <Phone size={28} strokeWidth={2.5} className="relative z-10 fill-current" />
      </a>

      {/* Render Click Effects */}
      {clicks.map(click => (
        <span
          key={click.id}
          className="fixed pointer-events-none rounded-full bg-[#FA8072] opacity-50 z-50 w-10 h-10 -ml-5 -mt-5 animate-ripple"
          style={{ 
            left: click.x, 
            top: click.y - window.scrollY // Adjust for scroll
          }}
        />
      ))}
    </div>
  );
};

export default App;