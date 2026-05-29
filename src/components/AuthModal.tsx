import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, ArrowRight, ShieldAlert, GraduationCap, BookOpen, MapPin, ShieldCheck } from 'lucide-react';
// 🚀 ALL FIREBASE IMPORTS REMOVED

type AuthMode = 'login' | 'signup' | 'forgot';
type Designation = 'student' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Ensure this matches your running Python backend!
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com'}/api`;

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States (You will need to update your Python backend to accept these later!)
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
        // 🚀 1. Call Custom Python Registration API with ALL Data
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email, 
            password: password,
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            classLevel: classLevel,
            state: stateSelection,
            medium: medium,
            gender: gender,
            role: designation
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to register");
        }
        
        setMessage('Access Node created! Check your email to verify your identity.');
        setTimeout(() => switchMode('login'), 5000);

      } else if (mode === 'login') {
        
        // STRICT ADMIN LOGIN CHECK
        if (designation === 'admin' && !['biswalsatyasubham274@gmail.com', 'satyagyanedu@gmail.com'].includes(email.toLowerCase())) {
          setError("SECURITY BREACH: Unauthorized email address for Admin designation.");
          setIsLoading(false);
          return;
        }

        // 🚀 2. Call Custom Python Login API
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
           // This will catch "Invalid password" or "Please verify your email" from FastAPI
           throw new Error(data.detail || "Authentication failure");
        }
        
        // 🚀 3. Save the JWT Token to LocalStorage!
        localStorage.setItem('gyanamitra_token', data.access_token);
        
        // Reload page to let UserContext pick up the new token
        window.location.reload();
        
      } else if (mode === 'forgot') {
        setError('Password recovery must be implemented in the custom backend.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("Google login is temporarily disabled while transitioning to the custom backend.");
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
                    setMode('login');
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Last Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="text" required value={lastName} onChange={e => setLastName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                      />
                    </div>
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
                        <option value="Odisha">Odisha</option>
                        <option value="Delhi">Delhi</option>
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