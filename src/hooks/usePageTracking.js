// src/hooks/usePageTracking.js
//
// Hook untuk melaporkan Meta Pixel PageView pada setiap perubahan route
// (SPA). Pasang sekali di komponen yang berada di dalam <Router>.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/metaPixel';

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
}
