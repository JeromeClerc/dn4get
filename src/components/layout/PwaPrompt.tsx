import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaPrompt: React.FC<{
  onCanInstallChange?: (canInstall: boolean, triggerInstall: () => void) => void;
}> = ({ onCanInstallChange }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowBanner(true);
      if (onCanInstallChange) {
        onCanInstallChange(true, () => handleInstallClick(promptEvent));
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [onCanInstallChange]);

  const handleInstallClick = async (eventToUse?: BeforeInstallPromptEvent) => {
    const promptToTrigger = eventToUse || deferredPrompt;
    if (!promptToTrigger) return;

    await promptToTrigger.prompt();
    const choice = await promptToTrigger.userChoice;
    if (choice.outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-0.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[14px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Installer Dn4Get sur Android
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Accès rapide hors-ligne et notifications natives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleInstallClick()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
