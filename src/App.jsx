// src/App.jsx

import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import { initMetaPixel } from './utils/metaPixel';

const App = () => {
  useEffect(() => {
    initMetaPixel();
  }, []);

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
