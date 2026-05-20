import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db, signInWithGoogle } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CLASS_LEVELS, INDIA_STATES_AND_UTS } from '../lib/profileOptions';
import { X, Mail, Lock, User, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', email: '', password: '', classLevel: '', state: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          displayName: `${formData.firstName} ${formData.lastName}`,
          classLevel: formData.classLevel,
          state: formData.state,
          role: 'student',
          createdAt: new Date()
        });
        await sendEmailVerification(cred.user);
        await auth.signOut();
        alert("Account created. Please verify your email.");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-8 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="float-right text-slate-400"><X /></button>
        <h2 className="text-2xl font-black text-white mb-6 uppercase">{mode === 'signup' ? 'Sign Up' : 'Login'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="First Name *" className="w-full bg-slate-800 p-3 rounded-xl text-white" onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input placeholder="Middle Name" className="w-full bg-slate-800 p-3 rounded-xl text-white" onChange={e => setFormData({...formData, middleName: e.target.value})} />
              <input required placeholder="Last Name *" className="w-full bg-slate-800 p-3 rounded-xl text-white col-span-2" onChange={e => setFormData({...formData, lastName: e.target.value})} />
              <select required className="w-full bg-slate-800 p-3 rounded-xl text-white" onChange={e => setFormData({...formData, classLevel: e.target.value})}>
                <option value="">Select Class *</option>
                {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select required className="w-full bg-slate-800 p-3 rounded-xl text-white" onChange={e => setFormData({...formData, state: e.target.value})}>
                <option value="">Select State *</option>
                {INDIA_STATES_AND_UTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <input required type="email" placeholder="Email" className="w-full bg-slate-800 p-3 rounded-xl text-white" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required type="password" placeholder="Password" className="w-full bg-slate-800 p-3 rounded-xl text-white" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full py-4 bg-brand rounded-xl text-white font-bold">{loading ? <Loader2 className="animate-spin" /> : 'Continue'}</button>
        </form>
        <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="text-brand mt-4 block w-full text-sm">
          {mode === 'signup' ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>,
    document.body
  );
}