// Global frontend config
const config = {
  apiBaseUrl: import.meta.env?.VITE_API_URL || 'http://localhost:3000/api',
  appName: 'DriveCenter',
  // Cloudinary config for avatar upload
  cloudinary: {
    cloudName: import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  },
};

export default config;

