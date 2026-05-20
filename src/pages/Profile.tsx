import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Edit2, MapPin, Clock, Trophy, Target, 
  Activity, Zap, GraduationCap, CheckCircle, Brain, 
  Sparkles, Loader2, User as UserIcon, BookOpen, Star, Shield, Mail, LogOut
} from 'lucide-react';
import { 
  UserProfile, updateUserProfile, 
  ActivitySignal, getUserSignals 
} from '../services/userService';
import { useUser } from '../contexts/UserContext';

// 🚀 IMPORTS REQUIRED FOR SECURE LOGOUT
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

type TabType = 'profile' | 'overview' | 'edit' | 'settings';

export default function Profile() {
  const { user, profile } = useUser();
  
  const [signals, setSignals] = useState<ActivitySignal[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  // Fetch Signals (Sub-collection)
  useEffect(() => {
    const fetchSignals = async () => {
      if (!user) return;
      try {
        const userSignals = await getUserSignals(user.uid);
        setSignals(userSignals);
      } catch (error) {
        console.error("Failed to fetch signals", error);
      } finally {
        setIsLoadingSignals(false);
      }
    };
    fetchSignals();
  }, [user]);

  // Keep the form data synced with the real-time profile
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const generatedDisplayName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ');
      
      const finalData = { 
        ...formData, 
        displayName: generatedDisplayName || formData.displayName 
      };

      await updateUserProfile(user.uid, finalData);
      
      toast.success('Profile parameters updated securely.', { icon: '✅' });
      setActiveTab('profile');
    } catch (err) {
      toast.error('Data transmission failed.');
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 THE FUNCTION TO DELETE THE BROWSER LINK (SIGN OUT)
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Securely logged out.");
      // Force reload to completely wipe local cache and jump to landing page
      window.location.href = '/'; 
    } catch (error) {
      toast.error("Failed to log out.");
      console.error(error);
    }
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = ['displayName', 'username', 'bio', 'classLevel', 'school', 'state', 'medium'];
    const filled = fields.filter(f => !!(profile as any)[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercent = calculateCompletion();

  // Show loading skeleton if the context profile hasn't loaded yet
  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-bg-deep pt-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-12 w-64 bg-slate-800/50 rounded-xl"></div>
          <div className="flex gap-4 border-b border-slate-800/50 pb-2">
            <div className="h-8 w-24 bg-slate-800/50 rounded-lg"></div>
            <div className="h-8 w-24 bg-slate-800/50 rounded-lg"></div>
            <div className="h-8 w-24 bg-slate-800/50 rounded-lg"></div>
          </div>
          <div className="h-[500px] bg-slate-900/50 rounded-[32px] border border-slate-800/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-slate-100 pb-24 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B', borderRadius: '16px' }
      }}/>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-brand/10 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-12">
        
        <div className="mb-10">
           <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
             <UserIcon className="h-8 w-8 sm:h-10 sm:w-10 text-brand" /> Neural Identity
           </h1>
           <p className="text-slate-400 font-medium mt-2 text-sm sm:text-base">Manage your synchronization parameters and learning telemetry.</p>
        </div>

        <div className="flex gap-2 sm:gap-6 border-b border-slate-800/80 overflow-x-auto custom-scrollbar pb-1">
          {[
            { id: 'profile', label: 'Your Profile', icon: <UserIcon className="h-4 w-4" /> },
            { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
            { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" /> },
            { id: 'settings', label: 'Settings', icon: <Shield className="h-4 w-4" /> }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as TabType)} 
              className={`px-4 sm:px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'border-brand text-brand bg-brand/5 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded-t-xl'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }} 
            transition={{ duration: 0.3, ease: "easeOut" }} 
            className="mt-8"
          >
            
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-8">
                   <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative group hover:border-brand/30 transition-all">
                      <div className="h-32 bg-gradient-to-br from-brand/20 via-blue-900/40 to-slate-900 relative">
                         {profile.isPremium && (
                           <div className="absolute top-4 right-4 bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                             <Star className="h-3 w-3" /> Premium
                           </div>
                         )}
                      </div>
                      
                      <div className="px-8 pb-8 relative">
                         <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] absolute -top-16">
                           <img 
                             src={profile.avatarUrl || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                             alt="Avatar" className="w-full h-full object-cover" 
                           />
                         </div>
                         
                         <div className="pt-20">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{profile.displayName || 'Unnamed Node'}</h2>
                            <p className="text-brand font-bold text-sm mt-1">@{profile.username || user.uid.slice(0,8)}</p>
                            
                            <p className="mt-4 text-slate-400 text-sm font-medium leading-relaxed">
                              {profile.bio || <span className="italic opacity-50">No biographical data found. Update profile to calibrate identity.</span>}
                            </p>

                            <div className="mt-6 space-y-3">
                               {profile.school && (
                                 <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-brand"><GraduationCap className="h-4 w-4" /></div>
                                    {profile.school}
                                 </div>
                               )}
                               {profile.classLevel && (
                                 <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400"><BookOpen className="h-4 w-4" /></div>
                                    {profile.classLevel}
                                 </div>
                               )}
                               {profile.state && (
                                 <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-orange-400"><MapPin className="h-4 w-4" /></div>
                                    {profile.state}
                                 </div>
                               )}
                               <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-purple-400"><Mail className="h-4 w-4" /></div>
                                  {user.email}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                      <div className="flex justify-between items-center mb-3">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Profile Configuration</h3>
                         <span className="text-brand font-black text-sm">{completionPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-brand transition-all duration-1000 relative" style={{ width: `${completionPercent}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                         </div>
                      </div>
                      {completionPercent < 100 && (
                        <p className="text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">Complete your profile in the Edit tab to unlock optimal AI calibration.</p>
                      )}
                   </div>
                </div>

                <div className="lg:col-span-7 space-y-8">
                   <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-brand/30 transition-all rounded-[32px] p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 relative z-10">
                         <div>
                            <p className="text-xs font-black uppercase tracking-widest text-brand mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Current Link Level</p>
                            <h2 className="text-5xl sm:text-6xl font-black italic uppercase tracking-tighter text-white">Tier {profile.level || 1}</h2>
                         </div>
                         <div className="text-left sm:text-right">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Accumulated XP</p>
                            <p className="text-2xl font-black text-slate-300">{(profile.totalXP || profile.xpPoints || 0).toLocaleString()} XP</p>
                         </div>
                      </div>
                      <div className="relative z-10">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                           <span>Level {profile.level || 1}</span>
                           <span>Level {(profile.level || 1) + 1}</span>
                         </div>
                         <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-brand to-cyan-400" style={{ width: `${(profile.totalXP || profile.xpPoints || 0) % 100}%` }}></div>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-400" /> Achievement Badges</h3>
                        <div className="grid grid-cols-3 gap-4">
                           <div className="aspect-square bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-yellow-500 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.1)] cursor-help" title="First Login">
                              <Star className="h-6 w-6" />
                           </div>
                           <div className="aspect-square bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-blue-400 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(96,165,250,0.1)] cursor-help" title="7 Day Streak">
                              <Zap className="h-6 w-6" />
                           </div>
                           <div className="aspect-square bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-emerald-400 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(52,211,153,0.1)] cursor-help" title="Profile Completed">
                              <CheckCircle className="h-6 w-6" />
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Target className="h-4 w-4 text-emerald-400" /> Active Directives</h3>
                        {profile.learningGoals && profile.learningGoals.length > 0 ? (
                          <div className="space-y-3">
                            {profile.learningGoals.slice(0,3).map((goal, i) => (
                              <div key={i} className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-3">
                                 <div className="w-1.5 h-1.5 rounded-full bg-brand"></div> {goal}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl opacity-50">
                             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">No active goals</p>
                          </div>
                        )}
                     </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={<Zap />} label="Total XP" value={(profile.totalXP || profile.xpPoints || 0).toLocaleString()} color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-400/20" />
                    <StatCard icon={<Trophy />} label="Streak" value={`${profile.streakCount || 0} Days`} color="text-orange-500" bg="bg-orange-500/10" border="border-orange-500/20" />
                    <StatCard icon={<Clock />} label="Hours" value={`${profile.studyHours || 0}h`} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
                    <StatCard icon={<Target />} label="Accuracy" value={`${profile.accuracy || 0}%`} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-6 sm:p-8 overflow-hidden flex flex-col h-[500px]">
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

            {activeTab === 'edit' && (
              <form onSubmit={handleSaveProfile} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[32px] p-6 sm:p-10 max-w-4xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="mb-8 border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Edit Parameters</h2>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Configure your neural identity</p>
                   </div>
                   <button type="submit" disabled={isSaving} className="w-full sm:w-auto px-8 py-4 bg-brand hover:bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                     {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                     {isSaving ? 'Processing...' : 'Save Changes'}
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">First Name <span className="text-red-500">*</span></label>
                    <input name="firstName" value={formData.firstName || ''} onChange={handleInputChange} required className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Middle Name</label>
                    <input name="middleName" value={formData.middleName || ''} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Last Name <span className="text-red-500">*</span></label>
                    <input name="lastName" value={formData.lastName || ''} onChange={handleInputChange} required className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username (Handle)</label>
                    <input name="username" value={formData.username || ''} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                  </div>
                  
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Bio / Status</label>
                    <textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} rows={3} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none" placeholder="What are your goals?" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Class Level <span className="text-red-500">*</span></label>
                    <select name="classLevel" value={formData.classLevel || ''} onChange={handleInputChange as any} required className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none transition-all cursor-pointer">
                      <option value="" disabled>Select Level</option>
                      {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">School / Institution</label>
                    <input name="school" value={formData.school || ''} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">State / Region (India) <span className="text-red-500">*</span></label>
                    <select name="state" value={formData.state || ''} onChange={handleInputChange as any} required className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none transition-all cursor-pointer">
                      <option value="" disabled>Select State / UT</option>
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
                    <select name="medium" value={formData.medium || ''} onChange={handleInputChange as any} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none transition-all cursor-pointer">
                      <option value="" disabled>Select Medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Odia">Odia</option>
                    </select>
                  </div>
                </div>
              </form>
            )}

            {/* 🚀 THE NEW LOGOUT BUTTON IS HERE IN SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-12 max-w-4xl text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-brand/5 blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] border border-slate-700">
                      <Shield className="h-10 w-10 text-brand" />
                   </div>
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">System Preferences</h2>
                   <p className="text-slate-400 text-sm mt-4 max-w-lg mx-auto font-medium leading-relaxed mb-10">
                     Advanced personalization matrices including theme configurations, focus modes, and notification overrides are slated for deployment in v2.0.
                   </p>

                   <div className="pt-8 border-t border-slate-800/80 w-full max-w-md">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Security</p>
                     <button
                       onClick={handleSignOut}
                       className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-red-500/10"
                     >
                       <LogOut className="h-4 w-4" />
                       Purge Access Node (Log Out)
                     </button>
                   </div>
                </div>
              </div>
            )}
            
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg, border }: { icon: React.ReactNode, label: string, value: string, color: string, bg: string, border: string }) {
  return (
    <div className={`p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:border-slate-600 shadow-xl`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg} ${color} ${border} border shadow-lg`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5" })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-black italic text-white tracking-tighter">{value}</p>
    </div>
  );
}