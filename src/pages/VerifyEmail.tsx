import React, { useState } from 'react';
import { User as FirebaseUser, sendEmailVerification } from 'firebase/auth';
import { Mail, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface VerifyEmailProps {
  user: FirebaseUser;
}

export default function VerifyEmail({ user }: VerifyEmailProps) {
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        toast.error("Please wait a minute before requesting another email.");
      } else {
        toast.error("Failed to send email. Try again later.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleReload = () => {
    // Reload the window to fetch the updated user token from Firebase
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4 relative overflow-hidden pt-20 pb-10">
      <Toaster position="top-center" toastOptions={{ style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B', borderRadius: '16px' }}}/>
      <div className="absolute top-0 w-full max-w-2xl h-96 bg-brand/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen"></div>
      
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[32px] p-8 sm:p-12 shadow-2xl relative z-10 text-center">
        
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <Mail className="h-10 w-10 text-brand" />
        </div>
        
        <h1 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter">Verify Identity</h1>
        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
          We sent a secure link to <span className="text-white font-bold">{user.email}</span>. Please click the link to verify your access clearance.
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleReload}
            className="w-full py-4 bg-brand hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            I have verified my email <ArrowRight className="h-4 w-4" />
          </button>
          
          <button 
            onClick={handleResend}
            disabled={isSending}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            {isSending ? 'Transmitting...' : 'Resend secure link'}
          </button>
        </div>
      </div>
    </div>
  );
}