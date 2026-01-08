const Card = ({ title, description, children, footer, className = '', headerAction }) => {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || description || headerAction) && (
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="border-t border-slate-200 px-6 py-4">{footer}</div>
      )}
    </div>
  );
};

export default Card;

