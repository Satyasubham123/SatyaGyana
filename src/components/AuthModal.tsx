import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
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

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus management & Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Slight delay to allow modal to render before focusing
      const timer = setTimeout(() => emailInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Global ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    setTimeout(() => emailInputRef.current?.focus(), 50);
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
        
        setMessage('Account created! Please check your inbox to verify your email.');
        setTimeout(() => switchMode('login'), 5000);

      } else if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          await auth.signOut(); 
          setError("Email not verified. A new verification link has been sent.");
          return;
        }
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Recovery instructions sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error(err);
      let errorText = "Authentication failed. Please try again.";
      if (err.code === 'auth/email-already-in-use') errorText = "An account already exists for this email.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') errorText = "Invalid email or password.";
      if (err.code === 'auth/weak-password') errorText = "Password must be at least 6 characters.";
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
      setError("Google Sign-in failed. Please try again.");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        /* Heavy backdrop blur completely mutes the distracting hero section */
        className="fixed inset-0 z-[9999] grid place-items-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div 
          layout /* Enables smooth height animation when switching modes */
          initial={{ scale: 0.95, opacity: 0, y: 15 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          /* Compact width and dynamic height prevents scrollbars entirely */
          className="w-full max-w-[400px] bg-[#0B1120] rounded-3xl border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden"
        >
          {/* Subtle Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />

          {/* Header */}
          <div className="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-xl">
                <Sparkles className="h-4 w-4 text-brand" />
              </div>
              <h2 id="modal-title" className="text-lg font-bold text-white tracking-tight">
                {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create an account' : 'Reset password'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="px-6 pb-6">
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
              {message && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-xl text-center">
                    {message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-slate-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe" autoComplete="name"
                      className="w-full bg-slate-900/50 border border-slate-800 h-11 pl-10 pr-4 rounded-xl text-sm text-white outline-none focus:bg-slate-900 focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-slate-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    ref={emailInputRef} placeholder="name@example.com" autoComplete="username"
                    className="w-full bg-slate-900/50 border border-slate-800 h-11 pl-10 pr-4 rounded-xl text-sm text-white outline-none focus:bg-slate-900 focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label htmlFor="password" className="text-xs font-medium text-slate-400">Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-medium text-brand hover:text-blue-400 hover:underline transition-colors focus-visible:outline-none">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                      placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full bg-slate-900/50 border border-slate-800 h-11 pl-10 pr-4 rounded-xl text-sm text-white outline-none focus:bg-slate-900 focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" disabled={isLoading}
                className="w-full h-11 mt-2 bg-brand hover:bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</>
                ) : (
                  mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
                )}
              </button>
            </form>

            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink-0 mx-3 text-slate-500 text-xs font-medium">or continue with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button 
              onClick={handleGoogleAuth} type="button"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <div className="mt-6 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <>New to GyanMitra? <button onClick={() => switchMode('signup')} className="text-brand hover:text-blue-400 font-medium ml-1">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => switchMode('login')} className="text-brand hover:text-blue-400 font-medium ml-1">Sign in</button></>
              )}
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}