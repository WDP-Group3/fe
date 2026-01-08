import { useState, useRef, useEffect } from 'react';

const Dropdown = ({ trigger, items = [], placement = 'bottom-left', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const placements = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-lg ${placements[placement]}`}
        >
          <div className="py-2">
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={index} className="my-2 border-t border-slate-200" />;
              }
              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    item.danger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  disabled={item.disabled}
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <span className="text-slate-400">{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;

