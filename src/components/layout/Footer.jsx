import React from "react";
import FooterCopyright from "./FooterCopyright";
// import FooterContent from "./FooterContent";

const Footer = () => {
  return (
    <div className="relative bg-[#111317] text-[#7E8796]">
      <div className="group relative">
        {/* Copyright Section */}
        <FooterCopyright />

        {/* Full Footer Content */}
        {/* <FooterContent /> */}
      </div>
    </div>
  );
};

export default Footer;
