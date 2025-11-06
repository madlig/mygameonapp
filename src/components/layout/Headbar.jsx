import { useLocation } from "react-router-dom";
import { getPageTitle } from "./TitleMapper";
import RightActions from "./RightActions";

const Headbar = () => {
  const location = useLocation();
  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="h-16 bg-gray-800 flex items-center justify-between px-4 text-white shadow">
      {/* Dynamic Title */}
      <h1 className="text-2xl font-bold tracking-wide">{currentTitle}</h1>

      {/* Right Section */}
      <RightActions />
    </div>
  );
};

export default Headbar;
