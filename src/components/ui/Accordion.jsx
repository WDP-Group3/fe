import { useState } from 'react';

const Accordion = ({ items = [], allowMultiple = false, className = '' }) => {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (key) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    } else {
      setOpenItems((prev) => (prev.includes(key) ? [] : [key]));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.key);
        return (
          <div key={item.key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              onClick={() => toggleItem(item.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{item.title}</span>
              <svg
                className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;

