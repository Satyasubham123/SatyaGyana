import React, { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { doc, getDoc, collection, query, where, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserStats {
  totalXP: number;
  dailyXP: number;
  nextMilestoneName: string;
  nextMilestoneDate: Date | null;
  globalPercentile: number;
}

async function fetchUserDashboardStatsLocal(uid: string): Promise<UserStats> {
  // Wrap EVERYTHING in a try-catch to ensure the dashboard never crashes
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { totalXP: 0, dailyXP: 0, nextMilestoneName: 'Initializing...', nextMilestoneDate: null, globalPercentile: 0 };
    }

    const userData = userSnap.data();
    const totalXP = userData.totalXP || userData.xpPoints || 0;
    
    let milestoneDate = null;
    if (userData.nextMilestoneDate instanceof Timestamp) {
      milestoneDate = userData.nextMilestoneDate.toDate();
    } else if (userData.nextMilestoneDate) {
      milestoneDate = new Date(userData.nextMilestoneDate);
    }

    const todayString = new Date().toISOString().split('T')[0];
    const dailyXP = userData.dailyXPTracker?.date === todayString ? userData.dailyXPTracker.xp : 0;

    let topPercentile = 100;
    try {
      const usersRef = collection(db, 'users');
      const totalUsersSnap = await getCountFromServer(usersRef);
      const totalUsers = totalUsersSnap.data().count;

      const usersBelowQuery = query(usersRef, where('totalXP', '<=', totalXP));
      const usersBelowSnap = await getCountFromServer(usersBelowQuery);
      const usersBelow = usersBelowSnap.data().count;

      if (totalUsers > 1) {
        topPercentile = Math.max(1, Math.round(100 - (usersBelow / totalUsers) * 100));
      }
    } catch (e) {
      console.warn("Global rank access restricted.");
    }

    return { totalXP, dailyXP, nextMilestoneName: userData.nextMilestoneName || 'Next Exam', nextMilestoneDate: milestoneDate, globalPercentile: topPercentile };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    // Return empty stats so the UI doesn't crash if the database connection fails
    return { totalXP: 0, dailyXP: 0, nextMilestoneName: 'Data Unavailable', nextMilestoneDate: null, globalPercentile: 0 };
  }
}

export default function StatsSummary({ user }: { user: FirebaseUser | null }) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    fetchUserDashboardStatsLocal(user.uid).then(data => {
      setStats(data);
      setIsLoading(false);
    });
  }, [user]);

  if (!user) return null;
  const daysRemaining = stats?.nextMilestoneDate ? Math.max(0, Math.ceil((stats.nextMilestoneDate.getTime() - Date.now()) / (1000 * 3600 * 24))) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      {/* Stats Cards remain the same... */}
      <div className="bg-bg-card p-8 rounded-3xl border border-border-strong">
         <p className="text-xs uppercase font-bold text-slate-500">XP Points</p>
         <p className="text-4xl font-black mt-2">{stats?.totalXP.toLocaleString() || 0}</p>
      </div>
      <div className="bg-bg-card p-8 rounded-3xl border border-border-strong">
         <p className="text-xs uppercase font-bold text-slate-500">Milestone</p>
         <p className="text-4xl font-black mt-2">{daysRemaining} Days</p>
      </div>
      <div className="bg-bg-card p-8 rounded-3xl border border-border-strong">
         <p className="text-xs uppercase font-bold text-slate-500">Efficiency</p>
         <p className="text-4xl font-black mt-2">Top {stats?.globalPercentile}%</p>
      </div>
    </div>
  );
}