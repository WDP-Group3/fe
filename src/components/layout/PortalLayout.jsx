import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { Dropdown } from '../ui';
import { Avatar } from '../common';
import config from '../../config';

const navItems = [
  { label: 'Tổng quan', to: '/portal/overview' },
  { label: 'Khóa học', to: '/portal/courses' },
  { label: 'Hồ sơ & đăng ký', to: '/portal/enrollment' },
  { label: 'Học phí', to: '/portal/payments' },
  { label: 'Lịch học', to: '/portal/schedule' },
  { label: 'Thi thử', to: '/portal/exams' },
  { label: 'Thông báo', to: '/portal/notifications' },
  { label: 'Quản trị', to: '/portal/admin' },
];

const PortalLayout = () => {
  const { user, logout } = useAuthContext();

  const userMenuItems = [
    {
      label: 'Thông tin cá nhân',
      onClick: () => window.location.href = '/portal/profile',
    },
    { divider: true },
    {
      label: 'Đăng xuất',
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/portal/overview" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-semibold shadow-md">
              DC
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{config.appName}</p>
              <p className="text-xs text-slate-500">Hệ thống đào tạo lái xe</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 sm:block">
              Hỗ trợ
            </button>
            {user ? (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                    <Avatar name={user.name} size="sm" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </button>
                }
                items={userMenuItems}
                placement="bottom-right"
              />
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;

