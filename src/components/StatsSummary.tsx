import React, { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { fetchUserDashboardStats, UserStats } from '../services/statsService';

interface StatsSummaryProps {
  user: FirebaseUser | null;
}

export default function StatsSummary({ user }: StatsSummaryProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchUserDashboardStats(user.uid);
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError("Failed to sync live data.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStats();
    return () => { isMounted = false; };
  }, [user]);

  if (!user) return null;

  let daysRemaining = 0;
  if (stats?.nextMilestoneDate) {
    const timeDiff = stats.nextMilestoneDate.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  }

  return (
    <section className="py-24 border-y border-border-strong bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4">
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-bg-card border border-border-strong p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none transition-transform hover:scale-[1.02]">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">XP Points Accumulation</p>
            {isLoading ? (
              <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-2"></div>
            ) : (
              <p className="text-5xl font-black italic text-slate-900 dark:text-slate-100">
                {stats?.totalXP.toLocaleString() || 0} 
                <span className="text-xs text-brand not-italic ml-2">+{stats?.dailyXP || 0} today</span>
              </p>
            )}
          </div>

          <div className="bg-bg-card border border-border-strong p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none transition-transform hover:scale-[1.02]">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Next Milestone</p>
            {isLoading ? (
              <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-2"></div>
            ) : (
              <p className="text-5xl font-black italic text-slate-900 dark:text-slate-100">
                {daysRemaining} Days 
                <span className="text-xs text-orange-600 not-italic ml-2">{stats?.nextMilestoneName}</span>
              </p>
            )}
          </div>

          <div className="bg-bg-card border border-border-strong p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none transition-transform hover:scale-[1.02]">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Efficiency Percentile</p>
            {isLoading ? (
              <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-2"></div>
            ) : (
              <p className="text-5xl font-black italic text-slate-900 dark:text-slate-100">
                Top {stats?.globalPercentile}% 
                <span className="text-xs text-blue-600 not-italic ml-2">Global Rank</span>
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}