import React from 'react';

const JokiLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <div className="w-[96%] max-w-[1550px] mx-auto mt-6 mb-12">
        {children}
      </div>
    </div>
  );
};

export default JokiLayout;
