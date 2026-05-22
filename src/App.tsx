import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";
import HomePage from "./pages/HomePage";
import DoorsPage from "./pages/DoorsPage";
import CabinetPage from "./pages/CabinetPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import ContactsPage from "./pages/ContactsPage";
import AuthPage from "./pages/AuthPage";

const queryClient = new QueryClient();

const NAV_ITEMS = [
  { id: "home", label: "Главная", icon: "Home", adminOnly: false },
  { id: "doors", label: "Двери", icon: "DoorOpen", adminOnly: false },
  { id: "cabinet", label: "Кабинет", icon: "User", adminOnly: false },
  { id: "about", label: "О проекте", icon: "Info", adminOnly: false },
  {
    id: "contacts",
    label: "Контакты",
    icon: "MessageSquare",
    adminOnly: false,
  },
  { id: "admin", label: "Админ", icon: "Shield", adminOnly: true },
];

function NavBar({
  active,
  setActive,
}: {
  active: string;
  setActive: (id: string) => void;
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState("Тайный ключ");

  useEffect(() => {
    api.content
      .getSite()
      .then((c: Record<string, { value: string }>) => {
        if (c?.site_name?.value) setSiteName(c.site_name.value);
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div
        className="max-w-5xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-between"
        style={{
          background: "rgba(7,9,15,0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(251,191,36,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <button
          onClick={() => setActive("home")}
          className="flex items-center gap-2 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
            <span className="text-black text-xs font-bold">GD</span>
          </div>
          <span className="font-oswald text-base tracking-widest text-white/90 uppercase group-hover:text-gold-400 transition-colors">
            {siteName}
          </span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.filter(
            (item) => !item.adminOnly || user?.role === "admin",
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`nav-link text-sm ${active === item.id ? "active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setActive("cabinet")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gold-500/20 text-gold-400 text-xs font-oswald tracking-wider hover:border-gold-400/40 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center text-xs font-bold">
                  {user.name[0]}
                </div>
                {user.name.split(" ")[0]}
              </button>
              <button
                onClick={logout}
                className="text-white/30 hover:text-white/60 transition-colors"
                title="Выйти"
              >
                <Icon name="LogOut" size={16} />
              </button>
            </div>
          ) : (
            <button
              className="hidden md:block btn-gold px-5 py-2 text-xs rounded-xl"
              onClick={() => setActive("auth")}
            >
              Войти
            </button>
          )}
          <button
            className="md:hidden text-white/60 hover:text-gold-400 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden mt-2 max-w-5xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: "rgba(7,9,15,0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(251,191,36,0.12)",
          }}
        >
          {NAV_ITEMS.filter(
            (item) => !item.adminOnly || user?.role === "admin",
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActive(item.id);
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors border-b border-white/5 last:border-0 ${
                active === item.id
                  ? "text-gold-400 bg-gold-500/5"
                  : "text-white/60 hover:text-white/90"
              }`}
            >
              <Icon name={item.icon} fallback="Star" size={18} />
              <span className="font-oswald tracking-wider uppercase text-sm">
                {item.label}
              </span>
            </button>
          ))}
          {user ? (
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-6 py-4 text-red-400 border-t border-white/5"
            >
              <Icon name="LogOut" size={18} />
              <span className="font-oswald tracking-wider uppercase text-sm">
                Выйти
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActive("auth");
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-6 py-4 text-gold-400 border-t border-white/5"
            >
              <Icon name="LogIn" size={18} />
              <span className="font-oswald tracking-wider uppercase text-sm">
                Войти
              </span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

function AppInner() {
  const [activePage, setActivePage] = useState("home");
  const [initialRef, setInitialRef] = useState("");
  const { loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setInitialRef(ref.toUpperCase());
      setActivePage("auth");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#07090f" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-black font-bold">GD</span>
          </div>
          <div className="text-white/30 font-rubik text-sm">Загружаем...</div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage onGoToDoors={() => setActivePage("doors")} />;
      case "doors":
        return <DoorsPage onNeedAuth={() => setActivePage("auth")} />;
      case "cabinet":
        return <CabinetPage onGoAuth={() => setActivePage("auth")} />;
      case "admin":
        return <AdminPage onGoAuth={() => setActivePage("auth")} />;
      case "about":
        return <AboutPage />;
      case "contacts":
        return <ContactsPage />;
      case "auth":
        return (
          <AuthPage
            onSuccess={() => setActivePage("cabinet")}
            initialRef={initialRef}
          />
        );
      default:
        return <HomePage onGoToDoors={() => setActivePage("doors")} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#07090f" }}>
      <NavBar active={activePage} setActive={setActivePage} />
      {renderPage()}
      <footer className="border-t border-white/5 py-8 px-4 text-center">
        <div className="font-oswald text-xs text-white/20 tracking-widest uppercase">
          © 2026 Golden Door · Все права защищены
        </div>
        <div className="flex justify-center gap-6 mt-3">
          {["Условия", "Политика", "Правила"].map((link) => (
            <button
              key={link}
              className="text-xs text-white/20 hover:text-white/40 font-rubik transition-colors"
            >
              {link}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppInner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
