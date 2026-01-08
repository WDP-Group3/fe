import { useState } from 'react';

const Tabs = ({ items = [], defaultActiveKey, onChange, className = '' }) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key);

  const handleTabClick = (key) => {
    setActiveKey(key);
    onChange?.(key);
  };

  const activeTab = items.find((item) => item.key === activeKey);

  return (
    <div className={className}>
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeKey === item.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      {activeTab && (
        <div className="mt-4">{activeTab.children}</div>
      )}
    </div>
  );
};

export default Tabs;

