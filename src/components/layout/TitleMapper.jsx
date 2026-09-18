const pageTitles = {
  '/dashboard': 'Dashboard',
  '/games': 'Games',
  '/task': 'Tasks',
  '/requests': 'Requests',
  '/operational': 'Operational',
  '/operational/shift': 'Shift Workspace',
  '/feedback': 'Feedback',
  '/content': 'Contents',
  '/about': 'About',
};

export const getPageTitle = (pathname) =>
  pageTitles[pathname] || 'Dashboard Admin';

