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
    <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
      <div className="flex items-center space-x-3 text-center sm:text-left">
        <div className="p-2.5 bg-white/10 rounded-xl hidden sm:block shrink-0">
          <Download size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm">Install Exam Tracker Pro</h4>
          <p className="text-xs text-white/80 mt-0.5">
            Add to your home screen for instant access and full offline tracking.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <button
          onClick={handleInstallClick}
          className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-indigo-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98]"
        >
          Install App
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-white/15 rounded-xl transition-colors duration-150 cursor-pointer text-white/80 hover:text-white"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
