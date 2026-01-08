const PageHeader = ({ title, description, breadcrumbs, action }) => {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="mb-2 text-sm text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-700">
                  {crumb.label}
                </a>
              ) : (
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-700 font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;

