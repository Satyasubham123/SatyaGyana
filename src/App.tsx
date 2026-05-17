/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { syncUserProfile, UserProfile } from './services/userService';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ClassDetails from './pages/ClassDetails';
import QuizPage from './pages/QuizPage';
import AITeacher from './pages/AITeacher';
import Profile from './pages/Profile';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const p = await syncUserProfile(user);
          setProfile(p);
        } catch (err) {
          console.error("Profile sync error:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} profile={profile} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/class/:classId" 
              element={user ? <ClassDetails user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/quiz/:quizId" 
              element={user ? <QuizPage user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/ai-teacher" 
              element={user ? <AITeacher user={user} profile={profile} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <Profile user={user} profile={profile} /> : <Navigate to="/" />} 
            />
             <Route 
              path="/payment-success" 
              element={user ? <PaymentSuccess /> : <Navigate to="/" />} 
            />
            <Route 
              path="/flashcards/:topicId" 
              element={user ? <FlashcardsPage user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/subscription" 
              element={user ? <Subscription /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/admin" 
              element={user && profile?.role === 'admin' ? <AdminDashboard user={user} profile={profile} /> : <Navigate to="/dashboard" />} 
            />
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
