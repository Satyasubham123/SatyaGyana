import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { updateUserProfile, UserProfile } from '../services/userService';
import { Sparkles, Loader2, MapPin, GraduationCap, UserIcon } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface CompleteProfileProps {
  user: FirebaseUser;
  setProfile: (p: UserProfile) => void;
}

export default function CompleteProfile({ user, setProfile }: CompleteProfileProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  // Try to split the Google Display Name if they used Google Auth
  const nameParts = (user.displayName || '').split(' ');
  
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || '',
    middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
    lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
    classLevel: '',
    state: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.classLevel || !formData.state) {
      toast.error("Please fill all mandatory fields.");
      return;
    }

    setIsSaving(true);
    try {
      // Auto-generate the full display name for the rest of the app to use
      const generatedDisplayName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ');

      const finalData = {
        ...formData,
        displayName: generatedDisplayName
      };

      await updateUserProfile(user.uid, finalData);
      setProfile(finalData as UserProfile);
      toast.success("Registration complete!");
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save data. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4 relative overflow-hidden pt-20 pb-10">
      <Toaster position="top-center" toastOptions={{ style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B', borderRadius: '16px' }}}/>
      <div className="absolute top-0 w-full max-w-2xl h-96 bg-brand/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen"></div>
      
      <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[32px] p-8 sm:p-12 shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black italic uppercase text-center text-white mb-2 tracking-tighter">Finalize Registration</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-10">Mandatory student configuration required</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2"><UserIcon className="h-3 w-3" /> First Name <span className="text-red-500">*</span></label>
               <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand transition-all" placeholder="First Name" />
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2"><UserIcon className="h-3 w-3 text-slate-700" /> Middle Name</label>
               <input value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand transition-all" placeholder="Middle Name (Optional)" />
             </div>

             <div className="space-y-2 md:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2"><UserIcon className="h-3 w-3" /> Last Name <span className="text-red-500">*</span></label>
               <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand transition-all" placeholder="Last Name" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2"><GraduationCap className="h-3 w-3" /> Class Level <span className="text-red-500">*</span></label>
              <select required value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value})} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand transition-all appearance-none cursor-pointer">
                <option value="" disabled>Select Class</option>
                {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2"><MapPin className="h-3 w-3" /> State / UT <span className="text-red-500">*</span></label>
              <select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand transition-all appearance-none cursor-pointer">
                <option value="" disabled>Select State / UT</option>
                {["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full py-5 bg-brand hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-8">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Processing...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}