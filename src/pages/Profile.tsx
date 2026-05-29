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
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

type TabType = 'profile' | 'overview' | 'edit' | 'settings';

export default function Profile() {
  const { user, profile } = useUser();
  
  // 🚀 FIXED: Tell TypeScript to relax and let us use all our custom fields!
  const prof = profile as any;
  const usr = user as any;

  const isAdmin = prof?.role === 'admin'; 
  
  const [signals, setSignals] = useState<ActivitySignal[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const tabs = isAdmin 
    ? [
        { id: 'profile', label: 'Admin Access', icon: <Shield className="h-4 w-4" /> },
        { id: 'settings', label: 'Settings', icon: <LogOut className="h-4 w-4" /> }
      ]
    : [
        { id: 'profile', label: 'Your Profile', icon: <UserIcon className="h-4 w-4" /> },
        { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
        { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" /> },
        { id: 'settings', label: 'Settings', icon: <Shield className="h-4 w-4" /> }
      ];

  useEffect(() => {
    const fetchSignals = async () => {
      if (!usr) return;
      try {
        // Fallback to email if uid is missing
        const userId = usr?.uid || usr?.email;
        if (userId) {
            const userSignals = await getUserSignals(userId);
            setSignals(userSignals);
        }
      } catch (error) {
        console.error("Failed to fetch signals", error);
      } finally {
        setIsLoadingSignals(false);
      }
    };
    fetchSignals();
  }, [usr]);

  useEffect(() => {
    if (prof) setFormData(prof);
  }, [prof]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (['firstName', 'middleName', 'lastName'].includes(name)) {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usr) return;
    setIsSaving(true);
    try {
      const generatedDisplayName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ');
      const finalData = { ...formData, displayName: generatedDisplayName || formData.displayName };
      
      const userId = usr?.uid || usr?.email;
      if (userId) {
          await updateUserProfile(userId, finalData);
          toast.success('Profile updated successfully.', { icon: '✅' });
          setActiveTab('profile');
      }
    } catch (err) {
      toast.error('Data transmission failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/'; 
    } catch (error) {
      toast.error("Failed to log out.");
    }
  };

  const calculateCompletion = () => {
    if (!prof) return 0;
    const fields = ['displayName', 'username', 'bio', 'classLevel', 'school', 'state', 'medium', 'gender'];
    const filled = fields.filter(f => !!prof[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercent = calculateCompletion();
  
  const totalXp = prof?.totalXP || prof?.xpPoints || 0;
  const currentLevelXP = totalXp % 1000;
  const progress = (currentLevelXP / 1000) * 100;

  if (!prof || !usr) {
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
             <UserIcon className="h-8 w-8 sm:h-10 sm:w-10 text-brand" /> {isAdmin ? "Admin Console" : "Student Profile"}
           </h1>
           <p className="text-slate-400 font-medium mt-2 text-sm sm:text-base">
             {isAdmin ? "Manage system telemetry and founder access." : "Manage your profile and learning activity."}
           </p>
        </div>

        <div className="flex gap-2 sm:gap-6 border-b border-slate-800/80 overflow-x-auto custom-scrollbar pb-1">
          {tabs.map((tab) => (
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
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="mt-8">
            
            {activeTab === 'profile' && (
              isAdmin ? (
                <div className="p-8 bg-slate-900 border border-purple-500/30 rounded-[32px] text-center shadow-2xl">
                    <Shield className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">System Administrator</h2>
                    <p className="text-slate-400 mt-2 font-medium">Logged in as {prof.email}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-8">
                     <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative group hover:border-brand/30 transition-all">
                        <div className="h-32 bg-gradient-to-br from-brand/20 via-blue-900/40 to-slate-900 relative">
                           {prof.isPremium && (
                             <div className="absolute top-4 right-4 bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                               <Star className="h-3 w-3" /> Premium
                             </div>
                           )}
                        </div>
                        
                        <div className="px-8 pb-8 relative">
                           <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] absolute -top-16">
                             <img 
                               src={prof.avatarUrl || usr?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usr?.uid || 'user'}`} 
                               alt="Avatar" 
                               className="w-full h-full object-cover" 
                               onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${usr?.uid || 'user'}`; }}
                             />
                           </div>
                           
                           <div className="pt-20">
                              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{prof.displayName || 'Student'}</h2>
                              <p className="text-brand font-bold text-sm mt-1">@{prof.username || usr?.uid?.slice(0,8) || usr?.email?.split('@')[0] || 'student'}</p>
                              
                              <div className="mt-3 flex flex-wrap gap-2">
                                {prof.classLevel && <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-[10px] font-bold text-slate-300 uppercase">{prof.classLevel}</span>}
                                {prof.medium && <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-[10px] font-bold text-slate-300 uppercase">{prof.medium} Medium</span>}
                                {prof.state && <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-[10px] font-bold text-slate-300 uppercase">{prof.state}</span>}
                              </div>

                              <p className="mt-4 text-slate-400 text-sm font-medium leading-relaxed">
                                {prof.bio || <span className="italic opacity-50">No bio added yet.</span>}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Profile Configuration</h3>
                           <span className="text-brand font-black text-sm">{completionPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-brand transition-all duration-1000 relative" style={{ width: `${completionPercent}%` }}></div>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-7 space-y-8">
                     <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-[32px] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 relative z-10">
                           <div>
                              <p className="text-xs font-black uppercase tracking-widest text-brand mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Current Level</p>
                              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-white">Tier {prof.level || 1}</h2>
                           </div>
                           <div className="text-left sm:text-right">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total XP</p>
                              <p className="text-2xl font-black text-slate-300">{totalXp.toLocaleString()} XP</p>
                           </div>
                        </div>
                        <div className="relative z-10">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                             <span>Level {prof.level || 1}</span>
                             <span>Level {(prof.level || 1) + 1}</span>
                           </div>
                           <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                              <div className="h-full bg-gradient-to-r from-brand to-cyan-400" style={{ width: `${progress}%` }}></div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-400" /> Achievement Badges</h3>
                          <div className="grid grid-cols-3 gap-4">
                             <div className="aspect-square bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]"><Star className="h-6 w-6" /></div>
                             <div className="aspect-square bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.1)]"><Zap className="h-6 w-6" /></div>
                             <div className="aspect-square bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]"><CheckCircle className="h-6 w-6" /></div>
                          </div>
                       </div>
                     </div>
                  </div>
                </div>
              )
            )}

            {!isAdmin && activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={<Zap />} label="Total XP" value={totalXp.toLocaleString()} color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-400/20" />
                  <StatCard icon={<Trophy />} label="Streak" value={`${prof.streakCount || 0} Days`} color="text-orange-500" bg="bg-orange-500/10" border="border-orange-500/20" />
                  <StatCard icon={<Clock />} label="Hours" value={`${prof.studyHours || 0}h`} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
                  <StatCard icon={<Target />} label="Accuracy" value={`${prof.accuracy || 0}%`} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" />
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-6 sm:p-8 h-[500px] flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-brand" /> Signal Feed</h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {isLoadingSignals ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-brand" />
                      </div>
                    ) : signals.length > 0 ? (
                      signals.map((signal) => (
                        <div key={signal.id} className="relative pl-6 pb-6 border-l border-slate-800 last:border-0 last:pb-0">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-brand flex items-center justify-center">
                            {signal.type === 'achievement' ? <Trophy className="h-2 w-2 text-brand" /> : <Brain className="h-2 w-2 text-brand" />}
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">{signal.title}</h4>
                          <p className="text-xs text-slate-400 font-medium mb-2 leading-relaxed">{signal.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Sparkles className="h-8 w-8 text-slate-500 mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No signals detected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isAdmin && activeTab === 'edit' && (
              <form onSubmit={handleSaveProfile} className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-6 sm:p-10 max-w-4xl shadow-2xl relative">
                <div className="mb-8 border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Edit Profile</h2>
                   </div>
                   <button type="submit" disabled={isSaving} className="px-8 py-4 bg-brand hover:bg-blue-600 text-white rounded-xl font-black uppercase text-xs transition-all flex items-center gap-2">
                     {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save Changes
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">First Name <span className="text-red-500">*</span></label>
                    <input required name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Middle Name</label>
                    <input name="middleName" value={formData.middleName || ''} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Last Name <span className="text-red-500">*</span></label>
                    <input required name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Class Level <span className="text-red-500">*</span></label>
                    <select required name="classLevel" value={formData.classLevel || ''} onChange={handleInputChange as any} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand cursor-pointer">
                      <option className="bg-slate-950 text-white" value="" disabled>Select Level</option>
                      {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option className="bg-slate-950 text-white" key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">State / UT <span className="text-red-500">*</span></label>
                    <select required name="state" value={formData.state || ''} onChange={handleInputChange as any} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand cursor-pointer">
                      <option className="bg-slate-950 text-white" value="" disabled>Select State</option>
                      {["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(s => <option className="bg-slate-950 text-white" key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Medium <span className="text-red-500">*</span></label>
                    <select required name="medium" value={formData.medium || ''} onChange={handleInputChange as any} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand cursor-pointer">
                      <option className="bg-slate-950 text-white" value="" disabled>Select Medium</option>
                      <option className="bg-slate-950 text-white" value="English">English</option>
                      <option className="bg-slate-950 text-white" value="Hindi">Hindi</option>
                      <option className="bg-slate-950 text-white" value="Odia">Odia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Gender <span className="text-red-500">*</span></label>
                    <select required name="gender" value={formData.gender || ''} onChange={handleInputChange as any} className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand cursor-pointer">
                      <option className="bg-slate-950 text-white" value="" disabled>Select</option>
                      <option className="bg-slate-950 text-white" value="Male">Male</option>
                      <option className="bg-slate-950 text-white" value="Female">Female</option>
                      <option className="bg-slate-950 text-white" value="Other">Other</option>
                    </select>
                  </div>

                  {/* 🚀 NEW: Bio Field (Optional, spans both columns) */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Bio (Optional)</label>
                    <textarea 
                      name="bio" 
                      value={formData.bio || ''} 
                      onChange={handleInputChange as any} 
                      placeholder="Tell us a little about your learning goals..."
                      className="w-full bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-white outline-none focus:border-brand min-h-[100px] resize-y custom-scrollbar"
                    />
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'settings' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-12 max-w-4xl text-center shadow-2xl">
                <div className="flex flex-col items-center">
                   <Shield className="h-10 w-10 text-brand mb-4" />
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">System Preferences</h2>
                   <div className="pt-8 border-t border-slate-800/80 w-full max-w-md mt-6">
                     <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                       <LogOut className="h-4 w-4" /> Log Out
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