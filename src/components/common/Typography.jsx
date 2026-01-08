const Typography = ({ 
  variant = 'body', 
  children, 
  className = '',
  as,
  ...props 
}) => {
  const variants = {
    h1: 'text-4xl font-bold text-slate-900',
    h2: 'text-3xl font-bold text-slate-900',
    h3: 'text-2xl font-semibold text-slate-900',
    h4: 'text-xl font-semibold text-slate-900',
    h5: 'text-lg font-semibold text-slate-900',
    h6: 'text-base font-semibold text-slate-900',
    body: 'text-base text-slate-700',
    body2: 'text-sm text-slate-600',
    caption: 'text-xs text-slate-500',
    overline: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
  };

  const components = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span',
  };

  const Component = as || components[variant] || 'p';
  const variantClass = variants[variant] || variants.body;

  return (
    <Component className={`${variantClass} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Typography;

