// src/routes/AppRouter.jsx

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';

// Import Layout dan Halaman
const Layout = lazy(() => import('../components/layout/Layout'));
const PrivateRoute = lazy(() => import('./PrivateRoute'));

// Import Halaman Spesifik Fitur
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const GamesPage = lazy(() => import('../features/games/GamesPage'));
const TaskPage = lazy(() => import('../features/tasks/TaskPage'));
const RequestsPage = lazy(() => import('../features/requests/RequestsPage'));
const OperationalPage = lazy(
  () => import('../features/operational/OperationalPage')
);
const LandingPage = lazy(() => import('../features/landing/LandingPage'));
const RequestGamePage = lazy(
  () => import('../features/landing/RequestGamePage')
);
// Import Halaman Umum
const LoginPage = lazy(() => import('../pages/LoginPage'));
const FeedbackPage = lazy(() => import('../pages/FeedbackPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRouter = () => {
  const fallback = (
    <div className="min-h-screen grid place-items-center text-slate-500">
      Memuat halaman...
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <Routes>
        {/* Rute Publik tanpa Layout */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/request-game" element={<RequestGamePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rute Privat yang dilindungi dan menggunakan Layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/task" element={<TaskPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/operational" element={<OperationalPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
        </Route>

        {/* Halaman Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
