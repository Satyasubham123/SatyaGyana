import React, { useState, useEffect } from 'react';
import { Newspaper, Bell, Sparkles, Calendar, ChevronRight, Loader2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addXPToUser } from '../services/userService';
import { useUser } from '../contexts/UserContext';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  published_at?: string;
  created_at?: string;
}

export default function DailyNewsWidget() {
  const [feed, setFeed] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'academic' | 'general'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [hasReadToday, setHasReadToday] = useState(false);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || "https://gyanamitra.onrender.com";
        const res = await fetch(`${API_URL}/api/daily-news`);
        
        if (!res.ok) throw new Error("Failed to fetch feed");
        
        const data: NewsItem[] = await res.json();
        
        // Handle filtering on the frontend
        if (filter !== 'all') {
          setFeed(data.filter(item => item.category === filter));
        } else {
          setFeed(data.slice(0, 3)); // Keep top 3 for 'all'
        }
      } catch (err) {
        console.error("Error connecting to intelligence feed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [filter]);

  // 1. Get the current user from your context
  const { user } = useUser();

  const claimNewsXP = async () => {
    if (hasReadToday) return;
    setHasReadToday(true);
    
    // 2. Alert the user they got the points
    alert("🏆 +5 XP: Daily Intel briefing digested!");
    
    // 3. Actually save the points to the database!
    const userId = (user as any)?.uid || user?.email;
    if (userId) {
        await addXPToUser(userId, 5, "Digested Morning Intel Briefing");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-2xl space-y-6 relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Satya Intelligence Feed</h3>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Autopilot Sync Active</p>
          </div>
        </div>
        
        <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
          {(['all', 'academic', 'general'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Querying Secure Data Node...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => (
            <motion.div 
              key={item.id} 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedItem(item);
                claimNewsXP();
              }}
              className="p-4 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/60 flex items-start gap-4 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className={`p-2.5 rounded-xl shrink-0 border ${
                item.category === 'academic' 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' 
                  : 'bg-purple-500/10 text-purple-500 border-purple-500/10'
              }`}>
                {item.category === 'academic' ? <Bell className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${
                    item.category === 'academic' ? 'text-amber-500' : 'text-purple-500'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[8px] font-bold text-slate-600">
                    {item.published_at || item.created_at ? new Date(item.published_at || item.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                  </span>
                </div>
                <h4 className="text-white font-bold text-sm truncate group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-slate-400 text-xs mt-1 line-clamp-1 leading-relaxed">
                  {item.summary}
                </p>
              </div>
              
              <ChevronRight className="h-4 w-4 text-slate-600 self-center group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </motion.div>
          ))}

          {feed.length === 0 && (
            <div className="py-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl">
              <Calendar className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Awaiting 07:00 AM Payload Broadcast...</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-[32px] max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                    selectedItem.category === 'academic' ? 'bg-amber-500/10 text-amber-500' : 'bg-purple-500/10 text-purple-500'
                  }`}>
                    {selectedItem.category}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                  {selectedItem.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedItem.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-emerald-400 bg-emerald-500/5 -mx-8 -mb-8 p-4 px-8">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Morning Intel Claimed</span>
                </div>
                <span className="text-xs font-black">+5 XP</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}