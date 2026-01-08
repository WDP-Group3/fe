const Select = ({
  label,
  error,
  helperText,
  required = false,
  size = 'md',
  options = [],
  placeholder = 'Chọn...',
  className = '',
  disabled = false,
  ...props
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-3 py-2 text-sm h-10',
    lg: 'px-4 py-2.5 text-base h-12',
  };

  const baseSelectStyles = `w-full rounded-xl border transition-all focus:outline-none focus:ring-2 appearance-none bg-white bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${
    sizes[size]
  } ${
    error
      ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
      : disabled
      ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
      : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
  } ${className}`;

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
      <select
        disabled={disabled}
        className={baseSelectStyles}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          if (typeof option === 'string') {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          );
        })}
      </select>
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

export default Select;

