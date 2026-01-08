const SocialIcons = ({ zalo, facebook, gmail, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (type, url) => {
    if (!url) return;
    
    if (type === 'gmail') {
      window.location.href = `mailto:${url}`;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {zalo && (
        <button
          onClick={() => handleClick('zalo', zalo)}
          className={`${sizes[size]} flex items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600 shadow-sm`}
          title="Liên hệ Zalo"
        >
          <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.4 7.87 7.54C7.65 7.68 7.5 7.86 7.5 8.04C7.5 8.25 7.65 8.44 7.87 8.56C8.1 8.69 8.37 8.75 8.53 8.75C8.69 8.75 8.96 8.68 9.18 8.55C9.4 8.41 9.56 8.23 9.56 8.04C9.56 7.83 9.4 7.64 9.18 7.52C8.95 7.4 8.69 7.33 8.53 7.33M15.53 7.33C15.37 7.33 15.1 7.4 14.87 7.54C14.65 7.68 14.5 7.86 14.5 8.04C14.5 8.25 14.65 8.44 14.87 8.56C15.1 8.69 15.37 8.75 15.53 8.75C15.69 8.75 15.96 8.68 16.18 8.55C16.4 8.41 16.56 8.23 16.56 8.04C16.56 7.83 16.4 7.64 16.18 7.52C15.95 7.4 15.69 7.33 15.53 7.33M12 8.11C10.03 8.11 8.44 9.7 8.44 11.67C8.44 12.67 8.85 13.59 9.5 14.28L8.44 16.22L10.38 15.16C11.07 15.81 11.99 16.22 12.99 16.22C14.96 16.22 16.55 14.63 16.55 12.66C16.55 10.69 14.96 9.11 12.99 9.11C12.99 9.11 12 9.11 12 9.11M12 10.28C13.22 10.28 14.22 11.28 14.22 12.5C14.22 13.72 13.22 14.72 12 14.72C11.44 14.72 10.93 14.5 10.55 14.13L10.22 13.8L9.33 14.11L9.64 13.22L9.31 12.89C9.13 12.51 9 12.01 9 11.5C9 10.28 10 9.28 11.22 9.28C11.22 9.28 12 9.28 12 9.28Z" />
          </svg>
        </button>
      )}
      {facebook && (
        <button
          onClick={() => handleClick('facebook', facebook)}
          className={`${sizes[size]} flex items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 shadow-sm`}
          title="Liên hệ Facebook"
        >
          <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>
      )}
      {gmail && (
        <button
          onClick={() => handleClick('gmail', gmail)}
          className={`${sizes[size]} flex items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 shadow-sm`}
          title="Gửi email"
        >
          <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SocialIcons;
