import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './services/SupabaseManager';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import './index.css';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Round = lazy(() => import('./pages/Round'));
const Shop = lazy(() => import('./pages/Shop'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const Profile = lazy(() => import('./pages/Profile'));
const Auth = lazy(() => import('./pages/Auth'));
const CourseSelection = lazy(() => import('./pages/CourseSelection'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EditStats = lazy(() => import('./pages/EditStats'));
const RoundHistory = lazy(() => import('./pages/RoundHistory'));
const RoundDetail = lazy(() => import('./pages/RoundDetail'));
const EditRound = lazy(() => import('./pages/EditRound'));
const Settings = lazy(() => import('./pages/Settings'));
const MyStore = lazy(() => import('./pages/MyStore'));

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    // Intentar bloquear la orientación
    const lockOrientation = async () => {
      if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
        try {
          await (screen.orientation as any).lock('portrait');
        } catch (e) {
          // Ignorar errores si no es soportado
        }
      }
    };
    lockOrientation();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-dark)' }}><div className="loader"></div></div>;
  }

  return (
    <Router>
      <div className="app-container">
        {session && <Navbar />}

        <main className={session ? "page-content container" : ""} style={!session ? { height: '100dvh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 0, margin: 0 } : {}}>
          <Suspense fallback={<div className="flex-center" style={{ height: '70vh' }}><div className="loader">Cargando...</div></div>}>
            <Routes>
              {!session ? (
                <>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Home />} />
                  <Route path="/round" element={<Round />} />
                  <Route path="/select-course" element={<CourseSelection />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/my-store" element={<MyStore />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/profile/stats" element={<EditStats />} />
                  <Route path="/rounds" element={<RoundHistory />} />
                  <Route path="/rounds/:id" element={<RoundDetail />} />
                  <Route path="/rounds/edit/:id" element={<EditRound />} />
                  <Route path="/auth" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </Suspense>
        </main>

        {session && <BottomNav />}
      </div>
    </Router>
  );
};

export default App;
