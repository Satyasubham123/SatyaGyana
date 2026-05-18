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
import { cn } from '../lib/utils';

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
        // 1. Create the user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 2. Add their display name
        await updateProfile(userCredential.user, { displayName: name });
        // 3. Send the verification link
        await sendEmailVerification(userCredential.user);
        
        // 🔥 STRICT FIX: Sign them out immediately so they cannot access the app yet!
        await auth.signOut();
        
        setMessage('Verification sent! Please check your email inbox and click the link to activate your account.');
        setTimeout(() => switchMode('login'), 5000); // Switch to login screen after reading

      } else if (mode === 'login') {
        // 1. Attempt to log them in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 2. Strict Check: If they haven't verified their email yet
        if (!userCredential.user.emailVerified) {
          // 🔥 AUTOMATIC RESEND: Trigger a fresh verification link immediately!
          await sendEmailVerification(userCredential.user);
          
          // 3. Log them back out so they can't browse the dashboard yet
          await auth.signOut(); 
          
          setError("Your email is not verified yet. We have just dispatched a brand new activation link to your inbox! Please check your main inbox as well as your Spam folder.");
          return; // Terminate login routine
        }

        // If verified successfully, grant access!
        onClose();

        // If verified, let them in!
        onClose();

      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error(err);
      let errorText = "An error occurred. Please try again.";
      if (err.code === 'auth/email-already-in-use') errorText = "This email is already registered.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') errorText = "Invalid email or password.";
      if (err.code === 'auth/weak-password') errorText = "Password should be at least 6 characters.";
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
      setError("Google Sign-In failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-slate-900 w-full max-w-md rounded-[32px] border border-border-strong shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-border-strong">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
              {mode === 'login' ? 'System Login' : mode === 'signup' ? 'Create Access Node' : 'Recover Password'}
            </h3>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-8">
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
                      className="w-full bg-slate-800 border border-border-strong p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
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
                    className="w-full bg-slate-800 border border-border-strong p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => switchMode('forgot')} className="text-[9px] font-black uppercase text-brand hover:underline tracking-widest">
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                      className="w-full bg-slate-800 border border-border-strong p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" disabled={isLoading}
                className="w-full py-4 mt-4 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? 'Processing...' : mode === 'login' ? 'Authenticate' : mode === 'signup' ? 'Initialize Account' : 'Send Reset Link'} 
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border-strong">
              <button 
                onClick={handleGoogleAuth} type="button"
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
                Continue with Google
              </button>
            </div>

            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  No access node? <button onClick={() => switchMode('signup')} className="text-brand hover:underline">Create One</button>
                </p>
              ) : (
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Return to <button onClick={() => switchMode('login')} className="text-brand hover:underline">Login Sequence</button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}