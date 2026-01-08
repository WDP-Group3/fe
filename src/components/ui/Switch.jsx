const Switch = ({
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
    sm: {
      track: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'translate-x-3',
    },
    md: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    lg: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`w-full ${className}`}>
      <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
        <div className="relative inline-flex">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={`${sizes[size].track} rounded-full transition-colors ${
              checked
                ? 'bg-indigo-600'
                : 'bg-slate-300'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <div
              className={`${sizes[size].thumb} absolute top-0.5 left-0.5 rounded-full bg-white transition-transform ${
                checked ? sizes[size].translate : 'translate-x-0'
              }`}
            />
          </div>
        </div>
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

export default Switch;

