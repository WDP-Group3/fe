import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import apiClient from '../../services/apiClient';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, pendingUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending'
    const [filters, setFilters] = useState({ search: '', role: '', status: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });

    useEffect(() => {
        loadUsers();
        loadStats();
    }, [activeTab, filters]); // Reload when filters change

    const loadStats = async () => {
        try {
            const res = await apiClient.get('/users/stats');
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.role) queryParams.append('role', filters.role);
            if (filters.status) queryParams.append('status', filters.status);

            if (activeTab === 'pending') {
                queryParams.append('approvalStatus', 'PENDING');
            } else {
                queryParams.append('approvalStatus', 'APPROVED');
            }

            const response = await apiClient.get(`/users?${queryParams.toString()}`);

            if (response.status === 'success') {
                const mappedUsers = (response.data || []).map((user) => ({
                    id: user._id,
                    name: user.fullName || user.name,
                    email: user.email,
                    role: user.role,
                    requestedRole: user.requestedRole,
                    phone: user.phone || '-',
                    status: user.status === 'ACTIVE' ? 'active' : 'inactive',
                    approvalStatus: user.approvalStatus,
                }));
                setUsers(mappedUsers);
            }
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await apiClient.put(`/users/${editingUser.id}`, formData);
            } else {
                await apiClient.post('/users', formData);
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });
            loadUsers();
            loadStats();
        } catch (error) {
            alert('Failed to save user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            password: '' // Don't show password
        });
        setShowModal(true);
    };

    const handleDeactivate = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn khoá tài khoản này?')) {
            try {
                await apiClient.patch(`/users/${id}/deactivate`);
                loadUsers();
                loadStats();
            } catch (error) {
                alert('Failed to deactivate user');
            }
        }
    };

    const handleApprove = async (id) => {
        if (window.confirm('Xác nhận duyệt quyền cho user này?')) {
            try {
                await apiClient.patch(`/users/${id}/approve`);
                alert('Đã duyệt thành công!');
                loadUsers();
                loadStats();
            } catch (error) {
                alert('Duyệt thất bại');
            }
        }
    };

    const handleReject = async (id) => {
        if (window.confirm('Xác nhận từ chối yêu cầu user này?')) {
            try {
                await apiClient.patch(`/users/${id}/reject`);
                alert('Đã từ chối!');
                loadUsers();
                loadStats();
            } catch (error) {
                alert('Thất bại');
            }
        }
    };

    const columns = [
        { key: 'name', title: 'Tên', dataIndex: 'name' },
        { key: 'email', title: 'Email', dataIndex: 'email' },
        {
            key: 'role',
            title: 'Vai trò',
            render: (_, record) => (
                <div>
                    <div className="font-medium">{record.role}</div>
                    {record.requestedRole && record.approvalStatus === 'PENDING' && (
                        <div className="mt-1 text-xs text-orange-600 font-semibold flex items-center gap-1">
                            <span>🕒 Xin lên:</span>
                            <span className="uppercase">{record.requestedRole}</span>
                        </div>
                    )}
                </div>
            )
        },
        { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status={val === 'active' ? 'done' : 'error'} label={val} /> },
        {
            key: 'actions',
            title: 'Hành động',
            render: (_, record) => (
                <div className="flex gap-2">
                    {activeTab === 'pending' ? (
                        <>
                            <button onClick={() => handleApprove(record.id)} className="rounded-md bg-green-50 px-3 py-1 text-sm font-semibold text-green-600 hover:bg-green-100 transition-colors">Duyệt</button>
                            <button onClick={() => handleReject(record.id)} className="rounded-md bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">Từ chối</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleEdit(record)} className="text-indigo-600 hover:underline">Sửa</button>
                            <button onClick={() => handleDeactivate(record.id)} className="text-red-600 hover:underline">Khoá</button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Quick Links Section */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Link to="/portal/reports" className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:bg-slate-50 transition-colors">
                    <span className="text-2xl">📊</span>
                    <span className="mt-2 font-semibold text-slate-900">Báo cáo</span>
                </Link>
                <Link to="/portal/feedback" className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:bg-slate-50 transition-colors">
                    <span className="text-2xl">⭐</span>
                    <span className="mt-2 font-semibold text-slate-900">Phản hồi</span>
                </Link>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm opacity-50 cursor-not-allowed">
                    <span className="text-2xl">⚙️</span>
                    <span className="mt-2 font-semibold text-slate-900">Cấu hình</span>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                <SectionHeader
                    title="Quản trị & phân quyền"
                    description="Admin toàn quyền hệ thống, Staff chỉ xem phạm vi được phân"
                    action={
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });
                                setShowModal(true);
                            }}
                            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Tạo user
                        </button>
                    }
                />

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            placeholder="🔍 Tìm kiếm theo tên, email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="STUDENT">Học viên</option>
                            <option value="INSTRUCTOR">Giáo viên</option>
                            <option value="CONSULTANT">Tư vấn viên</option>
                            <option value="GUEST">Khách (Guest)</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Đã khóa</option>
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex space-x-6 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${activeTab === 'active'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent'
                            }`}
                    >
                        Danh sách User
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${activeTab === 'active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                            {stats.totalUsers}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${activeTab === 'pending'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent'
                            }`}
                    >
                        Chờ duyệt
                        {stats.pendingUsers > 0 && (
                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-600 pulse-animation">
                                {stats.pendingUsers}
                            </span>
                        )}
                    </button>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h3 className="mb-4 text-xl font-bold text-slate-900">{editingUser ? 'Sửa User' : 'Tạo User Mới'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Họ tên</label>
                                    <input
                                        required
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Vai trò</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="STUDENT">Học viên</option>
                                        <option value="INSTRUCTOR">Giáo viên</option>
                                        <option value="CONSULTANT">Tư vấn viên</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                {!editingUser && (
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu (Mặc định 123456)</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                    >
                                        Huỷ
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        Lưu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                        <div className="text-4xl mb-3">📭</div>
                        <p>Không tìm thấy user nào</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <DataTable columns={columns} data={users} />
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                    <SectionHeader title="Quyền chỉnh sửa profile" />
                    <div className="space-y-2 text-sm text-slate-700">
                        <p>• Student: chỉnh profile của chính mình.</p>
                        <p>• Instructor: chỉnh profile của chính mình.</p>
                        <p>• Consultant (Sale): chỉnh profile của mình & học viên được phân công.</p>
                        <p>• Admin: chỉnh tất cả profile, phân quyền, khoá/mở tài khoản.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
