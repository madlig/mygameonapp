import React from 'react';

const FooterCopyright = () => {
  return (
    <div className="flex items-center justify-center h-12 bg-[#111317] border-t border-[#2A2F39] text-[#7E8796] text-sm z-10">
      <p className="cursor-pointer group-hover:opacity-100 transition-opacity duration-300">
        &copy; {new Date().getFullYear()} MyGameON. All rights reserved.
      </p>
    </div>
  );
};

export default FooterCopyright;
