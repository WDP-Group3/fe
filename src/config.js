// Global frontend config
const config = {
  apiBaseUrl: import.meta.env?.VITE_API_URL || 'http://localhost:3000/api',
  appName: 'DriveCenter',
};

export default config;

