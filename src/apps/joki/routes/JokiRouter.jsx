import React from "react"; 
import { Routes, Route } from "react-router-dom"; 
import JokiDashboard from "../pages/JokiDashboard"; 
import TicketPage from "../pages/TicketPage";
import { JokiProvider } from "../contexts/JokiContext";

const JokiRouter = () => (
  <JokiProvider>
    <Routes>
      <Route path="/" element={<JokiDashboard />} />
      <Route path="/ticket/:ticketId" element={<TicketPage />} />
      <Route path="/ticket/:workspaceId/:ticketId" element={<TicketPage />} />
      <Route path="*" element={<JokiDashboard />} />
    </Routes>
  </JokiProvider>
); 

export default JokiRouter;
