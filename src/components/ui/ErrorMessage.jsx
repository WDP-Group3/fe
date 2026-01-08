const ErrorMessage = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 ${className}`}>
      <svg
        className="mb-4 h-12 w-12 text-rose-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="mb-2 text-center text-sm font-medium text-rose-800">
        {message || 'Đã xảy ra lỗi'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Thử lại
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

