import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { translations, Language } from '../data/translations';
import {
  LayoutDashboard,
  UserPen,
  SlidersHorizontal,
  Network,
  Activity,
  Heart,
  CalendarDays,
  FileSpreadsheet,
  Settings2,
  CircleUser,
  LogOut,
  Sun,
  Moon,
  Globe,
  BrainCircuit,
  Sparkles,
  Menu,
  X,
  FileText,
  Workflow
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    setIsLoggedIn,
    healthData,
    currentScores
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = translations[language] || translations.en;

  const menuItems = [
    { name: t.dashboard, path: '/', icon: LayoutDashboard },
    { name: t.healthInput, path: '/input', icon: UserPen },
    { name: t.simulation, path: '/simulation', icon: SlidersHorizontal },
    { name: t.healthGraph, path: '/graph', icon: Network },
    { name: (t as any).architecture || "System Architecture", path: '/architecture', icon: Workflow },
    { name: t.recommendations, path: '/recommendations', icon: Sparkles },
    { name: t.timeline, path: '/timeline', icon: CalendarDays },
    { name: t.brief, path: '/brief', icon: FileText },
    { name: t.profile, path: '/profile', icon: CircleUser },
    { name: t.settings, path: '/settings', icon: Settings2 },
  ];

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-grid-glow bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-card/45 backdrop-blur-md border-r border-border/50 shrink-0 sticky top-0 h-screen p-5 justify-between z-20">
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center space-x-3 px-2 py-1.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center text-white">
              <BrainCircuit size={22} className="animate-pulse-slow" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider text-gradient m-0 leading-tight">VitalPredict</h1>
              <span className="text-[10px] text-muted-foreground tracking-widest font-mono uppercase font-bold">Explainable AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10 font-medium'
                      : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                    }`}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-border/50 pt-4 space-y-3">
          <div className="flex items-center space-x-3 px-2 py-1 cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-xs">
                R
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Rashmi</p>
              <p className="text-[11px] text-muted-foreground truncate">{healthData.age} Yrs • {healthData.gender === 'male' ? 'Male' : 'Female'}</p>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
              {currentScores.overallHealth}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-colors text-left"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card/65 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-lg text-white">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide text-gradient m-0 leading-tight">VitalPredict</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Lang / Theme for Mobile */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-[53px] left-0 right-0 bg-card border-b border-border/60 p-4 shadow-xl z-30 flex flex-col space-y-2 animate-accordion-down">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              );
            })}
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">R</div>
                <span className="text-sm font-medium">Rashmi</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 text-xs"
              >
                <LogOut size={14} />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* TOP NAVBAR FOR DESKTOP */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/30 bg-card/10 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-foreground capitalize tracking-wide">
              {menuItems.find((item) => item.path === currentPath)?.name || t.dashboard}
            </h2>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20"></div>
            <span className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider font-mono">Platform Live</span>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Multilingual Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border/60 hover:border-primary/50 bg-card/50 text-xs font-semibold hover:bg-secondary/40 transition-all"
              >
                <Globe size={13} className="text-muted-foreground" />
                <span className="uppercase">{language}</span>
              </button>

              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-36 bg-card border border-border/80 rounded-xl shadow-xl z-40 p-1 animate-accordion-down">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'Hindi (हिंदी)' },
                      { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
                      { code: 'te', label: 'Telugu (తెలుగు)' },
                      { code: 'ta', label: 'Tamil (தமிழ்)' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          language === lang.code ? 'bg-primary text-white' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-border/60 hover:border-primary/50 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Quick Status / Quick Actions */}
            <div className="h-6 w-[1px] bg-border/60"></div>
            
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground font-medium">Explainable Core: </span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">XGBoost+SHAP</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
