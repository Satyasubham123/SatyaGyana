import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Edit2, MapPin, Clock, Trophy, Target, 
  Activity, Zap, GraduationCap, CheckCircle, Brain, Sparkles, Loader2
} from 'lucide-react';
import { 
  UserProfile, syncUserProfile, updateUserProfile, 
  ActivitySignal, getUserSignals 
} from '../services/userService';

interface ProfileProps {
  user: FirebaseUser;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}
type TabType = 'overview' | 'edit' | 'settings';

export default function Profile({ user, profile: initialProfile, setProfile }: ProfileProps) {
  const [profile, setLocalProfile] = useState<UserProfile | null>(initialProfile);
  const [signals, setSignals] = useState<ActivitySignal[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, userSignals] = await Promise.all([
          syncUserProfile(user),
          getUserSignals(user.uid)
        ]);
        setLocalProfile(userData);
        setFormData(userData);
        setSignals(userSignals);
      } catch (error) {
        toast.error("Failed to sync neural profile.");
      } finally {
        setIsLoading(false);
      }
    };
    if (user && ! initialProfile) {
      loadData();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const savePromise = updateUserProfile(user.uid, formData);
    
    toast.promise(savePromise, {
      loading: 'Updating parameters...',
      success: 'Profile data synchronized.',
      error: 'Data transmission failed.'
    });

    try {
      await savePromise;
      const updatedProfile = {
        ...profile,
        ...formData
      } as UserProfile;

      setProfile(updatedProfile);
      setActiveTab('overview');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-brand animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Neural Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-slate-100 pb-24">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B', borderRadius: '16px' }
      }}/>

      {/* --- PREMIUM BANNER (No Upload Overlay) --- */}
      <div className="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Cover" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-brand/20 via-blue-900/40 to-slate-900" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          
          {/* Avatar System (No Upload Overlay) */}
          <div className="relative -mt-16 sm:-mt-20 shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-2xl relative">
              <img 
                src={profile.avatarUrl || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Avatar" className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
                  {profile.displayName || 'Anonymous Node'}
                </h1>
                <p className="text-brand font-bold uppercase tracking-widest text-xs mt-1">
                  @{profile.username || user.uid.slice(0,8)} • Level {profile.level || 1}
                </p>
              </div>
              <button onClick={() => setActiveTab('edit')} className="px-6 py-3 bg-brand/10 text-brand border border-brand/20 hover:bg-brand hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shrink-0">
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            </div>
            
            <p className="mt-4 text-slate-400 font-medium max-w-2xl leading-relaxed">
              {profile.bio || "No biographical data initialized. Edit profile to configure your learning matrix."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
              {profile.school && <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest"><GraduationCap className="h-4 w-4" /> {profile.school}</div>}
              {profile.state && <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest"><MapPin className="h-4 w-4" /> {profile.state}</div>}
              {profile.timezone && <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest"><Clock className="h-4 w-4" /> {profile.timezone}</div>}
            </div>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="mt-8 flex gap-2 border-b border-slate-800 overflow-x-auto custom-scrollbar pb-1">
          {['overview', 'edit', 'settings'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as TabType)} className={`px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT --- */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-8">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Analytics */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={<Zap />} label="Total XP" value={(profile.totalXP || profile.xpPoints || 0).toLocaleString()} color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-400/20" />
                    <StatCard icon={<Trophy />} label="Streak" value={`${profile.streakCount || 0} Days`} color="text-orange-500" bg="bg-orange-500/10" border="border-orange-500/20" />
                    <StatCard icon={<Clock />} label="Hours" value={`${profile.studyHours || 0}h`} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
                    <StatCard icon={<Target />} label="Accuracy" value={`${profile.accuracy || 0}%`} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" />
                  </div>

                  {/* Learning Goals */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-[24px] p-6 sm:p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Target className="h-5 w-5 text-brand" /> Current Directives</h3>
                    {profile.learningGoals && profile.learningGoals.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {profile.learningGoals.map((goal, i) => (
                          <span key={i} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300">{goal}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No active directives found. Update settings.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Activity Feed */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[24px] p-6 sm:p-8 overflow-hidden flex flex-col h-[500px]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 shrink-0"><Activity className="h-5 w-5 text-brand" /> Signal Feed</h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {signals.length > 0 ? signals.map((signal) => (
                      <div key={signal.id} className="relative pl-6 pb-6 border-l border-slate-800 last:border-0 last:pb-0">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-brand flex items-center justify-center">
                          {signal.type === 'achievement' ? <Trophy className="h-2 w-2 text-brand" /> : <Brain className="h-2 w-2 text-brand" />}
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{signal.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mb-2 leading-relaxed">{signal.description}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{signal.timestamp.toLocaleDateString()}</span>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <Sparkles className="h-8 w-8 text-slate-500 mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No signals detected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EDIT PROFILE TAB */}
            {activeTab === 'edit' && (
              <form onSubmit={handleSaveProfile} className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 sm:p-10 max-w-4xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Display Name</label>
                    <input name="displayName" value={formData.displayName || ''} onChange={handleInputChange} required className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</label>
                    <input name="username" value={formData.username || ''} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                  </div>
                  
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Bio / Status</label>
                    <textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} rows={3} className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none" placeholder="How are you feeling today?" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Class Level</label>
                    {/* 🚀 FIXED: Only options 6 through 10 */}
                    <select name="classLevel" value={formData.classLevel || ''} onChange={handleInputChange as any} className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                      <option value="">Select Level</option>
                      {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">School / Institution</label>
                    <input name="school" value={formData.school || ''} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">State / Region (India)</label>
                    {/* 🚀 FIXED: Exact alphabetical list of all States and UTs */}
                    <select name="state" value={formData.state || ''} onChange={handleInputChange as any} className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                      <option value="">Select State / UT</option>
                      {[
                        "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
                        "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
                        "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
                        "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
                        "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
                        "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
                      ].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Primary Language Medium</label>
                    <select name="medium" value={formData.medium || ''} onChange={handleInputChange as any} className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                      <option value="">Select Medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Odia">Odia</option>
                    </select>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button type="submit" disabled={isSaving} className="px-8 py-4 bg-brand hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {isSaving ? 'Processing...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 max-w-4xl text-center">
                <Sparkles className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-300">Advanced Personalization</h2>
                <p className="text-slate-500 text-sm mt-2">Theme color, focus modes, and notification preferences will be available in the v2 deployment.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Subcomponent for Stats
function StatCard({ icon, label, value, color, bg, border }: { icon: React.ReactNode, label: string, value: string, color: string, bg: string, border: string }) {
  return (
    <div className={`p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:border-slate-600`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg} ${color} ${border} border`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5" })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-black italic text-white tracking-tighter">{value}</p>
    </div>
  );
}