// src/App.jsx

import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import { initMetaPixel } from './utils/metaPixel';
import usePageTracking from './hooks/usePageTracking';

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
