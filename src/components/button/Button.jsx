import React from 'react';
import clsx from 'clsx';

const Button = ({ children, onClick, variant = 'primary', className }) => {
  const baseStyles = 'px-4 py-2 rounded text-white focus:outline-none';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    danger: 'bg-red-500 hover:bg-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(baseStyles, variants[variant], className)}
    >
      {children}
    </button>
  );
};

export default Button;
