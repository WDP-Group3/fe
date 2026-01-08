const Stack = ({ children, direction = 'column', spacing = 4, align = 'start', className = '' }) => {
  const directions = {
    row: 'flex-row',
    column: 'flex-col',
  };

  const spacings = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  const aligns = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div className={`flex ${directions[direction]} ${spacings[spacing]} ${aligns[align]} ${className}`}>
      {children}
    </div>
  );
};

export default Stack;

