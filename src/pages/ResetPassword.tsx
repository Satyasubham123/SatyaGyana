import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com'}/api`;

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Grab the secure token from the URL (e.g. ?token=xxxxx)
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("No recovery token found. Please use the exact link from your email.");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Failed to reset password.");

      setMessage(data.message);
      
      // Send them to the home page to log in after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl">
        
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Secure Reset</h2>
        </div>
        <p className="text-slate-400 text-sm mb-8 font-medium">Initialize a new secure passkey for your Access Node.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-3 text-left leading-relaxed">
            <ShieldAlert className="h-6 w-6 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-xl text-center leading-relaxed">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">New Passkey</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6}
                className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all"
                placeholder="Enter new password..."
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-600/30"
          >
            {isLoading ? 'PROCESSING...' : 'OVERRIDE PASSKEY'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}