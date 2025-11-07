import FooterCopyright from "./FooterCopyright";
// import FooterContent from "./FooterContent";

const Footer = () => {
  return (
    <div className="relative bg-gray-900 text-gray-400">
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
