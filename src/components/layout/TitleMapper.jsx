const pageTitles = {
  '/dashboard': 'Dashboard',
  '/games': 'Games',
  '/task': 'Tasks',
  '/requests': 'Requests',
  '/operational': 'Operational',
  '/operational/shift': 'Shift Workspace',
  '/feedback': 'Feedback',
  '/about': 'About',
};

export const getPageTitle = (pathname) =>
  pageTitles[pathname] || 'Page Not Found';
