const pageTitles = {
    "/dashboard": "Dashboard",
    "/games": "Games",
    "/tasks": "Tasks",
    "/requests": "Requests",
    "/search": "Search",
    "/feedback": "Feedback",
    "/about": "About",
  };
  
  export const getPageTitle = (pathname) => pageTitles[pathname] || "Page Not Found";
  