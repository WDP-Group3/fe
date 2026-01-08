const Skeleton = ({ width, height, className = '', rounded = 'md' }) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
};

export default Skeleton;

