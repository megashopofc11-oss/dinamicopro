import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  QrCode,
  LogOut,
  Menu,
  X,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export type ActivePage = 'dashboard' | 'generate' | 'batches' | 'qrcodes' | 'settings';

interface NavigationProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  setActivePage,
}) => {
  const { currentUser, logout, isDevUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Início',
      icon: LayoutDashboard,
    },
    {
      id: 'generate' as ActivePage,
      label: 'Gerar Plaquinhas',
      icon: Layers,
    },
    {
      id: 'batches' as ActivePage,
      label: 'Meus Lotes',
      icon: FolderKanban,
    },
    {
      id: 'qrcodes' as ActivePage,
      label: 'QR Codes',
      icon: QrCode,
    },
  ];

  const handleSelectPage = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#07070A]/95 backdrop-blur-md border-b border-red-500/15 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand with 3D Embossed Look */}
          <div
            onClick={() => handleSelectPage('dashboard')}
            className="cursor-pointer"
          >
            <Logo size="md" />
          </div>

          {/* Desktop Navigation Menu (Início | Gerar Plaquinhas | Meus Lotes | QR Codes) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0D0D12]/90 p-1.5 rounded-2xl border border-gray-800/80 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPage(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600/25 to-red-900/25 text-red-300 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Area: Settings & Logout */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => handleSelectPage('settings')}
              title="Configurações"
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                activePage === 'settings'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white border-gray-800 hover:border-gray-700'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <span className="text-xs text-gray-400 font-mono truncate max-w-[140px]">
                {currentUser?.email || (isDevUser ? 'admin@dinamicopro.com' : 'Usuário')}
              </span>
              <button
                onClick={logout}
                title="Sair do sistema"
                className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0E] border-b border-gray-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-500/15 text-red-300 border border-red-500/40'
                    : 'text-gray-400 hover:bg-gray-800/60 text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-gray-800 mt-2 flex items-center justify-between px-2">
            <button
              onClick={() => handleSelectPage('settings')}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white py-2"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Configurações</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
