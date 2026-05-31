// src/App.jsx

import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./routes/AppRouter";

const App = () => {
  useEffect(() => {
    initMetaPixel();
  }, []);

  usePageTracking();
  
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;