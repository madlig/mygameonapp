import React from "react";

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-20">
      <div className="loader border-t-2 border-blue-500 rounded-full w-8 h-8 animate-spin"></div>
    </div>
  );
};

export default LoadingOverlay;
