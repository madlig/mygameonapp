// src/routes/AppRouter.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import 'react-datepicker/dist/react-datepicker.css';

// Import Layout dan Halaman
import Layout from "../components/layout/Layout";
import PrivateRoute from "./PrivateRoute";

// Import Halaman Spesifik Fitur
import DashboardPage from "../features/dashboard/DashboardPage";
import GamesPage from "../features/games/GamesPage";
import TaskPage from "../features/tasks/TaskPage";
import RequestsPage from "../features/requests/RequestsPage";
import OperationalPage from "../features/operational/OperationalPage";
import LandingPage from "../features/landing/LandingPage";
import RequestGamePage from "../features/landing/RequestGamePage";
// Import Halaman Umum
import LoginPage from "../pages/LoginPage";
import FeedbackPage from "../pages/FeedbackPage";
import AboutPage from "../pages/AboutPage";
import NotFoundPage from "../pages/NotFoundPage"

const AppRouter = () => {
  return (
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
  );
};

export default AppRouter;