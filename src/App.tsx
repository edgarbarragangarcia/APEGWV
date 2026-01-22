import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

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
import TournamentManager from './pages/TournamentManager';
import CheckoutPage from './pages/CheckoutPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';

import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();

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
    return <div style={{ background: '#0e2f1f', height: '100vh', width: '100%' }} />;
  }

  const location = useLocation();
  const isRoundPage = location.pathname === '/round';

  return (
    <div className="app-container">
      {session && <Navbar />}

      <main
        className={`${session ? "page-content container" : ""} ${isRoundPage ? 'round-page-content' : ''}`}
        style={!session ? { height: '100dvh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 0, margin: 0 } : {}}
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
