import React from "react";
import { Routes, Route } from "react-router-dom";
import 'react-datepicker/dist/react-datepicker.css';
import DashboardPage from "./pages/DashboardPage";
import GamesPage from "./pages/GamesPage";
import TaskPage from "./pages/TaskPage";
import RequestsPage from "./pages/RequestsPage";
import OperationalPage from "./pages/OperationalPage";
import NotFound from "./pages/NotFound";
import Layout from "./layouts";
import FeedbackPage from "./pages/FeedbackPage";
import AboutPage from "./pages/AboutPage";
import LandingPage from "./pages/LandingPage"; // Import halaman landing page

const App = () => {
  return (
    <Routes>
      {/* Landing Page tanpa Layout */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Dashboard dan Halaman Lainnya */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/task" element={<TaskPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/operational" element={<OperationalPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* Halaman Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;