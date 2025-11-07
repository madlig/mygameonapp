import { ChevronUpIcon } from "@heroicons/react/24/outline";

const ScrollToTopButton = ({ isScrolled }) => {
  if (!isScrolled) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
  onClick={scrollToTop}
  className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition z-30"
  aria-label="Scroll to top"
>
  <ChevronUpIcon className="h-6 w-6" />
</button>
  );
};

export default ScrollToTopButton;
