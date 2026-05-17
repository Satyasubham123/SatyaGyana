import { CheckCircle2, Home, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function PaymentSuccess() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-bg-deep">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        className="max-w-md w-full bg-bg-surface p-10 rounded-2xl shadow-2xl border border-border-strong text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
        <div className="w-20 h-20 bg-brand rounded-sm flex items-center justify-center mx-auto mb-8 rotate-12">
          <CheckCircle2 className="h-10 w-10 text-black" />
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-main mb-4 italic">Neural Upgrade Complete</h2>
        <p className="text-secondary text-[12px] font-medium mb-10 leading-relaxed uppercase tracking-wide">
          Welcome to <span className="font-black text-brand italic">GyanMitra Pro</span>. Your neural link has been enhanced. Unlimited dataset access and priority AI processing are now active.
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/dashboard"
            className="block w-full bg-brand text-black py-4 rounded-sm font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand/20 hover:bg-white transition-colors flex items-center justify-center space-x-2"
          >
             <Home className="h-4 w-4" />
             <span>System Mainframe</span>
          </Link>
          <Link 
            to="/ai-teacher"
            className="block w-full bg-bg-card border border-border-strong text-main py-4 rounded-sm font-black uppercase tracking-[0.2em] text-xs hover:border-brand transition-all flex items-center justify-center space-x-2"
          >
             <span>Initialize AI Mentor</span>
             <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 flex justify-center items-center gap-2 opacity-20 italic">
          <Sparkles className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protocol Success • Secure Stream Verified</span>
        </div>
      </motion.div>
    </div>
  );
}
