const styles = {
  done: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  doing: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  idle: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  canceled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
};

const StatusBadge = ({ label, status }) => {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.idle}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label || status}
    </span>
  );
};

export default StatusBadge;

