import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth, signInWithGoogle } from '../lib/firebase';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetState();
    setMode(newMode);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);
        await auth.signOut();
        
        setMessage('Access Node created! Check your email to verify your identity.');
        setTimeout(() => switchMode('login'), 5000);

      } else if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          await auth.signOut(); 
          setError("Access Denied: Email not verified. A new link has been dispatched to your inbox.");
          return;
        }
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Recovery instructions dispatched! Check your inbox.');
      }
    } catch (err: any) {
      console.error(err);
      let errorText = "Authentication failure. Please try again.";
      if (err.code === 'auth/email-already-in-use') errorText = "Access Node already exists for this email.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') errorText = "Invalid credentials. Access denied.";
      if (err.code === 'auth/weak-password') errorText = "Security low: Password must be 6+ characters.";
      setError(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError("Google Handshake failed. Try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* 🚀 FIX: Fixed Backdrop with perfect flex centering */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
      >
        {/* 🚀 FIX: The Modal is now locked at a max-height so it perfectly centers and scrolls internally */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-md bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl flex flex-col relative max-h-[95vh] sm:max-h-[85vh] overflow-hidden"
        >
          {/* Sticky Header - NEVER SCROLLS */}
          <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 shrink-0">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
              {mode === 'login' ? 'SYSTEM LOGIN' : mode === 'signup' ? 'CREATE ACCESS NODE' : 'RECOVER PASSKEY'}
            </h3>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Body Container - SCROLLS INTERNALLY IF NEEDED */}
          <div className="p-8 overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-3 text-left leading-relaxed">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {message && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-xl text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" required value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => switchMode('forgot')} className="text-[9px] font-black uppercase text-brand hover:underline tracking-widest">
                        FORGOT?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                      className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" disabled={isLoading}
                className="w-full py-4 mt-4 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? 'PROCESSING...' : mode === 'login' ? 'AUTHENTICATE' : mode === 'signup' ? 'INITIALIZE NODE' : 'DISPATCH LINK'} 
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <button 
                onClick={handleGoogleAuth} type="button"
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
                CONTINUE WITH GOOGLE
              </button>
            </div>

            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  NO ACCESS NODE? <button onClick={() => switchMode('signup')} className="text-[#2563EB] hover:underline">Create One</button>
                </p>
              ) : (
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  RETURN TO <button onClick={() => switchMode('login')} className="text-[#2563EB] hover:underline">System Login</button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}