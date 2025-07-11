import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
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
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute"; // Impor Private Route

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Landing Page tanpa Layout */}
        <Route path="/" element={<LandingPage />} />
        {/* Landing Page tanpa Layout */}
        <Route path="/login" element={<LoginPage />} />
        {/* Dashboard dan Halaman Lainnya */}
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
        </Route> {/* PrivateRoute akan memeriksa login */}

        {/* Halaman Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;