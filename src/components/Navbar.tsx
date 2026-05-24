import { Link, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User as UserIcon, LogOut, Menu, X, Sparkles, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../services/userService';
import AuthModal from './AuthModal'; 

interface NavbarProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function Navbar({ user, profile }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false); 
  
  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error("Error destroying session:", error);
    }
  };

  const mainNav = isAdmin
    ? [
        { name: 'Control Tower', path: '/admin', show: true },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', show: !!user },
        { name: 'Study Visuals', path: '/visuals', show: !!user }, 
        { name: 'AI Mentor', path: '/ai-teacher', show: !!user },
        { name: 'Dictionary', path: '/dictionary', show: !!user },
      ];

  const secondaryNav = [
    { name: 'About', path: '/about' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Contact', path: '/contact' },
    { name: 'Terms', path: '/terms' },
    { name: 'Refunds', path: '/refund-policy' },
    { name: 'Disclaimer', path: '/disclaimer' },
  ];

  return (
    <nav className="bg-white/80 dark:bg-bg-surface/90 backdrop-blur-xl border-b border-border-strong sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-xl shadow-brand/20 group-hover:rotate-12 transition-transform duration-300 shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white group-hover:text-brand transition-all duration-300">
                GyanMitra
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {mainNav.map((item) => item.show && (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 hover:text-brand transition-all relative group whitespace-nowrap"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
             <div className="hidden lg:flex items-center space-x-4 border-r border-border-strong pr-8">
                {secondaryNav.slice(0, 3).map(item => (
                  <Link 
                    key={item.path} to={item.path} 
                    className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
             </div>

             {user ? (
               <div className="flex items-center gap-4 lg:gap-6">
                 {profile?.streakCount && profile.streakCount > 0 ? (
                   <div className="hidden xl:flex items-center gap-2 bg-brand/5 px-4 py-2 rounded-xl border border-brand/20 shadow-sm">
                     <span className="text-brand font-black text-[9px] uppercase tracking-widest italic whitespace-nowrap">🔥 {profile.streakCount} DAY STREAK</span>
                   </div>
                 ) : null}
                 <div className="flex items-center space-x-3 lg:space-x-4">
                   <Link to="/profile" className="group shrink-0">
                    <div className="w-10 h-10 rounded-xl border-2 border-border-strong p-0.5 group-hover:border-brand transition-all overflow-hidden">
                      <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`}
                        alt="Profile"
                        className="h-full w-full rounded-[8px] object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                   </Link>
                   <button
                     onClick={handleLogout}
                     className="p-3 bg-bg-deep border border-border-strong rounded-xl text-slate-500 hover:text-red-500 transition-all hover:shadow-lg shadow-red-500/10 shrink-0"
                     title="Logout"
                   >
                     <LogOut className="h-4 w-4" />
                   </button>
                 </div>
               </div>
             ) : (
               <button
                 onClick={() => setIsAuthOpen(true)} 
                 className="px-6 lg:px-8 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all active:scale-95 whitespace-nowrap"
               >
                 Log In / Sign Up
               </button>
             )}
          </div>

          <div className="md:hidden flex items-center space-x-4">
            {user && (
              <Link to="/profile" className="shrink-0">
                <div className="w-10 h-10 rounded-xl border-2 border-border-strong p-0.5 overflow-hidden">
                  <img
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`}
                    alt="Profile"
                    className="h-full w-full rounded-[8px] object-cover"
                  />
                </div>
              </Link>
            )}
            <button
              onClick={() => setIsOpen(true)}
              className="text-slate-800 dark:text-slate-200 p-2 bg-bg-deep rounded-xl border border-border-strong"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 right-0 w-full max-w-[320px] bg-white dark:bg-bg-surface border-l border-border-strong z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-border-strong shrink-0 bg-bg-surface">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Menu</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 bg-bg-deep rounded-lg border border-border-strong">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 🚀 FIXED MOBILE AREA: Added min-h-0 so the scroll area doesn't collapse */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0 bg-bg-surface">
                
                {/* Main Navigation */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-4 pl-2 border-l-2 border-brand">Navigation</p>
                  <div className="flex flex-col space-y-3">
                    {mainNav.map((item) => item.show && (
                      <Link
                        key={item.path} to={item.path} onClick={() => setIsOpen(false)}
                        className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex justify-between items-center text-white font-black uppercase tracking-widest text-xs hover:border-brand transition-all shadow-sm"
                      >
                        {item.name}
                        <ChevronRight className="h-4 w-4 text-brand" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Secondary Navigation */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 pl-2 border-l-2 border-slate-500">More Pages</p>
                  <div className="flex flex-col space-y-3">
                    {secondaryNav.map((item) => (
                      <Link
                        key={item.path} to={item.path} onClick={() => setIsOpen(false)}
                        className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:border-brand/40 transition-all flex justify-between items-center shadow-sm"
                      >
                        {item.name}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-border-strong bg-bg-deep shrink-0">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false); 
                      setIsAuthOpen(true); 
                    }}
                    className="w-full py-4 bg-brand text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <UserIcon className="h-4 w-4" />
                    Log In / Sign Up
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  );
}