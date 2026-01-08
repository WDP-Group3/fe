const Spacer = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
    '2xl': 'h-16',
  };

  return <div className={`${sizes[size]} ${className}`} />;
};

export default Spacer;

