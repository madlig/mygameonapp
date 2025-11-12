import React from "react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

const FooterContent = () => {
  return (
    <div className="absolute inset-x-0 bottom-full bg-gray-800 text-center py-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
      {/* Tagline */}
      <p className="text-lg font-semibold text-gray-300 mb-4">
        Connecting Gamers, One Click at a Time
      </p>

      {/* Legal Links */}
      <div className="flex justify-center space-x-6 text-sm mb-4">
        <a href="/terms" className="hover:text-white">
          Terms of Service
        </a>
        <a href="/privacy" className="hover:text-white">
          Privacy Policy
        </a>
      </div>

      {/* Social Media Links */}
      <div className="flex justify-center space-x-6 mb-4">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          <FaFacebook className="h-6 w-6" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          <FaTwitter className="h-6 w-6" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          <FaInstagram className="h-6 w-6" />
        </a>
      </div>

      {/* Developer Credits */}
      <p className="text-sm mb-2">
        Developed by <a href="https://yourportfolio.com" className="hover:text-white">Your Name</a>
      </p>
    </div>
  );
};

export default FooterContent;