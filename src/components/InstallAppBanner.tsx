import { useState, useEffect } from 'react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for the browser's install prompt signal
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser's default mini-infobar from automatically showing
      e.preventDefault();
      // Stash the event so it can be triggered later via our button
      setDeferredPrompt(e);
      // Update UI to show our custom install banner
      setIsVisible(true);
    };

    // Listen for successful installation (from any source)
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('SatyaGyana App was installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // ✅ FIX: Hide the banner regardless of choice, because this specific prompt event is now dead
    setIsVisible(false);
    
    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <div className="max-w-md mx-auto bg-slate-900 border border-brand/30 shadow-2xl shadow-brand/20 rounded-2xl p-4 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="SatyaGyana Icon" className="w-12 h-12 rounded-xl" />
          <div className="flex flex-col">
            <span className="text-white font-bold leading-tight text-lg">SatyaGyana App</span>
            <span className="text-slate-400 text-xs">Install for a faster, better experience.</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Later
          </button>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/30 hover:bg-brand/90 transition-all"
          >
            Install
          </button>
        </div>

      </div>
    </div>
  );
}