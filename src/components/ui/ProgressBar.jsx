const ProgressBar = ({ value }) => {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
};

export default ProgressBar;

