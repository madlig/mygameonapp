import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const isDashboard = pathSegments.length === 0 || pathSegments[0] === "dashboard";
  const isSearchPage = pathSegments.length === 0 || pathSegments[0] === "search";

  if (isDashboard || isSearchPage) return null;


  return (
    <nav className="bg-white px-4 py-2 rounded shadow mb-4">
      <ol className="flex items-center space-x-2 text-gray-700 text-sm">
        <li>
          <Link to="/dashboard" className="text-blue-600 font-medium hover:underline">
            Dashboard
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;

          return (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 mx-2 text-gray-400" />
              {isLast ? (
                <span className="font-semibold capitalize">{segment}</span>
              ) : (
                <Link to={path} className="text-blue-600 hover:underline capitalize">
                  {segment}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
