import React, { useEffect, useState } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUser } from '../contexts/UserContext';

export default function StatsSummary() {
  // 1. Get user and profile directly from the context (No props needed!)
  const { user, profile } = useUser();
  const [globalPercentile, setGlobalPercentile] = useState(100);

  // 2. Fetch the global percentile only when necessary
  useEffect(() => {
    if (!user || !profile) return;

    const fetchPercentile = async () => {
      try {
        const totalXP = profile.totalXP || profile.xpPoints || 0;
        const usersRef = collection(db, 'users');
        
        const totalUsersSnap = await getCountFromServer(usersRef);
        const totalUsers = totalUsersSnap.data().count;

        const usersBelowQuery = query(usersRef, where('totalXP', '<=', totalXP));
        const usersBelowSnap = await getCountFromServer(usersBelowQuery);
        const usersBelow = usersBelowSnap.data().count;

        if (totalUsers > 1) {
          const rank = Math.max(1, Math.round(100 - (usersBelow / totalUsers) * 100));
          setGlobalPercentile(rank);
        }
      } catch (e) {
        console.warn("Global rank access restricted or unavailable.");
      }
    };

    fetchPercentile();
  }, [user, profile?.totalXP]); // Re-runs automatically if their XP increases

  // Hide component if data is still loading
  if (!profile) return null;

  // 3. Extract real-time values from the profile context
  const totalXP = profile.totalXP || profile.xpPoints || 0;
  const streak = profile.streakCount || 0;

  // 4. Calculate milestone days remaining
  let daysRemaining = 0;
  if (profile.nextMilestoneDate) {
    const milestoneDate = profile.nextMilestoneDate instanceof Date 
        ? profile.nextMilestoneDate 
        : new Date(profile.nextMilestoneDate as any);
        
    daysRemaining = Math.max(0, Math.ceil((milestoneDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 px-4 sm:px-0">
      <div className="bg-bg-card p-8 rounded-3xl border border-border-strong hover:border-brand/50 transition-all shadow-sm">
         <p className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-slate-500">XP Points</p>
         <p className="text-3xl sm:text-4xl font-black mt-2 text-main italic">
           {totalXP.toLocaleString()}
         </p>
      </div>
      
      <div className="bg-bg-card p-8 rounded-3xl border border-border-strong hover:border-brand/50 transition-all shadow-sm">
         <p className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-slate-500">Milestone</p>
         <p className="text-3xl sm:text-4xl font-black mt-2 text-main italic">
           {profile.nextMilestoneDate ? `${daysRemaining} Days` : `${streak}d Streak`}
         </p>
      </div>
      
      <div className="bg-bg-card p-8 rounded-3xl border border-border-strong hover:border-brand/50 transition-all shadow-sm">
         <p className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-slate-500">Efficiency</p>
         <p className="text-3xl sm:text-4xl font-black mt-2 text-emerald-400 italic">
           Top {globalPercentile}%
         </p>
      </div>
    </div>
  );
}