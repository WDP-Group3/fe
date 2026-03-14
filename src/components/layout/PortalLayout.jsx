import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { useAuthContext } from '../../context/AuthContext';
import { Dropdown } from '../ui';
import { Avatar } from '../common';
import config from '../../config';

// Navigation items shown when not logged in
const PUBLIC_NAV_ITEMS = [
  { label: 'Tổng quan', to: '/' },
  { label: 'Khóa học', to: '/courses' },
  { label: 'Thi thử', to: '/exams' },
  { label: 'Bài viết', to: '/blogs' },
];

// Navigation items based on role
const getNavItems = (userRole) => {
  const allItems = [
    { label: 'Tổng quan', to: '/portal/overview', roles: ['ADMIN', 'STUDENT', 'INSTRUCTOR', 'CONSULTANT', 'GUEST'] },
    { label: 'Khóa học', to: '/portal/courses', roles: ['ADMIN', 'STUDENT'] },
    { label: 'Hồ sơ', to: '/portal/enrollment', roles: ['STUDENT'] },
    { label: 'Học phí', to: '/portal/payments', roles: ['ADMIN', 'STUDENT'] },
    { label: 'Thi thử', to: '/portal/exams', roles: ['STUDENT', 'GUEST'] },
    { label: 'Bài viết', to: '/blogs', roles: ['ADMIN', 'STUDENT', 'INSTRUCTOR', 'CONSULTANT', 'GUEST'] },
    { label: 'Duyệt hồ sơ', to: '/portal/document-approval', roles: ['ADMIN', 'CONSULTANT'] },
    { label: 'Lịch học', to: '/portal/schedule', roles: ['ADMIN', 'STUDENT', 'INSTRUCTOR'] },
    { label: 'Ứng viên', to: '/portal/leads', roles: ['CONSULTANT'] },
    { label: 'Quản trị', to: '/admin', roles: ['ADMIN'] },
    { label: 'Làm đơn', to: '/portal/letter', roles: ['ADMIN', 'STUDENT', 'INSTRUCTOR', 'CONSULTANT', 'GUEST'] },
    { label: 'Lịch dạy & Báo bận', to: '/portal/instructor-schedule', roles: ['INSTRUCTOR'] },
    // { label: 'Danh sách lịch', to: '/portal/schedule', roles: ['ADMIN', 'STUDENT', 'INSTRUCTOR'] },
    { label: 'Thông báo', to: '/portal/notifications', roles: ['ADMIN', 'STUDENT', 'INSTRUCTOR', 'CONSULTANT', 'GUEST'] },
    { label: 'Lương của tôi', to: '/portal/my-salary', roles: ['INSTRUCTOR', 'CONSULTANT'] },
  ];

  if (!userRole) return [];
  return allItems.filter((item) => item.roles.includes(userRole));
};

const PortalLayout = ({ children }) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => {
      logout();
    }, 100);
  };

  const userMenuItems = [
    {
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/portal/profile'),
    },
    ...(user?.role === 'STUDENT'
      ? [
        {
          label: 'Student Dashboard',
          onClick: () => navigate('/portal/student-dashboard'),
        },
      ]
      : []),
    { divider: true },
    {
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const navItems = user ? getNavItems(user?.role) : PUBLIC_NAV_ITEMS;

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      try {
        const response = await apiClient.get(`/notifications?userId=${user.id}&unread=true`);
        if (response.status === 'success') {
          setUnreadCount(response.unreadCount || 0);
        }
      } catch (error) {
        // ignore badge errors
      }
    };

    fetchUnreadCount();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {user?.approvalStatus === 'PENDING' && (
        <div className="bg-orange-100 px-4 py-2 text-center text-sm font-semibold text-orange-800 border-b border-orange-200">
          ⚠️ Tài khoản của bạn đang chờ duyệt quyền <span className="uppercase">{user.requestedRole}</span>. Hiện tại bạn đang sử dụng quyền Guest (Khách).
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-full items-center justify-between px-4 py-4 xl:ml-64 xl:mr-64">
          <Link to={user ? '/portal/overview' : '/'} className="flex items-center gap-3">
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
                    <Avatar name={user.name} src={user.avatar} size="sm" />
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
          <div className="mx-auto flex max-w-full items-center gap-2 overflow-x-auto px-4 py-2 xl:ml-64 xl:mr-64">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
                {item.to === '/portal/notifications' && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-full px-4 py-8 xl:ml-64 xl:mr-64">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default PortalLayout;
