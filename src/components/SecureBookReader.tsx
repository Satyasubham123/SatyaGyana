import React, { useEffect } from 'react';
import { X, BookOpen, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SecureBookReaderProps {
  driveUrl: string; // We keep this prop name so we don't break existing code, but it now accepts ANY pdf url!
  onClose: () => void;
}

export default function SecureBookReader({ driveUrl, onClose }: SecureBookReaderProps) {
  
  // Prevent scrolling on the main page while reading
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Basic security: block right clicks inside the reader wrapper
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-6"
        onContextMenu={handleContextMenu}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <BookOpen className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Secure Reading Mode</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-brand" /> Content Protected
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm active:scale-95"
              title="Close Reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PDF Viewer Area */}
          <div className="flex-1 w-full bg-slate-950 relative">
            {/* We append #toolbar=0&navpanes=0 to standard PDF links 
               to hide the default download/print buttons in standard browsers.
               (Note: Google Drive links might ignore this, but standard Supabase Storage links will respect it).
            */}
            <iframe 
              src={driveUrl.includes('google.com') ? driveUrl : `${driveUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-none"
              title="Secure Document Reader"
              sandbox="allow-scripts allow-same-origin" 
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}