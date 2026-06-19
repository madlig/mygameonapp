// src/App.jsx

import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import { initMetaPixel } from './utils/metaPixel';
import FloatingWhatsApp from './components/FloatingWhatsApp';

const App = () => {
  useEffect(() => {
    initMetaPixel();
  }, []);

  return (
    <AuthProvider>
      <AppRouter />
      <FloatingWhatsApp />
    </AuthProvider>
  );
};

export default App;
