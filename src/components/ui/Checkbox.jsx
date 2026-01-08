const Checkbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  error,
  helperText,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`w-full ${className}`}>
      <label className={`flex items-start gap-2 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`${sizes[size]} rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition-colors ${
            error ? 'border-rose-300' : ''
          }`}
          {...props}
        />
        {label && (
          <span className={`${labelSizes[size]} text-slate-700 select-none`}>
            {label}
          </span>
        )}
      </label>
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

export default Checkbox;

