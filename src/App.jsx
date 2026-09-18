// src/App.jsx

import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import CartCheckoutModal from './features/cart/CartCheckoutModal';
import AppRouter from './routes/AppRouter';
import { initMetaPixel } from './utils/metaPixel';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import JokiAppRouter from './apps/joki/routes/JokiRouter';

const App = () => {
  useEffect(() => {
    initMetaPixel();
  }, []);

  const hostname = window.location.hostname;
  const isJokiSubdomain = hostname.startsWith('joki.');

  return (
    <AuthProvider>
      {isJokiSubdomain ? (
        <JokiAppRouter />
      ) : (
        <CartProvider>
          <AppRouter />
          <CartCheckoutModal />
          <FloatingWhatsApp />
        </CartProvider>
      )}
    </AuthProvider>
  );
};

export default App;
