const Input = ({
  label,
  error,
  helperText,
  required = false,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  disabled = false,
  ...props
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-3 py-2 text-sm h-10',
    lg: 'px-4 py-2.5 text-base h-12',
  };

  const baseInputStyles = `w-full rounded-xl border transition-all focus:outline-none focus:ring-2 ${
    sizes[size]
  } ${
    error
      ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
      : disabled
      ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
      : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
  } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className={`mb-1 block font-medium text-slate-700 ${
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        }`}>
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          disabled={disabled}
          className={baseInputStyles}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

