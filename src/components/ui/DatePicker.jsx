import Input from './Input';

const DatePicker = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  size = 'md',
  min,
  max,
  disabled = false,
  className = '',
  ...props
}) => {
  const calendarIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <Input
      type="date"
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      required={required}
      size={size}
      disabled={disabled}
      leftIcon={calendarIcon}
      min={min}
      max={max}
      className={className}
      {...props}
    />
  );
};

export default DatePicker;

