import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InfoBox } from './components/InfoBox';
import { RecipeGenerator } from './components/RecipeGenerator';
import { Menu } from './components/Menu';
import { Logo } from './components/Logo';
import { Cookie, ChefHat, Utensils, Phone } from 'lucide-react';

const App: React.FC = () => {
  const [clicks, setClicks] = useState<{id: number, x: number, y: number}[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'menu'>('home');

  // Refs for Parallax Elements to avoid re-renders on scroll
  const cookie1Ref = useRef<HTMLDivElement>(null);
  const hat1Ref = useRef<HTMLDivElement>(null);
  const utensilRef = useRef<HTMLDivElement>(null);
  const cookie2Ref = useRef<HTMLDivElement>(null);
  const hat2Ref = useRef<HTMLDivElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      // Use requestAnimationFrame for smooth 60fps performance
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;

        // Apply transforms directly to DOM nodes
        if (cookie1Ref.current) {
          cookie1Ref.current.style.transform = `translate3d(0, ${y * 0.3}px, 0) rotate(15deg)`;
        }
        if (hat1Ref.current) {
          hat1Ref.current.style.transform = `translate3d(0, ${y * 0.5}px, 0) rotate(-10deg)`;
        }
        if (utensilRef.current) {
          utensilRef.current.style.transform = `translate3d(0, ${y * 0.4}px, 0) rotate(45deg)`;
        }
        if (cookie2Ref.current) {
          cookie2Ref.current.style.transform = `translate3d(0, ${y * 0.6}px, 0) rotate(-25deg)`;
        }
        if (hat2Ref.current) {
          hat2Ref.current.style.transform = `translate3d(0, ${y * 0.15}px, 0) rotate(180deg)`;
        }
        if (logoWrapperRef.current) {
          // Only apply if element exists (it might be unmounted in 'menu' view)
          logoWrapperRef.current.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
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
      {/* Parallax Background Layer - Using will-change-transform for GPU acceleration */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        {/* Top Left Cookie - Moves slowly */}
        <div 
          ref={cookie1Ref}
          className="absolute top-[5%] left-[5%] text-[#FA8072] opacity-[0.06] will-change-transform"
          style={{ transform: 'rotate(15deg)' }}
        >
          <Cookie size={120} />
        </div>

        {/* Top Right Chef Hat - Moves faster */}
        <div 
          ref={hat1Ref}
          className="absolute top-[15%] right-[8%] text-[#D4A76A] opacity-[0.08] will-change-transform"
          style={{ transform: 'rotate(-10deg)' }}
        >
          <ChefHat size={140} />
        </div>

        {/* Middle Left Utensils - Medium speed */}
        <div 
          ref={utensilRef}
          className="absolute top-[45%] left-[10%] text-gray-500 opacity-[0.05] will-change-transform"
          style={{ transform: 'rotate(45deg)' }}
        >
          <Utensils size={100} />
        </div>

        {/* Bottom Right Cookie - Fast */}
        <div 
          ref={cookie2Ref}
          className="absolute top-[70%] right-[15%] text-[#4E342E] opacity-[0.04] will-change-transform"
          style={{ transform: 'rotate(-25deg)' }}
        >
          <Cookie size={160} />
        </div>

        {/* Center Deep Background - Very slow */}
        <div 
          ref={hat2Ref}
          className="absolute top-[30%] left-[40%] text-[#FA8072] opacity-[0.03] will-change-transform"
          style={{ transform: 'rotate(180deg)' }}
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
                ref={logoWrapperRef}
                className="flex justify-center py-4 relative will-change-transform"
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