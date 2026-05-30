import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { createPortal } from 'react-dom';

interface XpPopupProps {
  amount: number;
  reason: string;
  onClose: () => void;
}

export default function XpPopup({ amount, reason, onClose }: XpPopupProps) {
  useEffect(() => {
    // Automatically hide the popup after 3.5 seconds
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div className="fixed bottom-10 right-10 z-[99999] animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-1 rounded-2xl shadow-2xl shadow-orange-500/20">
        <div className="bg-slate-900 px-6 py-4 rounded-xl flex items-center gap-4">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />
          </div>
          <div>
            <div className="text-yellow-400 font-black text-xl italic tracking-tighter">
              +{amount} XP
            </div>
            <div className="text-slate-300 text-xs font-bold uppercase tracking-widest">
              {reason}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}