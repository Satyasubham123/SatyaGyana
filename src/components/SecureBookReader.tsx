import React, { useState, useEffect } from 'react';

interface SecureReaderProps {
  driveUrl: string; // The link the admin pasted from Google Drive
  onClose: () => void; // Function to go back to the library
}

export default function SecureBookReader({ driveUrl, onClose }: SecureReaderProps) {
  const [embedUrl, setEmbedUrl] = useState('');
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    // Converts a standard Google Drive share link into a full-screen "Preview" embed
    const formatDriveLink = (url: string) => {
      try {
        const fileIdMatch = url.match(/[-\w]{25,}/);
        if (fileIdMatch) {
          return `https://drive.google.com/file/d/${fileIdMatch[0]}/preview`;
        }
        return url;
      } catch (e) {
        return url;
      }
    };

    setEmbedUrl(formatDriveLink(driveUrl));
  }, [driveUrl]);

  // Anti-screenshot / Anti-distraction blur effect
  useEffect(() => {
    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Navigation Bar */}
      <div className="w-full bg-slate-800 p-4 flex justify-between items-center border-b border-border-strong z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <h2 className="text-white font-black tracking-[0.2em] text-[10px] uppercase">Secure Viewing Active</h2>
        </div>
        <button 
          onClick={onClose}
          className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
        >
          Close Reader
        </button>
      </div>

      {/* Anti-Screenshot Blur Overlay */}
      {!isFocused && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl mt-[60px]">
          <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mb-6">
             <div className="w-10 h-10 bg-brand rounded-full animate-ping"></div>
          </div>
          <p className="text-white text-xl font-black uppercase italic tracking-tighter">Focus Lost</p>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2">Content protected. Click here to resume reading.</p>
        </div>
      )}

      {/* The Google Drive PDF Viewer */}
      <div className="w-full h-full pb-6 px-6 relative z-10 pt-6">
        <div className="w-full h-full rounded-[24px] overflow-hidden shadow-2xl border border-slate-700 bg-white">
          <iframe 
            src={embedUrl} 
            width="100%" 
            height="100%" 
            className="border-none"
            allow="autoplay"
            title="Secure Book Viewer"
          />
        </div>
      </div>
    </div>
  );
}