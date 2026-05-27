import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, ArrowRight, ShieldAlert, GraduationCap, BookOpen, MapPin, ShieldCheck } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, signInWithGoogle, db } from '../lib/firebase';

type AuthMode = 'login' | 'signup' | 'forgot';
type Designation = 'student' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States
  const [designation, setDesignation] = useState<Designation>('student');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [stateSelection, setStateSelection] = useState('');
  const [medium, setMedium] = useState('');
  const [gender, setGender] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setClassLevel('');
    setStateSelection('');
    setMedium('');
    setGender('');
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
        const generatedDisplayName = [firstName, middleName, lastName].filter(Boolean).join(' ');
        
        await updateProfile(userCredential.user, { displayName: generatedDisplayName });
        
        const userData: any = {
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          displayName: generatedDisplayName,
          email: email,
          role: 'student', 
          classLevel: classLevel,
          state: stateSelection,
          medium: medium,
          gender: gender,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userData, { merge: true });

        await sendEmailVerification(userCredential.user);
        await auth.signOut();
        
        setMessage('Access Node created! Check your email to verify your identity.');
        setTimeout(() => switchMode('login'), 5000);

      } else if (mode === 'login') {
        
        // 🚀 NEW: STRICT ADMIN LOGIN CHECK
        if (designation === 'admin' && email.toLowerCase() !== 'satyagyanaEdu@gmail.com') {
          setError("SECURITY BREACH: Unauthorized email address for Admin designation.");
          setIsLoading(false);
          return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          await auth.signOut(); 
          setError("Access Denied: Email not verified. A new link has been dispatched to your inbox.");
          return;
        }
        
        window.location.reload();
        
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
      window.location.reload();
    } catch (err) {
      setError("Google Handshake failed. Try again.");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] grid place-items-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-[32px] border border-slate-700 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
            {mode === 'login' && designation === 'admin' ? 'ADMIN OVERRIDE LOGIN' : mode === 'login' ? 'SYSTEM LOGIN' : mode === 'signup' ? 'CREATE ACCESS NODE' : 'RECOVER PASSKEY'}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          
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

          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {/* 🚀 Segmented Control - Always visible now! */}
            {mode !== 'forgot' && (
              <div className="flex bg-slate-800 p-1.5 rounded-2xl mb-6 border border-slate-700 relative">
                <button
                  type="button"
                  onClick={() => { setDesignation('student'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-10 ${designation === 'student' ? 'bg-[#2563EB] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  <User className="w-4 h-4" /> Student Node
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setDesignation('admin'); 
                    setMode('login'); // 🚀 Instantly forces Login Mode
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-10 ${designation === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  <ShieldCheck className="w-4 h-4" /> Admin Override
                </button>
              </div>
            )}

            {mode === 'signup' && designation === 'student' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">First Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="text" required value={firstName} onChange={e => setFirstName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Middle Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 opacity-50" />
                      <input 
                        type="text" value={middleName} onChange={e => setMiddleName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Last Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" required value={lastName} onChange={e => setLastName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Class <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <select 
                        required value={classLevel} onChange={e => setClassLevel(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="" disabled>Select</option>
                        {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">State/UT <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <select 
                        required value={stateSelection} onChange={e => setStateSelection(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="" disabled>Select</option>
                        {["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Medium <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <select 
                        required value={medium} onChange={e => setMedium(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="" disabled>Select</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Odia">Odia</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Gender <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <select 
                        required value={gender} onChange={e => setGender(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer text-sm"
                      >
                        <option value="" disabled>Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">
                {designation === 'admin' ? 'Authorized Admin Email' : 'Email Address'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                  placeholder={designation === 'admin' ? 'Enter admin email...' : ''}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Password <span className="text-red-500">*</span></label>
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
              className={`w-full py-4 mt-6 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${designation === 'admin' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30' : 'bg-[#2563EB] hover:bg-blue-600 shadow-blue-600/30'}`}
            >
              {isLoading ? 'PROCESSING...' : mode === 'login' && designation === 'admin' ? 'AUTHENTICATE ADMIN' : mode === 'login' ? 'AUTHENTICATE' : mode === 'signup' ? 'INITIALIZE NODE' : 'DISPATCH LINK'} 
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Google Auth */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <button 
              onClick={handleGoogleAuth} type="button"
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
              CONTINUE WITH GOOGLE
            </button>
          </div>

          {/* 🚀 Dynamic Bottom Links */}
          <div className="mt-6 text-center">
            {designation === 'student' ? (
              mode === 'login' ? (
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  NO ACCESS NODE? <button onClick={() => switchMode('signup')} className="text-[#2563EB] hover:underline">Create One</button>
                </p>
              ) : mode === 'signup' ? (
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  RETURN TO <button onClick={() => switchMode('login')} className="text-[#2563EB] hover:underline">System Login</button>
                </p>
              ) : null
            ) : (
              <p className="text-[10px] font-black uppercase text-purple-500/70 tracking-widest">
                AUTHORIZED PERSONNEL ONLY
              </p>
            )}
          </div>
          
        </div>
      </div>
    </div>,
    document.body
  );
}