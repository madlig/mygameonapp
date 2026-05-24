import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isDashboard =
    pathSegments.length === 0 || pathSegments[0] === 'dashboard';
  const isSearchPage =
    pathSegments.length === 0 || pathSegments[0] === 'search';

  if (isDashboard || isSearchPage) return null;

  return (
    <nav className="bg-[#1A1F27] border border-[#2A2F39] px-4 py-2 rounded-lg mb-4">
      <ol className="flex items-center space-x-2 text-[#C8CFDA] text-sm">
        <li>
          <Link
            to="/dashboard"
            className="text-[#FFD100] font-medium hover:underline"
          >
            Dashboard
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;

          return (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 mx-2 text-[#7E8796]" />
              {isLast ? (
                <span className="font-semibold text-[#F3F4F6] capitalize">
                  {segment}
                </span>
              ) : (
                <Link
                  to={path}
                  className="text-[#FFD100] hover:underline capitalize"
                >
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
