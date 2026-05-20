import VerifyEmail from './pages/VerifyEmail';
import { syncUserProfile, UserProfile, isProfileComplete } from './services/userService';
import CompleteProfile from './pages/CompleteProfile';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ClassDetails from './pages/ClassDetails';
import QuizPage from './pages/QuizPage';
import AITeacher from './pages/AITeacher';
import Profile from './pages/Profile';
import AIQuizGen from './pages/AIQuizGen';
import PaymentSuccess from './pages/PaymentSuccess';
import FlashcardsPage from './pages/FlashcardsPage';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import Disclaimer from './pages/Disclaimer';

// Components
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const profileComplete = profile ? isProfileComplete(profile) : false;
  const isVerified = user?.emailVerified || false;
  const profileComplete = profile ? isProfileComplete(profile) : false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const p = await syncUserProfile(user);
          setProfile(p);
          setDbError(null);
        } catch (err: any) {
          console.error("Profile sync error:", err);
          setDbError(err.toString());
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (dbError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-8 text-white">
        <div className="bg-red-500/10 border border-red-500 p-8 rounded-xl max-w-2xl w-full">
          <h3 className="font-black text-2xl mb-4 text-red-500">Database Connection Blocked</h3>
          <p className="mb-4 text-slate-300 font-medium">Your Google login worked, but Firestore rejected your app. Here is the exact error code:</p>
          <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-red-300 break-words border border-red-500/30">
            {dbError}
          </div>
          <p className="mt-6 text-emerald-400 font-bold uppercase tracking-widest text-sm">Please copy and paste this error back into our chat!</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-bg-deep text-slate-900 dark:text-slate-50 font-sans selection:bg-brand/20 transition-colors">
        <Navbar user={user} profile={profile} />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/verify-email" element={user && !isVerified ? <VerifyEmail user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="/complete-profile" element={user && isVerified && !profileComplete ? <CompleteProfile user={user} setProfile={setProfile} /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? (isVerified ? (profileComplete ? <Dashboard user={user} profile={profile} setProfile={setProfile} /> : <Navigate to="/complete-profile" />) : <Navigate to="/verify-email" />) : <Navigate to="/" />} />
            <Route path="/quiz/:quizId" element={user ? <QuizPage user={user} /> : <Navigate to="/" />} />
            <Route path="/ai-teacher" element={user ? (isVerified ? (profileComplete ? <AITeacher user={user} profile={profile} /> : <Navigate to="/complete-profile" />) : <Navigate to="/verify-email" />) : <Navigate to="/" />} />
            <Route path="/ai-quiz" element={user ? (profileComplete ? <AIQuizGen user={user} profile={profile} /> : <Navigate to="/complete-profile" />) : <Navigate to="/" />} />            
            <Route path="/profile" element={user ? <Profile user={user} profile={profile} setProfile={setProfile} /> : <Navigate to="/" />} />            <Route path="/payment-success" element={user ? <PaymentSuccess /> : <Navigate to="/" />} />
            <Route path="/flashcards/:topicId" element={user ? <FlashcardsPage user={user} /> : <Navigate to="/" />} />
            <Route path="/subscription" element={user ? <Subscription /> : <Navigate to="/dashboard" />} />
            <Route path="/admin" element={user && profile?.role === 'admin' ? <AdminDashboard user={user} profile={profile} /> : <Navigate to="/dashboard" />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}