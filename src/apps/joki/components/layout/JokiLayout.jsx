import React from 'react';

const JokiLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary font-sans relative selection:bg-accent-purple/30 selection:text-white pb-16">
      {/* Background ambient lighting */}
      <div 
        className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent-purple/5 blur-[140px] -z-10" 
      />
      <div 
        className="pointer-events-none fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-yellow/5 blur-[120px] -z-10" 
      />

      <div className="w-[96%] max-w-[1550px] mx-auto pt-5">
        {children}
      </div>
    </div>
  );
};

export default JokiLayout;
