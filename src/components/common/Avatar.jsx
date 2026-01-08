const Avatar = ({ src, alt, name, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`${sizes[size]} ${className} flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 font-semibold text-white shadow-sm`}
    >
      {src ? (
        <img src={src} alt={alt || name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;

