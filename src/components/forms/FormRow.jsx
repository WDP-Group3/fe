const FormRow = ({ children, cols = 2, gap = 4, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
  };

  const gaps = {
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
  };

  return (
    <div className={`grid ${gridCols[cols]} ${gaps[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default FormRow;

