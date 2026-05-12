import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Icon from "@/components/ui/icon";
import HomePage from "./pages/HomePage";
import DoorsPage from "./pages/DoorsPage";
import CabinetPage from "./pages/CabinetPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import ContactsPage from "./pages/ContactsPage";

const queryClient = new QueryClient();

const NAV_ITEMS = [
  { id: 'home', label: 'Главная', icon: 'Home' },
  { id: 'doors', label: 'Двери', icon: 'DoorOpen' },
  { id: 'cabinet', label: 'Кабинет', icon: 'User' },
  { id: 'about', label: 'О проекте', icon: 'Info' },
  { id: 'contacts', label: 'Контакты', icon: 'MessageSquare' },
  { id: 'admin', label: 'Админ', icon: 'Shield' },
];

function NavBar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div
        className="max-w-5xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(7,9,15,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(251,191,36,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => setActive('home')}
          className="flex items-center gap-2 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
            <span className="text-black text-xs font-bold">GD</span>
          </div>
          <span className="font-oswald text-base tracking-widest text-white/90 uppercase group-hover:text-gold-400 transition-colors">
            Golden Door
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`nav-link text-sm ${active === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA + Mobile burger */}
        <div className="flex items-center gap-3">
          <button
            className="hidden md:block btn-gold px-5 py-2 text-xs rounded-xl"
            onClick={() => setActive('doors')}
          >
            Купить ключ
          </button>
          <button
            className="md:hidden text-white/60 hover:text-gold-400 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'X' : 'Menu'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden mt-2 max-w-5xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(7,9,15,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(251,191,36,0.12)',
          }}
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors border-b border-white/5 last:border-0 ${
                active === item.id ? 'text-gold-400 bg-gold-500/5' : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Icon name={item.icon} fallback="Star" size={18} />
              <span className="font-oswald tracking-wider uppercase text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

function PageContent({ active }: { active: string }) {
  switch (active) {
    case 'home': return <HomePage />;
    case 'doors': return <DoorsPage />;
    case 'cabinet': return <CabinetPage />;
    case 'admin': return <AdminPage />;
    case 'about': return <AboutPage />;
    case 'contacts': return <ContactsPage />;
    default: return <HomePage />;
  }
}

const App = () => {
  const [activePage, setActivePage] = useState('home');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen" style={{ background: '#07090f' }}>
          <NavBar active={activePage} setActive={setActivePage} />
          <PageContent active={activePage} />

          {/* Footer */}
          <footer className="border-t border-white/5 py-8 px-4 text-center">
            <div className="font-oswald text-xs text-white/20 tracking-widest uppercase">
              © 2026 Golden Door · Все права защищены
            </div>
            <div className="flex justify-center gap-6 mt-3">
              {['Условия', 'Политика', 'Правила'].map(link => (
                <button key={link} className="text-xs text-white/20 hover:text-white/40 font-rubik transition-colors">
                  {link}
                </button>
              ))}
            </div>
          </footer>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
