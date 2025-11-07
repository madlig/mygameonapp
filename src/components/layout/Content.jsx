import { useState, useEffect } from "react";
import Breadcrumbs from "../common/Breadcrumbs";
import ScrollToTopButton from "../common/ScrollToTopButton";
import LoadingOverlay from "../common/LoadingOverlay"

const Content = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="relative flex-1 bg-gray-100 p-4">
  <Breadcrumbs />
  <LoadingOverlay isLoading={isLoading} />
  <div className="mt-4">{children}</div>
  <ScrollToTopButton isScrolled={isScrolled} />
</div>

  );
};

export default Content;
