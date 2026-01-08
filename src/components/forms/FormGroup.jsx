const FormGroup = ({ children, label, error, required = false, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div>{children}</div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
};

export default FormGroup;

