const SectionHeader = ({ title, description, action }) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
};

export default SectionHeader;

