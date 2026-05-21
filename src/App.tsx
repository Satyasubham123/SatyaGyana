import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { isProfileComplete } from './services/userService';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';
import ClassDetails from './pages/ClassDetails';
import QuizPage from './pages/QuizPage';
import AITeacher from './pages/AITeacher';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import { AIVisualizer } from './pages/AIVisualizer';

// Components
import Navbar from './components/Navbar';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useUser();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
    </div>
  );

  if (!user) return <Navigate to="/" />;
  if (!user.emailVerified) return <Navigate to="/verify-email" />;
  if (!isProfileComplete(profile)) return <Navigate to="/complete-profile" />;

  return <>{children}</>;
};

function AppContent() {
  const { user, profile, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-slate-900 dark:text-slate-50 font-sans selection:bg-brand/20 transition-colors">
      <Navbar user={user} profile={profile} />

      <main>
        <Routes>
          {/* ✅ Cleaned routes using Real-Time Context */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/complete-profile" element={user && user.emailVerified && !isProfileComplete(profile) ? <CompleteProfile /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
          <Route path="/subscription" element={user ? <Subscription /> : <Navigate to="/" />} />

          {/* 🚀 NEW: AI Study Visuals Route */}
          <Route path="/visuals" element={<ProtectedRoute><AIVisualizer /></ProtectedRoute>} />

          {/* ⚠️ Legacy routes (still using props to prevent TypeScript errors until we update them) */}
          <Route path="/verify-email" element={user && !user.emailVerified ? <VerifyEmail user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/class/:classId" element={<ProtectedRoute><ClassDetails user={user!} /></ProtectedRoute>} />
          <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizPage user={user!} /></ProtectedRoute>} />
          <Route path="/ai-teacher" element={<ProtectedRoute><AITeacher /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}