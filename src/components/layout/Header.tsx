import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Users,
  LogOut,
  LogIn,
  CheckCircle2,
  Database,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { NotificationItem } from '../../types';

interface HeaderProps {
  notifications: NotificationItem[];
  onSelectActivity?: (activityId: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenClientManager: () => void;
  onTriggerPwaInstall?: () => void;
  canInstallPwa?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onSelectActivity,
  onMarkRead,
  onMarkAllRead,
  onOpenClientManager,
  onTriggerPwaInstall,
  canInstallPwa,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isConfigured, signInWithGoogle, signOut } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo gauche */}
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <img src="/logo.svg" alt="Dn4Get Logo" className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    Dn4Get
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    Pro
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">
                  Do not forget
                </span>
              </div>
            </div>

            {/* Indicateur de statut Supabase / Local */}
            <div className="hidden md:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>{isConfigured ? 'Supabase Temps Réel' : 'Mode Local Persistant'}</span>
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            </div>
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bouton installer PWA si disponible */}
            {canInstallPwa && onTriggerPwaInstall && (
              <button
                onClick={onTriggerPwaInstall}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all"
                title="Installer sur Android / Desktop"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Installer l'app</span>
              </button>
            )}

            {/* Gestionnaire de clients */}
            <button
              onClick={onOpenClientManager}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Gérer les clients"
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Clients</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                notifications={notifications}
                onSelectActivity={onSelectActivity}
                onMarkRead={onMarkRead}
                onMarkAllRead={onMarkAllRead}
              />
            </div>

            {/* Toggle Mode Sombre / Clair */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
              aria-label="Changer de thème"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Profil Utilisateur / Connexion Google */}
            <div className="relative ml-1">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-7 h-7 rounded-lg object-cover ring-2 ring-blue-500/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 animate-in fade-in duration-100">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {user.display_name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Connexion Google</span>
                  <span className="sm:hidden">Connexion</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
