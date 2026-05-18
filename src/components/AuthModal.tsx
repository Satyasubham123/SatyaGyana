import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
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

  // Focus management & Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-focus email input after animation completes
      setTimeout(() => emailInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // ESC key to close
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
        
        setMessage('Account created! Please check your email to verify your identity.');
        setTimeout(() => switchMode('login'), 5000);

      } else if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          await auth.signOut(); 
          setError("Your email is not verified. A new link has been sent to your inbox.");
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

  // Close when clicking the backdrop (but not the modal itself)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[9999] grid place-items-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="w-full max-w-lg bg-slate-900 rounded-[32px] border border-slate-700 shadow-2xl shadow-brand/20 flex flex-col relative overflow-hidden my-auto"
          >
            {/* Subtle Gradient Glow for AI Theme */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-blue-400 to-brand opacity-80" />

            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:px-8 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-brand" />
                </div>
                <h2 id="modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Trust Indicator / Helper Text */}
              <p className="text-sm text-slate-400 mb-6 text-center">
                {mode === 'login' ? 'Enter your details to access your AI dashboard.' 
                  : mode === 'signup' ? 'Join 10,000+ students mastering concepts faster.'
                  : 'Enter your email and we will send you recovery instructions.'}
              </p>

              {/* Error & Success Messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-2xl flex items-center gap-3" role="alert">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
                {message && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-2xl text-center" role="status">
                      {message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleEmailAuth} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-brand transition-colors" />
                      <input 
                        id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-950/50 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-medium outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-brand transition-colors" />
                    <input 
                      id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      ref={emailInputRef}
                      placeholder="name@university.edu"
                      className="w-full bg-slate-950/50 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-medium outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label htmlFor="password" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Password</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-bold text-brand hover:text-blue-400 hover:underline transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-brand transition-colors" />
                      <input 
                        id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/50 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-medium outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full py-4 mt-2 bg-brand hover:bg-blue-600 text-white rounded-2xl font-bold tracking-wide text-sm shadow-xl shadow-brand/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    <>{mode === 'login' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'} <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              {/* Seamless Divider */}
              <div className="relative flex items-center py-8">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              {/* Subdued Google Button */}
              <button 
                onClick={handleGoogleAuth} type="button"
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl font-bold tracking-wide text-sm transition-all flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Clear Toggle Copy */}
              <div className="mt-8 text-center text-sm font-medium text-slate-400">
                {mode === 'login' ? (
                  <>Don't have an account? <button onClick={() => switchMode('signup')} className="text-brand hover:text-blue-400 hover:underline font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">Sign Up</button></>
                ) : (
                  <>Already have an account? <button onClick={() => switchMode('login')} className="text-brand hover:text-blue-400 hover:underline font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">Log In</button></>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}