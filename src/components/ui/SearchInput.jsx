import Input from './Input';

const SearchInput = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  onSearch,
  onClear,
  size = 'md',
  className = '',
  ...props
}) => {
  const searchIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const clearIcon = value && (
    <button
      type="button"
      onClick={onClear}
      className="text-slate-400 hover:text-slate-600 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  return (
    <Input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size={size}
      leftIcon={searchIcon}
      rightIcon={clearIcon}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSearch) {
          onSearch(value);
        }
      }}
      className={className}
      {...props}
    />
  );
};

export default SearchInput;

