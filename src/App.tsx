import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { OnboardingTour } from './components/OnboardingTour';
import { supabase } from './services/SupabaseManager';

import './index.css';

import Home from './pages/Home';
import Round from './pages/Round';
import Shop from './pages/Shop';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import CourseSelection from './pages/CourseSelection';
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
import CouponManager from './pages/CouponManager';
import TournamentManager from './pages/TournamentManager';
import CheckoutPage from './pages/CheckoutPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { QueryProvider } from './context/QueryProvider';

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
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

  if (loading) {
    return <div style={{ background: '#0e2f1f', height: '100vh', width: '100%' }} />;
  }

  const isRoundPage = location.pathname === '/round';

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
        className={`${session ? "page-content container" : ""} ${isRoundPage ? 'round-page-content' : ''}`}
        style={!session ? { flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 0, margin: 0 } : { flex: 1, overflow: isRoundPage ? 'hidden' : 'auto' }}
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
              <Route path="/round" element={<Round />} />
              <Route path="/select-course" element={<CourseSelection />} />
              <Route path="/green-fee" element={<GreenFee />} />
              <Route path="/green-fee/:courseId" element={<CourseReservation />} />
              <Route path="/my-reservations" element={<MyReservations />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/my-store" element={<MyStore />} />
              <Route path="/my-events" element={<TournamentManager />} />
              <Route path="/my-coupons" element={<CouponManager />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/stats" element={<EditStats />} />
              <Route path="/rounds" element={<RoundHistory />} />
              <Route path="/rounds/:id" element={<RoundDetail />} />
              <Route path="/rounds/edit/:id" element={<EditRound />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment-methods" element={<PaymentMethodsPage />} />
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
