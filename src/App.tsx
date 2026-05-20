import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { syncUserProfile, UserProfile, isProfileComplete } from './services/userService';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const p = await syncUserProfile(currentUser);
          setProfile(p);
          setDbError(null);
        } catch (err: any) {
          console.error('Profile sync error:', err);
          setDbError(err.toString());
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

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep p-6">
        <div className="bg-red-500/10 border border-red-500 rounded-2xl p-6 max-w-2xl w-full">
          <h2 className="text-red-500 text-2xl font-black mb-4">
            Database Connection Error
          </h2>

          <div className="bg-black/40 rounded-xl p-4 text-red-300 font-mono text-sm break-words">
            {dbError}
          </div>
        </div>
      </div>
    );
  }

  const isVerified = user?.emailVerified ?? false;
  const isComplete = isProfileComplete(profile);

  const ProtectedRoute = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    if (!user) return <Navigate to="/" />;

    if (!isVerified) {
      return <Navigate to="/verify-email" />;
    }

    if (!isComplete) {
      return <Navigate to="/complete-profile" />;
    }

    return <>{children}</>;
  };

  return (
    <Router>
      <div className="min-h-screen bg-bg-deep text-slate-900 dark:text-slate-50 font-sans selection:bg-brand/20 transition-colors">
        <Navbar user={user} profile={profile} />

        <main>
          <Routes>

            {/* PUBLIC ROUTES */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <LandingPage user={user} />
                )
              }
            />

            <Route
              path="/verify-email"
              element={
                user && !isVerified ? (
                  <VerifyEmail user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/complete-profile"
              element={
                user && isVerified && !isComplete ? (
                  <CompleteProfile
                    user={user}
                    setProfile={setProfile}
                  />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard
                    user={user!}
                    profile={profile}
                    setProfile={setProfile}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/class/:classId"
              element={
                <ProtectedRoute>
                  <ClassDetails user={user!} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz/:quizId"
              element={
                <ProtectedRoute>
                  <QuizPage user={user!} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-teacher"
              element={
                <ProtectedRoute>
                  <AITeacher
                    user={user!}
                    profile={profile}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-quiz"
              element={
                <ProtectedRoute>
                  <AIQuizGen
                    user={user!}
                    profile={profile}
                  />
                </ProtectedRoute>
              }
            />

            {/* STANDARD AUTH ROUTES */}
            <Route
              path="/profile"
              element={
                user ? (
                  <Profile
                    user={user}
                    profile={profile}
                    setProfile={setProfile}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/payment-success"
              element={
                user ? <PaymentSuccess /> : <Navigate to="/" />
              }
            />

            <Route
              path="/flashcards/:topicId"
              element={
                user ? (
                  <FlashcardsPage user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/subscription"
              element={
                user ? (
                  <Subscription />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin"
              element={
                user && profile?.role === 'admin' ? (
                  <AdminDashboard
                    user={user}
                    profile={profile}
                  />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* STATIC ROUTES */}
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