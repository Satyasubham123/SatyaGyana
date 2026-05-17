import { User as FirebaseUser, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { syncUserProfile, UserProfile, updateUserProfile } from '../services/userService';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { User, Mail, GraduationCap, Crown, LogOut, ChevronRight, Languages, Settings, Bell, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile({ user, profile: initialProfile }: { user: FirebaseUser, profile: UserProfile | null }) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  const handleUpdate = async (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    await updateUserProfile(user.uid, { [field]: value });
    setProfile({ ...profile, [field]: value });
  };

  if (isLoading) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-bg-deep min-h-screen">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 space-y-6">
           <div className="bg-bg-surface p-8 rounded-2xl border border-border-strong text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
              <div className="relative inline-block pb-4">
                 <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Profile" 
                  className="h-24 w-24 rounded-sm border-2 border-border-strong mx-auto group-hover:rotate-3 transition-transform"
                 />
                 {profile?.isPremium && (
                   <div className="absolute bottom-4 right-0 bg-brand p-1.5 rounded-sm border-2 border-black shadow-lg">
                      <Crown className="h-4 w-4 text-black" />
                   </div>
                 )}
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-main">{profile?.displayName}</h2>
              <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-6">{profile?.email}</p>
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-red-950/20 text-red-500 border border-red-900/50 rounded-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-2 hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-900/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
           </div>

           {/* Stats Summary */}
           <div className="bg-brand p-6 rounded-3xl text-white shadow-2xl shadow-brand/20 relative overflow-hidden group">
              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Sparkles className="h-40 w-40" />
              </div>
              <h3 className="font-black mb-4 flex items-center uppercase tracking-tighter italic text-xl">
                <Crown className="h-6 w-6 mr-3" />
                Linked Status
              </h3>
              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-sm">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-2">Current Plan</p>
                 <p className="font-black text-2xl italic uppercase tracking-tight">{profile?.isPremium ? 'Premium Pro' : 'Free Learner'}</p>
                 {!profile?.isPremium && (
                   <button className="mt-6 w-full bg-white text-brand py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-dark hover:text-white transition-all active:scale-95">
                      Upgrade Now
                   </button>
                 )}
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
           <div className="bg-bg-surface rounded-2xl border border-border-strong shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border-subtle bg-bg-card flex items-center space-x-3">
                 <Settings className="h-5 w-5 text-brand" />
                 <h3 className="font-black uppercase italic tracking-tighter text-main">Heuristic Configuration</h3>
              </div>
              
              <div className="p-6 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 italic">Student Identity</label>
                    <div className="flex items-center space-x-3 p-4 bg-bg-deep border border-border-subtle rounded-xl">
                       <User className="h-5 w-5 text-muted" />
                       <span className="text-main font-bold uppercase tracking-widest text-[11px]">{profile?.displayName}</span>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 italic">Sector (Class)</label>
                    <select 
                      value={profile?.classLevel}
                      onChange={(e) => handleUpdate('classLevel', e.target.value)}
                      className="w-full p-4 bg-bg-deep border border-border-subtle rounded-xl text-main font-bold uppercase tracking-widest text-[11px] focus:border-brand outline-none appearance-none cursor-pointer"
                    >
                      {CLASSES.map(cls => <option key={cls} value={cls} className="bg-bg-card">{cls}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 italic">Medium (Language)</label>
                    <select 
                      value={profile?.medium || 'English'}
                      onChange={(e) => handleUpdate('medium', e.target.value as any)}
                      className="w-full p-4 bg-bg-deep border border-border-subtle rounded-xl text-main font-bold uppercase tracking-widest text-[11px] focus:border-brand outline-none appearance-none cursor-pointer"
                    >
                      <option value="English" className="bg-bg-card">English</option>
                      <option value="Hindi" className="bg-bg-card">Hindi (हिन्दी)</option>
                      <option value="Odia" className="bg-bg-card">Odia (ଓଡ଼ିଆ)</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Notifications Mock */}
           <div className="bg-bg-surface rounded-2xl border border-border-strong shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border-subtle bg-bg-card flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-brand" />
                    <h3 className="font-black uppercase italic tracking-tighter text-main">Signal Feed</h3>
                 </div>
                 <span className="text-[10px] font-black bg-brand text-white px-3 py-1 rounded-sm uppercase tracking-widest italic">2 Signals active</span>
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex items-start justify-between group cursor-pointer">
                    <div>
                       <p className="font-black text-main text-xs uppercase tracking-tight italic">Chapter 5 Math Review</p>
                       <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1 italic">Your AI Study plan is ready for tomorrow.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted group-hover:text-brand transition-colors" />
                 </div>
                 <div className="flex items-start justify-between group cursor-pointer border-t border-border-subtle pt-4">
                    <div>
                       <p className="font-black text-main text-xs uppercase tracking-tight italic">New Milestone Unlocked!</p>
                       <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1 italic">Earned 'Steady Learner' for 3-day streak.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted group-hover:text-brand transition-colors" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
