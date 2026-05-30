import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com'}/api`;

export default function Verify() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAccount = async () => {
      // Grab the secure token from the URL
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage("No verification token found. Please use the exact link from your email.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/verify?token=${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Verification failed.");
        }

        setStatus('success');
        setMessage(data.msg || "Access Node verified successfully!");
        
        // Optionally redirect them home after 4 seconds
        setTimeout(() => {
          navigate('/');
        }, 4000);

      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || "An error occurred during verification.");
      }
    };

    verifyAccount();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-[#2563EB] animate-spin mb-4" />
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Verifying Node...</h2>
            <p className="text-slate-400 text-sm font-medium">Please wait while we authenticate your secure token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-500">
            <div className="bg-emerald-500/20 p-4 rounded-full mb-6">
              <ShieldCheck className="h-12 w-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Identity Confirmed</h2>
            <p className="text-emerald-400 text-sm font-bold mb-8">{message}</p>
            
            <Link to="/" className="w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-600 shadow-blue-600/30">
              PROCEED TO LOGIN <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-500">
            <div className="bg-red-500/20 p-4 rounded-full mb-6">
              <ShieldAlert className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Verification Failed</h2>
            <p className="text-red-400 text-sm font-bold mb-8">{message}</p>
            
            <Link to="/" className="w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700">
              RETURN HOME
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}