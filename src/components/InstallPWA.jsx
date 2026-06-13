import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Only show banner if not already standalone
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);



    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA install prompt: ${outcome}`);
    
    // Consumed the prompt
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-white/85 dark:bg-slate-900/65 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-slate-100/10 dark:shadow-none transition-all duration-200">
      <div className="flex items-center space-x-3 text-center sm:text-left">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/15 hidden sm:block shrink-0">
          <Download size={18} />
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Install Exam Tracker Pro</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Add to your home screen for a native app feel, offline tracking, and push alerts.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
        <button
          onClick={handleInstallClick}
          className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-center hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-indigo-500/15"
        >
          Install App
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors duration-150 cursor-pointer text-slate-455 hover:text-slate-600 dark:hover:text-slate-200"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
