const Divider = ({ text, className = '' }) => {
  if (text) {
    return (
      <div className={`relative my-6 ${className}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-slate-500">{text}</span>
        </div>
      </div>
    );
  }
  return <div className={`my-4 border-t border-slate-200 ${className}`}></div>;
};

export default Divider;

