import React from "react";

const CloseButton = ({ onClose }) => {
  return (
    <button
      onClick={onClose}
      className="text-gray-500 hover:text-gray-700"
      aria-label="Close"
    >
      ×
    </button>
  );
};

export default CloseButton;
