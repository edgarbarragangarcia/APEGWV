// Trigger redeploy: 2026-02-07T01:19:30
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { OnboardingTour } from './components/OnboardingTour';
import { supabase } from './services/SupabaseManager';

import './index.css';

import Home from './pages/Home';
import Round from './pages/Round';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import CourseSelection from './pages/CourseSelection';
import PlayModeSelection from './pages/PlayModeSelection';
import FriendSelection from './pages/FriendSelection';
import CreateGroup from './pages/CreateGroup';
import EditProfile from './pages/EditProfile';
import EditStats from './pages/EditStats';
import RoundHistory from './pages/RoundHistory';
import RoundDetail from './pages/RoundDetail';
import EditRound from './pages/EditRound';
import Settings from './pages/Settings';
import MyStore from './pages/MyStore';
import GreenFee from './pages/GreenFee';
import CourseReservation from './pages/CourseReservation';
import MyReservations from './pages/MyReservations';
import CartPage from './pages/CartPage';
import NotificationsPage from './pages/NotificationsPage';
import TournamentManager from './pages/TournamentManager';
import TournamentParticipants from './pages/TournamentParticipants';
import CheckoutPage from './pages/CheckoutPage';
import BallsPage from './pages/BallsPage';
import ClothingPage from './pages/ClothingPage';
import AccessoriesPage from './pages/AccessoriesPage';
import ShoesPage from './pages/ShoesPage';
import ClubsPage from './pages/ClubsPage';
import GlovesPage from './pages/GlovesPage';
import OthersPage from './pages/OthersPage';
import CapsPage from './pages/CapsPage';
import CommunityPage from './pages/CommunityPage';
import MyBag from './pages/MyBag';
import SwingAnalysis from './pages/SwingAnalysis';
import LiveBetting from './pages/LiveBetting';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineOverlay from './components/OfflineOverlay';


import { AuthProvider, useAuth } from './context/AuthContext';
import { QueryProvider } from './context/QueryProvider';
import { ToastProvider } from './context/ToastContext';

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

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

  React.useEffect(() => {
    if (session) {
      const checkOnboarding = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('has_completed_onboarding')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data && data.has_completed_onboarding === false) {
            setShowOnboarding(true);
          }
        } catch (err) {
          console.error('Error checking onboarding status:', err);
        }
      };
      checkOnboarding();
    } else {
      setShowOnboarding(false);
    }
  }, [session]);

  // Pantalla de carga inicial (Splash)
  if (loading) {
    return (
      <div style={{
        backgroundColor: '#0E2F1F',
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div className="loader"></div>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  const isRoundPage = location.pathname === '/round';
  const isNotificationsPage = location.pathname === '/notifications';
  const isPlayFlow = ['/play-mode', '/friend-selection', '/create-group', '/select-course', '/live-betting'].includes(location.pathname);
  const isRoundDetail = location.pathname.startsWith('/rounds/');
  const isFixedPage = isRoundPage || isNotificationsPage || isPlayFlow || isRoundDetail;

  return (
    <div
      className="app-container"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0
      }}
    >
      {session && <Navbar />}

      <main
        className={`${session && !isFixedPage ? "page-content container" : ""} ${isRoundPage || isNotificationsPage || isRoundDetail ? 'round-page-content' : ''} `}
        style={!session ? { flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 0, margin: 0 } : { flex: 1, overflow: isFixedPage ? 'hidden' : 'auto', position: 'relative' }}
      >
        <Routes>
          {!session ? (
            <>
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<Home />} />
              <Route path="/round" element={<Round />} />
              <Route path="/play-mode" element={<PlayModeSelection />} />
              <Route path="/friend-selection" element={<FriendSelection />} />
              <Route path="/create-group" element={<CreateGroup />} />
              <Route path="/select-course" element={<CourseSelection />} />
              <Route path="/green-fee" element={<GreenFee />} />
              <Route path="/green-fee/:courseId" element={<CourseReservation />} />
              <Route path="/my-reservations" element={<MyReservations />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/my-store" element={<MyStore />} />
              <Route path="/my-events" element={<TournamentManager />} />
              <Route path="/my-events/:id/participants" element={<TournamentParticipants />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/stats" element={<EditStats />} />
              <Route path="/rounds" element={<RoundHistory />} />
              <Route path="/rounds/:id" element={<RoundDetail />} />
              <Route path="/rounds/edit/:id" element={<EditRound />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/category/bolas" element={<BallsPage />} />
              <Route path="/category/ropa" element={<ClothingPage />} />
              <Route path="/category/accesorios" element={<AccessoriesPage />} />
              <Route path="/category/zapatos" element={<ShoesPage />} />
              <Route path="/category/palos" element={<ClubsPage />} />
              <Route path="/category/guantes" element={<GlovesPage />} />
              <Route path="/category/gorras" element={<CapsPage />} />
              <Route path="/category/otros" element={<OthersPage />} />
              <Route path="/my-bag" element={<MyBag />} />
              <Route path="/swing-analysis" element={<SwingAnalysis />} />
              <Route path="/live-betting" element={<LiveBetting />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>

      {session && <BottomNav />}

      {showOnboarding && session && (
        <OnboardingTour
          userId={session.user.id}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <OfflineOverlay isOnline={isOnline} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
};

export default App;
