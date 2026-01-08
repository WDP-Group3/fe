const Box = ({ children, padding = 'md', className = '', ...props }) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div className={`${paddings[padding] || paddings.md} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Box;

