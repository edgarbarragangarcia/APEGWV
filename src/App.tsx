import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import './index.css';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Round = lazy(() => import('./pages/Round'));
const Shop = lazy(() => import('./pages/Shop'));
const Caddies = lazy(() => import('./pages/Caddies'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const Profile = lazy(() => import('./pages/Profile'));

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main className="page-content container">
          <Suspense fallback={<div className="flex-center" style={{ height: '70vh' }}><div className="loader">Cargando...</div></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/round" element={<Round />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/caddies" element={<Caddies />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
