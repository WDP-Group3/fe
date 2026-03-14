
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { Dropdown } from '../ui';
import { Avatar } from '../common';

const navItems = [
    { label: 'Tổng quan', to: '/admin', icon: '📊' },
    { label: 'Duyệt hồ sơ', to: '/admin/documents', icon: '✅' },
    { label: 'Người dùng', to: '/admin/users', icon: '👥' },
    { label: 'Khóa học', to: '/admin/courses', icon: '📚' },
    { label: 'Học phí', to: '/admin/payments', icon: '💳' },
    { label: 'Thông báo', to: '/admin/notifications', icon: '📢' },
    { label: 'Đánh giá', to: '/admin/feedbacks', icon: '⭐' },
    { label: 'Báo cáo', to: '/admin/reports', icon: '📈' },
    { label: 'Ứng viên', to: '/admin/leads', icon: '👤' },
    { label: 'Duyệt đơn', to: '/admin/letter', icon: '📝' },
    { label: 'Bài viết', to: '/admin/blogs', icon: '✍️' },
    { label: 'Lịch nghỉ', to: '/admin/system-holidays', icon: '📅' },
    { label: 'Địa điểm học', to: '/admin/learning-locations', icon: '📍' }
];

const AdminLayout = () => {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();

    const userMenuItems = [
        // {
        //     label: 'Thông tin cá nhân',
        //     onClick: () => navigate('/portal/profile'),
        // // },
        // { divider: true },
        {
            label: 'Đăng xuất',
            onClick: logout,
            danger: true,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-xl transition-transform duration-300">
                <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold shadow-md">
                        AD
                    </div>
                    <span className="text-lg font-bold">Admin Panel</span>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
                    {user && (
                        <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
                            <Avatar name={user.name} src={user.avatar} size="sm" />
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                                <p className="truncate text-xs text-slate-400">Administrator</p>
                            </div>
                            <Dropdown
                                trigger={
                                    <button className="text-slate-400 hover:text-white transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                    </button>
                                }
                                items={userMenuItems}
                                placement="top-right"
                            />
                        </div>
                    )}
                </div>
            </aside>

            <main className="ml-64 flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
