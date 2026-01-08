const StatCard = ({ title, value, delta, icon, image }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition-all hover:shadow-md">
      {image && (
        <div className="absolute inset-0 bg-cover bg-center opacity-5 transition-opacity group-hover:opacity-10" style={{ backgroundImage: `url(${image})` }} />
      )}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {delta && (
            <p className="mt-1 text-xs font-medium text-emerald-600">{delta}</p>
          )}
        </div>
        {icon ? (
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-700 transition-transform group-hover:scale-110">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;

