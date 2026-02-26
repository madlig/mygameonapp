import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../common/Breadcrumbs';
import ScrollToTopButton from '../common/ScrollToTopButton';
import LoadingOverlay from '../common/LoadingOverlay';

const Content = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoading = false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    // gunakan safe-area-inset-bottom supaya konten tidak tertutup FAB/footer
    <div
      className="relative flex-1 bg-gray-100 p-4 sm:p-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}
    >
      <Breadcrumbs />
      <LoadingOverlay isLoading={isLoading} />
      <div className="mt-4">{children}</div>
      <ScrollToTopButton isScrolled={isScrolled} />
    </div>
  );
};

export default Content;
