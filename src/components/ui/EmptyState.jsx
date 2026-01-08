const EmptyState = ({ message = 'Không có dữ liệu', icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-12">
      {icon || (
        <svg
          className="mb-4 h-16 w-16 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}
      <p className="mb-4 text-center text-sm font-medium text-slate-600">{message}</p>
      {action}
    </div>
  );
};

export default EmptyState;

